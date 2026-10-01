import { CardWithTarget } from '../types/srs';
import { SemanticInterleaver } from './SemanticInterleaver';

export interface QueueBuilderOptions {
  maxNewCardsPerDay?: number;
  minSemanticSeparation?: number;
}

export class SrsQueueBuilder {
  private interleaver: SemanticInterleaver;
  private maxNewCardsPerDay: number;

  constructor(options: QueueBuilderOptions = {}) {
    this.interleaver = new SemanticInterleaver(options.minSemanticSeparation ?? 4);
    this.maxNewCardsPerDay = options.maxNewCardsPerDay ?? 15;
  }

  /**
   * Builds the daily session queue:
   * 1. Prioritizes due review/learning cards (cards with scheduledFor <= now).
   * 2. Caps new cards to maxNewCardsPerDay.
   * 3. Interleaves items with similar semantic clusters so they don't appear consecutively.
   */
  public buildQueue(dueCards: CardWithTarget[], newCards: CardWithTarget[]): CardWithTarget[] {
    const cappedNew = newCards.slice(0, this.maxNewCardsPerDay);

    const candidates = [...dueCards, ...cappedNew].map((item) => ({
      ...item,
      cardId: item.card.id,
      semanticClusterId: item.vocab?.subcategory || item.vocab?.partOfSpeech,
    }));

    return this.interleaver.interleaveQueue(candidates);
  }
}
