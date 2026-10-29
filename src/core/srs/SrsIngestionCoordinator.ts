import { SrsGoalSettings, IngestionPlan } from '../types/srs';

export const DEFAULT_SRS_GOAL_SETTINGS: SrsGoalSettings = {
  activeGoal: 'TOP_500',
  dailyNewCardsTarget: 10,
  overloadThreshold: 35,
  includePhrasalVerbs: true,
  phrasalVerbsRatio: 0.2,
};

export class SrsIngestionCoordinator {
  /**
   * Evaluates the current deck state and produces an ingestion plan:
   * - If dueCount >= overloadThreshold, throttles new card introduction (anti-burnout).
   * - Otherwise, calculates how many new cards are needed to meet the daily quota,
   *   taking into account new cards already present or scheduled today.
   */
  public evaluatePlan(
    dueCount: number,
    existingNewCardsCount: number,
    newCardsReviewedTodayCountOrSettings: number | SrsGoalSettings = 0,
    optionalSettings?: SrsGoalSettings,
  ): IngestionPlan {
    let newCardsReviewedTodayCount = 0;
    let settings = DEFAULT_SRS_GOAL_SETTINGS;

    if (
      typeof newCardsReviewedTodayCountOrSettings === 'object' &&
      newCardsReviewedTodayCountOrSettings !== null
    ) {
      settings = newCardsReviewedTodayCountOrSettings;
      newCardsReviewedTodayCount = 0;
    } else {
      newCardsReviewedTodayCount =
        typeof newCardsReviewedTodayCountOrSettings === 'number'
          ? newCardsReviewedTodayCountOrSettings
          : 0;
      if (optionalSettings) {
        settings = optionalSettings;
      }
    }

    if (dueCount >= settings.overloadThreshold) {
      return {
        isOverloaded: true,
        overloadDueCount: dueCount,
        newCardsNeeded: 0,
        reason: 'OVERLOAD_THROTTLED',
      };
    }

    const totalActiveOrReviewedToday = existingNewCardsCount + newCardsReviewedTodayCount;
    const needed = Math.max(0, settings.dailyNewCardsTarget - totalActiveOrReviewedToday);
    return {
      isOverloaded: false,
      overloadDueCount: dueCount,
      newCardsNeeded: needed,
      reason: needed === 0 ? 'DAILY_QUOTA_REACHED' : 'NORMAL',
    };
  }

  /**
   * Determines if a card review rating qualifies the card for receptive mastery graduation.
   * Criteria:
   * - stability >= 21 days
   * - reps >= 3
   * - not a leech
   */
  public isEligibleForMastery(stability: number, reps: number, isLeech = false): boolean {
    return stability >= 21 && reps >= 3 && !isLeech;
  }
}
