import { Kysely } from 'kysely';
import { DatabaseSchema } from '../../core/types/database';
import { CefrLevel, GrammaticalDimension, PartOfSpeech } from '../../core/types/vocab';
import { CardState, FsrsGrade, TargetType } from '../../core/types/srs';

const VALID_CEFR: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_DIMENSIONS: GrammaticalDimension[] = ['CONTENT', 'FUNCTION', 'CHUNK'];
const VALID_POS: PartOfSpeech[] = [
  'NOUN',
  'VERB',
  'ADJECTIVE',
  'ADVERB',
  'PREPOSITION',
  'CONJUNCTION',
  'ARTICLE_DETERMINER',
  'PRONOUN',
  'INTERJECTION',
];
const VALID_STATES: CardState[] = ['NEW', 'LEARNING', 'REVIEW', 'RELEARNING'];

function normalizeCefr(raw?: unknown): CefrLevel {
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase().trim() as CefrLevel;
    if (VALID_CEFR.includes(upper)) return upper;
  }
  return 'B1';
}

function normalizeDimension(raw?: unknown): GrammaticalDimension {
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase().trim() as GrammaticalDimension;
    if (VALID_DIMENSIONS.includes(upper)) return upper;
  }
  return 'CONTENT';
}

function normalizePos(raw?: unknown): PartOfSpeech {
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase().trim() as PartOfSpeech;
    if (VALID_POS.includes(upper)) return upper;
  }
  return 'NOUN';
}

function normalizeCardState(raw?: unknown): CardState {
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase().trim() as CardState;
    if (VALID_STATES.includes(upper)) return upper;
  }
  return 'NEW';
}

function normalizeTargetType(raw?: unknown): TargetType {
  if (typeof raw === 'string') {
    const upper = raw.toUpperCase().trim();
    if (upper === 'PHRASE') return 'PHRASE';
  }
  return 'VOCAB';
}

export interface RestoreStats {
  restoredCards: number;
  restoredVocabs: number;
  restoredReviews: number;
  restoredContexts: number;
}

export class RestoreService {
  /**
   * Restores user backup data payload into the SQLite database.
   * Handles nested vocab structures, direct records, camelCase/snake_case,
   * context examples, phraseological units, SRS cards, and review logs.
   */
  public static async restoreBackupToDatabase(
    db: Kysely<DatabaseSchema>,
    payload: Record<string, unknown>,
  ): Promise<RestoreStats> {
    const stats: RestoreStats = {
      restoredCards: 0,
      restoredVocabs: 0,
      restoredReviews: 0,
      restoredContexts: 0,
    };

    const cards = Array.isArray(payload.cards) ? payload.cards : [];
    const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];

    // Map to keep track of vocab IDs to guarantee relational references
    const cardIdSet = new Set<string>();

