import { SrsCard, ReviewLog, CardWithTarget, TargetType } from '../types/srs';

export interface DeckStatistics {
  dueCount: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  totalCount: number;
}

export interface ICardRepository {
  getDueCards(userId: string, limit?: number): Promise<SrsCard[]>;
  getCardById(cardId: string): Promise<SrsCard | null>;
  getCardByTargetId(targetId: string, targetType?: TargetType): Promise<SrsCard | null>;
  createCard(card: Omit<SrsCard, 'createdAt'>): Promise<SrsCard>;
  updateCard(card: SrsCard): Promise<void>;
  recordReviewLog(log: ReviewLog): Promise<void>;
  recordReview(card: SrsCard, log: ReviewLog): Promise<void>;
  getCardsWithDetails(userId: string, limit?: number): Promise<CardWithTarget[]>;
  getDueCardsWithDetails(userId: string, limit?: number): Promise<CardWithTarget[]>;
  getNewCardsWithDetails(userId: string, limit?: number): Promise<CardWithTarget[]>;
  getAllCardsWithDetails(userId: string, limit?: number): Promise<CardWithTarget[]>;
  getDeckStatistics(userId: string): Promise<DeckStatistics>;
  getAllReviewLogs(limit?: number): Promise<ReviewLog[]>;
}
