import { describe, it, expect } from 'vitest';
import { FsrsScheduler } from '../FsrsScheduler';
import { SrsCard } from '../../types/srs';

describe('FsrsScheduler', () => {
  const scheduler = new FsrsScheduler(0.9);

  const createNewCard = (overrides?: Partial<SrsCard>): SrsCard => ({
    id: 'test-card-1',
    userId: 'user-1',
    targetType: 'VOCAB',
    targetId: 'vocab-1',
    state: 'NEW',
    stability: 0,
    difficulty: 5.0,
    reps: 0,
    lapses: 0,
    lastReviewedAt: null,
    scheduledFor: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  describe('calculateRetrievability', () => {
    it('returns 0 if card has no review history', () => {
      const card = createNewCard();
      expect(scheduler.calculateRetrievability(card)).toBe(0);
    });

    it('returns exactly 1.0 on immediate same-day recall', () => {
      const now = new Date('2026-09-29T12:00:00Z');
      const card = createNewCard({
        stability: 5.0,
        lastReviewedAt: now.toISOString(),
      });
      const R = scheduler.calculateRetrievability(card, now);
      expect(R).toBeCloseTo(1.0, 5);
    });

    it('returns exactly 0.90 (90%) when elapsed time equals stability', () => {
      const reviewDate = new Date('2026-09-20T12:00:00Z');
      const stability = 10; // 10 days
      const targetDate = new Date('2026-09-30T12:00:00Z'); // 10 days later

      const card = createNewCard({
        stability,
        lastReviewedAt: reviewDate.toISOString(),
      });

      const R = scheduler.calculateRetrievability(card, targetDate);
      // Math: (1 + 19/81 * 1)^(-0.5) = (100/81)^(-0.5) = 9/10 = 0.9
      expect(R).toBeCloseTo(0.9, 4);
    });
  });

  describe('nextInterval', () => {
    it('returns interval approximately equal to stability for 90% retention', () => {
      const stability = 14;
      const interval = scheduler.nextInterval(stability);
      expect(interval).toBe(14);
    });

    it('returns at least 1 day even for very small stability', () => {
      const interval = scheduler.nextInterval(0.2);
      expect(interval).toBeGreaterThanOrEqual(1);
    });
  });

  describe('schedule new cards', () => {
    it('sets state to LEARNING and increments lapses when grade is Again (1)', () => {
      const card = createNewCard();
      const now = new Date('2026-09-29T10:00:00Z');
      const { updatedCard, log } = scheduler.schedule(card, 1, now);

      expect(updatedCard.state).toBe('LEARNING');
      expect(updatedCard.lapses).toBe(1);
      expect(updatedCard.reps).toBe(1);
      expect(updatedCard.stability).toBeCloseTo(0.4026, 3);
      expect(log.rating).toBe(1);
      expect(log.stateBefore).toBe('NEW');
    });

    it('sets state to REVIEW and stability to Good base when grade is Good (3)', () => {
      const card = createNewCard();
      const now = new Date('2026-09-29T10:00:00Z');
      const { updatedCard } = scheduler.schedule(card, 3, now);

      expect(updatedCard.state).toBe('REVIEW');
      expect(updatedCard.lapses).toBe(0);
      expect(updatedCard.reps).toBe(1);
      expect(updatedCard.stability).toBeCloseTo(3.173, 2);
      expect(updatedCard.difficulty).toBeGreaterThan(1);
      expect(updatedCard.difficulty).toBeLessThanOrEqual(10);
    });

    it('sets higher initial stability when grade is Easy (4)', () => {
      const card = createNewCard();
      const now = new Date('2026-09-29T10:00:00Z');
      const { updatedCard } = scheduler.schedule(card, 4, now);

      expect(updatedCard.state).toBe('REVIEW');
      expect(updatedCard.stability).toBeCloseTo(15.691, 2);
    });
  });

  describe('schedule review cards', () => {
    it('increases stability on successful recall and maintains REVIEW state', () => {
      const lastReview = new Date('2026-09-20T10:00:00Z');
      const now = new Date('2026-09-29T10:00:00Z'); // 9 days later
      const card = createNewCard({
        state: 'REVIEW',
        stability: 10,
        difficulty: 4.5,
        reps: 2,
        lapses: 0,
        lastReviewedAt: lastReview.toISOString(),
      });

      const { updatedCard } = scheduler.schedule(card, 3, now);

      expect(updatedCard.state).toBe('REVIEW');
      expect(updatedCard.stability).toBeGreaterThan(10);
      expect(updatedCard.reps).toBe(3);
    });

    it('transitions to RELEARNING and increments lapses when forgetting a review card', () => {
      const lastReview = new Date('2026-09-20T10:00:00Z');
      const now = new Date('2026-09-29T10:00:00Z');
      const card = createNewCard({
        state: 'REVIEW',
        stability: 12,
        difficulty: 5.0,
        reps: 3,
        lapses: 0,
        lastReviewedAt: lastReview.toISOString(),
      });

      const { updatedCard } = scheduler.schedule(card, 1, now);

      expect(updatedCard.state).toBe('RELEARNING');
      expect(updatedCard.lapses).toBe(1);
      expect(updatedCard.reps).toBe(4);
      expect(updatedCard.stability).toBeLessThan(card.stability);
    });
  });

  describe('previewIntervals', () => {
    it('returns intervals for all 4 grades in monotonic order for new cards', () => {
      const card = createNewCard();
      const intervals = scheduler.previewIntervals(card);

      expect(intervals[1]).toBeDefined();
      expect(intervals[2]).toBeDefined();
      expect(intervals[3]).toBeDefined();
      expect(intervals[4]).toBeDefined();
      expect(intervals[1]).toBeLessThanOrEqual(intervals[2]);
      expect(intervals[2]).toBeLessThanOrEqual(intervals[3]);
      expect(intervals[3]).toBeLessThanOrEqual(intervals[4]);
    });
  });
});