    for (const cardItem of cards) {
      if (typeof cardItem !== 'object' || cardItem === null) continue;
      const c = cardItem as Record<string, unknown>;

      // Check if vocab is nested or inline
      const vocabRaw = (typeof c.vocab === 'object' && c.vocab !== null
        ? c.vocab
        : typeof c.word === 'string'
          ? c
          : null) as Record<string, unknown> | null;

      let vocabId: string | null = null;

      if (vocabRaw && typeof vocabRaw.word === 'string' && vocabRaw.word.trim()) {
        const wordClean = vocabRaw.word.trim();
        const candidateId =
          (vocabRaw.id as string) ||
          (c.targetId as string) ||
          (c.target_id as string) ||
          `voc_restored_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const grammaticalDimension = normalizeDimension(
          vocabRaw.grammaticalDimension ?? vocabRaw.grammatical_dimension,
        );
        const partOfSpeech = normalizePos(vocabRaw.partOfSpeech ?? vocabRaw.part_of_speech);
        const cefrLevel = normalizeCefr(vocabRaw.cefrLevel ?? vocabRaw.cefr_level);
        const definitionEn =
          (vocabRaw.definitionEn as string) ||
          (vocabRaw.definition_en as string) ||
          (vocabRaw.definition as string) ||
          (c.definitionEn as string) ||
          (c.definition as string) ||
          wordClean;
        const translationEs =
          (vocabRaw.translationEs as string) ||
          (vocabRaw.translation_es as string) ||
          (vocabRaw.translation as string) ||
          (c.translationEs as string) ||
          (c.translation as string) ||
          'Sin traducción';
        const ipaGeneralAmerican =
          (vocabRaw.ipaGeneralAmerican as string) ||
          (vocabRaw.ipa_general_american as string) ||
          (vocabRaw.ipa as string) ||
          (c.ipaGeneralAmerican as string) ||
          (c.ipa as string) ||
          '';
        const ipaReceivedPronunciation =
          (vocabRaw.ipaReceivedPronunciation as string) ||
          (vocabRaw.ipa_received_pronunciation as string) ||
          null;
        const subcategory =
          (vocabRaw.subcategory as string) || (c.subcategory as string) || null;
        const isFalseFriend = Boolean(
          vocabRaw.isFalseFriend ?? vocabRaw.is_false_friend ?? c.isFalseFriend ?? false,
        )
          ? 1
          : 0;
        const falseFriendNote =
          (vocabRaw.falseFriendNote as string) ||
          (vocabRaw.false_friend_note as string) ||
          null;

        let morphJson = '[]';
        const rawMorph = vocabRaw.morphologicalFamilyJson ?? vocabRaw.morphological_family_json;
        if (Array.isArray(rawMorph)) {
          morphJson = JSON.stringify(rawMorph);
        } else if (typeof rawMorph === 'string' && rawMorph.trim()) {
          morphJson = rawMorph.trim();
        }

        const createdAt =
          (vocabRaw.createdAt as string) ||
          (vocabRaw.created_at as string) ||
          (c.createdAt as string) ||
          new Date().toISOString();

        // Check if vocab item already exists by ID or by Word
        const existingById = await db
          .selectFrom('vocab_items')
          .selectAll()
          .where('id', '=', candidateId)
          .executeTakeFirst();

        const existingByWord = !existingById
          ? await db
              .selectFrom('vocab_items')
              .selectAll()
              .where('word', '=', wordClean)
              .executeTakeFirst()
          : null;

        const targetVocabId = existingById ? existingById.id : existingByWord ? existingByWord.id : candidateId;

        const vocabValues = {
          word: wordClean,
          grammatical_dimension: grammaticalDimension,
          part_of_speech: partOfSpeech,
          subcategory,
          definition_en: definitionEn,
          translation_es: translationEs,
          ipa_general_american: ipaGeneralAmerican,
          ipa_received_pronunciation: ipaReceivedPronunciation,
          cefr_level: cefrLevel,
          is_false_friend: isFalseFriend,
          false_friend_note: falseFriendNote,
          morphological_family_json: morphJson,
        };

        if (existingById || existingByWord) {
          await db
            .updateTable('vocab_items')
            .set(vocabValues)
            .where('id', '=', targetVocabId)
            .execute();
        } else {
          await db
            .insertInto('vocab_items')
            .values({
              id: targetVocabId,
              ...vocabValues,
              created_at: createdAt,
            })
            .execute();
        }

        vocabId = targetVocabId;
        stats.restoredVocabs++;

        // Restore context examples if present in card or vocab
        const contextsRaw =
          Array.isArray(c.contexts) ? c.contexts :
          Array.isArray(c.allContexts) ? c.allContexts :
          Array.isArray(vocabRaw.contexts) ? vocabRaw.contexts :
          [];

        for (const ctxItem of contextsRaw) {
          if (typeof ctxItem !== 'object' || ctxItem === null) continue;
          const ctx = ctxItem as Record<string, unknown>;
          const sentenceEn = (ctx.sentenceEn as string) || (ctx.sentence_en as string) || '';
          if (!sentenceEn.trim()) continue;

          const ctxId =
            (ctx.id as string) ||
            `ctx_restored_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const sentenceEs = (ctx.sentenceEs as string) || (ctx.sentence_es as string) || '';
          const clozeTarget =
            (ctx.clozeTarget as string) || (ctx.cloze_target as string) || wordClean;
          const ctxCefr = normalizeCefr(ctx.cefrLevel ?? ctx.cefr_level ?? cefrLevel);
          const ctxAudioUrl = (ctx.audioUrl as string) || (ctx.audio_url as string) || null;
          const ctxCreatedAt = (ctx.createdAt as string) || (ctx.created_at as string) || new Date().toISOString();

          const existingCtx = await db
            .selectFrom('vocab_context_examples')
            .select('id')
            .where('id', '=', ctxId)
            .executeTakeFirst();

          const ctxValues = {
            vocab_id: vocabId,
            sentence_en: sentenceEn.trim(),
            sentence_es: sentenceEs.trim(),
            cloze_target: clozeTarget.trim(),
            audio_url: ctxAudioUrl,
            cefr_level: ctxCefr,
          };

          if (existingCtx) {
            await db
              .updateTable('vocab_context_examples')
              .set(ctxValues)
              .where('id', '=', ctxId)
              .execute();
          } else {
            await db
              .insertInto('vocab_context_examples')
              .values({
                id: ctxId,
                ...ctxValues,
                phrase_id: null,
                created_at: ctxCreatedAt,
              })
              .execute();
          }
          stats.restoredContexts++;
        }
      }

