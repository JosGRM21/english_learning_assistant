import { describe, it, expect } from 'vitest';
import { bottomUpListeningEngine } from '../services/BottomUpListeningEngine';

describe('BottomUpListeningEngine', () => {
  const sentence = 'Look at the cat in the garden.';

  it('generates Step 1 blind audio state with masked visual representation', () => {
    const state = bottomUpListeningEngine.generateSentenceState(sentence, 1);
    expect(state.step).toBe(1);
    expect(state.stepName).toContain('Audio Ciego');
    expect(state.renderedDisplay).toContain('••••');
  });

  it('generates Step 2 tonic skeleton masking function words and exposing content words', () => {
    const state = bottomUpListeningEngine.generateSentenceState(sentence, 2);
    expect(state.step).toBe(2);
    expect(state.stepName).toContain('Esqueleto Tónico');
    // "Look", "cat", "garden" should be visible; "at", "the", "in" should be masked as ___
    expect(state.renderedDisplay).toContain('Look');
    expect(state.renderedDisplay).toContain('cat');
    expect(state.renderedDisplay).toContain('garden');
    expect(state.renderedDisplay).toContain('___');
  });

  it('generates Step 3 full connected text and identifies phonetic phenomena', () => {
    const testSentence = 'Turn off the light and look at it.';
    const state = bottomUpListeningEngine.generateSentenceState(testSentence, 3);
    expect(state.step).toBe(3);
    expect(state.stepName).toContain('Texto Conectado');
    expect(state.renderedDisplay).toBe(testSentence);

    // Should detect linking between "Turn" and "off" (consonant-vowel), "look" and "at", "at" and "it"
    const linkingMarkers = state.phenomena.filter((p) => p.type === 'LINKING');
    expect(linkingMarkers.length).toBeGreaterThan(0);
    expect(linkingMarkers.some((p) => p.wordA.toLowerCase() === 'turn' && p.wordB?.toLowerCase() === 'off')).toBe(true);
  });

  it('detects elision of /t/ or /d/ before a consonant', () => {
    const elisionSentence = 'She left last night.';
    const phenomena = bottomUpListeningEngine.detectConnectedSpeechPhenomena(elisionSentence);

    const elisionMarkers = phenomena.filter((p) => p.type === 'ELISION');
    expect(elisionMarkers.length).toBeGreaterThan(0);
    expect(elisionMarkers.some((p) => p.wordA.toLowerCase() === 'last' && p.wordB?.toLowerCase() === 'night')).toBe(true);
  });
});
