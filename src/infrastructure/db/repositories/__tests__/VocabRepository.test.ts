import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../../core/types/database';
import { createTestDatabase } from '../../database';
import { VocabRepository } from '../VocabRepository';
import { CORE_VOCAB_DATA, reloadCoreCorpusMemory } from '@/data/core-vocab-corpus';

describe('VocabRepository Integration Tests', () => {
  let db: Kysely<DatabaseSchema>;
  let repo: VocabRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    repo = new VocabRepository(db);

    // If core corpus was reset on disk, provide fallback items for integration tests
    if (CORE_VOCAB_DATA.length === 0) {
      reloadCoreCorpusMemory([
        {
          id: 'voc_core_00001',
          word: 'be',
          grammaticalDimension: 'CONTENT',
          partOfSpeech: 'VERB',
          subcategory: null,
          definitionEn: 'To exist or have a identity',
          translationEs: 'ser, estar',
          ipaGeneralAmerican: 'biː',
          ipaReceivedPronunciation: 'biː',
          ipaWeakForm: 'bi',
          cefrLevel: 'A1',
          frequencyBand: 'TOP_500',
          isCore: 1,
          masteryStatus: 'INACTIVE',
          collocationsJson: ['be happy'],
          isSeparable: null,
          phoneticEdEnding: null,
          isFalseFriend: 0,
          falseFriendNote: null,
          verbTensesJson: null,
          domainCategory: 'Uso General',
          alternateSensesJson: null,
          graduatedExamples: {
            sentenceBasicEn: 'She is a doctor.',
            sentenceBasicEs: 'Ella es doctora.',
            sentenceAdvancedEn: 'To be successful requires work.',
            sentenceAdvancedEs: 'Tener éxito requiere trabajo.',
          },
        },
        {
          id: 'voc_core_00002',
          word: 'have',
          grammaticalDimension: 'CONTENT',
          partOfSpeech: 'VERB',
          subcategory: null,
          definitionEn: 'To possess',
          translationEs: 'tener, haber',
          ipaGeneralAmerican: 'hæv',
          ipaReceivedPronunciation: 'hæv',
          ipaWeakForm: 'həv',
          cefrLevel: 'A1',
          frequencyBand: 'TOP_500',
          isCore: 1,
          masteryStatus: 'INACTIVE',
          collocationsJson: ['have time'],
          isSeparable: null,
          phoneticEdEnding: null,
          isFalseFriend: 0,
          falseFriendNote: null,
          verbTensesJson: null,
          domainCategory: 'Uso General',
          alternateSensesJson: null,
          graduatedExamples: {
            sentenceBasicEn: 'I have a car.',
            sentenceBasicEs: 'Tengo un carro.',
            sentenceAdvancedEn: 'We have to move forward.',
            sentenceAdvancedEs: 'Tenemos que avanzar.',
          },
        },
      ]);
    }
  });

  afterEach(async () => {
    await db.destroy();
  });

  it('creates and retrieves a vocab item with all pedagogical fields', async () => {
    const item = await repo.createVocab({
      word: 'thrive',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'VERB',
      subcategory: 'INTRANSITIVE',
      definitionEn: 'to grow or develop successfully',
      translationEs: 'prosperar, florecer',
      ipaGeneralAmerican: '/θraɪv/',
      ipaReceivedPronunciation: '/θraɪv/',
      cefrLevel: 'B2',
      frequencyBand: 'TOP_3000',
      isCore: true,
      masteryStatus: 'LEARNING',
      collocationsJson: ['thrive on pressure', 'business will thrive'],
      isSeparable: null,
      phoneticEdEnding: '/d/',
      isFalseFriend: false,
      falseFriendNote: null,
      verbTensesJson: {
        infinitive: 'thrive',
        pastSimple: 'thrived',
        pastParticiple: 'thrived',
        thirdPersonPresent: 'thrives',
        gerund: 'thriving',
        isIrregular: false,
        edPhoneticEnding: '/d/',
      },
      domainCategory: 'Negocios',
      alternateSensesJson: null,
    });

    expect(item.id).toBeTruthy();
    expect(item.word).toBe('thrive');
    expect(item.frequencyBand).toBe('TOP_3000');
    expect(item.isCore).toBe(true);
    expect(item.masteryStatus).toBe('LEARNING');
    expect(item.collocationsJson).toEqual(['thrive on pressure', 'business will thrive']);
    expect(item.phoneticEdEnding).toBe('/d/');

    const retrieved = await repo.getVocabById(item.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.word).toBe('thrive');
    expect(retrieved?.frequencyBand).toBe('TOP_3000');
    expect(retrieved?.phoneticEdEnding).toBe('/d/');
  });

  it('searches the local corpus with zero AI tokens and instant response', async () => {
    // Should find words from the pre-bundled Core Corpus
    const results = await repo.searchLocalCorpus('be', 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.word.toLowerCase() === 'be')).toBe(true);

    const first = results[0];
    expect(first.isCore).toBe(true);
    expect(first.ipaGeneralAmerican).toBeTruthy();
  });

  it('activates a vocab item into LEARNING and automatically creates an agile SRS card', async () => {
    // Search a core word ('be' is always present in core corpus)
    const local = await repo.searchLocalCorpus('be', 1);
    expect(local.length).toBeGreaterThan(0);
    const beWord = local[0];

    const activated = await repo.activateVocabItem(beWord.id);
    expect(activated.masteryStatus).toBe('LEARNING');

    // Verify SRS card was created
    const card = await db
      .selectFrom('srs_cards')
      .selectAll()
      .where('target_id', '=', beWord.id)
      .where('target_type', '=', 'VOCAB')
      .executeTakeFirst();

    expect(card).not.toBeUndefined();
    expect(card?.srs_profile).toBe('VOCAB_AGILE');
    expect(card?.state).toBe('NEW');
  });

  it('computes core corpus coverage across frequency bands', async () => {
    const coverage = await repo.getCoreCorpusCoverage();
    expect(coverage.totalCore).toBe(3500);
    expect(coverage.byBand.TOP_500.total).toBe(500);
    expect(coverage.byBand.TOP_1000.total).toBe(500);
    expect(coverage.byBand.TOP_3000.total).toBe(2000);
    expect(coverage.byBand.TOP_5000.total).toBe(500);
  });

  it('deletes vocab item and cleans up related context examples and SRS cards', async () => {
    const item = await repo.createVocab({
      word: 'ephemeral',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'ADJECTIVE',
      subcategory: null,
      definitionEn: 'lasting for a very short time',
      translationEs: 'efímero',
      ipaGeneralAmerican: '/ɪˈfɛmərəl/',
      ipaReceivedPronunciation: '/ɪˈfɛmərəl/',
      cefrLevel: 'C1',
      frequencyBand: 'TOP_5000',
      isCore: false,
      masteryStatus: 'LEARNING',
      collocationsJson: [],
      isSeparable: null,
      phoneticEdEnding: null,
      isFalseFriend: false,
      falseFriendNote: null,
      verbTensesJson: null,
      domainCategory: 'Literatura',
      alternateSensesJson: null,
    });

    await repo.addContextExample({
      vocabId: item.id,
      sentenceEn: 'Fame in the digital age is often ephemeral.',
      sentenceEs: 'La fama en la era digital a menudo es efímera.',
      clozeTarget: 'ephemeral',
      cefrLevel: 'C1',
    });

    // Create an SRS card for it
    await db
      .insertInto('srs_cards')
      .values({
        id: 'card_ephemeral',
        user_id: 'user_local',
        target_type: 'VOCAB',
        target_id: item.id,
        srs_profile: 'VOCAB_AGILE',
        state: 'NEW',
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        consecutive_lapses: 0,
        is_leech: 0,
        last_reviewed_at: null,
        scheduled_for: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .execute();

    // Delete
    const deleted = await repo.deleteVocab(item.id);
    expect(deleted).toBe(true);

    // Verify cascaded cleanup
    const checkVocab = await repo.getVocabById(item.id);
    expect(checkVocab).toBeNull();

    const checkContext = await repo.getContextExamples(item.id);
    expect(checkContext).toHaveLength(0);

    const checkCard = await db
      .selectFrom('srs_cards')
      .selectAll()
      .where('target_id', '=', item.id)
      .execute();
    expect(checkCard).toHaveLength(0);
  });

  it('batch activates vocabulary items by frequency band independently of CEFR level', async () => {
    // 1. Seed two inactive core items with different CEFR levels in TOP_3000
    await repo.createVocab({
      word: 'resilience',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'NOUN',
      definitionEn: 'the capacity to recover quickly from difficulties',
      translationEs: 'resiliencia',
      ipaGeneralAmerican: '/rɪˈzɪliəns/',
      cefrLevel: 'B2',
      frequencyBand: 'TOP_3000',
      isCore: true,
      masteryStatus: 'INACTIVE',
      isFalseFriend: false,
    });

    await repo.createVocab({
      word: 'perceive',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'VERB',
      definitionEn: 'become aware or conscious of something',
      translationEs: 'percibir',
      ipaGeneralAmerican: '/pərˈsiːv/',
      cefrLevel: 'C1',
      frequencyBand: 'TOP_3000',
      isCore: true,
      masteryStatus: 'INACTIVE',
      isFalseFriend: false,
    });

    // 2. Batch activate by TOP_3000 only
    const activated = await repo.batchActivateByCriteria({
      frequencyBand: 'TOP_3000',
      limit: 10,
    });

    expect(activated.length).toBeGreaterThanOrEqual(2);
    expect(activated.some((w) => w.word === 'resilience')).toBe(true);
    expect(activated.some((w) => w.word === 'perceive')).toBe(true);

    // Verify all returned items have LEARNING status and corresponding srs_cards
    for (const item of activated) {
      expect(item.masteryStatus).toBe('LEARNING');
      const card = await db
        .selectFrom('srs_cards')
        .where('target_id', '=', item.id)
        .where('target_type', '=', 'VOCAB')
        .selectAll()
        .executeTakeFirst();
      expect(card).not.toBeUndefined();
      expect(card?.state).toBe('NEW');
    }
  });

  it('clears all vocab items and cascades cleanup of context examples, cards, and reviews', async () => {
    // 1. Create two vocab items
    const item1 = await repo.createVocab({
      word: 'clarity',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'NOUN',
      subcategory: 'UNCOUNTABLE',
      definitionEn: 'the quality of being clear',
      translationEs: 'claridad',
      ipaGeneralAmerican: '/ˈklɛrəti/',
      cefrLevel: 'B2',
      frequencyBand: 'TOP_3000',
      isCore: false,
      masteryStatus: 'LEARNING',
      collocationsJson: [],
      isSeparable: null,
      phoneticEdEnding: null,
      isFalseFriend: false,
      falseFriendNote: null,
    });

    const item2 = await repo.createVocab({
      word: 'lucid',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'ADJECTIVE',
      subcategory: null,
      definitionEn: 'expressed clearly; easy to understand',
      translationEs: 'lúcido, claro',
      ipaGeneralAmerican: '/ˈluːsɪd/',
      cefrLevel: 'C1',
      frequencyBand: 'TOP_5000',
      isCore: false,
      masteryStatus: 'LEARNING',
      collocationsJson: [],
      isSeparable: null,
      phoneticEdEnding: null,
      isFalseFriend: false,
      falseFriendNote: null,
    });

    // 2. Add context examples
    await repo.addContextExample({
      vocabId: item1.id,
      sentenceEn: 'His explanation brought clarity.',
      sentenceEs: 'Su explicación aportó claridad.',
      clozeTarget: 'clarity',
      cefrLevel: 'B2',
    });

    // 3. Add SRS cards
    await db
      .insertInto('srs_cards')
      .values([
        {
          id: 'card_clarity',
          user_id: 'user_local',
          target_type: 'VOCAB',
          target_id: item1.id,
          srs_profile: 'VOCAB_AGILE',
          state: 'NEW',
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          consecutive_lapses: 0,
          is_leech: 0,
          last_reviewed_at: null,
          scheduled_for: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 'card_lucid',
          user_id: 'user_local',
          target_type: 'VOCAB',
          target_id: item2.id,
          srs_profile: 'VOCAB_AGILE',
          state: 'NEW',
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          consecutive_lapses: 0,
          is_leech: 0,
          last_reviewed_at: null,
          scheduled_for: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ])
      .execute();

    // 4. Add a review log
    await db
      .insertInto('review_logs')
      .values({
        id: 'rev_log_1',
        card_id: 'card_clarity',
        rating: 3,
        state_before: 'NEW',
        stability_before: 0,
        difficulty_before: 0,
        new_stability: 1,
        new_difficulty: 5,
        elapsed_ms: 1000,
        reviewed_at: new Date().toISOString(),
      })
      .execute();

    // 5. Execute clearAllVocabs
    const count = await repo.clearAllVocabs();
    expect(count).toBeGreaterThanOrEqual(2);

    // 6. Verify table states
    const remainingVocabs = await repo.getAllVocabs(100);
    expect(remainingVocabs).toHaveLength(0);

    const remainingCards = await db
      .selectFrom('srs_cards')
      .where('target_type', '=', 'VOCAB')
      .selectAll()
      .execute();
    expect(remainingCards).toHaveLength(0);

    const remainingLogs = await db
      .selectFrom('review_logs')
      .where('card_id', '=', 'card_clarity')
      .selectAll()
      .execute();
    expect(remainingLogs).toHaveLength(0);
  });

  it('batches context examples retrieval in a single query with getContextExamplesForVocabs', async () => {
    // Insert two test vocab items with examples
    const v1 = await repo.createVocab({
      word: 'batchone',
      translationEs: 'lote uno',
      definitionEn: 'first batch item',
      ipaGeneralAmerican: 'bætʃ wʌn',
      isFalseFriend: false,
      cefrLevel: 'A1',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      isCore: false,
      masteryStatus: 'LEARNING',
    });
    const v2 = await repo.createVocab({
      word: 'batchtwo',
      translationEs: 'lote dos',
      definitionEn: 'second batch item',
      ipaGeneralAmerican: 'bætʃ tuː',
      isFalseFriend: false,
      cefrLevel: 'B1',
      partOfSpeech: 'VERB',
      grammaticalDimension: 'CONTENT',
      isCore: false,
      masteryStatus: 'LEARNING',
    });

    await repo.addContextExample({
      vocabId: v1.id,
      sentenceEn: 'This is batch one.',
      sentenceEs: 'Este es el lote uno.',
      clozeTarget: 'batchone',
      cefrLevel: 'A1',
    });

    await repo.addContextExample({
      vocabId: v2.id,
      sentenceEn: 'This is batch two.',
      sentenceEs: 'Este es el lote dos.',
      clozeTarget: 'batchtwo',
      cefrLevel: 'B1',
    });

    const results = await repo.getContextExamplesForVocabs([v1.id, v2.id]);
    expect(results[v1.id]).toBeDefined();
    expect(results[v1.id]).toHaveLength(1);
    expect(results[v1.id][0].sentenceEn).toBe('This is batch one.');

    expect(results[v2.id]).toBeDefined();
    expect(results[v2.id]).toHaveLength(1);
    expect(results[v2.id][0].sentenceEn).toBe('This is batch two.');

    // Empty array returns empty map
    const emptyResult = await repo.getContextExamplesForVocabs([]);
    expect(emptyResult).toEqual({});
  });
});
