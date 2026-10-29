import { z } from 'zod';

export const GoldenSampleCategoryEnum = z.enum([
  'nominal',
  'edge_case',
  'adversarial',
  'out_of_domain',
]);
export type GoldenSampleCategory = z.infer<typeof GoldenSampleCategoryEnum>;

export const ExpectedBehaviorEnum = z.enum([
  'respond',
  'refuse',
  'correct_spelling',
  'reject_non_word',
]);
export type ExpectedBehavior = z.infer<typeof ExpectedBehaviorEnum>;

export const CanonicalAssertionsSchema = z.object({
  disallow_punctuation_in_tokens: z.boolean().default(true),
  require_valid_english_word: z.boolean().default(true),
  min_senses: z.number().int().min(0).default(1),
  max_senses: z.number().int().max(10).default(3),
  require_weak_form: z.boolean().optional(),
  require_phonetic_ed_ending: z.enum(['/t/', '/d/', '/ɪd/']).optional(),
  require_verb_tenses: z.boolean().optional(),
  require_false_friend: z.boolean().optional(),
  expected_grammatical_dimension: z.enum(['CONTENT', 'FUNCTION', 'CHUNK']).optional(),
  expected_primary_part_of_speech: z.string().optional(),
});
export type CanonicalAssertions = z.infer<typeof CanonicalAssertionsSchema>;

export const GoldenSampleSchema = z.object({
  id: z.string().regex(/^GS-[A-Z]+-\d{3,4}$/, 'ID debe tener formato GS-[DOMINIO]-[NUMERO] ej. GS-VOCAB-001'),
  category: GoldenSampleCategoryEnum,
  domain: z.literal('vocab_enrichment'),
  subdomain: z.string().default('lexical_card'),
  user_input: z.string().min(1, 'user_input no puede estar vacío'),
  context: z.record(z.string(), z.unknown()).optional(),
  expected_behavior: ExpectedBehaviorEnum.default('respond'),
  criticality: z.number().int().min(1).max(5),
  mandatory_facts: z.array(z.string()).default([]),
  prohibited_terms: z.array(z.string()).default([]),
  canonical_assertions: CanonicalAssertionsSchema.default({}),
  expected_output: z.record(z.string(), z.unknown()),
  curated_by: z.string().min(1),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD'),
  rationale_es: z.string().min(1, 'Justificación pedagógica o adversarial obligatoria'),
});
export type GoldenSample = z.infer<typeof GoldenSampleSchema>;

export const GoldenDatasetSchema = z.object({
  version: z.string().regex(/^v\d+\.\d+\.\d+$/, 'Version debe seguir formato semver ej. v1.0.0'),
  domain: z.literal('vocab_enrichment'),
  description: z.string(),
  updated_at: z.string(),
  samples: z.array(GoldenSampleSchema).min(1),
});
export type GoldenDataset = z.infer<typeof GoldenDatasetSchema>;
