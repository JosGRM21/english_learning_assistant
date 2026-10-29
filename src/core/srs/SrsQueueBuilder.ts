import { CardWithTarget, SrsProfile } from '../types/srs';
import { SemanticInterleaver } from './SemanticInterleaver';
import { FsrsScheduler } from './FsrsScheduler';

export interface QueueBuilderOptions {
  maxNewCardsPerDay?: number;
  minSemanticSeparation?: number;
  shuffle?: boolean;
}

export interface BuildQueueFilters {
  srsProfile?: SrsProfile;
  includeLeeches?: boolean;
  maxNewCards?: number;
}

export class SrsQueueBuilder {
  private interleaver: SemanticInterleaver;
  private scheduler: FsrsScheduler;
  private maxNewCardsPerDay: number;
  private shuffle: boolean;

  constructor(options: QueueBuilderOptions = {}) {
    this.interleaver = new SemanticInterleaver(options.minSemanticSeparation ?? 4);
    this.scheduler = new FsrsScheduler();
    this.maxNewCardsPerDay = options.maxNewCardsPerDay ?? 15;
    this.shuffle = options.shuffle ?? true;
  }

  /**
   * Controlled in-place Fisher-Yates shuffle
   */
  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Builds the daily session queue according to strict RF-SRS-CORE-07 priority:
   * 1. Relearning / intraday learning steps.
   * 2. Due reviews ordered by lowest Retrievability R first (highest forgetting risk).
   * 3. New cards capped by daily limit.
   * 4. Excludes leeches (unless explicitly requested).
   * 5. Interleaves items with identical lemmas or subcategories.
   */
  public buildQueue(
    dueCards: CardWithTarget[],
    newCards: CardWithTarget[],
    filters?: BuildQueueFilters,
  ): CardWithTarget[] {
    let filteredDue = [...dueCards];
    let filteredNew = [...newCards];

    // Filter by profile if provided
    if (filters?.srsProfile) {
      filteredDue = filteredDue.filter(
        (c) => (c.card.srsProfile ?? 'VOCAB_AGILE') === filters.srsProfile,
      );
      filteredNew = filteredNew.filter(
        (c) => (c.card.srsProfile ?? 'VOCAB_AGILE') === filters.srsProfile,
      );
    }

    // Exclude leeches unless requested
    if (!filters?.includeLeeches) {
      filteredDue = filteredDue.filter((c) => !c.card.isLeech);
      filteredNew = filteredNew.filter((c) => !c.card.isLeech);
    }

    // Priority 1: Intraday cards (LEARNING or RELEARNING)
    const intradayCards = filteredDue.filter(
      (c) => c.card.state === 'LEARNING' || c.card.state === 'RELEARNING',
    );

    // Priority 2: Due review cards ordered by lowest retrievability first
    const reviewCards = filteredDue.filter((c) => c.card.state === 'REVIEW');
    const now = new Date();
    reviewCards.sort((a, b) => {
      const rA = this.scheduler.calculateRetrievability(a.card, now);
      const rB = this.scheduler.calculateRetrievability(b.card, now);
      return rA - rB;
    });

    const otherDue = filteredDue.filter(
      (c) =>
        c.card.state !== 'LEARNING' &&
        c.card.state !== 'RELEARNING' &&
        c.card.state !== 'REVIEW',
    );

    const orderedDue = this.shuffle
      ? [...this.shuffleArray(intradayCards), ...reviewCards, ...this.shuffleArray(otherDue)]
      : [...intradayCards, ...reviewCards, ...otherDue];

    // Priority 3: New cards capped
    const maxNew = filters?.maxNewCards ?? this.maxNewCardsPerDay;
    const cappedNew = filteredNew.slice(0, maxNew);
    const orderedNew = this.shuffle ? this.shuffleArray(cappedNew) : [...cappedNew];

    const candidates = [...orderedDue, ...orderedNew].map((item) => {
      return {
        ...item,
        cardId: item.card.id,
        // Priority 1: same word/lemma
        primaryClusterId: item.vocab?.word?.trim().toLowerCase() || undefined,
        // Priority 2: same subcategory OR part of speech
        secondaryClusterId: item.vocab?.subcategory || item.vocab?.partOfSpeech || undefined,
        semanticClusterId: item.vocab?.subcategory || item.vocab?.partOfSpeech || undefined,
      };
    });

    return this.interleaver.interleaveQueue(candidates);
  }
}

