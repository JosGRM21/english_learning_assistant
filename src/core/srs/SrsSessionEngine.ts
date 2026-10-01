import { CardWithTarget, FsrsGrade, SrsCard } from '../types/srs';

export interface SrsSessionStats {
  totalReviewed: number;
  successfulRecalls: number;
  lapses: number;
  averageLatencyMs: number;
  startedAt: string;
  finishedAt: string | null;
}

export interface RatingProcessResult {
  nextCard: CardWithTarget | null;
  wasRequeued: boolean;
  isFinished: boolean;
  remainingCount: number;
  completedCount: number;
}

export class SrsSessionEngine {
  private queue: CardWithTarget[] = [];
  private completedCards: CardWithTarget[] = [];
  private initialTotal: number;
  private stats: SrsSessionStats;
  private latencies: number[] = [];

  constructor(initialQueue: CardWithTarget[]) {
    this.queue = [...initialQueue];
    this.initialTotal = initialQueue.length;
    this.stats = {
      totalReviewed: 0,
      successfulRecalls: 0,
      lapses: 0,
      averageLatencyMs: 0,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };
  }

  public getCurrentCard(): CardWithTarget | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  public getRemainingCount(): number {
    return this.queue.length;
  }

  public getCompletedCount(): number {
    return this.completedCards.length;
  }

  public getTotalCards(): number {
    return this.initialTotal;
  }

  public getProgressPercentage(): number {
    const total = this.completedCards.length + this.queue.length;
    if (total === 0) return 100;
    return Math.min(100, Math.round((this.completedCards.length / total) * 100));
  }

  public isFinished(): boolean {
    return this.queue.length === 0;
  }

  public getStats(): SrsSessionStats {
    return { ...this.stats };
  }

  public processRating(grade: FsrsGrade, updatedCard: SrsCard, latencyMs = 0): RatingProcessResult {
    if (this.queue.length === 0) {
      return {
        nextCard: null,
        wasRequeued: false,
        isFinished: true,
        remainingCount: 0,
        completedCount: this.completedCards.length,
      };
    }

    const current = this.queue.shift()!;
    const cardWithUpdatedData: CardWithTarget = {
      ...current,
      card: updatedCard,
    };

    this.stats.totalReviewed += 1;
    if (latencyMs > 0) {
      this.latencies.push(latencyMs);
      this.stats.averageLatencyMs = Math.round(
        this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length,
      );
    }

    let wasRequeued = false;
    // Grade 1: Repetir (Again / Lapse)
    // Intra-session re-queueing: Re-insert 3 positions later or at the end
    if (grade === 1) {
      this.stats.lapses += 1;
      const insertIndex = Math.min(3, this.queue.length);
      this.queue.splice(insertIndex, 0, cardWithUpdatedData);
      wasRequeued = true;
    } else {
      this.stats.successfulRecalls += 1;
      this.completedCards.push(cardWithUpdatedData);
    }

    const finished = this.isFinished();
    if (finished && !this.stats.finishedAt) {
      this.stats.finishedAt = new Date().toISOString();
    }

    return {
      nextCard: this.getCurrentCard(),
      wasRequeued,
      isFinished: finished,
      remainingCount: this.queue.length,
      completedCount: this.completedCards.length,
    };
  }

  /**
   * Puts a specific card at the front of the queue (e.g. chosen from deck explorer)
   */
  public jumpToCard(card: CardWithTarget): void {
    if (this.queue.length > 0 && this.queue[0].card.id === card.card.id) {
      return;
    }
    this.queue = this.queue.filter((c) => c.card.id !== card.card.id);
    this.queue.unshift(card);
  }
}
