import { describe, it, expect } from 'vitest';
import { WeaknessEngine } from '../WeaknessEngine';
import { ErrorTaxonomyItem, UserErrorEvent } from '../../types/diagnostics';

describe('WeaknessEngine', () => {
  const engine = new WeaknessEngine();

  const sampleTaxon: ErrorTaxonomyItem = {
    id: 'err_01',
    code: 'L1_PREP_DEPEND_ON',
    domain: 'GRAMMAR',
    severity: 'HIGH',
    labelEs: 'Uso incorrecto de "depend of" en lugar de "depend on"',
    detailedExplanationEs: 'En español decimos depende de, pero en inglés depend on.',
  };

  describe('computeWeaknessScore', () => {
    it('returns 0.0 for zero occurrences', () => {
      const score = engine.computeWeaknessScore(0, 0, 'MEDIUM');
      expect(score).toBe(0.0);
    });

    it('weighs recent errors within 7 days significantly more than older errors', () => {
      // 5 errors all recent
      const recentScore = engine.computeWeaknessScore(5, 5, 'HIGH');
      // 5 errors from the distant past
      const oldScore = engine.computeWeaknessScore(0, 5, 'HIGH');

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('identifies critical threshold at >= 6.0', () => {
      expect(engine.isCritical(6.0)).toBe(true);
      expect(engine.isCritical(8.5)).toBe(true);
      expect(engine.isCritical(5.9)).toBe(false);
    });
  });

  describe('aggregateEvents', () => {
    it('aggregates events, computes score and flags criticality', () => {
      const now = new Date('2026-09-29T12:00:00Z');
      const events: UserErrorEvent[] = [
        {
          id: 'ev1',
          userId: 'user_1',
          errorTaxonomyId: sampleTaxon.id,
          source: 'WRITING_EVALUATION',
          committedAt: '2026-09-29T10:00:00Z', // today
        },
        {
          id: 'ev2',
          userId: 'user_1',
          errorTaxonomyId: sampleTaxon.id,
          source: 'SRS',
          committedAt: '2026-09-28T09:00:00Z', // 1 day ago
        },
        {
          id: 'ev3',
          userId: 'user_1',
          errorTaxonomyId: sampleTaxon.id,
          source: 'SRS',
          committedAt: '2026-09-27T11:00:00Z', // 2 days ago
        },
        {
          id: 'ev4',
          userId: 'user_1',
          errorTaxonomyId: sampleTaxon.id,
          source: 'WRITING_EVALUATION',
          committedAt: '2026-09-25T15:00:00Z', // 4 days ago
        },
      ];

      const metric = engine.aggregateEvents('user_1', sampleTaxon, events, now);

      expect(metric.userId).toBe('user_1');
      expect(metric.taxonomyCode).toBe('L1_PREP_DEPEND_ON');
      expect(metric.occurrencesLast7Days).toBe(4);
      expect(metric.totalOccurrences).toBe(4);
      expect(metric.weaknessScore).toBeGreaterThanOrEqual(6.0);
      expect(metric.isCritical).toBe(true);
    });
  });

  describe('generateMicroWorkout', () => {
    it('generates a 5-exercise workout tailored to the specific taxonomy code', () => {
      const metric = {
        id: 'wm_user_1_L1_PREP_DEPEND_ON',
        userId: 'user_1',
        errorTaxonomyId: 'err_01',
        taxonomyCode: 'L1_PREP_DEPEND_ON',
        labelEs: 'Depend on',
        domain: 'GRAMMAR' as const,
        occurrencesLast7Days: 4,
        totalOccurrences: 4,
        weaknessScore: 7.2,
        lastDetectedAt: '2026-09-29T10:00:00Z',
        isCritical: true,
      };

      const workout = engine.generateMicroWorkout(metric);

      expect(workout.exercises).toHaveLength(5);
      expect(workout.taxonomyCode).toBe('L1_PREP_DEPEND_ON');
      expect(workout.isCompleted).toBe(false);
      expect(workout.exercises[0].options).toHaveLength(4);
      expect(workout.exercises[0].correctOptionIndex).toBeGreaterThanOrEqual(0);
      expect(workout.exercises[0].correctOptionIndex).toBeLessThan(4);
    });
  });
});
