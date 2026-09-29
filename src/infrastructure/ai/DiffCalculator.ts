import { diffWords, Change } from 'diff';

export interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export class DiffCalculator {
  /**
   * Computes word-level diff between original and updated draft texts.
   */
  public computeWordDiff(original: string, updated: string): DiffSegment[] {
    const changes: Change[] = diffWords(original, updated);
    return changes.map((c) => ({
      value: c.value,
      added: Boolean(c.added),
      removed: Boolean(c.removed),
    }));
  }

  /**
   * Summarizes the count of modifications between two versions.
   */
  public summarizeChanges(original: string, updated: string): {
    wordsAdded: number;
    wordsRemoved: number;
    hasChanges: boolean;
  } {
    const diff = this.computeWordDiff(original, updated);
    let wordsAdded = 0;
    let wordsRemoved = 0;

    for (const segment of diff) {
      const wordCount = segment.value.trim().split(/\s+/).filter(Boolean).length;
      if (segment.added) wordsAdded += wordCount;
      if (segment.removed) wordsRemoved += wordCount;
    }

    return {
      wordsAdded,
      wordsRemoved,
      hasChanges: wordsAdded > 0 || wordsRemoved > 0,
    };
  }
}
