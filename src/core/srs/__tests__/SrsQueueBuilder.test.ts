import { describe, it, expect } from 'vitest';
import { SrsQueueBuilder } from '../SrsQueueBuilder';
import { CardWithTarget, SrsCard } from '../../types/srs';
import { VocabItem } from '../../types/vocab';

describe('SrsQueueBuilder', () => {
  const createMockCard = (id: string, word: string, subcategory = 'general'): CardWithTarget => {
    const vocab: VocabItem = {
      id: `voc_${id}`,
      word,
      translationEs: word,
      definitionEn: word,
      ipaGeneralAmerican: 'ˈtɛst',
      cefrLevel: 'B1',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      subcategory,
      isFalseFriend: false,
      isCore: true,
      masteryStatus: 'LEARNING',
      createdAt: new Date().toISOString(),
    };

    const card: SrsCard = {
      id: `card_${id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: vocab.id,
      srsProfile: 'VOCAB_AGILE',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      consecutiveLapses: 0,
      isLeech: false,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return { card, vocab, allContexts: [] };
  };

  it('caps new cards according to maxNewCardsPerDay', () => {
    const builder = new SrsQueueBuilder({ maxNewCardsPerDay: 3 });

    const dueCards: CardWithTarget[] = [createMockCard('due_1', 'due1')];
    const newCards: CardWithTarget[] = [
      createMockCard('new_1', 'new1'),
      createMockCard('new_2', 'new2'),
      createMockCard('new_3', 'new3'),
      createMockCard('new_4', 'new4'),
      createMockCard('new_5', 'new5'),
    ];

    const queue = builder.buildQueue(dueCards, newCards);

    // 1 due card + 3 capped new cards = 4 cards
    expect(queue.length).toBe(4);
  });

  it('spaces out cards with the same word lemma (e.g. multiple senses added simultaneously)', () => {
    const builder = new SrsQueueBuilder({ maxNewCardsPerDay: 10, minSemanticSeparation: 2, shuffle: false });

    // 2 senses of "thought" added together, along with other cards
    const cards = [
      createMockCard('1', 'thought', 'noun_sense'),
      createMockCard('2', 'thought', 'verb_sense'),
      createMockCard('3', 'apple', 'food'),
      createMockCard('4', 'banana', 'food'),
      createMockCard('5', 'car', 'vehicle'),
    ];

    const queue = builder.buildQueue(cards, []);

    expect(queue.length).toBe(5);
    // Find positions of "thought"
    const thoughtIndices = queue
      .map((item, idx) => (item.vocab?.word.toLowerCase() === 'thought' ? idx : -1))
      .filter((idx) => idx !== -1);

    expect(thoughtIndices.length).toBe(2);
    // They should not be consecutive!
    expect(Math.abs(thoughtIndices[1] - thoughtIndices[0])).toBeGreaterThanOrEqual(2);
  });

  it('spaces out cards from the same semantic cluster using interleaver', () => {
    const builder = new SrsQueueBuilder({ maxNewCardsPerDay: 10, minSemanticSeparation: 2, shuffle: false });

    const cards = [
      createMockCard('1', 'dog', 'animals'),
      createMockCard('2', 'cat', 'animals'),
      createMockCard('3', 'apple', 'food'),
      createMockCard('4', 'banana', 'food'),
      createMockCard('5', 'wolf', 'animals'),
    ];

    const queue = builder.buildQueue(cards, []);

    expect(queue.length).toBe(5);
    // Consecutive items should not share the same subcategory when alternative exists
    expect(queue[0].vocab?.subcategory).not.toBe(queue[1].vocab?.subcategory);
  });

  it('excludes leeches from the daily session queue by default', () => {
    const builder = new SrsQueueBuilder({ shuffle: false });

    const normalCard = createMockCard('1', 'normal');
    const leechCard = createMockCard('2', 'leech');
    leechCard.card.isLeech = true;

    const queueDefault = builder.buildQueue([normalCard, leechCard], []);
    expect(queueDefault.length).toBe(1);
    expect(queueDefault[0].card.id).toBe('card_1');

    const queueWithLeeches = builder.buildQueue([normalCard, leechCard], [], { includeLeeches: true });
    expect(queueWithLeeches.length).toBe(2);
  });

  it('filters queue by srsProfile to isolate agile vocabulary from error drills', () => {
    const builder = new SrsQueueBuilder({ shuffle: false });

    const vocabCard = createMockCard('1', 'hello');
    vocabCard.card.srsProfile = 'VOCAB_AGILE';

    const errorCard = createMockCard('2', 'error_drift');
    errorCard.card.srsProfile = 'WRITING_ERROR_REFLECTIVE';
    errorCard.card.targetType = 'WRITING_ERROR';

    const vocabQueue = builder.buildQueue([vocabCard, errorCard], [], { srsProfile: 'VOCAB_AGILE' });
    expect(vocabQueue.length).toBe(1);
    expect(vocabQueue[0].card.id).toBe('card_1');

    const errorQueue = builder.buildQueue([vocabCard, errorCard], [], { srsProfile: 'WRITING_ERROR_REFLECTIVE' });
    expect(errorQueue.length).toBe(1);
    expect(errorQueue[0].card.id).toBe('card_2');
  });

  it('prioritizes intraday learning/relearning cards ahead of regular review cards', () => {
    const builder = new SrsQueueBuilder({ shuffle: false });

    const reviewCard = createMockCard('1', 'review_word');
    reviewCard.card.state = 'REVIEW';
    reviewCard.card.stability = 10;
    reviewCard.card.lastReviewedAt = new Date(Date.now() - 5 * 86400000).toISOString();

    const learningCard = createMockCard('2', 'learning_word');
    learningCard.card.state = 'LEARNING';
    learningCard.card.stability = 0.5;

    const queue = builder.buildQueue([reviewCard, learningCard], []);
    expect(queue[0].card.id).toBe('card_2'); // Intraday learning card first!
  });
});

