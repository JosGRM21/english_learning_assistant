import { SrsCard, ReviewLog, CardWithTarget, TargetType, SrsProfile } from '../types/srs';

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
  updateCard(card: SrsCard): Promise<void>;
  resetLeechStatus(cardId: string): Promise<void>;
  recordReviewLog(log: ReviewLog): Promise<void>;
  recordReview(card: SrsCard, log: ReviewLog): Promise<void>;
  getCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getDueCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getNewCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getAllCardsWithDetails(userId: string, limit?: number, srsProfile?: SrsProfile): Promise<CardWithTarget[]>;
  getDeckStatistics(userId: string, srsProfile?: SrsProfile): Promise<DeckStatistics>;
  getAllReviewLogs(limit?: number): Promise<ReviewLog[]>;
  getWeakVocabularyForWriting(userId: string, contextDomain?: string | null, limit?: number): Promise<CardWithTarget[]>;
}

