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
}
