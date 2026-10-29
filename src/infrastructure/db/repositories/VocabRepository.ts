import { Kysely, Selectable, sql } from 'kysely';
import { DatabaseSchema, VocabItemsTable, VocabContextExamplesTable } from '../../../core/types/database';
import {
  IVocabRepository,
  CoreCorpusCoverage,
  CreateVocabInput,
  VocabPageFilter,
  VocabPageResult,
} from '../../../core/repositories/IVocabRepository';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  FrequencyBand,
  GrammaticalDimension,
  PartOfSpeech,
  VerbTenses,
  VocabSense,
  VocabMasteryStatus,
  PhrasalVerbItem,
} from '../../../core/types/vocab';
import {
  searchCoreCorpusLocally,
  getCoreCorpusWord,
  toDomainCoreVocab,
  CORE_VOCAB_DATA,
} from '@/data/core-vocab-corpus';

export function mapVocabRowToDomain(row: Selectable<VocabItemsTable>): VocabItem {
  let verbTenses: VerbTenses | null = null;
  if (row.verb_tenses_json) {
    try {
      verbTenses = JSON.parse(row.verb_tenses_json);
    } catch {
      verbTenses = null;
    }
  }

  let sensesJson: VocabSense[] | null = null;
  if (row.senses_json) {
    try {
      sensesJson = JSON.parse(row.senses_json);
    } catch {
      sensesJson = null;
    }
  }

  let alternateSenses: VocabSense[] | null = null;
  if (row.alternate_senses_json) {
    try {
      alternateSenses = JSON.parse(row.alternate_senses_json);
    } catch {
      alternateSenses = null;
    }
  } else if (sensesJson && sensesJson.length > 1) {
    alternateSenses = sensesJson.slice(1);
  }

  // Fallback if row does not have senses_json populated yet
  if (!sensesJson) {
    const primarySense: VocabSense = {
      translationEs: row.translation_es,
      definitionEn: row.definition_en,
      partOfSpeech: row.part_of_speech as PartOfSpeech,
      cefrLevel: row.cefr_level as CefrLevel,
    };

    sensesJson = [
      primarySense,
      ...(alternateSenses || []),
    ];
  }

  let phrasalVerbsJson: PhrasalVerbItem[] | null = null;
  if (row.phrasal_verbs_json) {
    try {
      phrasalVerbsJson = JSON.parse(row.phrasal_verbs_json);
    } catch {
      phrasalVerbsJson = null;
    }
  }

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
    isSeparable: row.is_separable === null ? null : Boolean(row.is_separable),
    phoneticEdEnding: (row.phonetic_ed_ending as '/t/' | '/d/' | '/ɪd/' | null) ?? null,
    isFalseFriend: Boolean(row.is_false_friend),
    falseFriendNote: row.false_friend_note,
    verbTensesJson: verbTenses,
    domainCategory: row.domain_category ?? null,
    alternateSensesJson: alternateSenses,
    sensesJson,
    phrasalVerbsJson,
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
      senseIndex: typeof row.sense_index === 'number' ? row.sense_index : Number(row.sense_index ?? 0),
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

  async getVocabsPage(filter: VocabPageFilter): Promise<VocabPageResult> {
    const page = Math.max(1, filter.page);
    const pageSize = Math.max(1, filter.pageSize);
    const offset = (page - 1) * pageSize;

    let baseQuery = this.db.selectFrom('vocab_items');

    if (filter.origin === 'CORE') {
      baseQuery = baseQuery.where('is_core', '=', 1);
    } else if (filter.origin === 'VAULT') {
      baseQuery = baseQuery.where('is_core', '=', 0);
    }

    if (filter.frequencyBand && filter.frequencyBand !== 'ALL') {
      baseQuery = baseQuery.where('frequency_band', '=', filter.frequencyBand as any);
    }

    if (filter.masteryStatus && filter.masteryStatus !== 'ALL') {
      baseQuery = baseQuery.where('mastery_status', '=', filter.masteryStatus as any);
    }

    if (filter.onlyFalseFriends) {
      baseQuery = baseQuery.where('is_false_friend', '=', 1);
    }

    if (filter.cefrLevel && filter.cefrLevel !== 'ALL') {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('cefr_level', '=', filter.cefrLevel as any),
          eb('alternate_senses_json', 'like', `%"cefrLevel":"${filter.cefrLevel}"%`),
        ]),
      );
    }

    if (filter.dimension && filter.dimension !== 'ALL') {
      baseQuery = baseQuery.where('grammatical_dimension', '=', filter.dimension as any);
    }

    if (filter.partOfSpeech && filter.partOfSpeech !== 'ALL') {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('part_of_speech', '=', filter.partOfSpeech as any),
          eb('alternate_senses_json', 'like', `%"partOfSpeech":"${filter.partOfSpeech}"%`),
        ]),
      );
    }

    const clean = filter.search?.trim().toLowerCase();
    if (clean) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb(sql`word COLLATE NOCASE`, 'like', `${clean}%`),
          eb(sql`word COLLATE NOCASE`, 'like', `%${clean}%`),
          eb('translation_es', 'like', `%${clean}%`),
          eb('definition_en', 'like', `%${clean}%`),
          eb('ipa_general_american', 'like', `%${clean}%`),
          eb('alternate_senses_json', 'like', `%${clean}%`),
        ]),
      );
    }

    // Filtered count directly in SQLite
    const countRes = await baseQuery
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst();
    const filteredCount = Number(countRes?.count ?? 0);

    // Sorting
    let sortedQuery = baseQuery.selectAll();
    switch (filter.sortBy) {
      case 'ALPHA_ASC':
        sortedQuery = sortedQuery.orderBy(sql`word COLLATE NOCASE`, 'asc');
        break;
      case 'ALPHA_DESC':
        sortedQuery = sortedQuery.orderBy(sql`word COLLATE NOCASE`, 'desc');
        break;
      case 'CEFR_ASC':
        sortedQuery = sortedQuery
          .orderBy(
            sql`CASE cefr_level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 WHEN 'C1' THEN 5 WHEN 'C2' THEN 6 ELSE 99 END`,
            'asc',
          )
          .orderBy(sql`word COLLATE NOCASE`, 'asc');
        break;
      case 'RECENT':
      default:
        if (clean) {
          sortedQuery = sortedQuery
            .orderBy(
              sql`CASE 
                WHEN word COLLATE NOCASE = ${clean} THEN 1 
                WHEN word COLLATE NOCASE LIKE ${clean + '%'} THEN 2 
                WHEN translation_es LIKE ${clean + '%'} THEN 3 
                ELSE 4 END`,
              'asc',
            )
            .orderBy('created_at', 'desc');
        } else {
          sortedQuery = sortedQuery.orderBy('created_at', 'desc').orderBy('id', 'desc');
        }
        break;
    }

    const rows = await sortedQuery.limit(pageSize).offset(offset).execute();
    const items = rows.map((r) => this.toDomainVocab(r));

    // Parallel aggregate counts
    const [totalsRow, cefrRows] = await Promise.all([
      this.db
        .selectFrom('vocab_items')
        .select([
          sql<number>`count(*)`.as('totalCount'),
          sql<number>`coalesce(sum(case when is_core = 1 then 1 else 0 end), 0)`.as('coreCount'),
          sql<number>`coalesce(sum(case when is_core = 0 then 1 else 0 end), 0)`.as('vaultCount'),
        ])
        .executeTakeFirst(),
      this.db
        .selectFrom('vocab_items')
        .select(['cefr_level', sql<number>`count(*)`.as('count')])
        .groupBy('cefr_level')
        .execute(),
    ]);

    const cefrCounts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    for (const cr of cefrRows) {
      if (cr.cefr_level && cefrCounts[cr.cefr_level] !== undefined) {
        cefrCounts[cr.cefr_level] = Number(cr.count ?? 0);
      }
    }

    return {
      items,
      totalCount: Number(totalsRow?.totalCount ?? 0),
      coreCount: Number(totalsRow?.coreCount ?? 0),
      vaultCount: Number(totalsRow?.vaultCount ?? 0),
      filteredCount,
      cefrCounts,
    };
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
          eb(sql`word COLLATE NOCASE`, 'like', `${clean}%`),
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

  async getContextExamplesForVocabs(vocabIds: string[]): Promise<Record<string, VocabContextExample[]>> {
    if (vocabIds.length === 0) return {};

    const rows = await this.db
      .selectFrom('vocab_context_examples')
      .selectAll()
      .where('vocab_id', 'in', vocabIds)
      .execute();

    const map: Record<string, VocabContextExample[]> = {};
    for (const row of rows) {
      if (row.vocab_id) {
        if (!map[row.vocab_id]) {
          map[row.vocab_id] = [];
        }
        map[row.vocab_id].push(this.toDomainContext(row));
      }
    }

    // Synthesize graduated examples for missing IDs from in-memory core corpus fallback
    for (const vocabId of vocabIds) {
      if (!map[vocabId] || map[vocabId].length === 0) {
        const coreWord = CORE_VOCAB_DATA.find((item) => item.id === vocabId);
        if (coreWord?.graduatedExamples) {
          const basicCloze = coreWord.graduatedExamples.clozeTargetBasic || coreWord.word;
          const advCloze = coreWord.graduatedExamples.clozeTargetAdvanced || coreWord.word;
          map[vocabId] = [
            {
              id: `ctx_core_${vocabId}_basic`,
              vocabId,
              senseIndex: 0,
              sentenceEn: coreWord.graduatedExamples.sentenceBasicEn,
              sentenceEs: coreWord.graduatedExamples.sentenceBasicEs,
              clozeTarget: basicCloze,
              cefrLevel: 'A2',
              createdAt: new Date().toISOString(),
            },
            {
              id: `ctx_core_${vocabId}_adv`,
              vocabId,
              senseIndex: 0,
              sentenceEn: coreWord.graduatedExamples.sentenceAdvancedEn,
              sentenceEs: coreWord.graduatedExamples.sentenceAdvancedEs,
              clozeTarget: advCloze,
              cefrLevel: 'B2',
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }
    }

    return map;
  }

  async findExistingByWord(word: string): Promise<VocabItem[]> {
    const clean = word.trim().toLowerCase();
    if (!clean) return [];
    const rows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where(sql`word COLLATE NOCASE`, '=', clean)
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

  async getAllVocabs(limit?: number): Promise<VocabItem[]> {
    let query = this.db
      .selectFrom('vocab_items')
      .selectAll()
      .orderBy('cefr_level', 'asc');

    if (limit !== undefined && limit > 0) {
      query = query.limit(limit);
    }

    const rows = await query.execute();
    return rows.map((row) => this.toDomainVocab(row));
  }

  async activateVocabItem(id: string, initialStatus: VocabMasteryStatus = 'NEW'): Promise<VocabItem> {
    const dbRow = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!dbRow) {
      const coreWord = CORE_VOCAB_DATA.find((item) => item.id === id);
      if (coreWord) {
        await this.createVocab({
          ...toDomainCoreVocab(coreWord, initialStatus),
          id: coreWord.id,
          masteryStatus: initialStatus,
        });
      } else {
        throw new Error(`Vocabulario con id ${id} no encontrado`);
      }
    } else {
      await this.db
        .updateTable('vocab_items')
        .set({ mastery_status: initialStatus })
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
      try {
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
      } catch (insertErr: unknown) {
        const msg = String(insertErr);
        if (
          !msg.includes('UNIQUE constraint failed') &&
          !msg.includes('2067') &&
          !msg.includes('idx_srs_target_unique')
        ) {
          throw insertErr;
        }
      }
    }

    const updated = await this.getVocabById(id);
    return updated!;
  }

  async activateVocabSense(vocabId: string, senseIndex: number): Promise<void> {
    const targetId = senseIndex === 0 ? vocabId : `${vocabId}#${senseIndex}`;

    // Ensure vocab itself is at least in LEARNING if currently INACTIVE
    const currentVocab = await this.getVocabById(vocabId);
    if (currentVocab && currentVocab.masteryStatus === 'INACTIVE') {
      await this.updateMasteryStatus(vocabId, 'LEARNING');
    }

    const existingCard = await this.db
      .selectFrom('srs_cards')
      .select('id')
      .where('target_id', '=', targetId)
      .where('target_type', '=', 'VOCAB')
      .executeTakeFirst();

    if (!existingCard) {
      const now = new Date().toISOString();
      try {
        await this.db
          .insertInto('srs_cards')
          .values({
            id: `card_voc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: 'user_local',
            target_type: 'VOCAB',
            target_id: targetId,
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
      } catch (insertErr: unknown) {
        const msg = String(insertErr);
        if (
          !msg.includes('UNIQUE constraint failed') &&
          !msg.includes('2067') &&
          !msg.includes('idx_srs_target_unique')
        ) {
          throw insertErr;
        }
      }
    }
  }

  async getNextEligiblePolysemousSenses(options: {
    minStabilityDays?: number;
    limit: number;
  }): Promise<Array<{ vocabId: string; senseIndex: number; sense: VocabSense; word: string }>> {
    const minStability = options.minStabilityDays ?? 21;
    const limit = options.limit ?? 2;

    const consolidatedPrimaryCards = await this.db
      .selectFrom('srs_cards')
      .select(['target_id', 'stability'])
      .where('target_type', '=', 'VOCAB')
      .where('stability', '>=', minStability)
      .execute();

    if (consolidatedPrimaryCards.length === 0) {
      return [];
    }

    const eligibleBaseVocabIds = consolidatedPrimaryCards
      .map((c) => c.target_id)
      .filter((id) => !id.includes('#'));

    if (eligibleBaseVocabIds.length === 0) {
      return [];
    }

    const vocabRows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('id', 'in', eligibleBaseVocabIds)
      .execute();

    const existingSenseCards = await this.db
      .selectFrom('srs_cards')
      .select('target_id')
      .where('target_type', '=', 'VOCAB')
      .execute();
    const existingTargetIds = new Set(existingSenseCards.map((c) => c.target_id));

    const candidates: Array<{ vocabId: string; senseIndex: number; sense: VocabSense; word: string }> = [];

    for (const row of vocabRows) {
      if (candidates.length >= limit) break;
      if (!row.alternate_senses_json) continue;

      let altSenses: VocabSense[] = [];
      try {
        altSenses = JSON.parse(row.alternate_senses_json);
      } catch {
        altSenses = [];
      }

      if (!Array.isArray(altSenses)) continue;

      altSenses.forEach((altSense, idx) => {
        if (candidates.length >= limit) return;
        const senseIndex = idx + 1;
        const targetId = `${row.id}#${senseIndex}`;
        if (!existingTargetIds.has(targetId)) {
          candidates.push({
            vocabId: row.id,
            senseIndex,
            sense: altSense,
            word: row.word,
          });
        }
      });
    }

    return candidates;
  }

  async getNextUnactivatedWords(options: {
    frequencyBand: FrequencyBand;
    limit: number;
  }): Promise<VocabItem[]> {
    const limit = options.limit ?? 10;

    const rows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where('is_core', '=', 1)
      .where('mastery_status', '=', 'INACTIVE')
      .where('frequency_band', '=', options.frequencyBand)
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
      .limit(limit)
      .execute();

    if (rows.length >= limit || CORE_VOCAB_DATA.length === 0) {
      return rows.map((r) => this.toDomainVocab(r));
    }

    const items = rows.map((r) => this.toDomainVocab(r));
    const existingIds = new Set(items.map((i) => i.id));

    for (const coreWord of CORE_VOCAB_DATA) {
      if (items.length >= limit) break;
      if (coreWord.frequencyBand !== options.frequencyBand) continue;
      if (existingIds.has(coreWord.id)) continue;
      items.push(toDomainCoreVocab(coreWord, 'INACTIVE'));
      existingIds.add(coreWord.id);
    }

    return items;
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

    const candidates = await query
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .execute();

    const activatedItems: VocabItem[] = [];

    if (candidates.length > 0) {
      await this.db.transaction().execute(async (trx) => {
        const candidateIds = candidates.map((c) => c.id);
        const now = new Date().toISOString();

        await trx
          .updateTable('vocab_items')
          .set({ mastery_status: 'LEARNING' })
          .where('id', 'in', candidateIds)
          .execute();

        const existingCards = await trx
          .selectFrom('srs_cards')
          .select('target_id')
          .where('target_id', 'in', candidateIds)
          .where('target_type', '=', 'VOCAB')
          .execute();
        const existingTargetIds = new Set(existingCards.map((c) => c.target_id));

        const cardsToInsert = candidateIds
          .filter((id) => !existingTargetIds.has(id))
          .map((id) => ({
            id: `card_voc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: 'user_local',
            target_type: 'VOCAB' as const,
            target_id: id,
            state: 'NEW' as const,
            stability: 0.0,
            difficulty: 5.0,
            reps: 0,
            lapses: 0,
            consecutive_lapses: 0,
            is_leech: 0,
            srs_profile: 'VOCAB_AGILE' as const,
            last_reviewed_at: null,
            scheduled_for: now,
            created_at: now,
          }));

        if (cardsToInsert.length > 0) {
          try {
            await trx.insertInto('srs_cards').values(cardsToInsert).execute();
          } catch (insertErr: unknown) {
            const msg = String(insertErr);
            if (
              !msg.includes('UNIQUE constraint failed') &&
              !msg.includes('2067') &&
              !msg.includes('idx_srs_target_unique')
            ) {
              throw insertErr;
            }
          }
        }
      });

      for (const row of candidates) {
        activatedItems.push(this.toDomainVocab({ ...row, mastery_status: 'LEARNING' }));
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
      .select([
        'frequency_band',
        'mastery_status',
        sql<number>`count(*)`.as('count'),
      ])
      .where('is_core', '=', 1)
      .groupBy(['frequency_band', 'mastery_status'])
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
      const count = Number(r.count ?? 0);
      if (!byBand[band]) {
        byBand[band] = { total: 0, active: 0, mastered: 0 };
      }

      if (r.mastery_status !== 'INACTIVE') {
        activeCore += count;
        byBand[band].active += count;
      }

      if (r.mastery_status === 'RECEPTIVE_MASTERY' || r.mastery_status === 'RECEPTIVE_MASTERED') {
        receptiveMastery += count;
        byBand[band].mastered += count;
      } else if (r.mastery_status === 'PRODUCTIVE_MASTERY' || r.mastery_status === 'PRODUCTIVE_ACTIVE') {
        productiveMastery += count;
        byBand[band].mastered += count;
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
    const verbTensesJson = vocab.verbTensesJson ? JSON.stringify(vocab.verbTensesJson) : null;
    const alternateSensesJson = vocab.alternateSensesJson ? JSON.stringify(vocab.alternateSensesJson) : null;
    const sensesJson = vocab.sensesJson ? JSON.stringify(vocab.sensesJson) : null;
    const phrasalVerbsJson = vocab.phrasalVerbsJson ? JSON.stringify(vocab.phrasalVerbsJson) : null;
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
        is_separable: vocab.isSeparable === null || vocab.isSeparable === undefined ? null : (vocab.isSeparable ? 1 : 0),
        phonetic_ed_ending: vocab.phoneticEdEnding ?? null,
        is_false_friend: vocab.isFalseFriend ? 1 : 0,
        false_friend_note: vocab.falseFriendNote?.trim() || null,
        verb_tenses_json: verbTensesJson,
        domain_category: vocab.domainCategory ?? null,
        alternate_senses_json: alternateSensesJson,
        senses_json: sensesJson,
        phrasal_verbs_json: phrasalVerbsJson,
        created_at: createdAt,
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
      isSeparable: vocab.isSeparable ?? null,
      phoneticEdEnding: vocab.phoneticEdEnding ?? null,
      isFalseFriend: vocab.isFalseFriend,
      falseFriendNote: vocab.falseFriendNote?.trim() || null,
      verbTensesJson: vocab.verbTensesJson ?? null,
      domainCategory: vocab.domainCategory ?? null,
      alternateSensesJson: vocab.alternateSensesJson ?? null,
      sensesJson: vocab.sensesJson ?? null,
      phrasalVerbsJson: vocab.phrasalVerbsJson ?? null,
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
    if (updates.isSeparable !== undefined) updateValues.is_separable = updates.isSeparable === null ? null : (updates.isSeparable ? 1 : 0);
    if (updates.phoneticEdEnding !== undefined) updateValues.phonetic_ed_ending = updates.phoneticEdEnding;
    if (updates.isFalseFriend !== undefined) updateValues.is_false_friend = updates.isFalseFriend ? 1 : 0;
    if (updates.falseFriendNote !== undefined) updateValues.false_friend_note = updates.falseFriendNote?.trim() || null;
    if (updates.domainCategory !== undefined) updateValues.domain_category = updates.domainCategory;
    if (updates.verbTensesJson !== undefined) {
      updateValues.verb_tenses_json = updates.verbTensesJson ? JSON.stringify(updates.verbTensesJson) : null;
    }
    if (updates.alternateSensesJson !== undefined) {
      updateValues.alternate_senses_json = updates.alternateSensesJson ? JSON.stringify(updates.alternateSensesJson) : null;
    }
    if (updates.sensesJson !== undefined) {
      updateValues.senses_json = updates.sensesJson ? JSON.stringify(updates.sensesJson) : null;
    }
    if (updates.phrasalVerbsJson !== undefined) {
      updateValues.phrasal_verbs_json = updates.phrasalVerbsJson ? JSON.stringify(updates.phrasalVerbsJson) : null;
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
    // 1. Find all SRS cards for vocab & phrase targets
    const associatedCards = await this.db
      .selectFrom('srs_cards')
      .select('id')
      .where('target_type', 'in', ['VOCAB', 'PHRASE'])
      .execute();

    // 2. Delete review logs first for data integrity
    if (associatedCards.length > 0) {
      const cardIds = associatedCards.map((c) => c.id);
      await this.db
        .deleteFrom('review_logs')
        .where('card_id', 'in', cardIds)
        .execute();
    }

    // 3. Delete all SRS cards for vocab & phrase targets
    await this.db
      .deleteFrom('srs_cards')
      .where('target_type', 'in', ['VOCAB', 'PHRASE'])
      .execute();

    // 4. Delete context examples
    await this.db
      .deleteFrom('vocab_context_examples')
      .execute();

    // 5. Delete phraseological units
    await this.db
      .deleteFrom('phraseological_units')
      .execute();

    // 6. Delete all vocab items
    const result = await this.db
      .deleteFrom('vocab_items')
      .executeTakeFirst();

    return Number(result.numDeletedRows ?? 0);
  }
}


