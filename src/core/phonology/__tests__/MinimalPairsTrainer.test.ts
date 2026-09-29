import { describe, it, expect } from 'vitest';
import { MinimalPairsTrainer } from '../MinimalPairsTrainer';

describe('MinimalPairsTrainer', () => {
  const trainer = new MinimalPairsTrainer();

  it('provides a catalog of critical Spanish-English minimal pairs', () => {
    const catalog = trainer.getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(10);

    // Verify key contrast types
    const vowelContrasts = catalog.filter((p) => p.contrastType === 'VOWEL');
    const consonantContrasts = catalog.filter((p) => p.contrastType === 'CONSONANT');

    expect(vowelContrasts.length).toBeGreaterThan(0);
    expect(consonantContrasts.length).toBeGreaterThan(0);

    // Check specific critical pairs
    expect(catalog.some((p) => p.wordA === 'sheep' && p.wordB === 'ship')).toBe(true);
    expect(catalog.some((p) => p.wordA === 'berry' && p.wordB === 'very')).toBe(true);
    expect(catalog.some((p) => p.wordA === 'sue' && p.wordB === 'zoo')).toBe(true);
  });

  it('creates a rapid challenge with 2.0-second time limit', () => {
    const challenge = trainer.createChallenge();

    expect(challenge.id).toBeDefined();
    expect(challenge.pair).toBeDefined();
    expect(['A', 'B']).toContain(challenge.targetOption);
    expect([challenge.pair.wordA, challenge.pair.wordB]).toContain(challenge.targetWord);
    expect(challenge.timeLimitSec).toBe(2.0);
  });

  it('evaluates correct selection within the 2-second time window as true', () => {
    const challenge = trainer.createChallenge();
    const result = trainer.evaluate(challenge, challenge.targetOption, 1200); // 1.2s

    expect(result.isCorrect).toBe(true);
    expect(result.responseTimeMs).toBe(1200);
    expect(result.selectedWord).toBe(challenge.targetWord);
  });

  it('evaluates incorrect choice as false', () => {
    const challenge = trainer.createChallenge();
    const wrongOption = challenge.targetOption === 'A' ? 'B' : 'A';
    const result = trainer.evaluate(challenge, wrongOption, 800);

    expect(result.isCorrect).toBe(false);
  });

  it('evaluates correct choice after 2.0s timeout as false', () => {
    const challenge = trainer.createChallenge();
    const result = trainer.evaluate(challenge, challenge.targetOption, 2500); // 2.5s (timed out)

    expect(result.isCorrect).toBe(false);
  });
});
