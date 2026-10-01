import { describe, it, expect } from 'vitest';
import { lexicalCoverageProfiler } from '../services/LexicalCoverageProfiler';
import { VocabItem } from '../../../types/vocab';

describe('LexicalCoverageProfiler', () => {
  const mockVocabList: VocabItem[] = [
    {
      id: 'v_01',
      word: 'persist',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'VERB',
      definitionEn: 'continue firmly',
      translationEs: 'persistir',
      ipaGeneralAmerican: 'pərˈsɪst',
      cefrLevel: 'B2',
      isFalseFriend: false,
      createdAt: '',
    },
    {
      id: 'v_02',
      word: 'endeavor',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'NOUN',
      definitionEn: 'an attempt to achieve a goal',
      translationEs: 'esfuerzo',
      ipaGeneralAmerican: 'ɪnˈdɛv.ər',
      cefrLevel: 'C1',
      isFalseFriend: false,
      createdAt: '',
    },
  ];

  it('calculates optimal coverage (>= 98%) when most words are known core words', () => {
    const text = 'The people went to the new house because they wanted to look at the work.';
    const result = lexicalCoverageProfiler.analyzeCoverage(text, mockVocabList);

    expect(result.coveragePercentage).toBeGreaterThanOrEqual(98.0);
    expect(result.band).toBe('OPTIMAL');
    expect(result.bandColor).toBe('green');
  });

  it('detects lower coverage and unknown tokens in text with rare words', () => {
    const text = 'The ubiquitous professor was perplexed by the arduous research and the diminutive results.';
    const result = lexicalCoverageProfiler.analyzeCoverage(text, []);

    expect(result.coveragePercentage).toBeLessThan(95.0);
    expect(result.band).toBe('OVERLOAD');
    expect(result.bandColor).toBe('red');
    expect(result.unknownTokens.length).toBeGreaterThanOrEqual(4);
    expect(result.unknownTokens.map((t) => t.cleanWord)).toContain('ubiquitous');
    expect(result.unknownTokens.map((t) => t.cleanWord)).toContain('perplexed');
  });

  it('properly discounts proper nouns from the denominator in Paul Nation formula', () => {
    const text = 'Yesterday John and Mary arrived in London with their friends.';
    const result = lexicalCoverageProfiler.analyzeCoverage(text, []);

    expect(result.properNounsCount).toBeGreaterThanOrEqual(2);
    expect(result.effectiveWords).toBe(result.totalWords - result.properNounsCount);
  });

  it('simplifies rare Latinate words into high-frequency core synonyms', () => {
    const text = 'She was perplexed by the arduous journey and decided to terminate the contract.';
    const simplified = lexicalCoverageProfiler.simplifyText(text);

    expect(simplified.replacedWordsCount).toBe(3);
    expect(simplified.simplifiedText).toContain('confused');
    expect(simplified.simplifiedText).toContain('difficult');
    expect(simplified.simplifiedText).toContain('end');
  });
});
