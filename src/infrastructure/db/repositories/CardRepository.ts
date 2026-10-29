import { Kysely, Selectable, sql } from 'kysely';
import { DatabaseSchema, SrsCardsTable } from '../../../core/types/database';
import { ICardRepository, DeckStatistics, CreateCardInput } from '../../../core/repositories/ICardRepository';
import {
  SrsCard,
  ReviewLog,
  CardWithTarget,
  CardState,
  TargetType,
  FsrsGrade,
  SrsProfile,
} from '../../../core/types/srs';
import { CefrLevel, GrammaticalDimension, PartOfSpeech, ChunkType, PhrasalVerbType, VocabContextExample, VerbTenses, VocabSense, PhraseologicalUnit } from '../../../core/types/vocab';
import { mapVocabRowToDomain } from './VocabRepository';

export class CardRepository implements ICardRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private toDomain(row: Selectable<SrsCardsTable>): SrsCard {
    return {
      id: row.id,
      userId: row.user_id,
      targetType: row.target_type as TargetType,
      targetId: row.target_id,
      srsProfile: (row.srs_profile as SrsProfile) ?? 'VOCAB_AGILE',
      state: row.state as CardState,
      stability: row.stability,
      difficulty: row.difficulty,
      reps: row.reps,
      lapses: row.lapses,
      consecutiveLapses: row.consecutive_lapses ?? 0,
      isLeech: Boolean(row.is_leech),
      lastReviewedAt: row.last_reviewed_at,
      scheduledFor: row.scheduled_for,
      createdAt: row.created_at,
    };
  }

  private parseJsonSafe<T>(jsonStr: string | null | undefined, fallback: T): T {
    if (!jsonStr) return fallback;
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      return fallback;
    }
  }

  async getDueCards(userId: string, limit = 50, srsProfile?: SrsProfile): Promise<SrsCard[]> {
    const now = new Date().toISOString();
    let query = this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('scheduled_for', '<=', now);

    if (srsProfile) {
      query = query.where('srs_profile', '=', srsProfile);
    }

    const rows = await query
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

  async createCard(card: CreateCardInput): Promise<SrsCard> {
    // Prevent duplicate cards for the exact same target
    const existing = await this.getCardByTargetId(card.targetId, card.targetType);
    if (existing) {
      return existing;
    }

    const createdAt = new Date().toISOString();

    try {
      await this.db
        .insertInto('srs_cards')
        .values({
          id: card.id,
          user_id: card.userId,
          target_type: card.targetType,
          target_id: card.targetId,
          srs_profile: card.srsProfile ?? 'VOCAB_AGILE',
          state: card.state,
          stability: card.stability,
          difficulty: card.difficulty,
          reps: card.reps,
          lapses: card.lapses,
          consecutive_lapses: card.consecutiveLapses ?? 0,
          is_leech: card.isLeech ? 1 : 0,
          last_reviewed_at: card.lastReviewedAt,
          scheduled_for: card.scheduledFor,
          created_at: createdAt,
        })
        .execute();
    } catch (err: unknown) {
      const msg = String(err);
      if (
        msg.includes('UNIQUE constraint failed') ||
        msg.includes('2067') ||
        msg.includes('idx_srs_target_unique')
      ) {
        const fallbackExisting = await this.getCardByTargetId(card.targetId, card.targetType);
        if (fallbackExisting) {
          return fallbackExisting;
        }
      }
      throw err;
    }

    return {
      ...card,
      srsProfile: card.srsProfile ?? 'VOCAB_AGILE',
      consecutiveLapses: card.consecutiveLapses ?? 0,
      isLeech: card.isLeech ?? false,
      createdAt,
    };
  }

  async activatePhraseCard(phraseId: string): Promise<SrsCard> {
    const existing = await this.getCardByTargetId(phraseId, 'PHRASE');
    if (existing) {
      return existing;
    }

    // Update phraseological_units & vocab_items mastery_status to LEARNING
    try {
      await this.db
        .updateTable('phraseological_units')
        .set({ mastery_status: 'LEARNING' })
        .where('id', '=', phraseId)
        .execute();
      await this.db
        .updateTable('vocab_items')
        .set({ mastery_status: 'LEARNING' })
        .where('id', '=', phraseId)
        .execute();
    } catch {
      // Ignored if table doesn't have row yet
    }

    const now = new Date().toISOString();
    const newCard: CreateCardInput = {
      id: `card_phr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: 'user_local',
      targetType: 'PHRASE',
      targetId: phraseId,
      state: 'NEW',
      stability: 0.0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      srsProfile: 'VOCAB_AGILE',
      lastReviewedAt: null,
      scheduledFor: now,
    };

    return this.createCard(newCard);
  }

  async getNextUnactivatedPhrases(options: {
    cefrLevels?: CefrLevel[];
    limit: number;
  }): Promise<PhraseologicalUnit[]> {
    const limit = options.limit ?? 10;
    let query = this.db
      .selectFrom('phraseological_units')
      .selectAll()
      .where('mastery_status', '=', 'INACTIVE');

    if (options.cefrLevels && options.cefrLevels.length > 0) {
      query = query.where('cefr_level', 'in', options.cefrLevels);
    }

    const rows = await query
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
      .limit(limit)
      .execute();

    return rows.map((r) => ({
      id: r.id,
      primaryVocabId: r.primary_vocab_id,
      chunkType: r.chunk_type as ChunkType,
      text: r.text,
      meaningEs: r.meaning_es,
      definitionEn: r.definition_en,
      ipaGeneralAmerican: r.ipa_general_american ?? undefined,
      ipaReceivedPronunciation: r.ipa_received_pronunciation ?? null,
      phrasalVerbType: r.phrasal_verb_type as PhrasalVerbType | null,
      pronounMustSplit: Boolean(r.pronoun_must_split),
      example1: r.example_1,
      example1Es: r.example_1_es,
      example2: r.example_2,
      example2Es: r.example_2_es,
      cefrLevel: r.cefr_level as CefrLevel,
      masteryStatus: (r.mastery_status as any) ?? 'INACTIVE',
      createdAt: r.created_at,
    }));
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
        consecutive_lapses: card.consecutiveLapses ?? 0,
        is_leech: card.isLeech ? 1 : 0,
        srs_profile: card.srsProfile ?? 'VOCAB_AGILE',
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
    if (!cards || cards.length === 0) return [];

    const vocabTargetIds = new Set<string>();
    const phraseTargetIds = new Set<string>();

    for (const card of cards) {
      if (card.targetType === 'VOCAB') {
        const baseVocabId = card.targetId.split('#')[0];
        vocabTargetIds.add(baseVocabId);
      } else if (card.targetType === 'PHRASE') {
        phraseTargetIds.add(card.targetId);
      }
    }

    // Include phraseTargetIds in vocabQueryIds in case a phrase item was stored in vocab_items
    const allVocabQueryIds = Array.from(new Set([...vocabTargetIds, ...phraseTargetIds]));

    // Batch load all targets and contexts in parallel (eliminating N+1 sequential IPC calls)
    const [vocabRows, contextRows, phraseRows] = await Promise.all([
      allVocabQueryIds.length > 0
        ? this.db.selectFrom('vocab_items').selectAll().where('id', 'in', allVocabQueryIds).execute()
        : Promise.resolve([]),
      allVocabQueryIds.length > 0
        ? this.db.selectFrom('vocab_context_examples').selectAll().where('vocab_id', 'in', allVocabQueryIds).execute()
        : Promise.resolve([]),
      phraseTargetIds.size > 0
        ? this.db.selectFrom('phraseological_units').selectAll().where('id', 'in', Array.from(phraseTargetIds)).execute()
        : Promise.resolve([]),
    ]);

    // Build fast in-memory lookup maps
    const vocabMap = new Map(vocabRows.map((v) => [v.id, v]));
    const phraseMap = new Map(phraseRows.map((p) => [p.id, p]));

    const contextsByVocabId = new Map<string, VocabContextExample[]>();
    for (const c of contextRows) {
      if (c.vocab_id) {
        if (!contextsByVocabId.has(c.vocab_id)) {
          contextsByVocabId.set(c.vocab_id, []);
        }
        contextsByVocabId.get(c.vocab_id)!.push({
          id: c.id,
          vocabId: c.vocab_id,
          phraseId: c.phrase_id,
          senseIndex: (c as any).sense_index ?? 0,
          sentenceEn: c.sentence_en,
          sentenceEs: c.sentence_es,
          clozeTarget: c.cloze_target,
          audioUrl: c.audio_url,
          cefrLevel: c.cefr_level as CefrLevel,
          createdAt: c.created_at,
        });
      }
    }

    // Assemble hydrated cards synchronously in a single pass
    const results: CardWithTarget[] = [];

    for (const card of cards) {
      if (card.targetType === 'VOCAB') {
        const [baseVocabId, senseIdxStr] = card.targetId.split('#');
        const senseIndex = senseIdxStr ? parseInt(senseIdxStr, 10) : 0;
        const vocabRow = vocabMap.get(baseVocabId);
        const allVocabContexts = contextsByVocabId.get(baseVocabId) ?? [];

        let vocabDomain = vocabRow ? mapVocabRowToDomain(vocabRow) : undefined;
        let currentSense: VocabSense | undefined = undefined;

        if (vocabDomain) {
          const allSenses: VocabSense[] =
            vocabDomain.sensesJson && vocabDomain.sensesJson.length > 0
              ? vocabDomain.sensesJson
              : [
                  {
                    translationEs: vocabDomain.translationEs,
                    definitionEn: vocabDomain.definitionEn,
                    partOfSpeech: vocabDomain.partOfSpeech,
                    cefrLevel: vocabDomain.cefrLevel,
                    grammarPattern: (vocabDomain as any).grammarPattern,
                    countability: (vocabDomain as any).countability,
                  },
                  ...((vocabDomain.alternateSensesJson as any) || []),
                ];

          currentSense = allSenses[senseIndex] || allSenses[0];

          if (currentSense) {
            vocabDomain = {
              ...vocabDomain,
              translationEs: currentSense.translationEs,
              definitionEn: currentSense.definitionEn,
              partOfSpeech: currentSense.partOfSpeech,
              cefrLevel: currentSense.cefrLevel,
            };
          }
        }

        const senseContexts = allVocabContexts.filter((ctx) => (ctx.senseIndex ?? 0) === senseIndex);
        const contexts = senseContexts.length > 0 ? senseContexts : allVocabContexts;

        results.push({
          card,
          vocab: vocabDomain,
          currentSenseIndex: senseIndex,
          currentSense,
          allContexts: contexts,
          currentContext: contexts[0],
        });
      } else if (card.targetType === 'PHRASE') {
        const phraseRow = phraseMap.get(card.targetId);
        const phraseItem = phraseRow
          ? {
              id: phraseRow.id,
              primaryVocabId: phraseRow.primary_vocab_id,
              chunkType: phraseRow.chunk_type as ChunkType,
              text: phraseRow.text,
              meaningEs: phraseRow.meaning_es,
              definitionEn: phraseRow.definition_en || '',
              ipaGeneralAmerican: phraseRow.ipa_general_american || '',
              ipaReceivedPronunciation: phraseRow.ipa_received_pronunciation || null,
              phrasalVerbType: phraseRow.phrasal_verb_type as PhrasalVerbType | null,
              pronounMustSplit: Boolean(phraseRow.pronoun_must_split),
              example1: phraseRow.example_1,
              example1Es: phraseRow.example_1_es,
              example2: phraseRow.example_2,
              example2Es: phraseRow.example_2_es,
              cefrLevel: phraseRow.cefr_level as CefrLevel,
              createdAt: phraseRow.created_at,
            }
          : null;

        if (phraseItem) {
          const contexts: VocabContextExample[] = [];
          if (phraseItem.example1) {
            contexts.push({
              id: `ctx_${phraseItem.id}_1`,
              phraseId: phraseItem.id,
              sentenceEn: phraseItem.example1,
              sentenceEs: phraseItem.example1Es || phraseItem.meaningEs,
              clozeTarget: phraseItem.text,
              cefrLevel: phraseItem.cefrLevel,
              createdAt: phraseItem.createdAt,
            });
          }

          const currentSense: VocabSense = {
            senseId: `sense_${phraseItem.id}`,
            translationEs: phraseItem.meaningEs,
            definitionEn: phraseItem.definitionEn || '',
            partOfSpeech: phraseItem.chunkType === 'PHRASAL_VERB' ? 'VERB' : 'NOUN',
            cefrLevel: phraseItem.cefrLevel,
            domainCategory: phraseItem.chunkType === 'PHRASAL_VERB' ? 'Phrasal Verb' : 'Expresión',
            exampleSentenceEn: phraseItem.example1,
            exampleSentenceEs: phraseItem.example1Es || phraseItem.meaningEs,
          };

          results.push({
            card,
            phrase: {
              id: phraseItem.id,
              primaryVocabId: phraseItem.primaryVocabId,
              chunkType: phraseItem.chunkType,
              text: phraseItem.text,
              meaningEs: phraseItem.meaningEs,
              definitionEn: phraseItem.definitionEn,
              ipaGeneralAmerican: phraseItem.ipaGeneralAmerican,
              ipaReceivedPronunciation: phraseItem.ipaReceivedPronunciation,
              phrasalVerbType: phraseItem.phrasalVerbType,
              pronounMustSplit: phraseItem.pronounMustSplit,
              example1: phraseItem.example1,
              example1Es: phraseItem.example1Es,
              example2: phraseItem.example2,
              example2Es: phraseItem.example2Es,
              cefrLevel: phraseItem.cefrLevel,
              createdAt: phraseItem.createdAt,
            },
            vocab: {
              id: phraseItem.id,
              word: phraseItem.text,
              grammaticalDimension: 'CHUNK',
              partOfSpeech: phraseItem.chunkType === 'PHRASAL_VERB' ? 'VERB' : 'NOUN',
              subcategory: phraseItem.chunkType === 'PHRASAL_VERB' ? 'PHRASAL_VERB' : undefined,
              definitionEn: phraseItem.definitionEn || '',
              translationEs: phraseItem.meaningEs,
              ipaGeneralAmerican: phraseItem.ipaGeneralAmerican || '',
              ipaReceivedPronunciation: phraseItem.ipaReceivedPronunciation || null,
              cefrLevel: phraseItem.cefrLevel,
              isSeparable: phraseItem.pronounMustSplit,
              isFalseFriend: false,
              isCore: true,
              masteryStatus: 'LEARNING',
              domainCategory: phraseItem.chunkType === 'PHRASAL_VERB' ? 'Phrasal Verb' : 'Expresión',
              sensesJson: [currentSense],
              createdAt: phraseItem.createdAt,
            },
            currentSense,
            currentSenseIndex: 0,
            allContexts: contexts,
            currentContext: contexts[0],
          });
        } else {
          // Fallback: Check vocab_items for phrases/chunks
          const vocabRow = vocabMap.get(card.targetId);
          const contexts = contextsByVocabId.get(card.targetId) ?? [];

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
                  frequencyBand: (vocabRow.frequency_band as any) ?? 'TOP_3000',
                  isCore: Boolean(vocabRow.is_core),
                  masteryStatus: (vocabRow.mastery_status as any) ?? 'INACTIVE',
                  phoneticEdEnding: (vocabRow.phonetic_ed_ending as any) ?? null,
                  isFalseFriend: Boolean(vocabRow.is_false_friend),
                  falseFriendNote: vocabRow.false_friend_note,
                  verbTensesJson: this.parseJsonSafe<VerbTenses | null>(
                    vocabRow.verb_tenses_json,
                    null,
                  ),
                  domainCategory: vocabRow.domain_category ?? null,
                  alternateSensesJson: this.parseJsonSafe<VocabSense[] | null>(
                    vocabRow.alternate_senses_json,
                    null,
                  ),
                  createdAt: vocabRow.created_at,
                }
              : undefined,
            allContexts: contexts,
            currentContext: contexts[0],
          });
        }
      } else {
        // Fallback for any other custom target type
        results.push({
          card,
          allContexts: [],
        });
      }
    }

    return results;
  }

  async getCardsWithDetails(userId: string, limit = 50, srsProfile?: SrsProfile): Promise<CardWithTarget[]> {
    const cards = await this.getDueCards(userId, limit, srsProfile);
    return this.populateCardDetails(cards);
  }

  async getDueCardsWithDetails(userId: string, limit = 50, srsProfile?: SrsProfile): Promise<CardWithTarget[]> {
    const now = new Date().toISOString();
    let query = this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('state', '!=', 'NEW')
      .where('scheduled_for', '<=', now);

    if (srsProfile) {
      query = query.where('srs_profile', '=', srsProfile);
    }

    const rows = await query
      .orderBy('scheduled_for', 'asc')
      .limit(limit)
      .execute();

    const cards = rows.map((r) => this.toDomain(r));
    return this.populateCardDetails(cards);
  }

  async getNewCardsWithDetails(userId: string, limit = 50, srsProfile?: SrsProfile): Promise<CardWithTarget[]> {
    const now = new Date().toISOString();
    let query = this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('state', '=', 'NEW')
      .where('scheduled_for', '<=', now);

    if (srsProfile) {
      query = query.where('srs_profile', '=', srsProfile);
    }

    const rows = await query
      .orderBy('created_at', 'asc')
      .limit(limit)
      .execute();

    const cards = rows.map((r) => this.toDomain(r));
    return this.populateCardDetails(cards);
  }

  async getAllCardsWithDetails(userId: string, limit = 200, srsProfile?: SrsProfile): Promise<CardWithTarget[]> {
    let query = this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId);

    if (srsProfile) {
      query = query.where('srs_profile', '=', srsProfile);
    }

    const rows = await query
      .orderBy('scheduled_for', 'asc')
      .limit(limit)
      .execute();

    const cards = rows.map((r) => this.toDomain(r));
    return this.populateCardDetails(cards);
  }

  async getDeckStatistics(userId: string, srsProfile?: SrsProfile): Promise<DeckStatistics> {
    const now = new Date().toISOString();
    let query = this.db
      .selectFrom('srs_cards')
      .select([
        sql<number>`count(*)`.as('totalCount'),
        sql<number>`coalesce(sum(case when is_leech = 1 then 1 else 0 end), 0)`.as('leechCount'),
        sql<number>`coalesce(sum(case when state = 'NEW' then 1 else 0 end), 0)`.as('newCount'),
        sql<number>`coalesce(sum(case when state != 'NEW' and scheduled_for <= ${now} then 1 else 0 end), 0)`.as('dueCount'),
        sql<number>`coalesce(sum(case when state in ('LEARNING', 'RELEARNING') then 1 else 0 end), 0)`.as('learningCount'),
        sql<number>`coalesce(sum(case when state = 'REVIEW' then 1 else 0 end), 0)`.as('reviewCount'),
      ])
      .where('user_id', '=', userId);

    if (srsProfile) {
      query = query.where('srs_profile', '=', srsProfile);
    }

    const row = await query.executeTakeFirst();

    return {
      dueCount: Number(row?.dueCount ?? 0),
      newCount: Number(row?.newCount ?? 0),
      learningCount: Number(row?.learningCount ?? 0),
      reviewCount: Number(row?.reviewCount ?? 0),
      totalCount: Number(row?.totalCount ?? 0),
      leechCount: Number(row?.leechCount ?? 0),
    };
  }

  async hasReviewToday(userId: string, todayDateStr: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('review_logs')
      .select('review_logs.id')
      .innerJoin('srs_cards', 'srs_cards.id', 'review_logs.card_id')
      .where('srs_cards.user_id', '=', userId)
      .where('review_logs.reviewed_at', 'like', `${todayDateStr}%`)
      .limit(1)
      .executeTakeFirst();

    return Boolean(row);
  }

  async getNewCardsReviewedTodayCount(
    userId: string,
    startOfDayIso: string,
    endOfDayIso: string,
  ): Promise<number> {
    const row = await this.db
      .selectFrom('review_logs')
      .select(sql<number>`count(distinct review_logs.card_id)`.as('count'))
      .innerJoin('srs_cards', 'srs_cards.id', 'review_logs.card_id')
      .where('srs_cards.user_id', '=', userId)
      .where('review_logs.state_before', '=', 'NEW')
      .where('review_logs.reviewed_at', '>=', startOfDayIso)
      .where('review_logs.reviewed_at', '<=', endOfDayIso)
      .executeTakeFirst();

    return Number(row?.count ?? 0);
  }

  async getDueCardsCount(userId: string, srsProfile?: SrsProfile): Promise<number> {
    const now = new Date().toISOString();
    let query = this.db
      .selectFrom('srs_cards')
      .select(sql<number>`count(*)`.as('count'))
      .where('user_id', '=', userId)
      .where('state', '!=', 'NEW')
      .where('scheduled_for', '<=', now);

    if (srsProfile) {
      query = query.where('srs_profile', '=', srsProfile);
    }

    const row = await query.executeTakeFirst();
    return Number(row?.count ?? 0);
  }

  async getActiveTargetIds(userId: string, targetType: TargetType): Promise<string[]> {
    const rows = await this.db
      .selectFrom('srs_cards')
      .select('target_id')
      .where('user_id', '=', userId)
      .where('target_type', '=', targetType)
      .execute();

    return rows.map((r) => r.target_id);
  }

  async getAllReviewLogs(limit = 1000): Promise<ReviewLog[]> {
    const rows = await this.db
      .selectFrom('review_logs')
      .selectAll()
      .orderBy('reviewed_at', 'desc')
      .limit(limit)
      .execute();

    return rows.map((r) => ({
      id: r.id,
      cardId: r.card_id,
      rating: r.rating as FsrsGrade,
      stateBefore: r.state_before as CardState,
      stabilityBefore: r.stability_before,
      difficultyBefore: r.difficulty_before,
      newStability: r.new_stability,
      newDifficulty: r.new_difficulty,
      elapsedMs: r.elapsed_ms,
      reviewedAt: r.reviewed_at,
    }));
  }

  async getWeakVocabularyForWriting(
    userId: string,
    contextDomain?: string | null,
    limit = 12,
  ): Promise<CardWithTarget[]> {
    const rows = await this.db
      .selectFrom('srs_cards')
      .selectAll()
      .where('user_id', '=', userId)
      .where('target_type', 'in', ['VOCAB', 'PHRASE'])
      .where((eb) =>
        eb.or([
          eb('state', 'in', ['NEW', 'LEARNING', 'RELEARNING']),
          eb('stability', '<', 3.0),
          eb('lapses', '>', 0),
        ]),
      )
      .orderBy('stability', 'asc')
      .orderBy('lapses', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit * 2)
      .execute();

    const domainCards = rows.map((r) => this.toDomain(r));
    const populated = await this.populateCardDetails(domainCards);

    const valid = populated.filter((item) => item.vocab && item.vocab.word.trim().length > 0);

    if (contextDomain) {
      const cleanDomain = contextDomain.toLowerCase();
      valid.sort((a, b) => {
        const aMatches = a.vocab?.domainCategory?.toLowerCase().includes(cleanDomain) ? 1 : 0;
        const bMatches = b.vocab?.domainCategory?.toLowerCase().includes(cleanDomain) ? 1 : 0;
        return bMatches - aMatches;
      });
    }

    return valid.slice(0, limit);
  }
}
