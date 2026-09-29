import { describe, it, expect } from 'vitest';
import { SemanticInterleaver, QueueItem } from '../SemanticInterleaver';

describe('SemanticInterleaver', () => {
  const interleaver = new SemanticInterleaver(3); // 3 items separation for testing

  it('preserves single-item or empty queues', () => {
    expect(interleaver.interleaveQueue([])).toEqual([]);
    const single: QueueItem[] = [{ cardId: '1', semanticClusterId: 'A' }];
    expect(interleaver.interleaveQueue(single)).toEqual(single);
  });

  it('separates items with identical semanticClusterId', () => {
    const queue: QueueItem[] = [
      { cardId: '1', semanticClusterId: 'FALSE_FRIEND_ACTUALLY' },
      { cardId: '2', semanticClusterId: 'FALSE_FRIEND_ACTUALLY' },
      { cardId: '3', semanticClusterId: 'NEUTRAL_1' },
      { cardId: '4', semanticClusterId: 'NEUTRAL_2' },
      { cardId: '5', semanticClusterId: 'NEUTRAL_3' },
    ];

    const interleaved = interleaver.interleaveQueue(queue);

    // Find indices of cluster items
    const indices: number[] = [];
    interleaved.forEach((item, index) => {
      if (item.semanticClusterId === 'FALSE_FRIEND_ACTUALLY') {
        indices.push(index);
      }
    });

    expect(indices.length).toBe(2);
    const distance = Math.abs(indices[1] - indices[0]);
    expect(distance).toBeGreaterThanOrEqual(3);
  });
});
