export interface QueueItem {
  cardId: string;
  taxonomyCode?: string;
  semanticClusterId?: string;
  [key: string]: unknown;
}

export class SemanticInterleaver {
  private readonly minSeparation: number;

  constructor(minSeparation = 5) {
    this.minSeparation = minSeparation;
  }

  /**
   * Reorders a review queue so items with the same semanticClusterId
   * are spaced out by at least minSeparation items whenever alternative items are available.
   */
  public interleaveQueue<T extends QueueItem>(queue: T[]): T[] {
    if (queue.length <= 1) return [...queue];

    const result: T[] = [];
    const pending = [...queue];

    while (pending.length > 0) {
      let placed = false;

      for (let i = 0; i < pending.length; i++) {
        const candidate = pending[i];

        // Check recent cards placed within minSeparation
        const recentSlice = result.slice(-this.minSeparation);
        const hasConflict =
          Boolean(candidate.semanticClusterId) &&
          recentSlice.some(
            (item) => item.semanticClusterId && item.semanticClusterId === candidate.semanticClusterId,
          );

        if (!hasConflict) {
          result.push(candidate);
          pending.splice(i, 1);
          placed = true;
          break;
        }
      }

      if (!placed) {
        // Only if ALL pending items conflict with the recent slice, place the first available
        result.push(pending.shift()!);
      }
    }

    return result;
  }
}
