import { describe, it, expect } from 'vitest';
import {
  extractTargetWordTokens,
  isTargetWordUsedInText,
  synthesizeErrorDrillFallback,
  checkProductiveVocabUsage,
} from '../WeakVocabMatcher';

describe('WeakVocabMatcher', () => {
  describe('extractTargetWordTokens', () => {
    it('generates standard inflections for single words', () => {
      const tokens = extractTargetWordTokens('walk');
      expect(tokens).toContain('walk');
      expect(tokens).toContain('walks');
      expect(tokens).toContain('walked');
      expect(tokens).toContain('walking');
    });

    it('generates inflections for verbs ending in y', () => {
      const tokens = extractTargetWordTokens('try');
      expect(tokens).toContain('try');
      expect(tokens).toContain('tries');
      expect(tokens).toContain('tried');
      expect(tokens).toContain('trying');
    });

    it('generates inflections for phrasal chunks', () => {
      const tokens = extractTargetWordTokens('depend on');
      expect(tokens).toContain('depend on');
      expect(tokens).toContain('depends on');
      expect(tokens).toContain('depended on');
      expect(tokens).toContain('depending on');
    });

    it('generates correct irregular past and participle forms without non-words', () => {
      const takeTokens = extractTargetWordTokens('take');
      expect(takeTokens).toContain('take');
      expect(takeTokens).toContain('took');
      expect(takeTokens).toContain('taken');
      expect(takeTokens).toContain('takes');
      expect(takeTokens).toContain('taking');
      expect(takeTokens).not.toContain('taked');

      const goTokens = extractTargetWordTokens('go on');
      expect(goTokens).toContain('went on');
      expect(goTokens).toContain('gone on');
      expect(goTokens).not.toContain('goed on');
    });
  });

  describe('isTargetWordUsedInText', () => {
    it('detects exact base word usage', () => {
      expect(isTargetWordUsedInText('resilient', 'She is very resilient under pressure.')).toBe(true);
    });

    it('detects inflected word usage', () => {
      expect(isTargetWordUsedInText('walk', 'He walked to the store.')).toBe(true);
      expect(isTargetWordUsedInText('walk', 'They are walking quickly.')).toBe(true);
    });

    it('detects phrasal verb inflected usage', () => {
      expect(isTargetWordUsedInText('depend on', 'Everything depends on our budget.')).toBe(true);
      expect(isTargetWordUsedInText('depend on', 'We depended on his assistance.')).toBe(true);
    });

    it('does not trigger on false substrings', () => {
      expect(isTargetWordUsedInText('cat', 'The catalog was informative.')).toBe(false);
      expect(isTargetWordUsedInText('ill', 'She will arrive soon.')).toBe(false);
    });
  });

  describe('synthesizeErrorDrillFallback', () => {
    it('generates valid positive production drill without distractor options (RF-ERR-02)', () => {
      const drill = synthesizeErrorDrillFallback({
        error_span: 'depends of',
        native_reformulation: 'depends on',
        explanation_es: 'En inglés depend rige on',
        sentence_context: 'It depends of the weather.',
      });

      expect(drill.format).toBe('CONTEXTUAL_CLOZE');
      expect(drill.expected_token).toBe('depends on');
      expect(drill.cloze_sentence).toContain('[ ___ ]');
      expect(drill.explanation_es).toBe('En inglés depend rige on');
      // No distractors or negative priming options
      expect((drill as any).options).toBeUndefined();
    });
  });

  describe('checkProductiveVocabUsage', () => {
    it('accurately categorizes words into used and missing', () => {
      const targetWords = ['thrive', 'resilient', 'reluctant'];
      const text = 'Innovative organizations thrive when employees remain resilient during crisis.';

      const result = checkProductiveVocabUsage(targetWords, text);
      expect(result.usedWords).toEqual(['thrive', 'resilient']);
      expect(result.missingWords).toEqual(['reluctant']);
    });
  });
});
