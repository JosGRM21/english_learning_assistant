import { CardState, FsrsGrade, SrsCard, ReviewLog, SrsProfile } from '../types/srs';

export interface SchedulerProfileConfig {
  requestedRetention: number; // 0.90 for VOCAB_AGILE, 0.92 for WRITING_ERROR_REFLECTIVE
  initialStabilityDays: number;
  lapsePenaltyMultiplier: number;
  maxIntervalDays: number;
  leechConsecutiveThreshold: number; // 4 for vocab, 3 for errors
  leechTotalLapsesThreshold: number; // 6 for vocab, 5 for errors
}

export const SRS_PROFILES_CONFIG: Record<SrsProfile, SchedulerProfileConfig> = {
  VOCAB_AGILE: {
    requestedRetention: 0.90,
    initialStabilityDays: 1.0,
    lapsePenaltyMultiplier: 1.0,
    maxIntervalDays: 365,
    leechConsecutiveThreshold: 4,
    leechTotalLapsesThreshold: 6,
  },
  WRITING_ERROR_REFLECTIVE: {
    requestedRetention: 0.92,
    initialStabilityDays: 0.5,
    lapsePenaltyMultiplier: 1.3,
    maxIntervalDays: 180,
    leechConsecutiveThreshold: 3,
    leechTotalLapsesThreshold: 5,
  },
};

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
   * Returns configuration parameters for a given profile.
   */
  public getProfileConfig(profile: SrsProfile = 'VOCAB_AGILE'): SchedulerProfileConfig {
    return SRS_PROFILES_CONFIG[profile] ?? SRS_PROFILES_CONFIG.VOCAB_AGILE;
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
   * Applies random temporal dispersion (+/- 5%) for intervals >= 3 days (RF-SRS-CORE-05).
   * Prevents cards reviewed on the same day from collapsing into identical future due dates.
   */
  public applyFuzz(interval: number): number {
    if (interval < 3) return interval;
    const maxDelta = Math.max(1, Math.round(interval * 0.05));
    const delta = Math.floor(Math.random() * (2 * maxDelta + 1)) - maxDelta;
    return Math.max(1, interval + delta);
  }

  /**
   * Calculates optimal review interval for target retention.
   * Returns 0 for sub-day stability (< 1.0) indicating an intraday learning/relearning step.
   * Capped by profile maxIntervalDays (365 for agile vocab, 180 for reflective errors).
   */
  public nextInterval(
    stability: number,
    profileOrRetention?: SrsProfile | number,
    applyFuzz = false,
  ): number {
    if (stability < 1.0) {
      return 0;
    }

    let retention = this.requestedRetention;
    let maxDays = 365;

    if (typeof profileOrRetention === 'number') {
      retention = profileOrRetention;
    } else if (typeof profileOrRetention === 'string' && SRS_PROFILES_CONFIG[profileOrRetention]) {
      retention = SRS_PROFILES_CONFIG[profileOrRetention].requestedRetention;
      maxDays = SRS_PROFILES_CONFIG[profileOrRetention].maxIntervalDays;
    }

    const rawInterval = (stability / this.factor) * (Math.pow(retention, -1.0 / this.decay) - 1.0);
    let interval = Math.min(maxDays, Math.max(1, Math.round(rawInterval)));

    if (applyFuzz && interval >= 3) {
      interval = this.applyFuzz(interval);
    }

    return interval;
  }

  /**
   * Calculates the scheduled date with daily study cut-off (04:00 AM),
   * ensuring cards reviewed late at night become due on the intended morning.
   * Sub-day intervals (0 days) schedule 10 minutes in the future for intraday repetition.
   */
  public calculateScheduledDate(now: Date, intervalDays: number, cutoffHour = 4): Date {
    if (intervalDays <= 0) {
      return new Date(now.getTime() + 10 * 60 * 1000);
    }

    const target = new Date(now);
    const isBeforeCutoff = target.getHours() < cutoffHour;
    const daysToAdd = isBeforeCutoff ? Math.max(0, intervalDays - 1) : intervalDays;

    target.setDate(target.getDate() + daysToAdd);
    target.setHours(cutoffHour, 0, 0, 0);
    return target;
  }

  /**
   * Previews next intervals in days for grades 1..4 without mutating card.
   */
  public previewIntervals(card: SrsCard, now: Date = new Date()): Record<FsrsGrade, number> {
    const grades: FsrsGrade[] = [1, 2, 3, 4];
    const result = {} as Record<FsrsGrade, number>;
    for (const grade of grades) {
      const scheduled = this.schedule(card, grade, now, { applyFuzz: false });
      result[grade] = scheduled.intervalDays;
    }
    return result;
  }

  /**
   * Schedules a card after user review with given grade (1: Again, 2: Hard, 3: Good, 4: Easy).
   * Incorporates profile configuration, leech detection, and optional fuzz factor.
   */
  public schedule(
    card: SrsCard,
    grade: FsrsGrade,
    now: Date = new Date(),
    options?: { applyFuzz?: boolean },
  ): ScheduledReviewResult {
    const profile: SrsProfile = card.srsProfile ?? 'VOCAB_AGILE';
    const config = this.getProfileConfig(profile);

    let newS: number;
    let newD: number;
    let newState: CardState = card.state;
    let newLapses = card.lapses;
    let consecutiveLapses = card.consecutiveLapses ?? 0;
    let isLeech = Boolean(card.isLeech);

    const stateBefore = card.state;
    const stabilityBefore = card.stability;
    const difficultyBefore = card.difficulty;

    // Leech detection and tracking (RF-SRS-CORE-09)
    if (grade === 1) {
      consecutiveLapses += 1;
      newLapses += 1;
      if (
        consecutiveLapses >= config.leechConsecutiveThreshold ||
        newLapses >= config.leechTotalLapsesThreshold
      ) {
        isLeech = true;
      }
    } else {
      consecutiveLapses = 0;
    }

    if (card.state === 'NEW') {
      const isEarlyReview = card.scheduledFor && new Date(card.scheduledFor).getTime() > now.getTime();
      if (isEarlyReview && grade >= 3) {
        // Early review before consolidation cooldown: cap initial stability
        newS = grade === 4 ? 1.5 : config.initialStabilityDays;
        newD = Math.min(Math.max(this.w[4] - Math.exp(this.w[5] * (grade - 1)) + 1, 1.0), 10.0);
        newState = 'REVIEW';
      } else {
        newS = profile === 'WRITING_ERROR_REFLECTIVE' && grade === 3
          ? config.initialStabilityDays
          : this.w[grade - 1];
        newD = Math.min(Math.max(this.w[4] - Math.exp(this.w[5] * (grade - 1)) + 1, 1.0), 10.0);
        newState = grade === 1 ? 'LEARNING' : 'REVIEW';
      }
    } else if (card.state === 'LEARNING') {
      // In-session or intraday learning step review
      if (grade === 1) {
        newS = this.w[0];
        newD = Math.min(card.difficulty + 0.2, 10.0);
        newState = 'LEARNING';
      } else {
        // Graduate to REVIEW with strict intraday consolidation cap (max 1.0 - 1.5 days).
        newS = grade === 4 ? 1.5 : config.initialStabilityDays;
        newD = grade === 4 ? Math.max(card.difficulty - 0.2, 1.0) : grade === 2 ? Math.min(card.difficulty + 0.2, 10.0) : card.difficulty;
        newState = 'REVIEW';
      }
    } else if (card.state === 'RELEARNING') {
      // In-session or intraday relearning step after a lapse
      if (grade === 1) {
        newS = Math.max(0.1, (card.stability * 0.8) / config.lapsePenaltyMultiplier);
        newD = Math.min(card.difficulty + 0.2, 10.0);
        newState = 'RELEARNING';
      } else {
        // Graduate back to REVIEW with strict 1.0 - 1.5 day consolidation step after a lapse
        newS = grade === 4 ? 1.5 : config.initialStabilityDays;
        newD = grade === 4 ? Math.max(card.difficulty - 0.2, 1.0) : grade === 2 ? Math.min(card.difficulty + 0.2, 10.0) : card.difficulty;
        newState = 'REVIEW';
      }
    } else {
      const R = this.calculateRetrievability(card, now);

      // Update difficulty
      const deltaD = -this.w[6] * (grade - 3);
      const dRaw = card.difficulty + deltaD;
      const d0 = this.w[4] - Math.exp(this.w[5] * (3 - 1)) + 1; // Good base
      newD = Math.min(Math.max(this.w[7] * d0 + (1 - this.w[7]) * dRaw, 1.0), 10.0);

      if (grade === 1) {
        // Lapse (Again) with profile lapsePenaltyMultiplier
        const rawLapseS = this.w[13] * Math.pow(newD, -this.w[14]) * Math.pow(card.stability + 1, this.w[15]) * Math.exp(this.w[16] * (1 - R));
        newS = Math.max(0.1, rawLapseS / config.lapsePenaltyMultiplier);
        newState = 'RELEARNING';
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

    const intervalDays = this.nextInterval(newS, profile, options?.applyFuzz ?? false);
    const scheduledForDate = this.calculateScheduledDate(now, intervalDays);

    const updatedCard: SrsCard = {
      ...card,
      srsProfile: profile,
      stability: parseFloat(newS.toFixed(4)),
      difficulty: parseFloat(newD.toFixed(4)),
      reps: card.reps + 1,
      lapses: newLapses,
      consecutiveLapses,
      isLeech,
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
