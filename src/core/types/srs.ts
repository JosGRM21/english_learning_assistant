import { VocabItem, PhraseologicalUnit, VocabContextExample } from './vocab';

export type TargetType = 'VOCAB' | 'PHRASE' | 'GRAMMAR' | 'PHONETICS';

export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export type FsrsGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface SrsCard {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  state: CardState;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  lastReviewedAt: string | null;
  scheduledFor: string;
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  rating: FsrsGrade;
  stateBefore: CardState;
  stabilityBefore: number;
  difficultyBefore: number;
  newStability: number;
  newDifficulty: number;
  elapsedMs: number;
  reviewedAt: string;
}

export interface CardWithTarget {
  card: SrsCard;
  vocab?: VocabItem;
  phrase?: PhraseologicalUnit;
  currentContext?: VocabContextExample;
  allContexts: VocabContextExample[];
}

export interface FsrsSchedulingResult {
  card: SrsCard;
  log: Omit<ReviewLog, 'id' | 'cardId' | 'reviewedAt'>;
  intervalDays: number;
}
