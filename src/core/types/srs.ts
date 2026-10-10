import { VocabItem, PhraseologicalUnit, VocabContextExample } from './vocab';

export type TargetType = 'VOCAB' | 'PHRASE' | 'WRITING_ERROR';

export type SrsProfile = 'VOCAB_AGILE' | 'WRITING_ERROR_REFLECTIVE';

export type CardState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING';

export type FsrsGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export type PositiveDrillFormat = 'CONTEXTUAL_CLOZE' | 'C_TEST' | 'SENTENCE_REWRITE' | 'CHUNK_SCRAMBLE';

export interface PositiveDrillData {
  format: PositiveDrillFormat;
  clozeSentence?: string;
  expectedToken?: string;
  cTestPrompt?: string;
  cTestPrefix?: string;
  expectedLength?: number;
  rewriteBaseSentence?: string;
  rewriteKeyword?: string;
  rewriteTargetSentence?: string;
  scrambledChunks?: string[];
  expectedSequence?: string[];
  explanationEs: string;
  sentenceContext: string;
}

export interface WritingErrorSrsItem {
  id: string;
  submissionId: string;
  userId: string;
  errorSpan: string;
  errorType: string;
  taxonomyCode: string;
  isL1SpanishTransfer: boolean;
  explanationEs: string;
  nativeReformulation: string;
  originalSentence: string;
  expandedContext: string;
  drillFormat: PositiveDrillFormat;
  drillData: PositiveDrillData;
  srsCardId?: string | null;
  masteryStatus: 'LEARNING' | 'INTERNALIZED' | 'RECIDIVIST';
  isFossilizedAlert: boolean;
  timesRecidivist: number;
  createdAt: string;
  srsCard?: SrsCard;
}

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
  writingError?: WritingErrorSrsItem;
  currentContext?: VocabContextExample;
  allContexts: VocabContextExample[];
}

export interface FsrsSchedulingResult {
  card: SrsCard;
  log: Omit<ReviewLog, 'id' | 'cardId' | 'reviewedAt'>;
  intervalDays: number;
}
