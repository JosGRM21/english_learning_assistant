import {
  DatabaseSchema,
  VocabItemsTable,
  PhraseologicalUnitsTable,
  VocabContextExamplesTable,
} from '../../core/types/database';
import { Kysely, Insertable } from 'kysely';

export interface SeedDataset {
  vocabItems: Insertable<VocabItemsTable>[];
  phraseUnits: Insertable<PhraseologicalUnitsTable>[];
  contextExamples: Insertable<VocabContextExamplesTable>[];
}

/**
 * Clean empty dataset. The application starts with an empty database.
 * No mock or preloaded data is bundled for the UI.
 */
export const SEED_DATA: SeedDataset = {
  vocabItems: [],
  phraseUnits: [],
  contextExamples: [],
};

export async function seedDatabase(db: Kysely<DatabaseSchema>): Promise<void> {
  // 1. Core vocabulary
  for (const item of SEED_DATA.vocabItems) {
    await db
      .insertInto('vocab_items')
      .values(item)
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  // 2. Phrase units
  for (const phrase of SEED_DATA.phraseUnits) {
    await db
      .insertInto('phraseological_units')
      .values(phrase)
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  // 3. Context examples
  for (const ctx of SEED_DATA.contextExamples) {
    await db
      .insertInto('vocab_context_examples')
      .values(ctx)
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }
}
