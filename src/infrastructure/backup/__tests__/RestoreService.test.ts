import { describe, it, expect, beforeEach } from 'vitest';
import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../../core/types/database';
import { createTestDatabase } from '../../db/database';
import { RestoreService } from '../RestoreService';
import { CardRepository } from '../../db/repositories/CardRepository';
import { VocabRepository } from '../../db/repositories/VocabRepository';

describe('RestoreService', () => {
  let db: Kysely<DatabaseSchema>;
  let cardRepo: CardRepository;
  let vocabRepo: VocabRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    cardRepo = new CardRepository(db);
    vocabRepo = new VocabRepository(db);
  });

  it('restores backup with nested vocab, phonetics, contexts, and srs cards into SQLite', async () => {
    const payload = {
      cards: [
        {
          id: 'card_apple',
          userId: 'user_local',
          targetType: 'VOCAB',
          targetId: 'voc_apple',
          state: 'LEARNING',
          stability: 3.5,
          difficulty: 4.2,
          reps: 2,
          lapses: 0,
          scheduledFor: new Date().toISOString(),
          vocab: {
            id: 'voc_apple',
            word: 'apple',
            grammaticalDimension: 'CONTENT',
            partOfSpeech: 'NOUN',
            definitionEn: 'A round fruit with red, green, or yellow skin and a white flesh.',
            translationEs: 'Manzana',
            ipaGeneralAmerican: '/ˈæp.əl/',
            ipaReceivedPronunciation: '/ˈæp.l̩/',
            cefrLevel: 'A1',
            isFalseFriend: false,
            morphologicalFamilyJson: ['apples'],
          },
          contexts: [
            {
              id: 'ctx_apple_1',
              sentenceEn: 'She ate a juicy red apple.',
              sentenceEs: 'Ella comió una jugosa manzana roja.',
              clozeTarget: 'apple',
              cefrLevel: 'A1',
            },
          ],
        },
      ],
      reviews: [
        {
          id: 'log_apple_1',
          cardId: 'card_apple',
          rating: 3,
          stateBefore: 'NEW',
          stabilityBefore: 0,
          difficultyBefore: 5,
          newStability: 3.5,
          newDifficulty: 4.2,
          elapsedMs: 2500,
          reviewedAt: new Date().toISOString(),
        },
      ],
    };

    const stats = await RestoreService.restoreBackupToDatabase(db, payload);

    expect(stats.restoredVocabs).toBe(1);
    expect(stats.restoredCards).toBe(1);
    expect(stats.restoredContexts).toBe(1);
    expect(stats.restoredReviews).toBe(1);

    // Verify vocab_items
    const vocabs = await vocabRepo.getAllVocabs(10);
    expect(vocabs).toHaveLength(1);
    expect(vocabs[0].word).toBe('apple');
    expect(vocabs[0].ipaGeneralAmerican).toBe('/ˈæp.əl/');
    expect(vocabs[0].translationEs).toBe('Manzana');
    expect(vocabs[0].cefrLevel).toBe('A1');

    // Verify contexts
    const contexts = await vocabRepo.getContextExamples(vocabs[0].id);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].sentenceEn).toBe('She ate a juicy red apple.');

    // Verify SRS cards
    const cardsWithDetails = await cardRepo.getAllCardsWithDetails('user_local');
    expect(cardsWithDetails).toHaveLength(1);
    expect(cardsWithDetails[0].card.stability).toBe(3.5);
    expect(cardsWithDetails[0].card.difficulty).toBe(4.2);
    expect(cardsWithDetails[0].vocab?.word).toBe('apple');
    expect(cardsWithDetails[0].vocab?.ipaGeneralAmerican).toBe('/ˈæp.əl/');

    // Verify review logs
    const logs = await cardRepo.getAllReviewLogs(10);
    expect(logs).toHaveLength(1);
    expect(logs[0].cardId).toBe('card_apple');
    expect(logs[0].rating).toBe(3);
  });

  it('restores flat vocab items with snake_case and default values', async () => {
    const payload = {
      cards: [
        {
          id: 'c_flat_1',
          word: 'ubiquitous',
          translation_es: 'omnipresente',
          definition_en: 'present everywhere',
          ipa_general_american: '/juːˈbɪk.wə.təs/',
          cefr_level: 'c1',
          part_of_speech: 'adjective',
          grammatical_dimension: 'content',
          stability: 5.0,
        },
      ],
    };

    const stats = await RestoreService.restoreBackupToDatabase(db, payload);

    expect(stats.restoredVocabs).toBe(1);
    expect(stats.restoredCards).toBe(1);

    const vocabs = await vocabRepo.getAllVocabs(10);
    expect(vocabs).toHaveLength(1);
    expect(vocabs[0].word).toBe('ubiquitous');
    expect(vocabs[0].translationEs).toBe('omnipresente');
    expect(vocabs[0].cefrLevel).toBe('C1');
    expect(vocabs[0].partOfSpeech).toBe('ADJECTIVE');

    const srsCards = await cardRepo.getAllCardsWithDetails('user_local');
    expect(srsCards).toHaveLength(1);
    expect(srsCards[0].vocab?.word).toBe('ubiquitous');
    expect(srsCards[0].card.stability).toBe(5.0);
  });

  it('is idempotent and updates existing records instead of duplicating', async () => {
    const payload1 = {
      cards: [
        {
          id: 'card_serendipity',
          vocab: {
            id: 'voc_serendipity',
            word: 'serendipity',
            translationEs: 'suerte',
            definitionEn: 'happy accident',
            ipaGeneralAmerican: '/ˌsɛr.ənˈdɪp.ə.ti/',
            cefrLevel: 'C1',
          },
        },
      ],
    };

    await RestoreService.restoreBackupToDatabase(db, payload1);

    const payload2 = {
      cards: [
        {
          id: 'card_serendipity',
          vocab: {
            id: 'voc_serendipity',
            word: 'serendipity',
            translationEs: 'serendipia / hallazgo afortunado',
            definitionEn: 'finding valuable things not sought for',
            ipaGeneralAmerican: '/ˌsɛr.ənˈdɪp.ə.ti/',
            cefrLevel: 'C1',
          },
          stability: 4.5,
        },
      ],
    };

    await RestoreService.restoreBackupToDatabase(db, payload2);

    const vocabs = await vocabRepo.getAllVocabs(10);
    expect(vocabs).toHaveLength(1);
    expect(vocabs[0].translationEs).toBe('serendipia / hallazgo afortunado');

    const cards = await cardRepo.getAllCardsWithDetails('user_local');
    expect(cards).toHaveLength(1);
    expect(cards[0].card.stability).toBe(4.5);
  });
});
