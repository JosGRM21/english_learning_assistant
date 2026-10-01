import { z } from 'zod';

export const SocraticClueTypeEnum = z.enum([
  'PREPOSITION',
  'TENSE_ASPECT',
  'FALSE_FRIEND',
  'AGREEMENT',
  'WORD_CHOICE',
  'WORD_ORDER',
  'COLLOCATION',
  'GRAMMAR',
  'PUNCTUATION',
  'SPELLING',
]);

export type SocraticClueType = z.infer<typeof SocraticClueTypeEnum>;

export const stripLeadingGreetings = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  const cleaned = val
    .replace(/^(?:¡?hola!?|saludos\b|bienvenido[a-s]*\b|estimado[a-s]*\b|buenos días\b|buenas tardes\b)[,.:!\s\n-]*/i, '')
    .trim();
  if (!cleaned) return '';
  return cleaned.replace(/[a-záéíóúüñ]/i, (char) => char.toUpperCase());
};

export const SocraticClueSchema = z.object({
  paragraph_index: z.number().int().default(1),
  clue_type: z.preprocess((val) => {
    if (typeof val !== 'string') return 'WORD_CHOICE';
    const upper = val.trim().toUpperCase().replace(/[\s-]+/g, '_');
    const valid: string[] = [
      'PREPOSITION',
      'TENSE_ASPECT',
      'FALSE_FRIEND',
      'AGREEMENT',
      'WORD_CHOICE',
      'WORD_ORDER',
      'COLLOCATION',
      'GRAMMAR',
      'PUNCTUATION',
      'SPELLING',
    ];
    if (valid.includes(upper)) return upper;
    if (upper.includes('PREP')) return 'PREPOSITION';
    if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
    if (upper.includes('AGREE')) return 'AGREEMENT';
    if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
    if (upper.includes('ORDER') || upper.includes('SYNTAX')) return 'WORD_ORDER';
    if (upper.includes('COLLOC')) return 'COLLOCATION';
    if (upper.includes('PUNCT')) return 'PUNCTUATION';
    if (upper.includes('SPELL')) return 'SPELLING';
    if (upper.includes('GRAM')) return 'GRAMMAR';
    return 'WORD_CHOICE';
  }, SocraticClueTypeEnum.catch('WORD_CHOICE')),
  hint_question_es: z.preprocess(stripLeadingGreetings, z.string()),
  highlighted_area: z.string(),
  sentence_context: z.preprocess((val) => (typeof val === 'string' ? val.trim() : ''), z.string().min(1, 'sentence_context is required')),
  zpd_contrastive_es: z.string().optional(),
  zpd_cloze_sentence: z.string().optional(),
  zpd_expected_token: z.string().optional(),
  zpd_native_model: z.string().optional(),
});

export const SocraticFeedbackResponseSchema = z.object({
  overall_impression_es: z.preprocess(stripLeadingGreetings, z.string()),
  error_count: z.number().int().nonnegative(),
  allow_self_correction: z.boolean(),
  scaffolded_clues: z.array(SocraticClueSchema),
});

export type SocraticFeedbackResponse = z.infer<typeof SocraticFeedbackResponseSchema>;
export type SocraticClue = z.infer<typeof SocraticClueSchema>;

export const CorrectionErrorTypeEnum = z.enum([
  'GRAMMAR',
  'LEXICON',
  'PREPOSITION',
  'WORD_ORDER',
  'FALSE_FRIEND',
  'PUNCTUATION',
  'REGISTER',
  'TENSE_ASPECT',
  'AGREEMENT',
  'WORD_CHOICE',
  'COLLOCATION',
  'SPELLING',
]);

export type CorrectionErrorType = z.infer<typeof CorrectionErrorTypeEnum>;

export const CorrectionItemSchema = z.object({
  error_span: z.string(),
  error_type: z.preprocess((val) => {
    if (typeof val !== 'string') return 'GRAMMAR';
    const upper = val.trim().toUpperCase().replace(/[\s-]+/g, '_');
    const valid: string[] = [
      'GRAMMAR',
      'LEXICON',
      'PREPOSITION',
      'WORD_ORDER',
      'FALSE_FRIEND',
      'PUNCTUATION',
      'REGISTER',
      'TENSE_ASPECT',
      'AGREEMENT',
      'WORD_CHOICE',
      'COLLOCATION',
      'SPELLING',
    ];
    if (valid.includes(upper)) return upper;
    if (upper.includes('PREP')) return 'PREPOSITION';
    if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
    if (upper.includes('AGREE')) return 'AGREEMENT';
    if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
    if (upper.includes('ORDER') || upper.includes('SYNTAX')) return 'WORD_ORDER';
    if (upper.includes('PUNCT')) return 'PUNCTUATION';
    if (upper.includes('SPELL')) return 'SPELLING';
    if (upper.includes('COLLOC')) return 'COLLOCATION';
    if (upper.includes('WORD') || upper.includes('VOCAB') || upper.includes('LEXIC')) return 'LEXICON';
    return 'GRAMMAR';
  }, CorrectionErrorTypeEnum.catch('GRAMMAR')),
  taxonomy_code: z.string().default('L1_TRANSFER_GENERIC'),
  is_l1_spanish_transfer: z.boolean().default(true),
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

export const SuccessfulRepairItemSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    return {
      original_snippet: '',
      corrected_snippet: val,
      praise_es: val,
    };
  }
  return val;
}, z.object({
  original_snippet: z.string().default(''),
  corrected_snippet: z.string().default(''),
  praise_es: z.string(),
}));

export type SuccessfulRepairItem = z.infer<typeof SuccessfulRepairItemSchema>;

export const WritingEvaluationResponseSchema = z.object({
  overall_feedback_es: z.preprocess(stripLeadingGreetings, z.string()),
  estimated_cefr: z.preprocess((val) => {
    if (typeof val === 'string') {
      const upper = val.trim().toUpperCase();
      if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(upper)) return upper;
    }
    return 'B1';
  }, z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).catch('B1')),
  scores: z.object({
    grammar: z.number().min(0).max(10),
    vocabulary: z.number().min(0).max(10),
    coherence: z.number().min(0).max(10),
  }),
  successful_repairs: z.array(SuccessfulRepairItemSchema).default([]),
  corrections: z.array(CorrectionItemSchema),
  micro_challenge: MicroChallengeSchema,
  micro_challenges: z.array(MicroChallengeSchema).optional(),
});

export type WritingEvaluationResponse = z.infer<typeof WritingEvaluationResponseSchema>;
export type CorrectionItem = z.infer<typeof CorrectionItemSchema>;
export type MicroChallenge = z.infer<typeof MicroChallengeSchema>;

export const VocabEnrichmentResponseSchema = z.object({
  word: z.string(),
  translationEs: z.string(),
  definitionEn: z.string(),
  ipaGeneralAmerican: z.string(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  partOfSpeech: z.enum([
    'NOUN',
    'VERB',
    'ADJECTIVE',
    'ADVERB',
    'PREPOSITION',
    'CONJUNCTION',
    'ARTICLE_DETERMINER',
    'PRONOUN',
    'INTERJECTION',
  ]),
  grammaticalDimension: z.enum(['CONTENT', 'FUNCTION', 'CHUNK']),
  exampleSentenceEn: z.string(),
  exampleSentenceEs: z.string(),
  isFalseFriend: z.boolean(),
  falseFriendNote: z.string().nullable().optional(),
  morphologicalFamily: z.array(z.string()).default([]),
});

export type VocabEnrichmentResponse = z.infer<typeof VocabEnrichmentResponseSchema>;

