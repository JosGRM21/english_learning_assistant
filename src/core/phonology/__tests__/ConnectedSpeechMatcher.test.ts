import { describe, it, expect } from 'vitest';
import { ConnectedSpeechMatcher } from '../ConnectedSpeechMatcher';

describe('ConnectedSpeechMatcher', () => {
  const matcher = new ConnectedSpeechMatcher();

  it('detects Consonant-to-Vowel linking (Linking C-V)', () => {
    const analysis = matcher.analyze('Hold on an hour');
    const linkingCV = analysis.boundaries.filter((b) => b.boundaryType === 'LINKING_CV');

    expect(linkingCV.length).toBeGreaterThanOrEqual(1);
    expect(linkingCV.some((b) => b.word1 === 'Hold' && b.word2 === 'on')).toBe(true);
  });

  it('detects intrusive /j/ glide linking after front vowels', () => {
    const analysis = matcher.analyze('I agree with you');
    const jLinking = analysis.boundaries.filter((b) => b.boundaryType === 'LINKING_VV_J');

    expect(jLinking.length).toBeGreaterThanOrEqual(1);
    expect(jLinking[0].word1).toBe('I');
    expect(jLinking[0].word2).toBe('agree');
  });

  it('detects intrusive /w/ glide linking after back rounded vowels', () => {
    const analysis = matcher.analyze('Go on do it');
    const wLinking = analysis.boundaries.filter((b) => b.boundaryType === 'LINKING_VV_W');

    expect(wLinking.length).toBeGreaterThanOrEqual(1);
    expect(wLinking.some((b) => b.word1 === 'Go' && b.word2 === 'on')).toBe(true);
  });

  it('detects coalescent assimilation (/d/ + you -> /dʒ/)', () => {
    const analysis = matcher.analyze('Did you see that?');
    const coalescent = analysis.boundaries.filter((b) => b.boundaryType === 'ASSIMILATION_COALESCENT');

    expect(coalescent.length).toBe(1);
    expect(coalescent[0].word1).toBe('Did');
    expect(coalescent[0].word2).toBe('you');
    expect(coalescent[0].ipaTransformed).toContain('dʒ');
  });

  it('detects alveolar plosive elision (/t/ or /d/ dropped before consonants)', () => {
    const analysis = matcher.analyze('My best friend lives next door');
    const elisions = analysis.boundaries.filter((b) => b.boundaryType === 'ELISION_T_D');

    expect(elisions.length).toBeGreaterThanOrEqual(1);
    expect(elisions.some((b) => b.word1 === 'best' && b.word2 === 'friend')).toBe(true);
  });

  it('detects weak forms for unstressed prepositions', () => {
    const analysis = matcher.analyze('I went from home to work');
    const weakForms = analysis.boundaries.filter((b) => b.boundaryType === 'WEAK_FORM');

    expect(weakForms.length).toBeGreaterThanOrEqual(1);
    expect(weakForms.some((b) => b.word1 === 'from' || b.word1 === 'to')).toBe(true);
  });
});
