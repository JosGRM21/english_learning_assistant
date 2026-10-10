import { Kysely, sql } from 'kysely';
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
  // 1. Check if core vocabulary is already seeded
  const existingCore = await db
    .selectFrom('vocab_items')
    .select(sql<number>`count(*)`.as('count'))
    .where('is_core', '=', 1)
    .executeTakeFirst();

  const coreCount = Number(existingCore?.count ?? 0);
  if (coreCount > 0) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  const rawWords = coreCorpusRaw as unknown as RawCoreCorpusItem[];
  const rawPhrases = corePhrasalRaw as unknown as RawCorePhrasalUnit[];

  if (!rawWords || rawWords.length === 0) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  const now = new Date().toISOString();

  // 2. Insert Core Vocab Items in chunks
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rawWords.length; i += CHUNK_SIZE) {
    const chunk = rawWords.slice(i, i + CHUNK_SIZE);
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
      morphological_family_json: item.morphologicalFamilyJson ? JSON.stringify(item.morphologicalFamilyJson) : JSON.stringify([]),
      verb_tenses_json: item.verbTensesJson ? JSON.stringify(item.verbTensesJson) : null,
      structured_family_json: item.structuredFamilyJson ? JSON.stringify(item.structuredFamilyJson) : null,
      domain_category: item.domainCategory ?? 'Uso General',
      alternate_senses_json: item.alternateSensesJson ? JSON.stringify(item.alternateSensesJson) : null,
      created_at: now,
    }));

    await db.insertInto('vocab_items').values(vocabRows).execute();

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
      await db.insertInto('vocab_context_examples').values(contextRows).execute();
    }
  }

  // 3. Insert Core Phrasal Units in chunks
  if (rawPhrases && rawPhrases.length > 0) {
    for (let i = 0; i < rawPhrases.length; i += CHUNK_SIZE) {
      const chunk = rawPhrases.slice(i, i + CHUNK_SIZE);
      const phraseRows = chunk.map((phrase) => ({
        id: phrase.id,
        primary_vocab_id: phrase.primaryVocabId ?? null,
        chunk_type: phrase.chunkType,
        text: phrase.text.trim(),
        meaning_es: phrase.meaningEs.trim(),
        phrasal_verb_type: phrase.phrasalVerbType ?? null,
        pronoun_must_split: phrase.pronounMustSplit ? 1 : 0,
        example_1: phrase.example1.trim(),
        example_2: phrase.example2 ? phrase.example2.trim() : null,
        cefr_level: phrase.cefrLevel,
        created_at: now,
      }));

      await db.insertInto('phraseological_units').values(phraseRows).execute();
    }
  }

  return {
    seededWords: rawWords.length,
    seededPhrases: rawPhrases ? rawPhrases.length : 0,
  };
}
