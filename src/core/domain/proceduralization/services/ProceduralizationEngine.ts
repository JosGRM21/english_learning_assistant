import { eventBus } from '../../../common/events/DomainEventBus';
import { ItemProceduralizedPayload, ErrorCommittedPayload } from '../../../common/events/types';
import { DrillPrompt } from '../../../types/drills';

export interface ProceduralTrialResult {
  cardId?: string;
  status: 'PROCEDURAL_PASS' | 'SLOW_CORRECT' | 'PROCEDURAL_FAIL';
  consecutiveFastRetrievals: number;
  isProceduralized: boolean;
  responseTimeMs: number;
  expectedRtMs: number;
}

export class ProceduralizationEngine {
  public static readonly PROCEDURAL_LATENCY_THRESHOLD_MS = 1500;
  public static readonly REQUIRED_CONSECUTIVE_SESSIONS = 3;

  // Power law constants: RT(N) = a + b * N^(-c)
  public static readonly MOTOR_LIMIT_A_MS = 500;
  public static readonly INITIAL_GAIN_B_MS = 3500;
  public static readonly LEARNING_RATE_C = 0.4;

  /**
   * Computes expected reaction time based on Newell & Rosenbloom Power Law of Learning.
   */
  public static calculatePowerLawExpectedRt(totalTrials: number): number {
    const n = Math.max(1, totalTrials);
    const rt =
      ProceduralizationEngine.MOTOR_LIMIT_A_MS +
      ProceduralizationEngine.INITIAL_GAIN_B_MS * Math.pow(n, -ProceduralizationEngine.LEARNING_RATE_C);
    return Math.round(rt);
  }

  /**
   * Evaluates a trial on an item and determines its proceduralization state in the basal ganglia.
   */
  public evaluateTrial(
    cardId: string | undefined,
    userId: string,
    isCorrect: boolean,
    elapsedMs: number,
    currentConsecutiveFast = 0,
    totalPriorTrials = 0,
    taxonomyCode?: string,
  ): ProceduralTrialResult {
    const expectedRtMs = ProceduralizationEngine.calculatePowerLawExpectedRt(totalPriorTrials + 1);

    if (isCorrect && elapsedMs < ProceduralizationEngine.PROCEDURAL_LATENCY_THRESHOLD_MS) {
      const newConsecutive = currentConsecutiveFast + 1;
      const isCertified = newConsecutive >= ProceduralizationEngine.REQUIRED_CONSECUTIVE_SESSIONS;

      if (isCertified && cardId) {
        const payload: ItemProceduralizedPayload = {
          userId,
          cardId,
          targetId: cardId,
          finalLatencyMs: elapsedMs,
          consecutiveSessions: newConsecutive,
          timestamp: new Date().toISOString(),
        };
        eventBus.publish('ITEM_PROCEDURALIZED', payload);
      }

      return {
        cardId,
        status: 'PROCEDURAL_PASS',
        consecutiveFastRetrievals: newConsecutive,
        isProceduralized: isCertified,
        responseTimeMs: elapsedMs,
        expectedRtMs,
      };
    }

    if (isCorrect) {
      return {
        cardId,
        status: 'SLOW_CORRECT',
        consecutiveFastRetrievals: currentConsecutiveFast,
        isProceduralized: false,
        responseTimeMs: elapsedMs,
        expectedRtMs,
      };
    }

    // Failure: reset streak
    if (taxonomyCode) {
      const errorPayload: ErrorCommittedPayload = {
        userId,
        errorTaxonomyCode: taxonomyCode,
        source: 'SPEED_DRILL',
        sourceReferenceId: cardId,
        timestamp: new Date().toISOString(),
      };
      eventBus.publish('ERROR_COMMITTED', errorPayload);
    }

    return {
      cardId,
      status: 'PROCEDURAL_FAIL',
      consecutiveFastRetrievals: 0,
      isProceduralized: false,
      responseTimeMs: elapsedMs,
      expectedRtMs,
    };
  }

  /**
   * Applies the Hot Error Recovery Loop: re-injects failed prompt at N+3 (same) and N+7 (variant).
   */
  public planErrorRecoveryQueue(
    currentQueue: DrillPrompt[],
    failedPrompt: DrillPrompt,
    currentIndex: number,
    variantPrompt?: DrillPrompt,
  ): DrillPrompt[] {
    const newQueue = [...currentQueue];

    // Re-inject at N+3
    const targetIndexN3 = Math.min(newQueue.length, currentIndex + 3);
    newQueue.splice(targetIndexN3, 0, {
      ...failedPrompt,
      id: `${failedPrompt.id}_recovery_n3`,
    });

    // If variant provided, inject at N+7
    if (variantPrompt) {
      const targetIndexN7 = Math.min(newQueue.length, currentIndex + 7);
      newQueue.splice(targetIndexN7, 0, {
        ...variantPrompt,
        id: `${variantPrompt.id}_recovery_n7`,
      });
    }

    return newQueue;
  }
}

export const proceduralizationEngine = new ProceduralizationEngine();
