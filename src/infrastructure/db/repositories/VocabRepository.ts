import { Kysely, Selectable } from 'kysely';
import { DatabaseSchema, VocabItemsTable, VocabContextExamplesTable } from '../../../core/types/database';
import { IVocabRepository } from '../../../core/repositories/IVocabRepository';
import { VocabItem, VocabContextExample, CefrLevel, GrammaticalDimension, PartOfSpeech } from '../../../core/types/vocab';

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
}

