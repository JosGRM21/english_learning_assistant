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
      createdAt: new Date().toISOString(),
    };

    const card: SrsCard = {
      id: `card_${id}`,
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

  it('spaces out cards from the same semantic cluster using interleaver', () => {
    const builder = new SrsQueueBuilder({ maxNewCardsPerDay: 10, minSemanticSeparation: 2 });

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
});
