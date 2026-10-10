import { VocabContextExample } from '../types/vocab';

export class ContextRotator {
  /**
   * Selects the next context example for a card, ensuring no immediate repetition
   * when 2 or more context examples are registered.
   */
  public selectNextContext(
    availableContexts: VocabContextExample[],
    lastContextIdShown?: string | null,
  ): VocabContextExample {
    if (!availableContexts || availableContexts.length === 0) {
      throw new Error('No contexts registered for this card');
    }

    if (availableContexts.length === 1) {
      return availableContexts[0];
    }

    const filtered = lastContextIdShown
      ? availableContexts.filter((c) => c.id !== lastContextIdShown)
      : availableContexts;

    const candidatePool = filtered.length > 0 ? filtered : availableContexts;
    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    return candidatePool[randomIndex];
  }

  /**
   * Selects a graduated context example (RF-VOC-09 & RF-SRS-04).
   * Alternates between accessible (A1-B1) and advanced (B2-C2) based on card review repetitions.
   */
  public selectGraduatedContext(
    availableContexts: VocabContextExample[],
    reps = 0,
    lastContextIdShown?: string | null,
  ): VocabContextExample {
    if (!availableContexts || availableContexts.length === 0) {
      throw new Error('No contexts registered for this card');
    }

    if (availableContexts.length === 1) {
      return availableContexts[0];
    }

    const basicContexts = availableContexts.filter(
      (c) => c.cefrLevel === 'A1' || c.cefrLevel === 'A2' || c.cefrLevel === 'B1',
    );
    const advancedContexts = availableContexts.filter(
      (c) => c.cefrLevel === 'B2' || c.cefrLevel === 'C1' || c.cefrLevel === 'C2',
    );

    if (basicContexts.length > 0 && advancedContexts.length > 0) {
      // Even reps -> basic (A2-B1); Odd reps -> advanced (B2+)
      const targetPool = reps % 2 === 0 ? basicContexts : advancedContexts;
      return this.selectNextContext(targetPool, lastContextIdShown);
    }

    return this.selectNextContext(availableContexts, lastContextIdShown);
  }
}

