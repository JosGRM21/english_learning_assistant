import { SrsCard, ReviewLog, CardWithTarget } from '../types/srs';

export interface ICardRepository {
  getDueCards(userId: string, limit?: number): Promise<SrsCard[]>;
  getCardById(cardId: string): Promise<SrsCard | null>;
  createCard(card: Omit<SrsCard, 'createdAt'>): Promise<SrsCard>;
  updateCard(card: SrsCard): Promise<void>;
  recordReviewLog(log: ReviewLog): Promise<void>;
  getCardsWithDetails(userId: string, limit?: number): Promise<CardWithTarget[]>;
}
