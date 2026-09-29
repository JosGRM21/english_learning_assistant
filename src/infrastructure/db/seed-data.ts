import {
  DatabaseSchema,
  VocabItemsTable,
  PhraseologicalUnitsTable,
  VocabContextExamplesTable,
  PhoneticRulesTable,
  GrammarRulesTable,
  ErrorTaxonomyTable,
} from '../../core/types/database';
import { Kysely, Insertable } from 'kysely';

export interface SeedDataset {
  vocabItems: Insertable<VocabItemsTable>[];
  phraseUnits: Insertable<PhraseologicalUnitsTable>[];
  contextExamples: Insertable<VocabContextExamplesTable>[];
  phoneticRules: Insertable<PhoneticRulesTable>[];
  grammarRules: Insertable<GrammarRulesTable>[];
  errorTaxonomy: Insertable<ErrorTaxonomyTable>[];
}

/**
 * Clean empty dataset. The application starts with an empty database.
 * No mock or preloaded data is bundled for the UI.
 */
export const SEED_DATA: SeedDataset = {
  vocabItems: [],
  phraseUnits: [],
  contextExamples: [],
  phoneticRules: [],
  grammarRules: [],
  errorTaxonomy: [],
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

  // 4. Phonetic rules
  for (const rule of SEED_DATA.phoneticRules) {
    await db
      .insertInto('phonetic_rules')
      .values(rule)
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  // 5. Grammar rules
  for (const grammar of SEED_DATA.grammarRules) {
    await db
      .insertInto('grammar_rules')
      .values(grammar)
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }

  // 6. Error taxonomy
  for (const taxon of SEED_DATA.errorTaxonomy) {
    await db
      .insertInto('error_taxonomy')
      .values(taxon)
      .onConflict((oc) => oc.column('id').doNothing())
      .execute();
  }
}
