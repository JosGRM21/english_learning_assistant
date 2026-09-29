import { describe, it, expect } from 'vitest';
import { MockAiGateway } from '../MockAiGateway';
import {
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponseSchema,
} from '../schemas';

describe('MockAiGateway', () => {
  const gateway = new MockAiGateway();

  describe('evaluateSocraticPhase1', () => {
    it('generates schema-valid socratic hints for L1 transfer errors', async () => {
      const draft = 'I am agree because it depend of my boss and actually I work hard.';
      const response = await gateway.evaluateSocraticPhase1(draft);

      // Verify schema conformance
      expect(() => SocraticFeedbackResponseSchema.parse(response)).not.toThrow();

      expect(response.error_count).toBeGreaterThanOrEqual(3);
      expect(response.allow_self_correction).toBe(true);

      const clueTypes = response.scaffolded_clues.map((c) => c.clue_type);
      expect(clueTypes).toContain('PREPOSITION');
      expect(clueTypes).toContain('AGREEMENT');
      expect(clueTypes).toContain('FALSE_FRIEND');

      // Verify hints are Socratic questions, not direct fixes
      for (const clue of response.scaffolded_clues) {
        expect(clue.hint_question_es).toContain('?');
      }
    });

    it('returns encouraging guidance when text has no targeted errors', async () => {
      const cleanDraft = 'She quickly mastered the complex grammar rules.';
      const response = await gateway.evaluateSocraticPhase1(cleanDraft);

      expect(() => SocraticFeedbackResponseSchema.parse(response)).not.toThrow();
      expect(response.scaffolded_clues.length).toBe(1);
      expect(response.scaffolded_clues[0].clue_type).toBe('WORD_CHOICE');
    });
  });

  describe('evaluateFinalPhase2', () => {
    it('generates full CEFR evaluation, diffable corrections and micro-challenge', async () => {
      const draft1 = 'I am agree and it depend of the situation.';
      const draft2 = 'I agree and it depends on the situation.';

      const response = await gateway.evaluateFinalPhase2(draft1, draft2, 'B2');

      // Verify schema conformance
      expect(() => WritingEvaluationResponseSchema.parse(response)).not.toThrow();

      expect(response.estimated_cefr).toBe('B2');
      expect(response.scores.grammar).toBeGreaterThan(0);
      expect(response.scores.vocabulary).toBeGreaterThan(0);
      expect(response.scores.coherence).toBeGreaterThan(0);

      // Micro challenge must have 4 options and valid answer index
      expect(response.micro_challenge.options).toHaveLength(4);
      expect(response.micro_challenge.correct_option_index).toBeGreaterThanOrEqual(0);
      expect(response.micro_challenge.correct_option_index).toBeLessThan(4);
      expect(response.micro_challenge.sentence_with_blank).toContain('___');
    });

    it('identifies uncorrected L1 transfer errors in draft2', async () => {
      const draft1 = 'It depend of money.';
      const draft2 = 'It still depend of money actually.';

      const response = await gateway.evaluateFinalPhase2(draft1, draft2, 'B1');

      expect(response.corrections.length).toBeGreaterThanOrEqual(2);
      const prepError = response.corrections.find((c) => c.error_type === 'PREPOSITION');
      expect(prepError).toBeDefined();
      expect(prepError?.is_l1_spanish_transfer).toBe(true);
      expect(prepError?.native_reformulation).toContain('depend on');
    });
  });
});
