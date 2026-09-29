import { describe, it, expect } from 'vitest';
import { FsrsCalibrator } from '../FsrsCalibrator';
import { ReviewLog } from '../../types/srs';

describe('FsrsCalibrator', () => {
  const calibrator = new FsrsCalibrator();

  const createMockLog = (rating: 1 | 2 | 3 | 4): ReviewLog => ({
    id: `log_${Math.random()}`,
    cardId: 'card_1',
    rating,
    stateBefore: 'REVIEW',
    stabilityBefore: 5.0,
    difficultyBefore: 5.0,
    newStability: 6.0,
    newDifficulty: 5.0,
    elapsedMs: 2000,
    reviewedAt: new Date().toISOString(),
  });

  it('handles empty review logs gracefully', () => {
    const report = calibrator.calibrate([], 0.9);
    expect(report.totalReviewsEvaluated).toBe(0);
    expect(report.sampleSizeAdequate).toBe(false);
  });

  it('calculates exact retention rate from successful ratings', () => {
    // 35 logs: 30 successful (rating 3), 5 lapses (rating 1) -> 30/35 = 85.7%
    const logs: ReviewLog[] = [
      ...Array.from({ length: 30 }, () => createMockLog(3)),
      ...Array.from({ length: 5 }, () => createMockLog(1)),
    ];

    const report = calibrator.calibrate(logs, 0.9);

    expect(report.totalReviewsEvaluated).toBe(35);
    expect(report.successfulRecalls).toBe(30);
    expect(report.actualRetentionRate).toBeCloseTo(0.857, 2);
    expect(report.sampleSizeAdequate).toBe(true);
    expect(report.retentionDeficit).toBeLessThan(0);
  });

  it('suggests tightening retention request when actual retention is low', () => {
    // 40 logs: 28 success, 12 lapses (70% retention vs 90% target)
    const logs: ReviewLog[] = [
      ...Array.from({ length: 28 }, () => createMockLog(3)),
      ...Array.from({ length: 12 }, () => createMockLog(1)),
    ];

    const report = calibrator.calibrate(logs, 0.9);

    expect(report.actualRetentionRate).toBe(0.7);
    expect(report.recommendedRequestRetention).toBeGreaterThan(0.9);
    expect(report.recommendationEs).toContain('inferior al 90%');
  });
});
