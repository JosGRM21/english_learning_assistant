import { MinimalPairItem, MinimalPairChallenge, MinimalPairResult, PhonemicContrastType } from '../types/phonology';

import { MINIMAL_PAIRS_CATALOG } from '@/data/minimal-pairs-catalog';
export { MINIMAL_PAIRS_CATALOG };


export class MinimalPairsTrainer {
  private readonly catalog: MinimalPairItem[];

  constructor(customCatalog?: MinimalPairItem[]) {
    this.catalog = customCatalog ?? MINIMAL_PAIRS_CATALOG;
  }

  public getCatalog(): MinimalPairItem[] {
    return [...this.catalog];
  }

  /**
   * Generates a rapid discrimination challenge with a 2.0-second response window.
   */
  public createChallenge(filters?: {
    contrastType?: PhonemicContrastType;
    pairId?: string;
  }): MinimalPairChallenge {
    let pool = this.catalog;
    if (filters?.contrastType) {
      pool = pool.filter((p) => p.contrastType === filters.contrastType);
    }
    if (filters?.pairId) {
      pool = pool.filter((p) => p.id === filters.pairId);
    }

    if (pool.length === 0) {
      pool = this.catalog;
    }

    const pair = pool[Math.floor(Math.random() * pool.length)];
    const targetOption: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    const targetWord = targetOption === 'A' ? pair.wordA : pair.wordB;
    const targetIpa = targetOption === 'A' ? pair.ipaA : pair.ipaB;

    return {
      id: `mp_chal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pair,
      targetOption,
      targetWord,
      targetIpa,
      timeLimitSec: 2.0,
    };
  }

  /**
   * Evaluates user answer with latency tracking.
   */
  public evaluate(
    challenge: MinimalPairChallenge,
    selectedOption: 'A' | 'B',
    responseTimeMs: number,
  ): MinimalPairResult {
    const selectedWord = selectedOption === 'A' ? challenge.pair.wordA : challenge.pair.wordB;
    const isCorrect = selectedOption === challenge.targetOption && responseTimeMs <= challenge.timeLimitSec * 1000;

    return {
      challengeId: challenge.id,
      pairId: challenge.pair.id,
      targetWord: challenge.targetWord,
      selectedWord,
      isCorrect,
      responseTimeMs,
    };
  }
}
