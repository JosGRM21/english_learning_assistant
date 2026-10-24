import { Kysely } from 'kysely';
import { DatabaseSchema } from '@/core/types/database';
import coreCorpusRaw from '@/data/core-vocab-corpus.json';
import corePhrasalRaw from '@/data/core-phrasal-units.json';
import { RawCoreCorpusItem, RawCorePhrasalUnit } from '@/data/core-vocab-corpus';

/**
 * Seeds the master vocabulary corpus and phrasal units into SQLite.
 * This runs automatically on application startup if the SQLite database
 * does not have core vocabulary populated yet.
 * 
 * Guarantees:
 * - Idempotent: checks for existing core words before inserting.
 * - Chunked / batch insertion for optimal SQLite transaction speed.
 * - Seeds vocabulary items, context examples (basic/advanced), and phraseological units.
 */
export async function seedCoreCorpus(db: Kysely<DatabaseSchema>): Promise<{ seededWords: number; seededPhrases: number }> {
  const rawWords = coreCorpusRaw as unknown as RawCoreCorpusItem[];
  const rawPhrases = corePhrasalRaw as unknown as RawCorePhrasalUnit[];

  if (!rawWords || rawWords.length === 0) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  // 1. Fetch existing core word IDs and phrase IDs for non-destructive incremental seeding
  const existingCoreRows = await db
    .selectFrom('vocab_items')
    .select('id')
    .where('is_core', '=', 1)
    .execute();
  const existingCoreIds = new Set(existingCoreRows.map((r) => r.id));

  const existingPhraseRows = await db
    .selectFrom('phraseological_units')
    .select('id')
    .execute();
  const existingPhraseIds = new Set(existingPhraseRows.map((r) => r.id));

  // 2. Identify missing items to insert incrementally
  const wordsToInsert = rawWords.filter((w) => !existingCoreIds.has(w.id));
  const phrasesToInsert = (rawPhrases || []).filter((p) => !existingPhraseIds.has(p.id));

  if (wordsToInsert.length === 0 && phrasesToInsert.length === 0) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  const now = new Date().toISOString();
  const CHUNK_SIZE = 50;

  // 3. Insert newly discovered items atomically within a single transaction
  await db.transaction().execute(async (trx) => {
    for (let i = 0; i < wordsToInsert.length; i += CHUNK_SIZE) {
      const chunk = wordsToInsert.slice(i, i + CHUNK_SIZE);
      const vocabRows = chunk.map((item) => ({
        id: item.id,
        word: item.word.trim(),
        grammatical_dimension: item.grammaticalDimension,
        part_of_speech: item.partOfSpeech,
        subcategory: item.subcategory ?? null,
        definition_en: item.definitionEn.trim(),
        translation_es: item.translationEs.trim(),
        ipa_general_american: item.ipaGeneralAmerican?.trim() || '',
        ipa_received_pronunciation: item.ipaReceivedPronunciation?.trim() || null,
        ipa_weak_form: item.ipaWeakForm?.trim() || null,
        cefr_level: item.cefrLevel,
        frequency_band: item.frequencyBand ?? 'TOP_3000',
        is_core: 1,
        mastery_status: 'INACTIVE' as const,
        collocations_json: item.collocationsJson ? JSON.stringify(item.collocationsJson) : JSON.stringify([]),
        is_separable: item.isSeparable === null || item.isSeparable === undefined ? null : (item.isSeparable ? 1 : 0),
        phonetic_ed_ending: item.phoneticEdEnding ?? null,
        is_false_friend: item.isFalseFriend ? 1 : 0,
        false_friend_note: item.falseFriendNote?.trim() || null,
        verb_tenses_json: item.verbTensesJson ? JSON.stringify(item.verbTensesJson) : null,
        domain_category: item.domainCategory ?? 'Uso General',
        alternate_senses_json: item.alternateSensesJson ? JSON.stringify(item.alternateSensesJson) : null,
        created_at: now,
      }));

      await trx.insertInto('vocab_items').values(vocabRows).execute();

      // Context examples for this chunk
      const contextRows: Array<{
        id: string;
        vocab_id: string;
        phrase_id: null;
        sentence_en: string;
        sentence_es: string;
        cloze_target: string;
        audio_url: null;
        cefr_level: string;
        created_at: string;
      }> = [];

      for (const item of chunk) {
        if (item.graduatedExamples) {
          if (item.graduatedExamples.sentenceBasicEn) {
            contextRows.push({
              id: `ctx_${item.id}_basic`,
              vocab_id: item.id,
              phrase_id: null,
              sentence_en: item.graduatedExamples.sentenceBasicEn,
              sentence_es: item.graduatedExamples.sentenceBasicEs || '',
              cloze_target: item.graduatedExamples.clozeTargetBasic || item.word,
              audio_url: null,
              cefr_level: item.cefrLevel,
              created_at: now,
            });
          }
          if (item.graduatedExamples.sentenceAdvancedEn) {
            contextRows.push({
              id: `ctx_${item.id}_adv`,
              vocab_id: item.id,
              phrase_id: null,
              sentence_en: item.graduatedExamples.sentenceAdvancedEn,
              sentence_es: item.graduatedExamples.sentenceAdvancedEs || '',
              cloze_target: item.graduatedExamples.clozeTargetAdvanced || item.word,
              audio_url: null,
              cefr_level: item.cefrLevel === 'A1' ? 'A2' : item.cefrLevel === 'A2' ? 'B1' : 'B2',
              created_at: now,
            });
          }
        }
      }

      if (contextRows.length > 0) {
        await trx.insertInto('vocab_context_examples').values(contextRows).execute();
      }
    }

    // 4. Insert Core Phrasal Units in chunks
    if (phrasesToInsert.length > 0) {
      for (let i = 0; i < phrasesToInsert.length; i += CHUNK_SIZE) {
        const chunk = phrasesToInsert.slice(i, i + CHUNK_SIZE);
        const phraseRows = chunk.map((phrase) => ({
          id: phrase.id,
          primary_vocab_id: phrase.primaryVocabId ?? null,
          chunk_type: phrase.chunkType,
          text: phrase.text.trim(),
          meaning_es: phrase.meaningEs.trim(),
          definition_en: phrase.definitionEn ? phrase.definitionEn.trim() : '',
          ipa_general_american: phrase.ipaGeneralAmerican?.trim() || null,
          ipa_received_pronunciation: phrase.ipaReceivedPronunciation?.trim() || null,
          phrasal_verb_type: phrase.phrasalVerbType ?? null,
          pronoun_must_split: phrase.pronounMustSplit ? 1 : 0,
          example_1: phrase.example1.trim(),
          example_1_es: phrase.example1Es ? phrase.example1Es.trim() : '',
          example_2: phrase.example2 ? phrase.example2.trim() : null,
          example_2_es: phrase.example2Es ? phrase.example2Es.trim() : null,
          cefr_level: phrase.cefrLevel,
          created_at: now,
        }));

        await trx.insertInto('phraseological_units').values(phraseRows).execute();
      }
    }
  });

  return {
    seededWords: wordsToInsert.length,
    seededPhrases: phrasesToInsert.length,
  };
}
