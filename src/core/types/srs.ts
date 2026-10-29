import { VocabItem, PhraseologicalUnit, VocabContextExample, VocabSense } from './vocab';

export type TargetType = 'VOCAB' | 'PHRASE';

export type SrsProfile = 'VOCAB_AGILE';

export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export type FsrsGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface SrsCard {
  id: string;
  userId: string;
  targetType: TargetType;
  targetId: string;
  srsProfile: SrsProfile;
  state: CardState;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  consecutiveLapses: number;
  isLeech: boolean;
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
  currentSenseIndex?: number;
  currentSense?: VocabSense;
  currentContext?: VocabContextExample;
  allContexts: VocabContextExample[];
}

export interface FsrsSchedulingResult {
  card: SrsCard;
  log: Omit<ReviewLog, 'id' | 'cardId' | 'reviewedAt'>;
  intervalDays: number;
}

export interface SrsGoalSettings {
  activeGoal: 'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000';
  dailyNewCardsTarget: number;
  overloadThreshold: number;
  includePhrasalVerbs?: boolean;
  phrasalVerbsRatio?: number;
}

export interface IngestionPlan {
  isOverloaded: boolean;
  overloadDueCount: number;
  newCardsNeeded: number;
  reason: 'NORMAL' | 'OVERLOAD_THROTTLED' | 'DAILY_QUOTA_REACHED';
}

