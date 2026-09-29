import { z } from 'zod';

export const SocraticClueSchema = z.object({
  paragraph_index: z.number().int().default(1),
  clue_type: z.enum(['PREPOSITION', 'TENSE_ASPECT', 'FALSE_FRIEND', 'AGREEMENT', 'WORD_CHOICE']),
  hint_question_es: z.string(),
  highlighted_area: z.string(),
});

export const SocraticFeedbackResponseSchema = z.object({
  overall_impression_es: z.string(),
  error_count: z.number().int().nonnegative(),
  allow_self_correction: z.boolean(),
  scaffolded_clues: z.array(SocraticClueSchema),
});

export type SocraticFeedbackResponse = z.infer<typeof SocraticFeedbackResponseSchema>;
export type SocraticClue = z.infer<typeof SocraticClueSchema>;

export const CorrectionItemSchema = z.object({
  error_span: z.string(),
  error_type: z.enum([
    'GRAMMAR',
    'LEXICON',
    'PREPOSITION',
    'WORD_ORDER',
    'FALSE_FRIEND',
    'PUNCTUATION',
    'REGISTER',
  ]),
  taxonomy_code: z.string(),
  is_l1_spanish_transfer: z.boolean(),
  explanation_es: z.string(),
  native_reformulation: z.string(),
});

export const MicroChallengeSchema = z.object({
  question_es: z.string(),
  sentence_with_blank: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correct_option_index: z.number().int().min(0).max(3),
  explanation_es: z.string(),
});

export const WritingEvaluationResponseSchema = z.object({
  overall_feedback_es: z.string(),
  estimated_cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  scores: z.object({
    grammar: z.number().min(0).max(10),
    vocabulary: z.number().min(0).max(10),
    coherence: z.number().min(0).max(10),
  }),
  corrections: z.array(CorrectionItemSchema),
  micro_challenge: MicroChallengeSchema,
});

export type WritingEvaluationResponse = z.infer<typeof WritingEvaluationResponseSchema>;
export type CorrectionItem = z.infer<typeof CorrectionItemSchema>;
export type MicroChallenge = z.infer<typeof MicroChallengeSchema>;
