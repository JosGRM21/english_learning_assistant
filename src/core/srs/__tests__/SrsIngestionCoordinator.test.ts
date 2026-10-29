import { describe, it, expect } from 'vitest';
import { SrsIngestionCoordinator, DEFAULT_SRS_GOAL_SETTINGS } from '../SrsIngestionCoordinator';

describe('SrsIngestionCoordinator', () => {
  const coordinator = new SrsIngestionCoordinator();

  it('throttles new cards when dueCount exceeds or equals overload threshold (35)', () => {
    const planAt35 = coordinator.evaluatePlan(35, 0, DEFAULT_SRS_GOAL_SETTINGS);
    expect(planAt35.isOverloaded).toBe(true);
    expect(planAt35.newCardsNeeded).toBe(0);
    expect(planAt35.reason).toBe('OVERLOAD_THROTTLED');

    const planAt40 = coordinator.evaluatePlan(40, 0, DEFAULT_SRS_GOAL_SETTINGS);
    expect(planAt40.isOverloaded).toBe(true);
    expect(planAt40.newCardsNeeded).toBe(0);
  });

  it('calculates exact needed new cards when under overload threshold', () => {
    // Target is 10, existing is 0 -> needs 10
    const planZero = coordinator.evaluatePlan(15, 0, {
      ...DEFAULT_SRS_GOAL_SETTINGS,
      dailyNewCardsTarget: 10,
    });
    expect(planZero.isOverloaded).toBe(false);
    expect(planZero.newCardsNeeded).toBe(10);
    expect(planZero.reason).toBe('NORMAL');

    // Target is 10, existing is 4 -> needs 6
    const planPartial = coordinator.evaluatePlan(15, 4, {
      ...DEFAULT_SRS_GOAL_SETTINGS,
      dailyNewCardsTarget: 10,
    });
    expect(planPartial.isOverloaded).toBe(false);
    expect(planPartial.newCardsNeeded).toBe(6);
    expect(planPartial.reason).toBe('NORMAL');

    // Target is 10, existing is 10 -> needs 0 (DAILY_QUOTA_REACHED)
    const planFulfilled = coordinator.evaluatePlan(15, 10, {
      ...DEFAULT_SRS_GOAL_SETTINGS,
      dailyNewCardsTarget: 10,
    });
    expect(planFulfilled.isOverloaded).toBe(false);
    expect(planFulfilled.newCardsNeeded).toBe(0);
    expect(planFulfilled.reason).toBe('DAILY_QUOTA_REACHED');

    // Target is 10, existing is 12 -> needs 0
    const planExceeded = coordinator.evaluatePlan(15, 12, {
      ...DEFAULT_SRS_GOAL_SETTINGS,
      dailyNewCardsTarget: 10,
    });
    expect(planExceeded.newCardsNeeded).toBe(0);
  });

  it('accounts for cards already reviewed today when computing daily quota', () => {
    // Target 20, 0 existing new cards in queue, but 20 already reviewed today (user scenario)
    const planAlreadyCompletedToday = coordinator.evaluatePlan(
      0,
      0,
      20,
      {
        ...DEFAULT_SRS_GOAL_SETTINGS,
        dailyNewCardsTarget: 20,
      },
    );
    expect(planAlreadyCompletedToday.isOverloaded).toBe(false);
    expect(planAlreadyCompletedToday.newCardsNeeded).toBe(0);
    expect(planAlreadyCompletedToday.reason).toBe('DAILY_QUOTA_REACHED');

    // Target 20, 5 already reviewed today, 5 existing new -> needs 10
    const planPartialToday = coordinator.evaluatePlan(
      5,
      5,
      5,
      {
        ...DEFAULT_SRS_GOAL_SETTINGS,
        dailyNewCardsTarget: 20,
      },
    );
    expect(planPartialToday.isOverloaded).toBe(false);
    expect(planPartialToday.newCardsNeeded).toBe(10);
    expect(planPartialToday.reason).toBe('NORMAL');

    // Target 20, 25 reviewed today (exceeded target) -> needs 0
    const planExceededToday = coordinator.evaluatePlan(
      0,
      0,
      25,
      {
        ...DEFAULT_SRS_GOAL_SETTINGS,
        dailyNewCardsTarget: 20,
      },
    );
    expect(planExceededToday.newCardsNeeded).toBe(0);
    expect(planExceededToday.reason).toBe('DAILY_QUOTA_REACHED');
  });

  it('evaluates mastery eligibility based on stability >= 21 and reps >= 3', () => {
    // Insufficient stability
    expect(coordinator.isEligibleForMastery(15, 4, false)).toBe(false);

    // Insufficient reps
    expect(coordinator.isEligibleForMastery(25, 2, false)).toBe(false);

    // Leech is not eligible
    expect(coordinator.isEligibleForMastery(25, 5, true)).toBe(false);

    // Fully eligible
    expect(coordinator.isEligibleForMastery(21, 3, false)).toBe(true);
    expect(coordinator.isEligibleForMastery(45, 6, false)).toBe(true);
  });
});
