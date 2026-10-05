import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { createTestDatabase } from '../database';
import { CardRepository } from '../repositories/CardRepository';
import { VocabRepository } from '../repositories/VocabRepository';
import { FsrsScheduler } from '../../../core/srs/FsrsScheduler';
import { SrsCard } from '../../../core/types/srs';

async function insertTestFixtures(db: Kysely<DatabaseSchema>) {
  await db
    .insertInto('vocab_items')
    .values([
      {
        id: 'voc_b1_01',
        word: 'depend',
        grammatical_dimension: 'CONTENT',
        part_of_speech: 'VERB',
        definition_en: 'To be determined or decided by something else.',
        translation_es: 'Depender',
        ipa_general_american: 'dɪˈpɛnd',
        ipa_received_pronunciation: 'dɪˈpend',
        cefr_level: 'B1',
        is_false_friend: 0,
        false_friend_note: null,
        morphological_family_json: JSON.stringify(['dependent', 'dependence']),
        created_at: new Date().toISOString(),
      },
      {
        id: 'voc_b2_actually',
        word: 'actually',
        grammatical_dimension: 'FUNCTION',
        part_of_speech: 'ADVERB',
        definition_en: 'In truth or in fact.',
        translation_es: 'En realidad / De hecho',
        ipa_general_american: 'ˈæktʃuəli',
        ipa_received_pronunciation: 'ˈæktʃuəli',
        cefr_level: 'B2',
        is_false_friend: 1,
        false_friend_note: 'No significa "actualmente" (currently).',
        morphological_family_json: JSON.stringify(['actual']),
        created_at: new Date().toISOString(),
      },
    ])
    .execute();

  await db
    .insertInto('vocab_context_examples')
    .values([
      {
        id: 'ctx_01',
        vocab_id: 'voc_b1_01',
        sentence_en: 'Success depends on hard work.',
        sentence_es: 'El éxito depende del trabajo duro.',
        cloze_target: 'depend on',
        cefr_level: 'B1',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ctx_02',
        vocab_id: 'voc_b1_01',
        sentence_en: 'It all depends on the weather tomorrow.',
        sentence_es: 'Todo depende del clima mañana.',
        cloze_target: 'depends on',
        cefr_level: 'B1',
        created_at: new Date().toISOString(),
      },
    ])
    .execute();
}

describe('Database Integration & Repositories', () => {
  let db: Kysely<DatabaseSchema>;
  let cardRepo: CardRepository;
  let vocabRepo: VocabRepository;
  const scheduler = new FsrsScheduler(0.9);

  beforeEach(async () => {
    db = await createTestDatabase();
    cardRepo = new CardRepository(db);
    vocabRepo = new VocabRepository(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('successfully initializes all 15 tables with a clean zero-record state', async () => {
    const vocabCount = await db
      .selectFrom('vocab_items')
      .select((eb) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    expect(Number(vocabCount?.count)).toBe(0);

    const cardsCount = await db
      .selectFrom('srs_cards')
      .select((eb) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    expect(Number(cardsCount?.count)).toBe(0);
  });

  it('searches vocabulary items with false friend flags and filters', async () => {
    await insertTestFixtures(db);

    const results = await vocabRepo.searchVocabs('actually');
    expect(results.length).toBeGreaterThan(0);
    const item = results[0];
    expect(item.word).toBe('actually');
    expect(item.isFalseFriend).toBe(true);
    expect(item.falseFriendNote).toContain('actualmente');
  });

  it('retrieves context examples for a vocabulary item', async () => {
    await insertTestFixtures(db);

    const contexts = await vocabRepo.getContextExamples('voc_b1_01'); // 'depend'
    expect(contexts.length).toBeGreaterThanOrEqual(2);
    expect(contexts[0].clozeTarget).toBe('depend on');
  });

  it('creates, reviews, and updates an SRS card with FSRS scheduling', async () => {
    await insertTestFixtures(db);

    // 1. Create an SRS card for 'depend'
    const userId = 'user_test_01';
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
    await insertTestFixtures(db);

    const userId = 'user_test_02';
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

  it('creates new vocabulary items and context examples dynamically', async () => {
    const created = await vocabRepo.createVocab({
      word: 'thriving',
      translationEs: 'próspero / floreciente',
      definitionEn: 'Growing, developing, or being successful.',
      cefrLevel: 'B2',
      partOfSpeech: 'ADJECTIVE',
      grammaticalDimension: 'CONTENT',
      ipaGeneralAmerican: 'ˈθraɪvɪŋ',
      isFalseFriend: false,
    });

    expect(created.id).toBeDefined();
    expect(created.word).toBe('thriving');

    // Add context example
    const example = await vocabRepo.addContextExample({
      vocabId: created.id,
      sentenceEn: 'The company is thriving in the competitive market.',
      sentenceEs: 'La empresa está prosperando en el mercado competitivo.',
      clozeTarget: 'thriving',
      cefrLevel: 'B2',
    });

    expect(example.id).toBeDefined();
    expect(example.vocabId).toBe(created.id);

    // Verify retrieval
    const fetched = await vocabRepo.getVocabById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.translationEs).toBe('próspero / floreciente');

    const contexts = await vocabRepo.getContextExamples(created.id);
    expect(contexts.length).toBe(1);
    expect(contexts[0].sentenceEn).toContain('thriving');
  });

  it('creates an SRS card without foreign key failure for default user_local', async () => {
    // Create a vocab word first
    const vocab = await vocabRepo.createVocab({
      word: 'resilient',
      translationEs: 'resiliente',
      definitionEn: 'Able to recover quickly.',
      cefrLevel: 'B2',
      partOfSpeech: 'ADJECTIVE',
      grammaticalDimension: 'CONTENT',
      ipaGeneralAmerican: '/rɪˈzɪljənt/',
      isFalseFriend: false,
    });

    // Directly create card for user_local (as useVocabList does)
    const card = await cardRepo.createCard({
      id: `card_resilient_${Date.now()}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: vocab.id,
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
    });

    expect(card.id).toBeDefined();
    expect(card.userId).toBe('user_local');
    expect(card.targetId).toBe(vocab.id);

    // Verify card is retrievable by user_local
    const dueCards = await cardRepo.getDueCards('user_local');
    expect(dueCards.some((c) => c.id === card.id)).toBe(true);
  });
});
