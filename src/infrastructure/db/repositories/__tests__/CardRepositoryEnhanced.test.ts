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

  it('populates details for PHRASE, GRAMMAR, and PHONETICS cards without dropping them', async () => {
    // 1. Insert a phraseological unit
    await db
      .insertInto('phraseological_units')
      .values({
        id: 'phrase_1',
        chunk_type: 'COLLOCATION',
        text: 'bear in mind',
        meaning_es: 'tener en cuenta',
        example_1: 'Please bear in mind that rules apply to everyone.',
        example_2: 'Ten en cuenta que las reglas aplican a todos.',
        cefr_level: 'B2',
        created_at: new Date().toISOString(),
      })
      .execute();

    // 2. Insert a grammar rule
    await db
      .insertInto('grammar_rules')
      .values({
        id: 'gram_1',
        code: 'MODAL_SHOULD',
        title: 'Should for Advice',
        category: 'MODALS',
        explanation_es: 'Uso de should para consejos o recomendaciones.',
        formula_syntax: 'Subject + should + verb bare infinitive',
        cefr_level: 'A2',
        created_at: new Date().toISOString(),
      })
      .execute();

    // 3. Create SRS cards for PHRASE and GRAMMAR
    await cardRepo.createCard({
      id: 'card_phrase',
      userId: 'user_test',
      targetType: 'PHRASE',
      targetId: 'phrase_1',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
    });

    await cardRepo.createCard({
      id: 'card_grammar',
      userId: 'user_test',
      targetType: 'GRAMMAR',
      targetId: 'gram_1',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
    });

    const allCards = await cardRepo.getAllCardsWithDetails('user_test');
    expect(allCards.length).toBe(2);

    const phraseCard = allCards.find((c) => c.card.id === 'card_phrase');
    expect(phraseCard).toBeDefined();
    expect(phraseCard?.phrase?.text).toBe('bear in mind');
    expect(phraseCard?.vocab?.word).toBe('bear in mind');
    expect(phraseCard?.allContexts.length).toBe(1);

    const grammarCard = allCards.find((c) => c.card.id === 'card_grammar');
    expect(grammarCard).toBeDefined();
    expect(grammarCard?.vocab?.word).toBe('Should for Advice');
    expect(grammarCard?.vocab?.translationEs).toBe('Uso de should para consejos o recomendaciones.');
  });

  it('prevents duplicate card creation for the same targetId and targetType', async () => {
    const card1 = await cardRepo.createCard({
      id: 'card_dup_1',
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

    // Attempt to create second card for same target
    const card2 = await cardRepo.createCard({
      id: 'card_dup_2',
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

    // Must return the already existing card without creating another row
    expect(card2.id).toBe(card1.id);

    const all = await cardRepo.getAllCardsWithDetails('user_test');
    expect(all.filter((c) => c.card.targetId === 'voc_1').length).toBe(1);
  });

  it('retrieves all historical review logs with getAllReviewLogs', async () => {
    const card = await cardRepo.createCard({
      id: 'card_for_logs',
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

    await cardRepo.recordReviewLog({
      id: 'rev_log_1',
      cardId: card.id,
      rating: 3,
      stateBefore: 'NEW',
      stabilityBefore: 0,
      difficultyBefore: 5.0,
      newStability: 3.17,
      newDifficulty: 5.0,
      elapsedMs: 1200,
      reviewedAt: new Date().toISOString(),
    });

    const logs = await cardRepo.getAllReviewLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].cardId).toBe(card.id);
    expect(logs[0].rating).toBe(3);
  });
});
