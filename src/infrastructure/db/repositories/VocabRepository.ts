import { Kysely, Selectable, sql } from 'kysely';
import { DatabaseSchema, VocabItemsTable, VocabContextExamplesTable } from '../../../core/types/database';
import { IVocabRepository, CoreCorpusCoverage, CreateVocabInput } from '../../../core/repositories/IVocabRepository';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  FrequencyBand,
  GrammaticalDimension,
  PartOfSpeech,
  VerbTenses,
  StructuredWordFamily,
  VocabSense,
  VocabMasteryStatus,
} from '../../../core/types/vocab';
import {
  searchCoreCorpusLocally,
  getCoreCorpusWord,
  toDomainCoreVocab,
  CORE_VOCAB_DATA,
} from '@/data/core-vocab-corpus';

export function mapVocabRowToDomain(row: Selectable<VocabItemsTable>): VocabItem {
  let morphologicalFamily: string[] = [];
  if (row.morphological_family_json) {
    try {
      morphologicalFamily = JSON.parse(row.morphological_family_json);
    } catch {
      morphologicalFamily = [];
    }
  }

  let verbTenses: VerbTenses | null = null;
  if (row.verb_tenses_json) {
    try {
      verbTenses = JSON.parse(row.verb_tenses_json);
    } catch {
      verbTenses = null;
    }
  }

  let structuredFamily: StructuredWordFamily | null = null;
  if (row.structured_family_json) {
    try {
      structuredFamily = JSON.parse(row.structured_family_json);
    } catch {
      structuredFamily = null;
    }
  }

  let alternateSenses: VocabSense[] | null = null;
  if (row.alternate_senses_json) {
    try {
      alternateSenses = JSON.parse(row.alternate_senses_json);
    } catch {
      alternateSenses = null;
    }
  }

  let collocations: string[] = [];
  if (row.collocations_json) {
    try {
      collocations = JSON.parse(row.collocations_json);
    } catch {
      collocations = [];
    }
  }

  let primaryGraduatedExamples: any = null;
  if (row.is_core) {
    const coreWord = getCoreCorpusWord(row.word);
    if (coreWord?.graduatedExamples) {
      primaryGraduatedExamples = coreWord.graduatedExamples;
    }
  }

  const primarySense: VocabSense = {
    translationEs: row.translation_es,
    definitionEn: row.definition_en,
    partOfSpeech: row.part_of_speech as PartOfSpeech,
    cefrLevel: row.cefr_level as CefrLevel,
    collocations,
    graduatedExamples: primaryGraduatedExamples,
  };

  const sensesJson: VocabSense[] = [
    primarySense,
    ...(alternateSenses || []),
  ];

  return {
    id: row.id,
    word: row.word,
    grammaticalDimension: row.grammatical_dimension as GrammaticalDimension,
    partOfSpeech: row.part_of_speech as PartOfSpeech,
    subcategory: row.subcategory,
    definitionEn: row.definition_en,
    translationEs: row.translation_es,
    ipaGeneralAmerican: row.ipa_general_american,
    ipaReceivedPronunciation: row.ipa_received_pronunciation,
    ipaWeakForm: row.ipa_weak_form || null,
    cefrLevel: row.cefr_level as CefrLevel,
    frequencyBand: (row.frequency_band as FrequencyBand) ?? 'TOP_3000',
    masteryStatus: (row.mastery_status as VocabMasteryStatus) ?? 'INACTIVE',
    isCore: Boolean(row.is_core),
    collocationsJson: collocations,
    isSeparable: row.is_separable === null ? null : Boolean(row.is_separable),
    phoneticEdEnding: (row.phonetic_ed_ending as '/t/' | '/d/' | '/ɪd/' | null) ?? null,
    isFalseFriend: Boolean(row.is_false_friend),
    falseFriendNote: row.false_friend_note,
    morphologicalFamilyJson: morphologicalFamily,
    verbTensesJson: verbTenses,
    structuredFamilyJson: structuredFamily,
    domainCategory: row.domain_category ?? null,
    alternateSensesJson: alternateSenses,
    sensesJson,
    createdAt: row.created_at,
  };
}

