import { SrsCard, ReviewLog, CardWithTarget, TargetType, SrsProfile } from '../types/srs';
import { CefrLevel, PhraseologicalUnit } from '../types/vocab';

export interface DeckStatistics {
  dueCount: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  totalCount: number;
  leechCount: number;
}

export type CreateCardInput = Omit<SrsCard, 'createdAt' | 'srsProfile' | 'consecutiveLapses' | 'isLeech'> & {
  srsProfile?: SrsProfile;
  consecutiveLapses?: number;
  isLeech?: boolean;
};

export interface ICardRepository {
  getDueCards(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<SrsCard[]>;
  getCardById(cardId: string): Promise<SrsCard | null>;
  getCardByTargetId(targetId: string, targetType?: TargetType): Promise<SrsCard | null>;
  createCard(card: CreateCardInput): Promise<SrsCard>;
  activatePhraseCard(phraseId: string): Promise<SrsCard>;
  getNextUnactivatedPhrases(options: { cefrLevels?: CefrLevel[]; limit: number }): Promise<PhraseologicalUnit[]>;
  updateCard(card: SrsCard): Promise<void>;
  recordReviewLog(log: ReviewLog): Promise<void>;
  recordReview(card: SrsCard, log: ReviewLog): Promise<void>;
  getCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getDueCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getNewCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getAllCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getDeckStatistics(userId: string, srsProfile?: SrsProfile): Promise<DeckStatistics>;
  getAllReviewLogs(limit?: number): Promise<ReviewLog[]>;
  hasReviewToday(userId: string, todayDateStr: string): Promise<boolean>;
  getNewCardsReviewedTodayCount(userId: string, startOfDayIso: string, endOfDayIso: string): Promise<number>;
  getDueCardsCount(userId: string, srsProfile?: SrsProfile): Promise<number>;
  getActiveTargetIds(userId: string, targetType: TargetType): Promise<string[]>;
  getWeakVocabularyForWriting(userId: string, contextDomain?: string | null, limit?: number): Promise<CardWithTarget[]>;
}

