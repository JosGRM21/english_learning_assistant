import { describe, it, expect } from 'vitest';
import { SpeedDrillTrainer } from '../SpeedDrillTrainer';

describe('SpeedDrillTrainer', () => {
  const trainer = new SpeedDrillTrainer();

  describe('createSession', () => {
    it('creates a session with requested drill type and count', () => {
      const prompts = trainer.createSession('COLLOCATION_BLITZ', 4);
      expect(prompts.length).toBeLessThanOrEqual(4);
      expect(prompts.every((p) => p.drillType === 'COLLOCATION_BLITZ')).toBe(true);
    });
  });

  describe('evaluateAnswer', () => {
    const samplePrompt = {
      id: 'test_p1',
      drillType: 'PREPOSITION_RAPID_FIRE' as const,
      promptText: 'depend on',
      sentenceContext: 'It depends ___ you.',
      options: ['on', 'of', 'in', 'at'],
      correctOptionIndex: 0,
      timeLimitMs: 3000,
      explanationEs: 'depend on',
    };

    it('awards points and scales combo multiplier for correct timely answer', () => {
      const result = trainer.evaluateAnswer(samplePrompt, 0, 1000, 2);

      expect(result.isCorrect).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(100);
      expect(result.comboMultiplier).toBe(2); // combo becomes 3 -> 2x
    });

    it('zeros points and resets multiplier on wrong option', () => {
      const result = trainer.evaluateAnswer(samplePrompt, 1, 1000, 5);

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.comboMultiplier).toBe(1);
    });

    it('zeros points if response exceeds timeLimitMs', () => {
      const result = trainer.evaluateAnswer(samplePrompt, 0, 3500, 2); // 3500 > 3000

      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
    });
  });

  describe('calculateSummary', () => {
    it('accurately summarizes session metrics', () => {
      const results = [
        {
          promptId: 'p1',
          selectedOptionIndex: 0,
          isCorrect: true,
          responseTimeMs: 800,
          pointsEarned: 240,
          comboMultiplier: 2,
        },
        {
          promptId: 'p2',
          selectedOptionIndex: 1,
          isCorrect: false,
          responseTimeMs: 1200,
          pointsEarned: 0,
          comboMultiplier: 1,
        },
      ];

      const summary = trainer.calculateSummary('COLLOCATION_BLITZ', results, 4);

      expect(summary.totalPrompts).toBe(2);
      expect(summary.correctCount).toBe(1);
      expect(summary.finalScore).toBe(240);
      expect(summary.avgResponseTimeMs).toBe(1000);
      expect(summary.maxCombo).toBe(4);
    });
  });
});