export class VocabRepository implements IVocabRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private toDomainVocab(row: Selectable<VocabItemsTable>): VocabItem {
    return mapVocabRowToDomain(row);
  }


  private toDomainContext(row: Selectable<VocabContextExamplesTable>): VocabContextExample {
    return {
      id: row.id,
      vocabId: row.vocab_id,
      phraseId: row.phrase_id,
      sentenceEn: row.sentence_en,
      sentenceEs: row.sentence_es,
      clozeTarget: row.cloze_target,
      audioUrl: row.audio_url,
      cefrLevel: row.cefr_level as CefrLevel,
      createdAt: row.created_at,
    };
  }

  async getVocabById(vocabId: string): Promise<VocabItem | null> {
    const row = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('id', '=', vocabId)
      .executeTakeFirst();

    if (row) {
      return this.toDomainVocab(row);
    }

    // Check if it's in the in-memory core corpus
    const coreItem = CORE_VOCAB_DATA.find((item) => item.id === vocabId);
    if (coreItem) {
      return toDomainCoreVocab(coreItem, 'INACTIVE');
    }

    return null;
  }

  async searchVocabs(query: string, cefrLevel?: CefrLevel): Promise<VocabItem[]> {
    let q = this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb('word', 'like', `%${query}%`),
          eb('translation_es', 'like', `%${query}%`),
          eb('definition_en', 'like', `%${query}%`),
        ]),
      );

    if (cefrLevel) {
      q = q.where('cefr_level', '=', cefrLevel);
    }

    const rows = await q.orderBy('word', 'asc').limit(50).execute();
    return rows.map((row) => this.toDomainVocab(row));
  }

  async searchLocalCorpus(query: string, limit = 20): Promise<VocabItem[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    // 1. Search in SQLite DB first
    const rows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('is_core', '=', 1)
      .where((eb) =>
        eb.or([
          eb(sql`lower(word)`, 'like', `${clean}%`),
          eb('translation_es', 'like', `%${clean}%`),
        ]),
      )
      .orderBy('word', 'asc')
      .limit(limit)
      .execute();

    if (rows.length > 0) {
      return rows.map((row) => this.toDomainVocab(row));
    }

    // 2. If DB has no matches (e.g. not pre-seeded), query fast in-memory corpus
    const memoryResults = searchCoreCorpusLocally(query, limit);
    return memoryResults.map((item) => toDomainCoreVocab(item, 'INACTIVE'));
  }

  async getContextExamples(vocabId: string): Promise<VocabContextExample[]> {
    const rows = await this.db
      .selectFrom('vocab_context_examples')
      .selectAll()
      .where('vocab_id', '=', vocabId)
      .execute();

    if (rows.length > 0) {
      return rows.map((row) => this.toDomainContext(row));
    }

    // Synthesize graduated examples if it's from the core corpus
    const coreWord = CORE_VOCAB_DATA.find((item) => item.id === vocabId);
    if (coreWord?.graduatedExamples) {
      const basicCloze = coreWord.graduatedExamples.clozeTargetBasic || coreWord.word;
      const advCloze = coreWord.graduatedExamples.clozeTargetAdvanced || coreWord.word;
      return [
        {
          id: `ctx_core_${vocabId}_basic`,
          vocabId,
          sentenceEn: coreWord.graduatedExamples.sentenceBasicEn,
          sentenceEs: coreWord.graduatedExamples.sentenceBasicEs,
          clozeTarget: basicCloze,
          cefrLevel: 'A2',
          createdAt: new Date().toISOString(),
        },
        {
          id: `ctx_core_${vocabId}_adv`,
          vocabId,
          sentenceEn: coreWord.graduatedExamples.sentenceAdvancedEn,
          sentenceEs: coreWord.graduatedExamples.sentenceAdvancedEs,
          clozeTarget: advCloze,
          cefrLevel: 'B2',
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return [];
  }

  async findExistingByWord(word: string): Promise<VocabItem[]> {
    const clean = word.trim().toLowerCase();
    if (!clean) return [];
    const rows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where(sql`lower(word)`, '=', clean)
      .execute();

    if (rows.length > 0) {
      return rows.map((row) => this.toDomainVocab(row));
    }

    const coreItem = getCoreCorpusWord(clean);
    if (coreItem) {
      return [toDomainCoreVocab(coreItem, 'INACTIVE')];
    }

    return [];
  }

  async getAllVocabs(limit = 100): Promise<VocabItem[]> {
    const rows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .orderBy('cefr_level', 'asc')
      .limit(limit)
      .execute();

    return rows.map((row) => this.toDomainVocab(row));
  }

  async activateVocabItem(id: string): Promise<VocabItem> {
    const dbRow = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!dbRow) {
      const coreWord = CORE_VOCAB_DATA.find((item) => item.id === id);
      if (coreWord) {
        await this.createVocab({
          ...toDomainCoreVocab(coreWord, 'LEARNING'),
          id: coreWord.id,
          masteryStatus: 'LEARNING',
        });
      } else {
        throw new Error(`Vocabulario con id ${id} no encontrado`);
      }
    } else {
      await this.db
        .updateTable('vocab_items')
        .set({ mastery_status: 'LEARNING' })
        .where('id', '=', id)
        .execute();
    }

    // Ensure corresponding agile SRS card exists
    const existingCard = await this.db
      .selectFrom('srs_cards')
      .select('id')
      .where('target_id', '=', id)
      .where('target_type', '=', 'VOCAB')
      .executeTakeFirst();

    if (!existingCard) {
      const now = new Date().toISOString();
      await this.db
        .insertInto('srs_cards')
        .values({
          id: `card_voc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: 'user_local',
          target_type: 'VOCAB',
          target_id: id,
          state: 'NEW',
          stability: 0.0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          consecutive_lapses: 0,
          is_leech: 0,
          srs_profile: 'VOCAB_AGILE',
          last_reviewed_at: null,
          scheduled_for: now,
          created_at: now,
        })
        .execute();
    }

    const updated = await this.getVocabById(id);
    return updated!;
  }

  async batchActivateByCriteria(options: {
    cefrLevel?: CefrLevel;
    frequencyBand?: FrequencyBand;
    limit?: number;
  }): Promise<VocabItem[]> {
    const limit = options.limit ?? 20;

    let query = this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('is_core', '=', 1)
      .where('mastery_status', '=', 'INACTIVE');

    if (options.cefrLevel) {
      query = query.where('cefr_level', '=', options.cefrLevel);
    }
    if (options.frequencyBand) {
      query = query.where('frequency_band', '=', options.frequencyBand);
    }

    const candidates = await query.limit(limit).execute();
    const activatedItems: VocabItem[] = [];

    for (const row of candidates) {
      const activated = await this.activateVocabItem(row.id);
      activatedItems.push(activated);
    }

    // If DB candidates were fewer than limit, fallback to in-memory core corpus if not yet seeded
    if (activatedItems.length < limit) {
      for (const item of CORE_VOCAB_DATA) {
        if (activatedItems.length >= limit) break;
        if (options.cefrLevel && item.cefrLevel !== options.cefrLevel) continue;
        if (options.frequencyBand && item.frequencyBand !== options.frequencyBand) continue;

        const dbExists = await this.db
          .selectFrom('vocab_items')
          .select(['id', 'mastery_status'])
          .where('id', '=', item.id)
          .executeTakeFirst();

        if (!dbExists || dbExists.mastery_status === 'INACTIVE') {
          const activated = await this.activateVocabItem(item.id);
          if (!activatedItems.some((a) => a.id === activated.id)) {
            activatedItems.push(activated);
          }
        }
      }
    }

    return activatedItems;
  }

  async updateMasteryStatus(id: string, status: VocabMasteryStatus): Promise<void> {
    const dbStatus =
      status === 'PRODUCTIVE_MASTERY' || status === 'PRODUCTIVE_ACTIVE'
        ? 'PRODUCTIVE_MASTERY'
        : status === 'RECEPTIVE_MASTERY' || status === 'RECEPTIVE_MASTERED'
        ? 'RECEPTIVE_MASTERY'
        : status === 'INACTIVE'
        ? 'INACTIVE'
        : status === 'LEARNING'
        ? 'LEARNING'
        : 'NEW';

    await this.db
      .updateTable('vocab_items')
      .set({ mastery_status: dbStatus })
      .where('id', '=', id)
      .execute();
  }

  async getCoreCorpusCoverage(): Promise<CoreCorpusCoverage> {
    const rows = await this.db
      .selectFrom('vocab_items')
      .select(['frequency_band', 'mastery_status'])
      .where('is_core', '=', 1)
      .execute();

    const byBand: Record<FrequencyBand, { total: number; active: number; mastered: number }> = {
      TOP_500: { total: 500, active: 0, mastered: 0 },
      TOP_1000: { total: 500, active: 0, mastered: 0 },
      TOP_3000: { total: 2000, active: 0, mastered: 0 },
      TOP_5000: { total: 500, active: 0, mastered: 0 },
    };

    let totalCore = 3500;
    let activeCore = 0;
    let receptiveMastery = 0;
    let productiveMastery = 0;

    for (const r of rows) {
      const band = (r.frequency_band as FrequencyBand) || 'TOP_3000';
      if (!byBand[band]) {
        byBand[band] = { total: 0, active: 0, mastered: 0 };
      }

      if (r.mastery_status !== 'INACTIVE') {
        activeCore++;
        byBand[band].active++;
      }

      if (r.mastery_status === 'RECEPTIVE_MASTERY') {
        receptiveMastery++;
        byBand[band].mastered++;
      } else if (r.mastery_status === 'PRODUCTIVE_MASTERY') {
        productiveMastery++;
        byBand[band].mastered++;
      }
    }

    return {
      totalCore,
      activeCore,
      receptiveMastery,
      productiveMastery,
      byBand,
    };
  }

  async createVocab(vocab: CreateVocabInput): Promise<VocabItem> {
    const id = vocab.id ?? `voc_custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString();
    const morphJson = vocab.morphologicalFamilyJson ? JSON.stringify(vocab.morphologicalFamilyJson) : JSON.stringify([]);
    const verbTensesJson = vocab.verbTensesJson ? JSON.stringify(vocab.verbTensesJson) : null;
    const structuredFamilyJson = vocab.structuredFamilyJson ? JSON.stringify(vocab.structuredFamilyJson) : null;
    const alternateSensesJson = vocab.alternateSensesJson ? JSON.stringify(vocab.alternateSensesJson) : null;
    const collocationsJson = vocab.collocationsJson ? JSON.stringify(vocab.collocationsJson) : JSON.stringify([]);

    const dbMasteryStatus =
      vocab.masteryStatus === 'PRODUCTIVE_MASTERY' || vocab.masteryStatus === 'PRODUCTIVE_ACTIVE'
        ? 'PRODUCTIVE_MASTERY'
        : vocab.masteryStatus === 'RECEPTIVE_MASTERY' || vocab.masteryStatus === 'RECEPTIVE_MASTERED'
        ? 'RECEPTIVE_MASTERY'
        : vocab.masteryStatus === 'INACTIVE'
        ? 'INACTIVE'
        : vocab.masteryStatus === 'LEARNING'
        ? 'LEARNING'
        : 'NEW';

    await this.db
      .insertInto('vocab_items')
      .values({
        id,
        word: vocab.word.trim(),
        grammatical_dimension: vocab.grammaticalDimension,
        part_of_speech: vocab.partOfSpeech,
        subcategory: vocab.subcategory ?? null,
        definition_en: vocab.definitionEn.trim(),
        translation_es: vocab.translationEs.trim(),
        ipa_general_american: vocab.ipaGeneralAmerican?.trim() || '',
        ipa_received_pronunciation: vocab.ipaReceivedPronunciation?.trim() || null,
        ipa_weak_form: vocab.ipaWeakForm?.trim() || null,
        cefr_level: vocab.cefrLevel,
        frequency_band: vocab.frequencyBand ?? 'TOP_3000',
        is_core: vocab.isCore ? 1 : 0,
        mastery_status: dbMasteryStatus,
        collocations_json: collocationsJson,
        is_separable: vocab.isSeparable === null || vocab.isSeparable === undefined ? null : (vocab.isSeparable ? 1 : 0),
        phonetic_ed_ending: vocab.phoneticEdEnding ?? null,
        is_false_friend: vocab.isFalseFriend ? 1 : 0,
        false_friend_note: vocab.falseFriendNote?.trim() || null,
        morphological_family_json: morphJson,
        verb_tenses_json: verbTensesJson,
        structured_family_json: structuredFamilyJson,
        domain_category: vocab.domainCategory ?? null,
        alternate_senses_json: alternateSensesJson,
      })
      .execute();

    return {
      id,
      word: vocab.word.trim(),
      grammaticalDimension: vocab.grammaticalDimension,
      partOfSpeech: vocab.partOfSpeech,
      subcategory: vocab.subcategory ?? null,
      definitionEn: vocab.definitionEn.trim(),
      translationEs: vocab.translationEs.trim(),
      ipaGeneralAmerican: vocab.ipaGeneralAmerican?.trim() || '',
      ipaReceivedPronunciation: vocab.ipaReceivedPronunciation?.trim() || null,
      cefrLevel: vocab.cefrLevel,
      frequencyBand: vocab.frequencyBand ?? 'TOP_3000',
      isCore: vocab.isCore ?? false,
      masteryStatus: vocab.masteryStatus ?? 'LEARNING',
      collocationsJson: vocab.collocationsJson ?? [],
      isSeparable: vocab.isSeparable ?? null,
      phoneticEdEnding: vocab.phoneticEdEnding ?? null,
      isFalseFriend: vocab.isFalseFriend,
      falseFriendNote: vocab.falseFriendNote?.trim() || null,
      morphologicalFamilyJson: vocab.morphologicalFamilyJson ?? [],
      verbTensesJson: vocab.verbTensesJson ?? null,
      structuredFamilyJson: vocab.structuredFamilyJson ?? null,
      domainCategory: vocab.domainCategory ?? null,
      alternateSensesJson: vocab.alternateSensesJson ?? null,
      createdAt,
    };
  }

  async addContextExample(
    example: Omit<VocabContextExample, 'id' | 'createdAt'> & { id?: string },
  ): Promise<VocabContextExample> {
    const id = example.id ?? `ctx_custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString();

    await this.db
      .insertInto('vocab_context_examples')
      .values({
        id,
        vocab_id: example.vocabId ?? null,
        phrase_id: example.phraseId ?? null,
        sentence_en: example.sentenceEn.trim(),
        sentence_es: example.sentenceEs.trim(),
        cloze_target: example.clozeTarget.trim(),
        audio_url: example.audioUrl ?? null,
        cefr_level: example.cefrLevel,
      })
      .execute();

    return {
      id,
      vocabId: example.vocabId ?? null,
      phraseId: example.phraseId ?? null,
      sentenceEn: example.sentenceEn.trim(),
      sentenceEs: example.sentenceEs.trim(),
      clozeTarget: example.clozeTarget.trim(),
      audioUrl: example.audioUrl ?? null,
      cefrLevel: example.cefrLevel,
      createdAt,
    };
  }

  async updateVocab(
    vocabId: string,
    updates: Partial<Omit<VocabItem, 'id' | 'createdAt'>>,
  ): Promise<VocabItem> {
    const updateValues: Record<string, unknown> = {};

    if (updates.word !== undefined) updateValues.word = updates.word.trim();
    if (updates.grammaticalDimension !== undefined) updateValues.grammatical_dimension = updates.grammaticalDimension;
    if (updates.partOfSpeech !== undefined) updateValues.part_of_speech = updates.partOfSpeech;
    if (updates.subcategory !== undefined) updateValues.subcategory = updates.subcategory;
    if (updates.definitionEn !== undefined) updateValues.definition_en = updates.definitionEn.trim();
    if (updates.translationEs !== undefined) updateValues.translation_es = updates.translationEs.trim();
    if (updates.ipaGeneralAmerican !== undefined) updateValues.ipa_general_american = updates.ipaGeneralAmerican.trim();
    if (updates.ipaReceivedPronunciation !== undefined) updateValues.ipa_received_pronunciation = updates.ipaReceivedPronunciation?.trim() || null;
    if (updates.ipaWeakForm !== undefined) updateValues.ipa_weak_form = updates.ipaWeakForm?.trim() || null;
    if (updates.cefrLevel !== undefined) updateValues.cefr_level = updates.cefrLevel;
    if (updates.frequencyBand !== undefined) updateValues.frequency_band = updates.frequencyBand;
    if (updates.isCore !== undefined) updateValues.is_core = updates.isCore ? 1 : 0;
    if (updates.masteryStatus !== undefined) updateValues.mastery_status = updates.masteryStatus;
    if (updates.collocationsJson !== undefined) updateValues.collocations_json = JSON.stringify(updates.collocationsJson);
    if (updates.isSeparable !== undefined) updateValues.is_separable = updates.isSeparable === null ? null : (updates.isSeparable ? 1 : 0);
    if (updates.phoneticEdEnding !== undefined) updateValues.phonetic_ed_ending = updates.phoneticEdEnding;
    if (updates.isFalseFriend !== undefined) updateValues.is_false_friend = updates.isFalseFriend ? 1 : 0;
    if (updates.falseFriendNote !== undefined) updateValues.false_friend_note = updates.falseFriendNote?.trim() || null;
    if (updates.domainCategory !== undefined) updateValues.domain_category = updates.domainCategory;
    if (updates.morphologicalFamilyJson !== undefined) {
      updateValues.morphological_family_json = JSON.stringify(updates.morphologicalFamilyJson);
    }
    if (updates.verbTensesJson !== undefined) {
      updateValues.verb_tenses_json = updates.verbTensesJson ? JSON.stringify(updates.verbTensesJson) : null;
    }
    if (updates.structuredFamilyJson !== undefined) {
      updateValues.structured_family_json = updates.structuredFamilyJson ? JSON.stringify(updates.structuredFamilyJson) : null;
    }
    if (updates.alternateSensesJson !== undefined) {
      updateValues.alternate_senses_json = updates.alternateSensesJson ? JSON.stringify(updates.alternateSensesJson) : null;
    }

    if (Object.keys(updateValues).length > 0) {
      await this.db
        .updateTable('vocab_items')
        .set(updateValues)
        .where('id', '=', vocabId)
        .execute();
    }

    const updated = await this.getVocabById(vocabId);
    if (!updated) {
      throw new Error(`Vocabulario con id ${vocabId} no encontrado después de actualizar`);
    }
    return updated;
  }

  async deleteVocab(vocabId: string): Promise<boolean> {
    const count = await this.deleteVocabs([vocabId]);
    return count > 0;
  }

  async deleteVocabs(vocabIds: string[]): Promise<number> {
    if (!vocabIds || vocabIds.length === 0) return 0;

    // 1. Find all associated SRS card IDs for all selected vocab items
    const associatedCards = await this.db
      .selectFrom('srs_cards')
      .select('id')
      .where('target_id', 'in', vocabIds)
      .execute();

    // 2. Delete review logs first to guarantee FK integrity
    if (associatedCards.length > 0) {
      const cardIds = associatedCards.map((c) => c.id);
      await this.db
        .deleteFrom('review_logs')
        .where('card_id', 'in', cardIds)
        .execute();
    }

    // 3. Delete associated SRS cards (both VOCAB and PHRASE target types)
    await this.db
      .deleteFrom('srs_cards')
      .where('target_id', 'in', vocabIds)
      .execute();

    // 4. Delete context examples
    await this.db
      .deleteFrom('vocab_context_examples')
      .where('vocab_id', 'in', vocabIds)
      .execute();

    // 5. Delete vocab items
    const result = await this.db
      .deleteFrom('vocab_items')
      .where('id', 'in', vocabIds)
      .executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }

  async clearAllVocabs(): Promise<number> {
    // 1. Delete all SRS cards for vocab & phrase targets (cascades to review_logs)
    await this.db
      .deleteFrom('srs_cards')
      .where('target_type', 'in', ['VOCAB', 'PHRASE'])
      .execute();

    // 2. Delete all vocab items (cascades to vocab_context_examples and phraseological_units)
    const result = await this.db
      .deleteFrom('vocab_items')
      .executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }
}


