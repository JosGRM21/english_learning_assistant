import { describe, it, expect } from 'vitest';
import { DiffCalculator } from '../DiffCalculator';

describe('DiffCalculator', () => {
  const diffCalc = new DiffCalculator();

  describe('computeWordDiff', () => {
    it('returns single unchanged segment for identical strings', () => {
      const original = 'I am studying English.';
      const result = diffCalc.computeWordDiff(original, original);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(original);
      expect(result[0].added).toBe(false);
      expect(result[0].removed).toBe(false);
    });

    it('identifies added and removed words correctly', () => {
      const draft1 = 'It depend of the weather.';
      const draft2 = 'It depends on the weather.';

      const result = diffCalc.computeWordDiff(draft1, draft2);

      const added = result.filter((s) => s.added);
      const removed = result.filter((s) => s.removed);

      expect(removed.map((s) => s.value)).toContain('depend of');
      expect(added.map((s) => s.value)).toContain('depends on');
    });

    it('handles empty strings without throwing', () => {
      const result = diffCalc.computeWordDiff('', 'Hello world');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((s) => s.added && s.value.includes('Hello'))).toBe(true);
    });
  });

  describe('summarizeChanges', () => {
    it('reports no changes when texts match exactly', () => {
      const text = 'Consistent practice creates fluency.';
      const summary = diffCalc.summarizeChanges(text, text);

      expect(summary.hasChanges).toBe(false);
      expect(summary.wordsAdded).toBe(0);
      expect(summary.wordsRemoved).toBe(0);
    });

    it('accurately counts additions and removals', () => {
      const original = 'I am agree with your proposal.';
      const updated = 'I agree with your proposal today.';

      const summary = diffCalc.summarizeChanges(original, updated);

      expect(summary.hasChanges).toBe(true);
      expect(summary.wordsRemoved).toBeGreaterThanOrEqual(1); // 'am' removed
      expect(summary.wordsAdded).toBeGreaterThanOrEqual(1); // 'today' added
    });
  });
});