      // Check phraseological units if present
      let phraseId: string | null = null;
      const phraseRaw = (typeof c.phrase === 'object' && c.phrase !== null ? c.phrase : null) as Record<string, unknown> | null;
      if (phraseRaw && typeof phraseRaw.text === 'string' && phraseRaw.text.trim()) {
        const textClean = phraseRaw.text.trim();
        const pId =
          (phraseRaw.id as string) ||
          `phr_restored_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const meaningEs =
          (phraseRaw.meaningEs as string) || (phraseRaw.meaning_es as string) || textClean;
        const pCefr = normalizeCefr(phraseRaw.cefrLevel ?? phraseRaw.cefr_level);
        const chunkType = (phraseRaw.chunkType as string) || (phraseRaw.chunk_type as string) || 'COLLOCATION';
        const example1 = (phraseRaw.example1 as string) || (phraseRaw.example_1 as string) || textClean;
        const example2 = (phraseRaw.example2 as string) || (phraseRaw.example_2 as string) || null;

        const existingPhrase = await db
          .selectFrom('phraseological_units')
          .select('id')
          .where('id', '=', pId)
          .executeTakeFirst();

        const phraseValues = {
          primary_vocab_id: vocabId,
          chunk_type: chunkType,
          text: textClean,
          meaning_es: meaningEs,
          phrasal_verb_type: null,
          pronoun_must_split: 0,
          example_1: example1,
          example_2: example2,
          cefr_level: pCefr,
        };

        if (existingPhrase) {
          await db
            .updateTable('phraseological_units')
            .set(phraseValues)
            .where('id', '=', pId)
            .execute();
        } else {
          await db
            .insertInto('phraseological_units')
            .values({
              id: pId,
              ...phraseValues,
              created_at: new Date().toISOString(),
            })
            .execute();
        }
        phraseId = pId;
      }

      // Now restore or create the SRS card
      const targetType = normalizeTargetType(c.targetType ?? c.target_type ?? (phraseId ? 'PHRASE' : 'VOCAB'));
      const targetId = (targetType === 'PHRASE' ? phraseId : vocabId) || (c.targetId as string) || (c.target_id as string);

      if (targetId) {
        const cardId =
          (c.id as string) ||
          `card_${targetId}`;
        const userId = (c.userId as string) || (c.user_id as string) || 'user_local';
        const state = normalizeCardState(c.state);
        const stability = typeof c.stability === 'number' ? c.stability : 0;
        const difficulty = typeof c.difficulty === 'number' ? c.difficulty : 5.0;
        const reps = typeof c.reps === 'number' ? c.reps : 0;
        const lapses = typeof c.lapses === 'number' ? c.lapses : 0;
        const scheduledFor =
          (c.scheduledFor as string) ||
          (c.scheduled_for as string) ||
          new Date().toISOString();
        const lastReviewedAt =
          (c.lastReviewedAt as string) ||
          (c.last_reviewed_at as string) ||
          null;
        const createdAt =
          (c.createdAt as string) ||
          (c.created_at as string) ||
          new Date().toISOString();

        // Check uniqueness by ID and unique index (target_type, target_id)
        const existingCard = await db
          .selectFrom('srs_cards')
          .selectAll()
          .where((eb) =>
            eb.or([
              eb('id', '=', cardId),
              eb.and([
                eb('target_type', '=', targetType),
                eb('target_id', '=', targetId),
              ]),
            ]),
          )
          .executeTakeFirst();

        const cardValues = {
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          state,
          stability,
          difficulty,
          reps,
          lapses,
          is_proceduralized: 0,
          consecutive_fast_retrievals: 0,
          last_reaction_time_ms: null,
          last_reviewed_at: lastReviewedAt,
          scheduled_for: scheduledFor,
        };

        if (existingCard) {
          await db
            .updateTable('srs_cards')
            .set(cardValues)
            .where('id', '=', existingCard.id)
            .execute();
          cardIdSet.add(existingCard.id);
        } else {
          await db
            .insertInto('srs_cards')
            .values({
              id: cardId,
              ...cardValues,
              created_at: createdAt,
            })
            .execute();
          cardIdSet.add(cardId);
        }
        stats.restoredCards++;
      }
    }

    // Restore review logs
    for (const logItem of reviews) {
      if (typeof logItem !== 'object' || logItem === null) continue;
      const l = logItem as Record<string, unknown>;
      const cardId = (l.cardId as string) || (l.card_id as string);
      if (!cardId || !cardIdSet.has(cardId)) {
        // Verify if card exists in db directly
        const cardExists = await db
          .selectFrom('srs_cards')
          .select('id')
          .where('id', '=', cardId)
          .executeTakeFirst();
        if (!cardExists) continue;
      }

      const logId = (l.id as string) || `log_restored_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const ratingRaw = Number(l.rating ?? 3);
      const rating = (ratingRaw >= 1 && ratingRaw <= 4 ? ratingRaw : 3) as FsrsGrade;
      const stateBefore = (l.stateBefore as string) || (l.state_before as string) || 'NEW';
      const stabilityBefore = Number(l.stabilityBefore ?? l.stability_before ?? 0);
      const difficultyBefore = Number(l.difficultyBefore ?? l.difficulty_before ?? 5);
      const newStability = Number(l.newStability ?? l.new_stability ?? 0);
      const newDifficulty = Number(l.newDifficulty ?? l.new_difficulty ?? 5);
      const elapsedMs = Number(l.elapsedMs ?? l.elapsed_ms ?? 0);
      const reviewedAt = (l.reviewedAt as string) || (l.reviewed_at as string) || new Date().toISOString();

      const existingLog = await db
        .selectFrom('review_logs')
        .select('id')
        .where('id', '=', logId)
        .executeTakeFirst();

      const logValues = {
        card_id: cardId,
        rating,
        state_before: stateBefore,
        stability_before: stabilityBefore,
        difficulty_before: difficultyBefore,
        new_stability: newStability,
        new_difficulty: newDifficulty,
        elapsed_ms: elapsedMs,
        reviewed_at: reviewedAt,
      };

      if (existingLog) {
        await db
          .updateTable('review_logs')
          .set(logValues)
          .where('id', '=', logId)
          .execute();
      } else {
        await db
          .insertInto('review_logs')
          .values({
            id: logId,
            ...logValues,
          })
          .execute();
      }
      stats.restoredReviews++;
    }

    return stats;
  }
}
