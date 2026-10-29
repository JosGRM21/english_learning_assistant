import { z } from 'zod';
import {
  SocraticFeedbackResponseSchema,
  WritingEvaluationResponseSchema,
  CANONICAL_TAXONOMY_CODES,
  TaxonomyErrorCodeEnum,
} from '../../src/infrastructure/ai/schemas';
import { GoldenSampleCategoryEnum, ExpectedBehaviorEnum } from './golden-dataset.schema';

/**
 * Aserciones canónicas específicas para la Fase 1: Pistas Socráticas y Andamiaje ZPD.
 */
export const WritingSocraticAssertionsSchema = z.object({
  max_clues: z.number().int().min(1).max(5).default(3),
  disallow_punctuation: z.boolean().default(true),
  disallow_greetings: z.boolean().default(true),
  expected_taxonomy_codes: z.array(TaxonomyErrorCodeEnum).default([]),
  forbidden_taxonomy_codes: z.array(TaxonomyErrorCodeEnum).default([]),
  require_l1_transfer_flag: z.boolean().optional(),
  target_error_count_min: z.number().int().nonnegative().optional(),
  target_error_count_max: z.number().int().nonnegative().optional(),
});

export type WritingSocraticAssertions = z.infer<typeof WritingSocraticAssertionsSchema>;

/**
 * Muestra dorada para la Fase 1: Taller de Redacción Socrática.
 */
export const WritingSocraticSampleSchema = z.object({
  id: z.string().regex(/^GS-WRT-SOC-\d{3,4}$/, 'ID debe tener formato GS-WRT-SOC-XXX'),
  category: GoldenSampleCategoryEnum,
  domain: z.literal('writing_socratic'),
  subdomain: z.string().default('socratic_scaffolding'),
  user_input: z.string().min(1, 'El texto del borrador no puede estar vacío'),
  context: z
    .object({
      cefrTarget: z.string().default('B1'),
      readingContext: z.string().optional(),
      missionInstructions: z.string().optional(),
      targetWords: z.array(z.string()).optional(),
    })
    .optional(),
  expected_behavior: ExpectedBehaviorEnum.default('respond'),
  criticality: z.number().int().min(1).max(5),
  mandatory_facts: z.array(z.string()).default([]),
  prohibited_terms: z.array(z.string()).default([]),
  canonical_assertions: WritingSocraticAssertionsSchema.default({}),
  expected_output: SocraticFeedbackResponseSchema,
  rationale_es: z.string().min(1, 'Justificación pedagógica obligatoria'),
  curated_by: z.string().min(1),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD'),
});

export type WritingSocraticSample = z.infer<typeof WritingSocraticSampleSchema>;

/**
 * Golden Dataset completo para Fase 1.
 */
export const WritingSocraticDatasetSchema = z.object({
  version: z.string().regex(/^v\d+\.\d+\.\d+$/),
  domain: z.literal('writing_socratic'),
  description: z.string(),
  updated_at: z.string(),
  samples: z.array(WritingSocraticSampleSchema).min(1),
});

export type WritingSocraticDataset = z.infer<typeof WritingSocraticDatasetSchema>;

/**
 * Aserciones canónicas específicas para la Fase 2: Evaluación Final y Doble Reformulación.
 */
export const WritingEvaluationAssertionsSchema = z.object({
  disallow_punctuation_in_corrections: z.boolean().default(true),
  disallow_greetings: z.boolean().default(true),
  min_noticing_contrasts: z.number().int().nonnegative().default(1),
  expected_cefr_range: z.array(z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])).optional(),
  expected_repaired_snippets: z.array(z.string()).default([]),
  expected_unrepaired_snippets: z.array(z.string()).default([]),
  expected_target_words_detected: z.array(z.string()).default([]),
  min_voice_preservation_similarity: z.number().min(0).max(1).default(0.75),
});

export type WritingEvaluationAssertions = z.infer<typeof WritingEvaluationAssertionsSchema>;

/**
 * Muestra dorada para la Fase 2: Evaluación Final, Doble Reformulación y Noticing the Gap.
 */
export const WritingEvaluationSampleSchema = z.object({
  id: z.string().regex(/^GS-WRT-EVAL-\d{3,4}$/, 'ID debe tener formato GS-WRT-EVAL-XXX'),
  category: GoldenSampleCategoryEnum,
  domain: z.literal('writing_evaluation'),
  subdomain: z.string().default('double_recast_evaluation'),
  user_input: z.string().min(1, 'El borrador 2 no puede estar vacío'),
  context: z.object({
    draft1: z.string().min(1, 'Borrador 1 previo es obligatorio'),
    cefrTarget: z.string().default('B1'),
    readingContext: z.string().optional(),
    missionInstructions: z.string().optional(),
    targetWords: z.array(z.string()).optional(),
  }),
  expected_behavior: ExpectedBehaviorEnum.default('respond'),
  criticality: z.number().int().min(1).max(5),
  mandatory_facts: z.array(z.string()).default([]),
  prohibited_terms: z.array(z.string()).default([]),
  canonical_assertions: WritingEvaluationAssertionsSchema.default({}),
  expected_output: WritingEvaluationResponseSchema,
  rationale_es: z.string().min(1, 'Justificación pedagógica obligatoria'),
  curated_by: z.string().min(1),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD'),
});

export type WritingEvaluationSample = z.infer<typeof WritingEvaluationSampleSchema>;

/**
 * Golden Dataset completo para Fase 2.
 */
export const WritingEvaluationDatasetSchema = z.object({
  version: z.string().regex(/^v\d+\.\d+\.\d+$/),
  domain: z.literal('writing_evaluation'),
  description: z.string(),
  updated_at: z.string(),
  samples: z.array(WritingEvaluationSampleSchema).min(1),
});

export type WritingEvaluationDataset = z.infer<typeof WritingEvaluationDatasetSchema>;
