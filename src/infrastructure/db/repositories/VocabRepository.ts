import { Kysely, Selectable, sql } from 'kysely';
import { DatabaseSchema, VocabItemsTable, VocabContextExamplesTable } from '../../../core/types/database';
import { IVocabRepository } from '../../../core/repositories/IVocabRepository';
import {
  VocabItem,
  VocabContextExample,
  CefrLevel,
  GrammaticalDimension,
  PartOfSpeech,
  VerbTenses,
  StructuredWordFamily,
  VocabSense,
} from '../../../core/types/vocab';

export class VocabRepository implements IVocabRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private toDomainVocab(row: Selectable<VocabItemsTable>): VocabItem {
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
      cefrLevel: row.cefr_level as CefrLevel,
      isFalseFriend: Boolean(row.is_false_friend),
      falseFriendNote: row.false_friend_note,
      morphologicalFamilyJson: morphologicalFamily,
      verbTensesJson: verbTenses,
      structuredFamilyJson: structuredFamily,
      domainCategory: row.domain_category ?? null,
      alternateSensesJson: alternateSenses,
      createdAt: row.created_at,
    };
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

    return row ? this.toDomainVocab(row) : null;
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

  async getContextExamples(vocabId: string): Promise<VocabContextExample[]> {
    const rows = await this.db
      .selectFrom('vocab_context_examples')
      .selectAll()
      .where('vocab_id', '=', vocabId)
      .execute();

    return rows.map((row) => this.toDomainContext(row));
  }

  async findExistingByWord(word: string): Promise<VocabItem[]> {
    const clean = word.trim().toLowerCase();
    if (!clean) return [];
    const rows = await this.db
      .selectFrom('vocab_items')
      .selectAll()
      .where(sql`lower(word)`, '=', clean)
      .execute();

    return rows.map((row) => this.toDomainVocab(row));
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

  async createVocab(vocab: Omit<VocabItem, 'id' | 'createdAt'> & { id?: string }): Promise<VocabItem> {
    const id = vocab.id ?? `voc_custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString();
    const morphJson = vocab.morphologicalFamilyJson ? JSON.stringify(vocab.morphologicalFamilyJson) : JSON.stringify([]);
    const verbTensesJson = vocab.verbTensesJson ? JSON.stringify(vocab.verbTensesJson) : null;
    const structuredFamilyJson = vocab.structuredFamilyJson ? JSON.stringify(vocab.structuredFamilyJson) : null;
    const alternateSensesJson = vocab.alternateSensesJson ? JSON.stringify(vocab.alternateSensesJson) : null;

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
        cefr_level: vocab.cefrLevel,
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
    if (updates.cefrLevel !== undefined) updateValues.cefr_level = updates.cefrLevel;
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
    // 1. Find all associated SRS card IDs
    const associatedCards = await this.db
      .selectFrom('srs_cards')
      .select('id')
      .where('target_id', '=', vocabId)
      .execute();

    // 2. Delete review logs first to guarantee FK integrity even if PRAGMA foreign_keys is off
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
      .where('target_id', '=', vocabId)
      .execute();

    // 4. Delete context examples
    await this.db
      .deleteFrom('vocab_context_examples')
      .where('vocab_id', '=', vocabId)
      .execute();

    // 5. Delete vocab item
    const result = await this.db
      .deleteFrom('vocab_items')
      .where('id', '=', vocabId)
      .executeTakeFirst();

    return Number(result.numDeletedRows ?? 1) > 0;
  }
}

