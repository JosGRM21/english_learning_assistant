import { CardState, FsrsGrade, SrsCard, ReviewLog } from '../types/srs';

export interface FsrsWeights {
  w: number[];
}

export const DEFAULT_FSRS_WEIGHTS: number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
  1.54576, 0.19914, 1.0124, 0.4466, 1.4897, 0.2189, 0.318, 0.2823, 0.2802,
];

export interface ScheduledReviewResult {
  updatedCard: SrsCard;
  log: Omit<ReviewLog, 'id' | 'cardId' | 'reviewedAt'>;
  intervalDays: number;
}

export class FsrsScheduler {
  private readonly requestedRetention: number;
  private readonly factor = 19.0 / 81.0;
  private readonly decay = 0.5;
  private readonly w: number[];

  constructor(requestedRetention = 0.9, customWeights?: number[]) {
    this.requestedRetention = requestedRetention;
    this.w = customWeights && customWeights.length === 17 ? customWeights : DEFAULT_FSRS_WEIGHTS;
  }

  /**
   * Calculates current probability of recall R(t, S) using power law.
   */
  public calculateRetrievability(card: Pick<SrsCard, 'stability' | 'lastReviewedAt'>, now: Date = new Date()): number {
    if (!card.lastReviewedAt || card.stability <= 0) return 0.0;
    const lastReviewedDate = new Date(card.lastReviewedAt);
    const elapsedDays = Math.max(0, (now.getTime() - lastReviewedDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.pow(1.0 + this.factor * (elapsedDays / card.stability), -this.decay);
  }

  /**
   * Calculates optimal review interval for target retention.
   */
  public nextInterval(stability: number): number {
    const interval = (stability / this.factor) * (Math.pow(this.requestedRetention, -1.0 / this.decay) - 1.0);
    return Math.max(1, Math.round(interval));
  }

  /**
   * Previews next intervals in days for grades 1..4 without mutating card.
   */
  public previewIntervals(card: SrsCard, now: Date = new Date()): Record<FsrsGrade, number> {
    const grades: FsrsGrade[] = [1, 2, 3, 4];
    const result = {} as Record<FsrsGrade, number>;
    for (const grade of grades) {
      const scheduled = this.schedule(card, grade, now);
      result[grade] = scheduled.intervalDays;
    }
    return result;
  }

  /**
   * Schedules a card after user review with given grade (1: Again, 2: Hard, 3: Good, 4: Easy).
   */
  public schedule(card: SrsCard, grade: FsrsGrade, now: Date = new Date()): ScheduledReviewResult {
    let newS: number;
    let newD: number;
    let newState: CardState = card.state;
    let newLapses = card.lapses;

    const stateBefore = card.state;
    const stabilityBefore = card.stability;
    const difficultyBefore = card.difficulty;

    if (card.state === 'NEW') {
      newS = this.w[grade - 1];
      newD = Math.min(Math.max(this.w[4] - Math.exp(this.w[5] * (grade - 1)) + 1, 1.0), 10.0);
      newState = grade === 1 ? 'LEARNING' : 'REVIEW';
      if (grade === 1) {
        newLapses += 1;
      }
    } else {
      const R = this.calculateRetrievability(card, now);

      // Update difficulty
      const deltaD = -this.w[6] * (grade - 3);
      const dRaw = card.difficulty + deltaD;
      const d0 = this.w[4] - Math.exp(this.w[5] * (3 - 1)) + 1; // Good base
      newD = Math.min(Math.max(this.w[7] * d0 + (1 - this.w[7]) * dRaw, 1.0), 10.0);

      if (grade === 1) {
        // Lapse (Again)
        newS = this.w[13] * Math.pow(newD, -this.w[14]) * Math.pow(card.stability + 1, this.w[15]) * Math.exp(this.w[16] * (1 - R));
        newState = 'RELEARNING';
        newLapses += 1;
      } else {
        // Successful Recall (Hard, Good, Easy)
        const gradeBonus = grade === 2 ? this.w[11] : grade === 4 ? this.w[12] : 1.0;
        const sInc =
          1.0 +
          Math.exp(this.w[8]) *
            (11 - newD) *
            Math.pow(card.stability, -this.w[9]) *
            (Math.exp(this.w[10] * (1 - R)) - 1) *
            gradeBonus;
        newS = Math.max(0.1, card.stability * sInc);
        newState = 'REVIEW';
      }
    }

    const intervalDays = this.nextInterval(newS);
    const scheduledForDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    const updatedCard: SrsCard = {
      ...card,
      stability: parseFloat(newS.toFixed(4)),
      difficulty: parseFloat(newD.toFixed(4)),
      reps: card.reps + 1,
      lapses: newLapses,
      state: newState,
      lastReviewedAt: now.toISOString(),
      scheduledFor: scheduledForDate.toISOString(),
    };

    const log: Omit<ReviewLog, 'id' | 'cardId' | 'reviewedAt'> = {
      rating: grade,
      stateBefore,
      stabilityBefore: parseFloat(stabilityBefore.toFixed(4)),
      difficultyBefore: parseFloat(difficultyBefore.toFixed(4)),
      newStability: updatedCard.stability,
      newDifficulty: updatedCard.difficulty,
      elapsedMs: 0,
    };

    return {
      updatedCard,
      log,
      intervalDays,
    };
  }
}
