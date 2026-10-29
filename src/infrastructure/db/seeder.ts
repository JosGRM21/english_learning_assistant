import { Kysely, sql } from 'kysely';
import { DatabaseSchema } from '@/core/types/database';
import { RawCoreCorpusItem, RawCorePhrasalUnit } from '@/data/core-vocab-corpus';

/**
 * Seeds the master vocabulary corpus and phrasal units into SQLite.
 * This runs automatically on application startup if the SQLite database
 * does not have core vocabulary populated yet.
 * 
 * Guarantees:
 * - Single Source of Truth (SSOT): All lexical units (2,809 words + 586 phrasal verbs = 3,395 items)
 *   are stored in `vocab_items` with their senses and graduated examples.
 * - Idempotent: checks for existing core words, phrases, and context examples before inserting.
 * - Lazy loaded: does NOT bundle the 11MB JSON in the initial entry bundle.
 * - Chunked / batch insertion for optimal SQLite transaction speed.
 * - Seeds vocabulary items, context examples (basic/advanced), and phraseological units.
 */
export async function seedCoreCorpus(db: Kysely<DatabaseSchema>): Promise<{ seededWords: number; seededPhrases: number }> {
  // 0. Quick check: if database already has core vocabulary populated (3,395 total items), skip loading JSON entirely
  const existingCountRow = await db
    .selectFrom('vocab_items')
    .select(sql<number>`count(*)`.as('count'))
    .where('is_core', '=', 1)
    .executeTakeFirst();

  const count = Number(existingCountRow?.count ?? 0);

  const nullSensesRow = await db
    .selectFrom('vocab_items')
    .select(sql<number>`count(*)`.as('count'))
    .where('is_core', '=', 1)
    .where('senses_json', 'is', null)
    .executeTakeFirst();
  const nullSensesCount = Number(nullSensesRow?.count ?? 0);

  // Check if any existing phrasal unit has duplicate sentences in senses_json
  let needsPhraseHealing = false;
  if (count > 0) {
    const samplePhrase = await db
      .selectFrom('vocab_items')
      .select(['id', 'senses_json'])
      .where('id', '=', 'phr_core_00586')
      .executeTakeFirst();

    if (samplePhrase?.senses_json) {
      try {
        const parsed = JSON.parse(samplePhrase.senses_json);
        const grad = parsed?.[0]?.graduatedExamples;
        if (grad && grad.sentenceBasicEn && grad.sentenceBasicEn === grad.sentenceAdvancedEn) {
          needsPhraseHealing = true;
        }
      } catch {
        needsPhraseHealing = true;
      }
    }
  }

  if (count >= 3390 && nullSensesCount === 0 && !needsPhraseHealing) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  // 1. Dynamic import only when seeding is actually required
  const [coreCorpusModule, corePhrasalModule] = await Promise.all([
    import('@/data/core-vocab-corpus.json'),
    import('@/data/core-phrasal-units.json'),
  ]);

  const rawWords = (coreCorpusModule.default || coreCorpusModule) as unknown as RawCoreCorpusItem[];
  const rawPhrases = (corePhrasalModule.default || corePhrasalModule) as unknown as RawCorePhrasalUnit[];

  if (!rawWords || rawWords.length === 0) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  // 2. Fetch existing core word IDs, phrase IDs, and context IDs for non-destructive incremental seeding
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

  const existingContextRows = await db
    .selectFrom('vocab_context_examples')
    .select(['id', 'vocab_id', 'phrase_id'])
    .execute();
  const existingContextMap = new Map(existingContextRows.map((r) => [r.id, r]));

  // 3. Identify missing items to insert incrementally
  const wordsToInsert = rawWords.filter((w) => !existingCoreIds.has(w.id));
  const phrasesToInsertIntoVocab = (rawPhrases || []).filter((p) => !existingCoreIds.has(p.id));
  const phrasesToInsertIntoPhrasalTable = (rawPhrases || []).filter((p) => !existingPhraseIds.has(p.id));

  if (
    wordsToInsert.length === 0 &&
    phrasesToInsertIntoVocab.length === 0 &&
    phrasesToInsertIntoPhrasalTable.length === 0 &&
    nullSensesCount === 0 &&
    !needsPhraseHealing
  ) {
    return { seededWords: 0, seededPhrases: 0 };
  }

  const now = new Date().toISOString();
  const CHUNK_SIZE = 150;

  // 4. Insert or update items atomically within a single transaction
  await db.transaction().execute(async (trx) => {
    // 4.0 Backfill senses_json and phrasal_verbs_json for existing core rows if missing
    if (nullSensesCount > 0) {
      const rowsNeedingSenses = await trx
        .selectFrom('vocab_items')
        .select('id')
        .where('is_core', '=', 1)
        .where('senses_json', 'is', null)
        .execute();

      if (rowsNeedingSenses.length > 0) {
        const rawWordsMap = new Map(rawWords.map((w) => [w.id, w]));
        for (let i = 0; i < rowsNeedingSenses.length; i += CHUNK_SIZE) {
          const chunk = rowsNeedingSenses.slice(i, i + CHUNK_SIZE);
          for (const row of chunk) {
            const item = rawWordsMap.get(row.id);
            if (item) {
              await trx
                .updateTable('vocab_items')
                .set({
                  senses_json: (item as any).sensesJson ? JSON.stringify((item as any).sensesJson) : null,
                  phrasal_verbs_json: (item as any).phrasalVerbsJson ? JSON.stringify((item as any).phrasalVerbsJson) : null,
                })
                .where('id', '=', row.id)
                .execute();
            }
          }
        }
      }
    }

    // 4.0.1 Healing migration: repair existing CHUNK items in vocab_items and phraseological_units if needed
    if (needsPhraseHealing) {
      const rawPhrasesMap = new Map((rawPhrases || []).map((p) => [p.id, p]));
      const existingChunkRows = await trx
        .selectFrom('vocab_items')
        .select(['id', 'senses_json'])
        .where('is_core', '=', 1)
        .where('grammatical_dimension', '=', 'CHUNK')
        .execute();

      for (const row of existingChunkRows) {
        const phrase = rawPhrasesMap.get(row.id);
        if (!phrase) continue;

        let shouldUpdate = false;
        try {
          const parsed = row.senses_json ? JSON.parse(row.senses_json) : null;
          const s0 = parsed?.[0]?.graduatedExamples;
          if (
            s0 &&
            (s0.sentenceBasicEn === s0.sentenceAdvancedEn ||
              (!s0.sentenceAdvancedEn && phrase.example2))
          ) {
            shouldUpdate = true;
          }
        } catch {
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          const hasDistinctAdv = Boolean(
            phrase.example2 &&
              phrase.example2.trim().toLowerCase() !== phrase.example1.trim().toLowerCase(),
          );

          const phraseSense = {
            senseId: 'sense_1',
            translationEs: phrase.meaningEs.trim(),
            definitionEn: phrase.definitionEn ? phrase.definitionEn.trim() : '',
            partOfSpeech: phrase.chunkType === 'PHRASAL_VERB' ? 'VERB' : 'NOUN',
            cefrLevel: phrase.cefrLevel,
            domainCategory: 'Phrasal Verb',
            exampleSentenceEn: phrase.example1.trim(),
            exampleSentenceEs: phrase.example1Es ? phrase.example1Es.trim() : phrase.meaningEs.trim(),
            graduatedExamples: {
              sentenceBasicEn: phrase.example1.trim(),
              sentenceBasicEs: phrase.example1Es ? phrase.example1Es.trim() : phrase.meaningEs.trim(),
              clozeTargetBasic: phrase.text.trim(),
              sentenceAdvancedEn: hasDistinctAdv ? phrase.example2!.trim() : null,
              sentenceAdvancedEs: hasDistinctAdv && phrase.example2Es ? phrase.example2Es.trim() : null,
              clozeTargetAdvanced: hasDistinctAdv ? phrase.text.trim() : null,
            },
          };

          await trx
            .updateTable('vocab_items')
            .set({ senses_json: JSON.stringify([phraseSense]) })
            .where('id', '=', row.id)
            .execute();
        }
      }

      // Also ensure phraseological_units has example_2 updated if it was null
      for (const phrase of rawPhrases || []) {
        if (phrase.example2) {
          await trx
            .updateTable('phraseological_units')
            .set({
              example_2: phrase.example2.trim(),
              example_2_es: phrase.example2Es ? phrase.example2Es.trim() : null,
            })
            .where('id', '=', phrase.id)
            .where('example_2', 'is', null)
            .execute();
        }
      }
    }

    // 4.1 Insert core single-word items into `vocab_items`
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
        is_separable: item.isSeparable === null || item.isSeparable === undefined ? null : (item.isSeparable ? 1 : 0),
        phonetic_ed_ending: item.phoneticEdEnding ?? null,
        is_false_friend: item.isFalseFriend ? 1 : 0,
        false_friend_note: item.falseFriendNote?.trim() || null,
        verb_tenses_json: item.verbTensesJson ? JSON.stringify(item.verbTensesJson) : null,
        domain_category: item.domainCategory ?? 'Uso General',
        alternate_senses_json: item.alternateSensesJson ? JSON.stringify(item.alternateSensesJson) : null,
        senses_json: (item as any).sensesJson ? JSON.stringify((item as any).sensesJson) : null,
        phrasal_verbs_json: (item as any).phrasalVerbsJson ? JSON.stringify((item as any).phrasalVerbsJson) : null,
        created_at: now,
      }));

      await trx.insertInto('vocab_items').values(vocabRows).execute();

      // Context examples for words in this chunk (only if not already existing)
      const contextRows: Array<{
        id: string;
        vocab_id: string;
        phrase_id: string | null;
        sense_index: number;
        sentence_en: string;
        sentence_es: string;
        cloze_target: string;
        audio_url: string | null;
        cefr_level: string;
        created_at: string;
      }> = [];

      for (const item of chunk) {
        if (item.graduatedExamples) {
          const basicId = `ctx_${item.id}_basic`;
          if (item.graduatedExamples.sentenceBasicEn && !existingContextMap.has(basicId)) {
            contextRows.push({
              id: basicId,
              vocab_id: item.id,
              phrase_id: null,
              sense_index: 0,
              sentence_en: item.graduatedExamples.sentenceBasicEn,
              sentence_es: item.graduatedExamples.sentenceBasicEs || '',
              cloze_target: item.graduatedExamples.clozeTargetBasic || item.word,
              audio_url: null,
              cefr_level: item.cefrLevel,
              created_at: now,
            });
            existingContextMap.set(basicId, { id: basicId, vocab_id: item.id, phrase_id: null });
          }

          const advId = `ctx_${item.id}_adv`;
          if (item.graduatedExamples.sentenceAdvancedEn && !existingContextMap.has(advId)) {
            contextRows.push({
              id: advId,
              vocab_id: item.id,
              phrase_id: null,
              sense_index: 0,
              sentence_en: item.graduatedExamples.sentenceAdvancedEn,
              sentence_es: item.graduatedExamples.sentenceAdvancedEs || '',
              cloze_target: item.graduatedExamples.clozeTargetAdvanced || item.word,
              audio_url: null,
              cefr_level: item.cefrLevel === 'A1' ? 'A2' : item.cefrLevel === 'A2' ? 'B1' : 'B2',
              created_at: now,
            });
            existingContextMap.set(advId, { id: advId, vocab_id: item.id, phrase_id: null });
          }
        }

        // Context examples for alternate polysemous senses
        if (item.alternateSensesJson && Array.isArray(item.alternateSensesJson)) {
          item.alternateSensesJson.forEach((altSense: any, idx: number) => {
            const senseIndex = idx + 1;
            const graduated = altSense.graduatedExamples;
            if (graduated) {
              const altBasicId = `ctx_${item.id}_s${senseIndex}_basic`;
              if (graduated.sentenceBasicEn && !existingContextMap.has(altBasicId)) {
                contextRows.push({
                  id: altBasicId,
                  vocab_id: item.id,
                  phrase_id: null,
                  sense_index: senseIndex,
                  sentence_en: graduated.sentenceBasicEn,
                  sentence_es: graduated.sentenceBasicEs || '',
                  cloze_target: graduated.clozeTargetBasic || item.word,
                  audio_url: null,
                  cefr_level: altSense.cefrLevel || item.cefrLevel,
                  created_at: now,
                });
                existingContextMap.set(altBasicId, { id: altBasicId, vocab_id: item.id, phrase_id: null });
              }

              const altAdvId = `ctx_${item.id}_s${senseIndex}_adv`;
              if (graduated.sentenceAdvancedEn && !existingContextMap.has(altAdvId)) {
                contextRows.push({
                  id: altAdvId,
                  vocab_id: item.id,
                  phrase_id: null,
                  sense_index: senseIndex,
                  sentence_en: graduated.sentenceAdvancedEn,
                  sentence_es: graduated.sentenceAdvancedEs || '',
                  cloze_target: graduated.clozeTargetAdvanced || item.word,
                  audio_url: null,
                  cefr_level: altSense.cefrLevel === 'A1' ? 'A2' : altSense.cefrLevel === 'A2' ? 'B1' : 'B2',
                  created_at: now,
                });
                existingContextMap.set(altAdvId, { id: altAdvId, vocab_id: item.id, phrase_id: null });
              }
            }
          });
        }
      }

      if (contextRows.length > 0) {
        await trx.insertInto('vocab_context_examples').values(contextRows).execute();
      }
    }

    // 4.2 Insert phrasal units into `vocab_items` (as CHUNK items for the Vocabulary Bank)
    if (phrasesToInsertIntoVocab.length > 0) {
      for (let i = 0; i < phrasesToInsertIntoVocab.length; i += CHUNK_SIZE) {
        const chunk = phrasesToInsertIntoVocab.slice(i, i + CHUNK_SIZE);
        const vocabChunkRows = chunk.map((phrase) => {
          const hasDistinctAdv = Boolean(
            phrase.example2 &&
              phrase.example2.trim().toLowerCase() !== phrase.example1.trim().toLowerCase(),
          );

          const phraseSense = {
            senseId: 'sense_1',
            translationEs: phrase.meaningEs.trim(),
            definitionEn: phrase.definitionEn ? phrase.definitionEn.trim() : '',
            partOfSpeech: phrase.chunkType === 'PHRASAL_VERB' ? 'VERB' : 'NOUN',
            cefrLevel: phrase.cefrLevel,
            domainCategory: 'Phrasal Verb',
            exampleSentenceEn: phrase.example1.trim(),
            exampleSentenceEs: phrase.example1Es ? phrase.example1Es.trim() : phrase.meaningEs.trim(),
            graduatedExamples: {
              sentenceBasicEn: phrase.example1.trim(),
              sentenceBasicEs: phrase.example1Es ? phrase.example1Es.trim() : phrase.meaningEs.trim(),
              clozeTargetBasic: phrase.text.trim(),
              sentenceAdvancedEn: hasDistinctAdv ? phrase.example2!.trim() : null,
              sentenceAdvancedEs: hasDistinctAdv && phrase.example2Es ? phrase.example2Es.trim() : null,
              clozeTargetAdvanced: hasDistinctAdv ? phrase.text.trim() : null,
            },
          };

          return {
            id: phrase.id,
            word: phrase.text.trim(),
            grammatical_dimension: 'CHUNK' as const,
            part_of_speech: phrase.chunkType === 'PHRASAL_VERB' ? 'VERB' : 'NOUN',
            subcategory: phrase.chunkType === 'PHRASAL_VERB' ? 'PHRASAL_VERB' : null,
            definition_en: phrase.definitionEn ? phrase.definitionEn.trim() : '',
            translation_es: phrase.meaningEs.trim(),
            ipa_general_american: phrase.ipaGeneralAmerican?.trim() || '',
            ipa_received_pronunciation: phrase.ipaReceivedPronunciation?.trim() || null,
            ipa_weak_form: null,
            cefr_level: phrase.cefrLevel,
            frequency_band: 'TOP_3000',
            is_core: 1,
            mastery_status: 'INACTIVE' as const,
            is_separable: phrase.pronounMustSplit ? 1 : 0,
            phonetic_ed_ending: null,
            is_false_friend: 0,
            false_friend_note: null,
            verb_tenses_json: null,
            domain_category: 'Phrasal Verb',
            alternate_senses_json: null,
            senses_json: JSON.stringify([phraseSense]),
            phrasal_verbs_json: null,
            created_at: now,
          };
        });

        await trx.insertInto('vocab_items').values(vocabChunkRows).execute();
      }
    }

    // 4.3 Insert into `phraseological_units` table (for phrase-level SRS reviews)
    if (phrasesToInsertIntoPhrasalTable.length > 0) {
      for (let i = 0; i < phrasesToInsertIntoPhrasalTable.length; i += CHUNK_SIZE) {
        const chunk = phrasesToInsertIntoPhrasalTable.slice(i, i + CHUNK_SIZE);
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
          mastery_status: 'INACTIVE' as const,
          created_at: now,
        }));

        await trx.insertInto('phraseological_units').values(phraseRows).execute();
      }
    }

    // 4.4 Insert or update context examples for phrasal units
    // (Both vocab_items and phraseological_units now exist, ensuring foreign keys pass cleanly)
    const allPhrasesToCheck = rawPhrases || [];
    for (let i = 0; i < allPhrasesToCheck.length; i += CHUNK_SIZE) {
      const chunk = allPhrasesToCheck.slice(i, i + CHUNK_SIZE);
      const phraseContextRowsToInsert = [];

      for (const phrase of chunk) {
        // Example 1
        if (phrase.example1) {
          const ex1Id = `ctx_${phrase.id}_1`;
          const existingEx1 = existingContextMap.get(ex1Id);
          if (existingEx1) {
            // If already present but vocab_id is null, update it safely
            if (!existingEx1.vocab_id) {
              await trx
                .updateTable('vocab_context_examples')
                .set({ vocab_id: phrase.id })
                .where('id', '=', ex1Id)
                .execute();
            }
          } else {
            phraseContextRowsToInsert.push({
              id: ex1Id,
              vocab_id: phrase.id,
              phrase_id: phrase.id,
              sense_index: 0,
              sentence_en: phrase.example1.trim(),
              sentence_es: phrase.example1Es ? phrase.example1Es.trim() : phrase.meaningEs.trim(),
              cloze_target: phrase.text.trim(),
              audio_url: null,
              cefr_level: phrase.cefrLevel,
              created_at: now,
            });
            existingContextMap.set(ex1Id, { id: ex1Id, vocab_id: phrase.id, phrase_id: phrase.id });
          }
        }

        // Example 2
        if (phrase.example2) {
          const ex2Id = `ctx_${phrase.id}_2`;
          const existingEx2 = existingContextMap.get(ex2Id);
          if (existingEx2) {
            // If already present but vocab_id is null, update it safely
            if (!existingEx2.vocab_id) {
              await trx
                .updateTable('vocab_context_examples')
                .set({ vocab_id: phrase.id })
                .where('id', '=', ex2Id)
                .execute();
            }
          } else {
            phraseContextRowsToInsert.push({
              id: ex2Id,
              vocab_id: phrase.id,
              phrase_id: phrase.id,
              sense_index: 0,
              sentence_en: phrase.example2.trim(),
              sentence_es: phrase.example2Es ? phrase.example2Es.trim() : '',
              cloze_target: phrase.text.trim(),
              audio_url: null,
              cefr_level: phrase.cefrLevel,
              created_at: now,
            });
            existingContextMap.set(ex2Id, { id: ex2Id, vocab_id: phrase.id, phrase_id: phrase.id });
          }
        }
      }

      if (phraseContextRowsToInsert.length > 0) {
        await trx.insertInto('vocab_context_examples').values(phraseContextRowsToInsert).execute();
      }
    }
  });

  return {
    seededWords: wordsToInsert.length + phrasesToInsertIntoVocab.length,
    seededPhrases: phrasesToInsertIntoPhrasalTable.length,
  };
}
