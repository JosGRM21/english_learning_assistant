export interface DomainEvent<T = unknown> {
  readonly eventName: string;
  readonly payload: T;
  readonly timestamp: string;
}

export interface ErrorCommittedPayload {
  userId: string;
  errorTaxonomyCode: string;
  source: 'SRS' | 'WRITING_EVALUATION' | 'PHONETICS_DRILL' | 'SPEED_DRILL';
  sourceReferenceId?: string;
  contextSnippet?: string;
  incorrectToken?: string;
  correctToken?: string;
  timestamp?: string;
}

export interface ItemProceduralizedPayload {
  userId: string;
  cardId: string;
  targetId: string;
  finalLatencyMs: number;
  consecutiveSessions: number;
  timestamp?: string;
}

export interface CardReviewedPayload {
  userId: string;
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  elapsedMs: number;
  newStability: number;
  newDifficulty: number;
  stateBefore: string;
  stateAfter: string;
  timestamp?: string;
}

export type EventHandler<T = any> = (payload: T) => void | Promise<void>;
