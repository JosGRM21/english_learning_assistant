import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProceduralizationEngine,
  proceduralizationEngine,
} from '../services/ProceduralizationEngine';
import { eventBus } from '../../../common/events/DomainEventBus';
import { DrillPrompt } from '../../../types/drills';

describe('ProceduralizationEngine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Power Law calculation (Newell & Rosenbloom)', () => {
    it('calculates initial trial RT as 4000ms (500 + 3500 * 1^-0.4)', () => {
      const rt1 = ProceduralizationEngine.calculatePowerLawExpectedRt(1);
      expect(rt1).toBe(4000);
    });

    it('predicts monotonically decreasing RT with increasing practice trials', () => {
      const rt1 = ProceduralizationEngine.calculatePowerLawExpectedRt(1);
      const rt5 = ProceduralizationEngine.calculatePowerLawExpectedRt(5);
      const rt20 = ProceduralizationEngine.calculatePowerLawExpectedRt(20);
      const rt100 = ProceduralizationEngine.calculatePowerLawExpectedRt(100);

      expect(rt5).toBeLessThan(rt1);
      expect(rt20).toBeLessThan(rt5);
      expect(rt100).toBeLessThan(rt20);
      expect(rt100).toBeGreaterThan(ProceduralizationEngine.MOTOR_LIMIT_A_MS);
    });
  });

  describe('evaluateTrial', () => {
    it('marks response as PROCEDURAL_PASS when correct and RT < 1500ms', () => {
      const result = proceduralizationEngine.evaluateTrial(
        'card-1',
        'user-123',
        true,
        950,
        0,
        5,
      );

      expect(result.status).toBe('PROCEDURAL_PASS');
      expect(result.consecutiveFastRetrievals).toBe(1);
      expect(result.isProceduralized).toBe(false);
      expect(result.responseTimeMs).toBe(950);
      expect(result.expectedRtMs).toBeGreaterThan(0);
    });

    it('marks response as SLOW_CORRECT when correct but RT >= 1500ms', () => {
      const result = proceduralizationEngine.evaluateTrial(
        'card-1',
        'user-123',
        true,
        1850,
        2,
        5,
      );

      expect(result.status).toBe('SLOW_CORRECT');
      expect(result.consecutiveFastRetrievals).toBe(2); // does not increment or reset
      expect(result.isProceduralized).toBe(false);
    });

    it('resets consecutiveFastRetrievals and emits ERROR_COMMITTED on error', () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');

      const result = proceduralizationEngine.evaluateTrial(
        'card-1',
        'user-123',
        false,
        1200,
        2,
        5,
        'L1_PRO_DROP_DUMMY_IT',
      );

      expect(result.status).toBe('PROCEDURAL_FAIL');
      expect(result.consecutiveFastRetrievals).toBe(0);
      expect(result.isProceduralized).toBe(false);

      expect(publishSpy).toHaveBeenCalledWith('ERROR_COMMITTED', expect.objectContaining({
        userId: 'user-123',
        errorTaxonomyCode: 'L1_PRO_DROP_DUMMY_IT',
        source: 'SPEED_DRILL',
        sourceReferenceId: 'card-1',
      }));
    });

    it('certifies item as isProceduralized on 3 consecutive fast sessions and publishes ITEM_PROCEDURALIZED', () => {
      const publishSpy = vi.spyOn(eventBus, 'publish');

      const result = proceduralizationEngine.evaluateTrial(
        'card-pro-99',
        'user-123',
        true,
        1100,
        2, // already at 2 consecutive fast retrievals
        10,
      );

      expect(result.status).toBe('PROCEDURAL_PASS');
      expect(result.consecutiveFastRetrievals).toBe(3);
      expect(result.isProceduralized).toBe(true);

      expect(publishSpy).toHaveBeenCalledWith('ITEM_PROCEDURALIZED', expect.objectContaining({
        userId: 'user-123',
        cardId: 'card-pro-99',
        targetId: 'card-pro-99',
        finalLatencyMs: 1100,
        consecutiveSessions: 3,
      }));
    });
  });

  describe('Hot Error Recovery Queue planning (N+3 / N+7)', () => {
    const mockPrompts: DrillPrompt[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p-${i}`,
      drillType: 'CLAUSE_SHIFT',
      promptText: `Prompt ${i}`,
      sentenceContext: `Context ${i}`,
      explanationEs: 'Explicación',
      correctOptionIndex: 0,
      options: ['A', 'B'],
      timeLimitMs: 2500,
    }));

    it('inserts failed prompt at N+3 in the queue', () => {
      const failedPrompt = mockPrompts[1];
      const updatedQueue = proceduralizationEngine.planErrorRecoveryQueue(
        mockPrompts,
        failedPrompt,
        1,
      );

      expect(updatedQueue.length).toBe(mockPrompts.length + 1);
      // N = 1, N+3 = 4
      expect(updatedQueue[4].id).toBe('p-1_recovery_n3');
      expect(updatedQueue[4].promptText).toBe(failedPrompt.promptText);
    });

    it('inserts failed prompt at N+3 and variant at N+7 in the queue', () => {
      const failedPrompt = mockPrompts[0];
      const variantPrompt: DrillPrompt = {
        ...mockPrompts[0],
        id: 'p-0-variant',
        promptText: 'Variant prompt 0',
      };

      const updatedQueue = proceduralizationEngine.planErrorRecoveryQueue(
        mockPrompts,
        failedPrompt,
        0,
        variantPrompt,
      );

      expect(updatedQueue.length).toBe(mockPrompts.length + 2);
      expect(updatedQueue[3].id).toBe('p-0_recovery_n3');
      // After splicing at index 3, the queue grew by 1, so index 7 in new queue contains the variant
      expect(updatedQueue[7].id).toBe('p-0-variant_recovery_n7');
    });
  });
});
