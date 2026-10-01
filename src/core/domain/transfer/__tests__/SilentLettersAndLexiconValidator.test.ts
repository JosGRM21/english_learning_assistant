import { describe, it, expect } from 'vitest';
import { SilentLettersMuter } from '../services/SilentLettersMuter';
import { LexiconValidator } from '../../lexicon/services/LexiconValidator';

describe('SilentLettersMuter (RF-TRN-08)', () => {
  it('identifies silent K in know and knife', () => {
    const knowAnalysis = SilentLettersMuter.analyzeWord('know');
    expect(knowAnalysis).not.toBeNull();
    expect(knowAnalysis?.silentIndices).toContain(0);

    const knifeAnalysis = SilentLettersMuter.analyzeWord('knife');
    expect(knifeAnalysis).not.toBeNull();
    expect(knifeAnalysis?.silentIndices).toContain(0);
  });

  it('identifies silent W in write', () => {
    const analysis = SilentLettersMuter.analyzeWord('write');
    expect(analysis).not.toBeNull();
    expect(analysis?.silentIndices).toContain(0);
  });

  it('identifies silent B in climb and doubt', () => {
    const climb = SilentLettersMuter.analyzeWord('climb');
    expect(climb).not.toBeNull();
    expect(climb?.silentIndices).toContain(4);

    const doubt = SilentLettersMuter.analyzeWord('doubt');
    expect(doubt).not.toBeNull();
    expect(doubt?.silentIndices).toContain(3);
  });

  it('renders HTML string with muted span', () => {
    const html = SilentLettersMuter.renderHtmlMuted('knight');
    expect(html).toContain('line-through');
    expect(html).toContain('k');
  });

  it('returns null for words without silent letters', () => {
    const analysis = SilentLettersMuter.analyzeWord('desk');
    expect(analysis).toBeNull();
  });
});

describe('LexiconValidator (RF-SEM-04)', () => {
  it('rejects isolated de-lexicalised verbs (get, take, make, have)', () => {
    const resultGet = LexiconValidator.validateTerm('get');
    expect(resultGet.isValid).toBe(false);
    expect(resultGet.errorCode).toBe('DE_LEXICALISED_ISOLATION_ERROR');
    expect(resultGet.suggestedCollocations?.length).toBeGreaterThan(0);

    const resultTake = LexiconValidator.validateTerm('TAKE');
    expect(resultTake.isValid).toBe(false);
  });

  it('accepts collocations containing de-lexicalised verbs', () => {
    const result = LexiconValidator.validateTerm('take into account');
    expect(result.isValid).toBe(true);
  });

  it('accepts regular content words', () => {
    const result = LexiconValidator.validateTerm('wander');
    expect(result.isValid).toBe(true);
  });
});
