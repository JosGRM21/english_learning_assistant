import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { createTestDatabase } from '../database';
import { seedDatabase } from '../seed-data';
import { CardRepository } from '../repositories/CardRepository';
import { VocabRepository } from '../repositories/VocabRepository';
import { FsrsScheduler } from '../../../core/srs/FsrsScheduler';
import { SrsCard } from '../../../core/types/srs';

describe('Database Integration & Repositories', () => {
  let db: Kysely<DatabaseSchema>;
  let cardRepo: CardRepository;
  let vocabRepo: VocabRepository;
  const scheduler = new FsrsScheduler(0.9);

  beforeEach(async () => {
    db = await createTestDatabase();
    await seedDatabase(db);
    cardRepo = new CardRepository(db);
    vocabRepo = new VocabRepository(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('successfully initializes all 15 tables and seeds initial vocabulary', async () => {
    const vocabCount = await db
      .selectFrom('vocab_items')
      .select((eb) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    expect(Number(vocabCount?.count)).toBeGreaterThanOrEqual(25);

    const phoneticRulesCount = await db
      .selectFrom('phonetic_rules')
      .select((eb) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    expect(Number(phoneticRulesCount?.count)).toBeGreaterThanOrEqual(5);
  });

  it('searches vocabulary items with false friend flags and filters', async () => {
    const results = await vocabRepo.searchVocabs('actually');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.word).toBe('actually');
    expect(item.isFalseFriend).toBe(true);
    expect(item.falseFriendNote).toContain('actualmente');
  });

  it('retrieves context examples for a vocabulary item', async () => {
    const contexts = await vocabRepo.getContextExamples('voc_b1_01'); // 'depend'
    expect(contexts.length).toBeGreaterThanOrEqual(2);
    expect(contexts[0].clozeTarget).toBe('depend on');
  });

  it('creates, reviews, and updates an SRS card with FSRS scheduling', async () => {
    // 1. Create a user first
    const userId = 'user_test_01';
    await db
      .insertInto('users')
      .values({
        id: userId,
        username: 'test_student',
        target_accent: 'GENERAL_AMERICAN',
        current_cefr_target: 'B1',
        default_ai_model: 'gemini-3.8-flash',
        api_key_rotation_mode: 'FAILOVER_ON_QUOTA',
      })
      .execute();

    // 2. Create an SRS card for 'depend'
    const newCardData: Omit<SrsCard, 'createdAt'> = {
      id: 'card_test_01',
      userId,
      targetType: 'VOCAB',
      targetId: 'voc_b1_01',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date('2026-09-29T10:00:00Z').toISOString(),
    };

    const createdCard = await cardRepo.createCard(newCardData);
    expect(createdCard.id).toBe('card_test_01');

    // 3. User reviews with 'Good' (grade 3)
    const reviewTime = new Date('2026-09-29T11:00:00Z');
    const { updatedCard, log } = scheduler.schedule(createdCard, 3, reviewTime);

    await cardRepo.updateCard(updatedCard);
    await cardRepo.recordReviewLog({
      id: 'log_test_01',
      cardId: updatedCard.id,
      rating: log.rating,
      stateBefore: log.stateBefore,
      stabilityBefore: log.stabilityBefore,
      difficultyBefore: log.difficultyBefore,
      newStability: log.newStability,
      newDifficulty: log.newDifficulty,
      elapsedMs: 2500,
      reviewedAt: reviewTime.toISOString(),
    });

    // 4. Verify persisted state in DB
    const fetchedCard = await cardRepo.getCardById('card_test_01');
    expect(fetchedCard).not.toBeNull();
    expect(fetchedCard?.state).toBe('REVIEW');
    expect(fetchedCard?.reps).toBe(1);
    expect(fetchedCard?.stability).toBeCloseTo(3.173, 2);

    // 5. Verify review logs
    const logs = await db
      .selectFrom('review_logs')
      .selectAll()
      .where('card_id', '=', 'card_test_01')
      .execute();

    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe(3);
  });

  it('fetches cards with target details and context examples', async () => {
    const userId = 'user_test_02';
    await db
      .insertInto('users')
      .values({
        id: userId,
        username: 'test_student_2',
        target_accent: 'GENERAL_AMERICAN',
        current_cefr_target: 'B2',
      })
      .execute();

    // Create due card scheduled in the past
    await cardRepo.createCard({
      id: 'card_test_02',
      userId,
      targetType: 'VOCAB',
      targetId: 'voc_b1_01',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date('2026-01-01T00:00:00Z').toISOString(),
    });

    const detailedCards = await cardRepo.getCardsWithDetails(userId);
    expect(detailedCards.length).toBe(1);
    expect(detailedCards[0].vocab?.word).toBe('depend');
    expect(detailedCards[0].allContexts.length).toBeGreaterThanOrEqual(2);
    expect(detailedCards[0].currentContext).toBeDefined();
  });
});
