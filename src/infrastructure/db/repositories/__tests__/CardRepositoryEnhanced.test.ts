import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../../core/types/database';
import { createTestDatabase } from '../../database';
import { CardRepository } from '../CardRepository';
import { SrsCard, ReviewLog } from '../../../../core/types/srs';

describe('CardRepository Enhanced Methods', () => {
  let db: Kysely<DatabaseSchema>;
  let cardRepo: CardRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    cardRepo = new CardRepository(db);

    // Insert user
    await db
      .insertInto('users')
      .values({
        id: 'user_test',
        username: 'student_test',
        target_accent: 'GENERAL_AMERICAN',
        current_cefr_target: 'B1',
        default_ai_model: 'gemini-3.8-flash',
        api_key_rotation_mode: 'FAILOVER_ON_QUOTA',
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    // Insert vocab
    await db
      .insertInto('vocab_items')
      .values([
        {
          id: 'voc_1',
          word: 'resilient',
          grammatical_dimension: 'CONTENT',
          part_of_speech: 'ADJECTIVE',
          definition_en: 'able to recover quickly',
          translation_es: 'resiliente',
          ipa_general_american: 'rɪˈzɪl.jənt',
          cefr_level: 'B2',
          is_false_friend: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'voc_2',
          word: 'thorough',
          grammatical_dimension: 'CONTENT',
          part_of_speech: 'ADJECTIVE',
          definition_en: 'complete and careful',
          translation_es: 'exhaustivo',
          ipa_general_american: 'ˈθɜːr.oʊ',
          cefr_level: 'B2',
          is_false_friend: 0,
          created_at: new Date().toISOString(),
        },
      ])
      .execute();

    // Insert context
    await db
      .insertInto('vocab_context_examples')
      .values({
        id: 'ctx_1',
        vocab_id: 'voc_1',
        sentence_en: 'She remained resilient in tough times.',
        sentence_es: 'Ella se mantuvo resiliente en momentos difíciles.',
        cloze_target: 'resilient',
        cefr_level: 'B2',
        created_at: new Date().toISOString(),
      })
      .execute();
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('correctly filters due cards vs new cards with details', async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();

    // Card 1: Review card due now
    await cardRepo.createCard({
      id: 'card_1',
      userId: 'user_test',
      targetType: 'VOCAB',
      targetId: 'voc_1',
      state: 'REVIEW',
      stability: 3.0,
      difficulty: 5.0,
      reps: 2,
      lapses: 0,
      lastReviewedAt: pastDate,
      scheduledFor: pastDate,
    });

    // Card 2: New card
    await cardRepo.createCard({
      id: 'card_2',
      userId: 'user_test',
      targetType: 'VOCAB',
      targetId: 'voc_2',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
    });

    const dueCards = await cardRepo.getDueCardsWithDetails('user_test');
    expect(dueCards.length).toBe(1);
    expect(dueCards[0].card.id).toBe('card_1');
    expect(dueCards[0].vocab?.word).toBe('resilient');
    expect(dueCards[0].allContexts.length).toBe(1);

    const newCards = await cardRepo.getNewCardsWithDetails('user_test');
    expect(newCards.length).toBe(1);
    expect(newCards[0].card.id).toBe('card_2');
    expect(newCards[0].vocab?.word).toBe('thorough');

    const stats = await cardRepo.getDeckStatistics('user_test');
    expect(stats.totalCount).toBe(2);
    expect(stats.newCount).toBe(1);
    expect(stats.dueCount).toBe(1);
    expect(stats.reviewCount).toBe(1);
  });

  it('records review and log atomically', async () => {
    const card: SrsCard = await cardRepo.createCard({
      id: 'card_rev_test',
      userId: 'user_test',
      targetType: 'VOCAB',
      targetId: 'voc_1',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
    });

    const updatedCard: SrsCard = {
      ...card,
      state: 'REVIEW',
      stability: 3.17,
      difficulty: 5.2,
      reps: 1,
      lapses: 0,
      lastReviewedAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + 3 * 86400 * 1000).toISOString(),
    };

    const log: ReviewLog = {
      id: 'log_1',
      cardId: card.id,
      rating: 3,
      stateBefore: 'NEW',
      stabilityBefore: 0,
      difficultyBefore: 5.0,
      newStability: 3.17,
      newDifficulty: 5.2,
      elapsedMs: 1450,
      reviewedAt: new Date().toISOString(),
    };

    await cardRepo.recordReview(updatedCard, log);

    const reloaded = await cardRepo.getCardById(card.id);
    expect(reloaded?.state).toBe('REVIEW');
    expect(reloaded?.reps).toBe(1);
    expect(reloaded?.stability).toBe(3.17);

    const logs = await db
      .selectFrom('review_logs')
      .selectAll()
      .where('card_id', '=', card.id)
      .execute();

    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe(3);
    expect(logs[0].elapsed_ms).toBe(1450);
  });
});
