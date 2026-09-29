import { describe, it, expect } from 'vitest';
import { NoticingAnnotator } from '../NoticingAnnotator';
import { VocabItem } from '../../types/vocab';

describe('NoticingAnnotator', () => {
  const sampleVocab: VocabItem[] = [
    {
      id: 'voc_01',
      word: 'depend',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'VERB',
      definitionEn: 'Rely on.',
      translationEs: 'Depender',
      ipaGeneralAmerican: 'dɪˈpɛnd',
      cefrLevel: 'B1',
      isFalseFriend: false,
      createdAt: '2026-09-29T10:00:00Z',
    },
    {
      id: 'voc_02',
      word: 'actually',
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'ADVERB',
      definitionEn: 'In fact.',
      translationEs: 'En realidad',
      ipaGeneralAmerican: 'ˈæktʃuəli',
      cefrLevel: 'B1',
      isFalseFriend: true,
      falseFriendNote: 'No significa actualmente.',
      createdAt: '2026-09-29T10:00:00Z',
    },
  ];

  const annotator = new NoticingAnnotator(sampleVocab);

  describe('annotateText', () => {
    it('flags recognized vocabulary items and identifies punctuation', () => {
      const text = 'Success does not depend on luck. Actually, it requires daily effort!';
      const segments = annotator.annotateText(text);

      expect(segments).toHaveLength(2); // 2 sentences

      // Sentence 1 contains 'depend'
      const dependToken = segments[0].tokens.find((t) => t.cleanWord === 'depend');
      expect(dependToken).toBeDefined();
      expect(dependToken?.isTargetVocab).toBe(true);
      expect(dependToken?.translationEs).toBe('Depender');
      expect(dependToken?.ipa).toBe('dɪˈpɛnd');

      // Sentence 2 contains 'Actually' (case-insensitive)
      const actuallyToken = segments[1].tokens.find((t) => t.cleanWord === 'actually');
      expect(actuallyToken).toBeDefined();
      expect(actuallyToken?.isTargetVocab).toBe(true);

      // Punctuation is parsed cleanly
      const periodToken = segments[0].tokens.find((t) => t.originalText === '.');
      expect(periodToken?.isPunctuation).toBe(true);
    });
  });

  describe('buildOneClickCardPayload', () => {
    it('builds payload with context sentence and IPA', () => {
      const segments = annotator.annotateText('It will depend on your commitment.');
      const dependToken = segments[0].tokens.find((t) => t.cleanWord === 'depend')!;

      const payload = annotator.buildOneClickCardPayload(dependToken, segments[0].sentenceEn);

      expect(payload.cleanWord).toBe('depend');
      expect(payload.sentenceEn).toBe('It will depend on your commitment.');
      expect(payload.translationEs).toBe('Depender');
      expect(payload.ipa).toBe('dɪˈpɛnd');
      expect(payload.cefrLevel).toBe('B1');
    });
  });
});
