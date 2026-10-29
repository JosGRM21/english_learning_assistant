import { describe, it, expect, vi } from 'vitest';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';
import { KeyPoolManager } from '../../scripts/vocab-generator/key-pool-manager';
import { VocabJudgeInput } from '../schemas/judge-verdict.schema';

describe('VocabLlmJudge con KeyPoolManager y Paralelismo', () => {
  it('debe inicializar el pool de claves correctamente con el conteo de claves activas', () => {
    const fakeKeys = ['AIzaSyFakeKey1', 'AIzaSyFakeKey2', 'AIzaSyFakeKey3'];
    const pool = new KeyPoolManager(fakeKeys, 100, 1);
    const judge = new VocabLlmJudge(fakeKeys.join(','), 'gemini-3.5-flash-lite', pool);

    expect(judge.getActiveKeysCount()).toBe(3);
    expect(judge.getTotalKeysCount()).toBe(3);
    expect(judge.getKeyPoolStatus()).toContain('Claves activas: 3/3');
  });

  it('debe ejecutar evaluateCandidatesParallel distribuyendo trabajo concurrentemente', async () => {
    const fakeKeys = ['key_A', 'key_B', 'key_C'];
    const pool = new KeyPoolManager(fakeKeys, 10, 1);
    const judge = new VocabLlmJudge(fakeKeys.join(','), 'gemini-3.5-flash-lite', pool);

    // Mock evaluateCandidate para simular llamadas al LLM con latencia
    const evaluatedLemmas: string[] = [];
    vi.spyOn(judge, 'evaluateCandidate').mockImplementation(async (input: VocabJudgeInput) => {
      evaluatedLemmas.push(input.lemma);
      await new Promise((res) => setTimeout(res, 20));
      return {
        chainOfThought: 'Mock CoT',
        criteriaEvaluations: [],
        overallPassed: true,
        score: 1.0,
        criticalFailures: [],
        actionableFeedback: 'OK',
      };
    });

    const candidates: VocabJudgeInput[] = [
      { lemma: 'word1', candidateOutput: { word: 'word1' }, canonicalAssertions: { disallow_punctuation_in_tokens: true, require_valid_english_word: true, min_senses: 1, max_senses: 5, require_weak_form: false } },
      { lemma: 'word2', candidateOutput: { word: 'word2' }, canonicalAssertions: { disallow_punctuation_in_tokens: true, require_valid_english_word: true, min_senses: 1, max_senses: 5, require_weak_form: false } },
      { lemma: 'word3', candidateOutput: { word: 'word3' }, canonicalAssertions: { disallow_punctuation_in_tokens: true, require_valid_english_word: true, min_senses: 1, max_senses: 5, require_weak_form: false } },
      { lemma: 'word4', candidateOutput: { word: 'word4' }, canonicalAssertions: { disallow_punctuation_in_tokens: true, require_valid_english_word: true, min_senses: 1, max_senses: 5, require_weak_form: false } },
    ];

    let progressCount = 0;
    const results = await judge.evaluateCandidatesParallel(candidates, {
      concurrency: 3,
      onProgress: (done) => {
        progressCount = done;
      },
    });

    expect(results).toHaveLength(4);
    expect(progressCount).toBe(4);
    expect(results.every((r) => r.verdict?.overallPassed)).toBe(true);
    expect(evaluatedLemmas).toEqual(['word1', 'word2', 'word3', 'word4']);
  });
});
