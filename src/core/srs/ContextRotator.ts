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
}
