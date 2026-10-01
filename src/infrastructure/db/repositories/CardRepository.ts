import { Kysely, Selectable } from 'kysely';
import { DatabaseSchema, SrsCardsTable } from '../../../core/types/database';
import { ICardRepository, DeckStatistics } from '../../../core/repositories/ICardRepository';
import { SrsCard, ReviewLog, CardWithTarget, CardState, TargetType } from '../../../core/types/srs';
import { CefrLevel, GrammaticalDimension, PartOfSpeech } from '../../../core/types/vocab';

export class CardRepository implements ICardRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private toDomain(row: Selectable<SrsCardsTable>): SrsCard {
    return {
      id: row.id,
      userId: row.user_id,
      targetType: row.target_type as TargetType,
      targetId: row.target_id,
      state: row.state as CardState,
      stability: row.stability,
      difficulty: row.difficulty,
      reps: row.reps,
      lapses: row.lapses,
      lastReviewedAt: row.last_reviewed_at,
      scheduledFor: row.scheduled_for,
      createdAt: row.created_at,
    };
  }

  async getDueCards(userId: string, limit = 50): Promise<SrsCard[]> {
    const now = new Date().toISOString();
    const rows = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('scheduled_for', '<=', now)
      .orderBy('scheduled_for', 'asc')
      .limit(limit)
      .execute();

    return rows.map((row) => this.toDomain(row));
  }

  async getCardById(cardId: string): Promise<SrsCard | null> {
    const row = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('id', '=', cardId)
      .executeTakeFirst();

    return row ? this.toDomain(row) : null;
  }

  async getCardByTargetId(targetId: string, targetType: TargetType = 'VOCAB'): Promise<SrsCard | null> {
    const row = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('target_id', '=', targetId)
      .where('target_type', '=', targetType)
      .executeTakeFirst();

    return row ? this.toDomain(row) : null;
  }

  async createCard(card: Omit<SrsCard, 'createdAt'>): Promise<SrsCard> {
    const createdAt = new Date().toISOString();

    // Ensure the referenced user exists to guarantee foreign key integrity
    await this.db
      .insertInto('users')
      .values({
        id: card.userId,
        username: card.userId,
        target_accent: 'GENERAL_AMERICAN',
        current_cefr_target: 'B1',
        default_ai_model: 'gemini-3.8-flash',
        api_key_rotation_mode: 'FAILOVER_ON_QUOTA',
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();

    await this.db
      .insertInto('srs_cards')
      .values({
        id: card.id,
        user_id: card.userId,
        target_type: card.targetType,
        target_id: card.targetId,
        state: card.state,
        stability: card.stability,
        difficulty: card.difficulty,
        reps: card.reps,
        lapses: card.lapses,
        last_reviewed_at: card.lastReviewedAt,
        scheduled_for: card.scheduledFor,
        created_at: createdAt,
      })
      .execute();

    return {
      ...card,
      createdAt,
    };
  }

  async updateCard(card: SrsCard): Promise<void> {
    await this.db
      .updateTable('srs_cards')
      .set({
        state: card.state,
        stability: card.stability,
        difficulty: card.difficulty,
        reps: card.reps,
        lapses: card.lapses,
        last_reviewed_at: card.lastReviewedAt,
        scheduled_for: card.scheduledFor,
      })
      .where('id', '=', card.id)
      .execute();
  }

  async recordReviewLog(log: ReviewLog): Promise<void> {
    await this.db
      .insertInto('review_logs')
      .values({
        id: log.id,
        card_id: log.cardId,
        rating: log.rating,
        state_before: log.stateBefore,
        stability_before: log.stabilityBefore,
        difficulty_before: log.difficultyBefore,
        new_stability: log.newStability,
        new_difficulty: log.newDifficulty,
        elapsed_ms: log.elapsedMs,
        reviewed_at: log.reviewedAt,
      })
      .execute();
  }

  async recordReview(card: SrsCard, log: ReviewLog): Promise<void> {
    await this.updateCard(card);
    await this.recordReviewLog(log);
  }

  private async populateCardDetails(cards: SrsCard[]): Promise<CardWithTarget[]> {
    const results: CardWithTarget[] = [];

    for (const card of cards) {
      if (card.targetType === 'VOCAB') {
        const vocabRow = await this.db
          .selectFrom('vocab_items')
          .selectAll()
          .where('id', '=', card.targetId)
          .executeTakeFirst();

        const contextRows = await this.db
          .selectFrom('vocab_context_examples')
          .selectAll()
          .where('vocab_id', '=', card.targetId)
          .execute();

        const contexts = contextRows.map((c) => ({
          id: c.id,
          vocabId: c.vocab_id,
          phraseId: c.phrase_id,
          sentenceEn: c.sentence_en,
          sentenceEs: c.sentence_es,
          clozeTarget: c.cloze_target,
          audioUrl: c.audio_url,
          cefrLevel: c.cefr_level as CefrLevel,
          createdAt: c.created_at,
        }));

        results.push({
          card,
          vocab: vocabRow
            ? {
                id: vocabRow.id,
                word: vocabRow.word,
                grammaticalDimension: vocabRow.grammatical_dimension as GrammaticalDimension,
                partOfSpeech: vocabRow.part_of_speech as PartOfSpeech,
                subcategory: vocabRow.subcategory,
                definitionEn: vocabRow.definition_en,
                translationEs: vocabRow.translation_es,
                ipaGeneralAmerican: vocabRow.ipa_general_american,
                ipaReceivedPronunciation: vocabRow.ipa_received_pronunciation,
                cefrLevel: vocabRow.cefr_level as CefrLevel,
                isFalseFriend: Boolean(vocabRow.is_false_friend),
                falseFriendNote: vocabRow.false_friend_note,
                morphologicalFamilyJson: vocabRow.morphological_family_json
                  ? JSON.parse(vocabRow.morphological_family_json)
                  : [],
                createdAt: vocabRow.created_at,
              }
            : undefined,
          allContexts: contexts,
          currentContext: contexts[0],
        });
      }
    }

    return results;
  }

  async getCardsWithDetails(userId: string, limit = 50): Promise<CardWithTarget[]> {
    const cards = await this.getDueCards(userId, limit);
    return this.populateCardDetails(cards);
  }

  async getDueCardsWithDetails(userId: string, limit = 50): Promise<CardWithTarget[]> {
    const now = new Date().toISOString();
    const rows = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('state', '!=', 'NEW')
      .where('scheduled_for', '<=', now)
      .orderBy('scheduled_for', 'asc')
      .limit(limit)
      .execute();

    const cards = rows.map((r) => this.toDomain(r));
    return this.populateCardDetails(cards);
  }

  async getNewCardsWithDetails(userId: string, limit = 50): Promise<CardWithTarget[]> {
    const rows = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('state', '=', 'NEW')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .execute();

    const cards = rows.map((r) => this.toDomain(r));
    return this.populateCardDetails(cards);
  }

  async getAllCardsWithDetails(userId: string, limit = 200): Promise<CardWithTarget[]> {
    const rows = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('scheduled_for', 'asc')
      .limit(limit)
      .execute();

    const cards = rows.map((r) => this.toDomain(r));
    return this.populateCardDetails(cards);
  }

  async getDeckStatistics(userId: string): Promise<DeckStatistics> {
    const now = new Date().toISOString();
    const all = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();

    let newCount = 0;
    let dueCount = 0;
    let learningCount = 0;
    let reviewCount = 0;

    for (const row of all) {
      if (row.state === 'NEW') {
        newCount++;
      } else {
        if (row.scheduled_for <= now) {
          dueCount++;
        }
        if (row.state === 'LEARNING' || row.state === 'RELEARNING') {
          learningCount++;
        } else if (row.state === 'REVIEW') {
          reviewCount++;
        }
      }
    }

    return {
      dueCount,
      newCount,
      learningCount,
      reviewCount,
      totalCount: all.length,
    };
  }
}
