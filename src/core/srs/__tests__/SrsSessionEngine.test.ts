import { describe, it, expect, beforeEach } from 'vitest';
import { SrsSessionEngine } from '../SrsSessionEngine';
import { CardWithTarget, SrsCard } from '../../types/srs';
import { VocabItem } from '../../types/vocab';

describe('SrsSessionEngine', () => {
  const createMockCardWithTarget = (id: string, word: string): CardWithTarget => {
    const vocab: VocabItem = {
      id: `voc_${id}`,
      word,
      translationEs: `traducción ${word}`,
      definitionEn: `definition of ${word}`,
      ipaGeneralAmerican: 'ˈtɛst',
      cefrLevel: 'B1',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    const card: SrsCard = {
      id: `card_${id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: vocab.id,
      state: 'REVIEW',
      stability: 2.5,
      difficulty: 5.0,
      reps: 1,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return {
      card,
      vocab,
      allContexts: [],
    };
  };

  let cards: CardWithTarget[];

  beforeEach(() => {
    cards = [
      createMockCardWithTarget('1', 'apple'),
      createMockCardWithTarget('2', 'banana'),
      createMockCardWithTarget('3', 'cherry'),
      createMockCardWithTarget('4', 'date'),
      createMockCardWithTarget('5', 'elderberry'),
    ];
  });

  it('initializes with correct counts and first card', () => {
    const engine = new SrsSessionEngine(cards);

    expect(engine.getRemainingCount()).toBe(5);
    expect(engine.getCompletedCount()).toBe(0);
    expect(engine.getTotalCards()).toBe(5);
    expect(engine.isFinished()).toBe(false);
    expect(engine.getCurrentCard()?.vocab?.word).toBe('apple');
  });

  it('advances automatically to the next card on successful rating (Good / Grade 3)', () => {
    const engine = new SrsSessionEngine(cards);

    const updatedCard: SrsCard = {
      ...cards[0].card,
      reps: 2,
      stability: 5.0,
      state: 'REVIEW',
    };

    const result = engine.processRating(3, updatedCard, 1200);

    expect(result.wasRequeued).toBe(false);
    expect(result.nextCard?.vocab?.word).toBe('banana');
    expect(engine.getCurrentCard()?.vocab?.word).toBe('banana');
    expect(engine.getRemainingCount()).toBe(4);
    expect(engine.getCompletedCount()).toBe(1);
    expect(engine.isFinished()).toBe(false);

    const stats = engine.getStats();
    expect(stats.totalReviewed).toBe(1);
    expect(stats.successfulRecalls).toBe(1);
    expect(stats.lapses).toBe(0);
    expect(stats.averageLatencyMs).toBe(1200);
  });

  it('re-queues failed cards intra-session on Again (Grade 1) at offset 3', () => {
    const engine = new SrsSessionEngine(cards);

    const updatedLapsedCard: SrsCard = {
      ...cards[0].card,
      lapses: 1,
      state: 'RELEARNING',
    };

    // Card 1 is 'apple'. Next in queue are 'banana', 'cherry', 'date', 'elderberry'.
    // Re-inserting 'apple' at index 3 means:
    // index 0: 'banana'
    // index 1: 'cherry'
    // index 2: 'date'
    // index 3: 'apple' (re-queued!)
    // index 4: 'elderberry'
    const result = engine.processRating(1, updatedLapsedCard, 2500);

    expect(result.wasRequeued).toBe(true);
    expect(result.nextCard?.vocab?.word).toBe('banana');
    expect(engine.getRemainingCount()).toBe(5); // Still 5 cards to review!
    expect(engine.getCompletedCount()).toBe(0);

    const stats = engine.getStats();
    expect(stats.totalReviewed).toBe(1);
    expect(stats.lapses).toBe(1);
    expect(stats.successfulRecalls).toBe(0);

    // Rate banana (Good) -> Next is cherry
    engine.processRating(3, cards[1].card, 1000);
    expect(engine.getCurrentCard()?.vocab?.word).toBe('cherry');

    // Rate cherry (Good) -> Next is date
    engine.processRating(3, cards[2].card, 1000);
    expect(engine.getCurrentCard()?.vocab?.word).toBe('date');

    // Rate date (Good) -> Next must be the re-queued 'apple'!
    engine.processRating(3, cards[3].card, 1000);
    expect(engine.getCurrentCard()?.vocab?.word).toBe('apple');
  });

  it('re-queues at the tail when remaining cards are fewer than 3', () => {
    const shortList = [
      createMockCardWithTarget('1', 'apple'),
      createMockCardWithTarget('2', 'banana'),
    ];
    const engine = new SrsSessionEngine(shortList);

    // Apple failed
    const result = engine.processRating(1, shortList[0].card);
    expect(result.wasRequeued).toBe(true);
    expect(result.nextCard?.vocab?.word).toBe('banana');

    // Rate banana
    engine.processRating(3, shortList[1].card);
    // Next should be apple again!
    expect(engine.getCurrentCard()?.vocab?.word).toBe('apple');
  });

  it('marks session as finished when all cards are completed', () => {
    const singleCard = [createMockCardWithTarget('1', 'single')];
    const engine = new SrsSessionEngine(singleCard);

    expect(engine.isFinished()).toBe(false);

    const result = engine.processRating(4, singleCard[0].card, 800);

    expect(result.isFinished).toBe(true);
    expect(result.nextCard).toBeNull();
    expect(engine.isFinished()).toBe(true);
    expect(engine.getRemainingCount()).toBe(0);
    expect(engine.getCompletedCount()).toBe(1);
    expect(engine.getProgressPercentage()).toBe(100);

    const stats = engine.getStats();
    expect(stats.finishedAt).not.toBeNull();
    expect(stats.totalReviewed).toBe(1);
  });

  it('supports jumpToCard for direct selection from deck explorer', () => {
    const engine = new SrsSessionEngine(cards);
    expect(engine.getCurrentCard()?.vocab?.word).toBe('apple');

    const dateCard = cards[3]; // 'date'
    engine.jumpToCard(dateCard);

    expect(engine.getCurrentCard()?.vocab?.word).toBe('date');
    expect(engine.getRemainingCount()).toBe(5);
  });
});
