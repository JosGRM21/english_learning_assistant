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
    db = await createTestDatabase(false);
    cardRepo = new CardRepository(db);

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

  it('populates details for PHRASE and VOCAB cards without dropping them', async () => {
    // 1. Insert a phraseological unit
    await db
      .insertInto('phraseological_units')
      .values({
        id: 'phrase_1',
        chunk_type: 'IDIOM',
        text: 'bear in mind',
        meaning_es: 'tener en cuenta',
        example_1: 'Please bear in mind that rules apply to everyone.',
        example_2: 'Ten en cuenta que las reglas aplican a todos.',
        cefr_level: 'B2',
        created_at: new Date().toISOString(),
      })
      .execute();

    // 2. Create SRS cards for PHRASE and VOCAB
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
      id: 'card_vocab_1',
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

    const allCards = await cardRepo.getAllCardsWithDetails('user_test');
    expect(allCards.length).toBe(2);

    const phraseCard = allCards.find((c) => c.card.id === 'card_phrase');
    expect(phraseCard).toBeDefined();
    expect(phraseCard?.phrase?.text).toBe('bear in mind');
    expect(phraseCard?.vocab?.word).toBe('bear in mind');
    expect(phraseCard?.allContexts.length).toBe(1);

    const vocabCard = allCards.find((c) => c.card.id === 'card_vocab_1');
    expect(vocabCard).toBeDefined();
    expect(vocabCard?.vocab?.word).toBe('resilient');
    expect(vocabCard?.vocab?.translationEs).toBe('resiliente');
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

  it('accurately counts new cards reviewed today using local day boundaries', async () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    const card1 = await cardRepo.createCard({
      id: 'card_count_1',
      userId: 'user_count_test',
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

    const card2 = await cardRepo.createCard({
      id: 'card_count_2',
      userId: 'user_count_test',
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

    // Before any review: 0
    const count0 = await cardRepo.getNewCardsReviewedTodayCount('user_count_test', startOfDay, endOfDay);
    expect(count0).toBe(0);

    // 1. First review of card1 (stateBefore: 'NEW')
    await cardRepo.recordReviewLog({
      id: 'rev_log_c1_1',
      cardId: card1.id,
      rating: 3,
      stateBefore: 'NEW',
      stabilityBefore: 0,
      difficultyBefore: 5.0,
      newStability: 3.17,
      newDifficulty: 5.0,
      elapsedMs: 1500,
      reviewedAt: new Date(today.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    });

    // 2. Second review of card1 (intra-session or intraday, stateBefore: 'LEARNING')
    await cardRepo.recordReviewLog({
      id: 'rev_log_c1_2',
      cardId: card1.id,
      rating: 3,
      stateBefore: 'LEARNING',
      stabilityBefore: 3.17,
      difficultyBefore: 5.0,
      newStability: 4.5,
      newDifficulty: 5.0,
      elapsedMs: 1200,
      reviewedAt: new Date(today.getTime() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    });

    // Card 1 should only be counted once even though it had multiple logs
    const count1 = await cardRepo.getNewCardsReviewedTodayCount('user_count_test', startOfDay, endOfDay);
    expect(count1).toBe(1);

    // 3. Review of card2 reviewed YESTERDAY (outside today's range)
    const yesterday = new Date(today.getTime() - 1000 * 60 * 60 * 25).toISOString();
    await cardRepo.recordReviewLog({
      id: 'rev_log_c2_yesterday',
      cardId: card2.id,
      rating: 3,
      stateBefore: 'NEW',
      stabilityBefore: 0,
      difficultyBefore: 5.0,
      newStability: 3.17,
      newDifficulty: 5.0,
      elapsedMs: 1000,
      reviewedAt: yesterday,
    });

    // Still 1 for today
    const countStill1 = await cardRepo.getNewCardsReviewedTodayCount('user_count_test', startOfDay, endOfDay);
    expect(countStill1).toBe(1);

    // 4. Now card2 reviewed TODAY with stateBefore = 'NEW'
    await cardRepo.recordReviewLog({
      id: 'rev_log_c2_today',
      cardId: card2.id,
      rating: 3,
      stateBefore: 'NEW',
      stabilityBefore: 0,
      difficultyBefore: 5.0,
      newStability: 3.17,
      newDifficulty: 5.0,
      elapsedMs: 1100,
      reviewedAt: new Date().toISOString(),
    });

    // Now exactly 2 distinct new cards reviewed today
    const count2 = await cardRepo.getNewCardsReviewedTodayCount('user_count_test', startOfDay, endOfDay);
    expect(count2).toBe(2);
  });

  it('hydrates polysemic card targeting specific sense with targetId containing #senseIndex', async () => {
    await db
      .insertInto('vocab_items')
      .values({
        id: 'voc_run_poly',
        word: 'run',
        grammatical_dimension: 'CONTENT',
        part_of_speech: 'VERB',
        definition_en: 'to move fast with two feet',
        translation_es: 'correr',
        ipa_general_american: 'rʌn',
        cefr_level: 'A1',
        is_false_friend: 0,
        alternate_senses_json: JSON.stringify([
          {
            senseId: 'sense_2',
            contextualHint: 'run a business or company',
            partOfSpeech: 'VERB',
            definitionEn: 'to manage or direct an organization',
            translationEs: 'administrar / dirigir',
            cefrLevel: 'B1',
          },
        ]),
        created_at: new Date().toISOString(),
      })
      .execute();

    await db
      .insertInto('vocab_context_examples')
      .values([
        {
          id: 'ctx_run_s0',
          vocab_id: 'voc_run_poly',
          phrase_id: null,
          sense_index: 0,
          sentence_en: 'I run in the park every morning.',
          sentence_es: 'Corro en el parque todas las mañanas.',
          cloze_target: 'run',
          cefr_level: 'A1',
          created_at: new Date().toISOString(),
        },
        {
          id: 'ctx_run_s1',
          vocab_id: 'voc_run_poly',
          phrase_id: null,
          sense_index: 1,
          sentence_en: 'She runs a successful tech startup.',
          sentence_es: 'Ella administra una startup tecnológica exitosa.',
          cloze_target: 'runs',
          cefr_level: 'B1',
          created_at: new Date().toISOString(),
        },
      ])
      .execute();

    await cardRepo.createCard({
      id: 'card_run_s1',
      userId: 'user_poly_test',
      targetType: 'VOCAB',
      targetId: 'voc_run_poly#1',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      scheduledFor: new Date().toISOString(),
      lastReviewedAt: null,
    });

    const populated = await cardRepo.getNewCardsWithDetails('user_poly_test', 10);
    expect(populated.length).toBe(1);
    expect(populated[0].currentSenseIndex).toBe(1);
    expect(populated[0].currentSense?.contextualHint).toBe('run a business or company');
    expect(populated[0].vocab?.translationEs).toBe('administrar / dirigir');
    expect(populated[0].vocab?.definitionEn).toBe('to manage or direct an organization');
    expect(populated[0].allContexts[0].sentenceEn).toBe('She runs a successful tech startup.');
  });

  it('retrieves unactivated phrasal units filtered by CEFR levels and tracks activation', async () => {
    await db
      .insertInto('phraseological_units')
      .values([
        {
          id: 'phr_test_a1',
          primary_vocab_id: null,
          chunk_type: 'PHRASAL_VERB',
          text: 'get up',
          meaning_es: 'levantarse',
          definition_en: 'to rise from bed',
          cefr_level: 'A1',
          example_1: 'I get up at 7 AM.',
          example_1_es: 'Me levanto a las 7 AM.',
          mastery_status: 'INACTIVE',
          created_at: new Date().toISOString(),
        },
        {
          id: 'phr_test_b2',
          primary_vocab_id: null,
          chunk_type: 'PHRASAL_VERB',
          text: 'carry out',
          meaning_es: 'llevar a cabo',
          definition_en: 'to perform or conduct an experiment',
          cefr_level: 'B2',
          example_1: 'They will carry out the investigation.',
          example_1_es: 'Llevarán a cabo la investigación.',
          mastery_status: 'INACTIVE',
          created_at: new Date().toISOString(),
        },
      ])
      .execute();

    const a1Phrases = await cardRepo.getNextUnactivatedPhrases({
      cefrLevels: ['A1', 'A2'],
      limit: 10,
    });

    expect(a1Phrases.some((p) => p.id === 'phr_test_a1')).toBe(true);
    expect(a1Phrases.some((p) => p.id === 'phr_test_b2')).toBe(false);

    // Activate the A1 phrase
    await cardRepo.activatePhraseCard('phr_test_a1');

    const remainingA1 = await cardRepo.getNextUnactivatedPhrases({
      cefrLevels: ['A1', 'A2'],
      limit: 10,
    });
    expect(remainingA1.some((p) => p.id === 'phr_test_a1')).toBe(false);
  });
});
