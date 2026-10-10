import { z } from 'zod';

export const SocraticClueTypeEnum = z.enum([
  'PREPOSITION',
  'TENSE_ASPECT',
  'FALSE_FRIEND',
  'AGREEMENT',
  'LEXICAL_COLLOCATION',
  'WORD_ORDER',
  'COHESION_LINKERS',
  'SYNTACTIC_VARIETY',
  'REGISTER',
  'SPELLING',
  // Legacy / synonym fallbacks
  'WORD_CHOICE',
  'COLLOCATION',
  'GRAMMAR',
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
      'LEXICAL_COLLOCATION',
      'WORD_ORDER',
      'COHESION_LINKERS',
      'SYNTACTIC_VARIETY',
      'REGISTER',
      'SPELLING',
      'WORD_CHOICE',
      'COLLOCATION',
      'GRAMMAR',
    ];
    if (valid.includes(upper)) return upper;
    if (upper.includes('PREP')) return 'PREPOSITION';
    if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
    if (upper.includes('AGREE')) return 'AGREEMENT';
    if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
    if (upper.includes('ORDER') || upper.includes('SYNTAX')) return 'WORD_ORDER';
    if (upper.includes('COLLOC') || upper.includes('LEXIC') || upper.includes('VOCAB')) return 'LEXICAL_COLLOCATION';
    if (upper.includes('COHESION') || upper.includes('LINKER') || upper.includes('CONNECTOR')) return 'COHESION_LINKERS';
    if (upper.includes('VARIETY') || upper.includes('COMPLEX')) return 'SYNTACTIC_VARIETY';
    if (upper.includes('REGISTER') || upper.includes('TONE')) return 'REGISTER';
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
  overall_impression_es: z.preprocess(stripLeadingGreetings, z.string().default('Observaciones del mentor.')),
  error_count: z.number().int().nonnegative().default(0),
  allow_self_correction: z.boolean().default(true),
  scaffolded_clues: z.array(SocraticClueSchema).default([]),
});

export type SocraticFeedbackResponse = z.infer<typeof SocraticFeedbackResponseSchema>;
export type SocraticClue = z.infer<typeof SocraticClueSchema>;

export const TaxonomyErrorCodeEnum = z.enum([
  'PREPOSITION',
  'TENSE_ASPECT',
  'FALSE_FRIEND',
  'AGREEMENT',
  'LEXICAL_COLLOCATION',
  'WORD_ORDER',
  'COHESION_LINKERS',
  'SYNTACTIC_VARIETY',
  'REGISTER',
  'SPELLING',
]);

export type TaxonomyErrorCode = z.infer<typeof TaxonomyErrorCodeEnum>;

export const CorrectionErrorTypeEnum = z.enum([
  'PREPOSITION',
  'TENSE_ASPECT',
  'FALSE_FRIEND',
  'AGREEMENT',
  'LEXICAL_COLLOCATION',
  'WORD_ORDER',
  'COHESION_LINKERS',
  'SYNTACTIC_VARIETY',
  'REGISTER',
  'SPELLING',
  // Normalized legacy / synonym fallbacks:
  'GRAMMAR',
  'LEXICON',
  'WORD_CHOICE',
  'COLLOCATION',
]);

export type CorrectionErrorType = z.infer<typeof CorrectionErrorTypeEnum>;

export const PositiveDrillFormatEnum = z.enum([
  'CONTEXTUAL_CLOZE',
  'C_TEST',
  'SENTENCE_REWRITE',
  'CHUNK_SCRAMBLE',
]);

export type PositiveDrillFormat = z.infer<typeof PositiveDrillFormatEnum>;

export const PositiveDrillSchema = z.object({
  format: PositiveDrillFormatEnum.default('CONTEXTUAL_CLOZE').optional(),
  // CONTEXTUAL_CLOZE
  cloze_sentence: z.string().optional(),
  expected_token: z.string().optional(),
  hint_es: z.string().optional(),
  options: z.array(z.string()).optional(),
  correct_option_index: z.number().int().optional(),
  // C_TEST
  sentence_with_prefix: z.string().optional(),
  c_test_prefix: z.string().optional(),
  expected_length: z.number().int().positive().optional(),
  // SENTENCE_REWRITE
  prompt_instruction_es: z.string().optional(),
  source_sentence: z.string().optional(),
  mandatory_keyword: z.string().optional(),
  model_solution: z.string().optional(),
  // CHUNK_SCRAMBLE
  scrambled_chunks: z.array(z.string()).optional(),
  correct_sequence: z.array(z.string()).optional(),
  // Pedagogical explanations
  explanation_es: z.string().default(''),
  transfer_prompt_es: z.string().optional(),
});

export type PositiveDrill = z.infer<typeof PositiveDrillSchema>;
export const ErrorPracticeDrillSchema = PositiveDrillSchema;
export type ErrorPracticeDrill = PositiveDrill;

export const CorrectionItemSchema = z.preprocess(
  (raw: any) => {
    if (raw && typeof raw === 'object') {
      const errorSpan =
        raw.error_span ||
        raw.user_fragment ||
        raw.original_snippet ||
        raw.highlighted_area ||
        raw.mistake ||
        raw.original_sentence ||
        '';
      return {
        ...raw,
        error_span: typeof errorSpan === 'string' ? errorSpan : String(errorSpan ?? ''),
      };
    }
    return raw;
  },
  z.object({
    error_span: z.string().default(''),
    error_type: z.preprocess((val) => {
      if (typeof val !== 'string') return 'AGREEMENT';
      const upper = val.trim().toUpperCase().replace(/[\s-]+/g, '_');
      const valid: string[] = [
        'PREPOSITION',
        'TENSE_ASPECT',
        'FALSE_FRIEND',
        'AGREEMENT',
        'LEXICAL_COLLOCATION',
        'WORD_ORDER',
        'COHESION_LINKERS',
        'SYNTACTIC_VARIETY',
        'REGISTER',
        'SPELLING',
      ];
      if (valid.includes(upper)) return upper;
      if (upper.includes('PREP')) return 'PREPOSITION';
      if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
      if (upper.includes('AGREE')) return 'AGREEMENT';
      if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
      if (upper.includes('COLLOC') || upper.includes('LEXIC') || upper.includes('WORD_CHOICE') || upper.includes('VOCAB')) return 'LEXICAL_COLLOCATION';
      if (upper.includes('ORDER') || upper.includes('SYNTAX')) return 'WORD_ORDER';
      if (upper.includes('COHESION') || upper.includes('LINKER') || upper.includes('CONNECTOR')) return 'COHESION_LINKERS';
      if (upper.includes('VARIETY') || upper.includes('COMPLEX')) return 'SYNTACTIC_VARIETY';
      if (upper.includes('REGISTER') || upper.includes('TONE')) return 'REGISTER';
      if (upper.includes('SPELL')) return 'SPELLING';
      if (upper.includes('GRAM')) return 'AGREEMENT';
      return 'AGREEMENT';
    }, CorrectionErrorTypeEnum.catch('AGREEMENT')),
    taxonomy_code: z.string().default('PREPOSITION'),
    is_l1_spanish_transfer: z.boolean().default(true),
    explanation_es: z.string().default(''),
    native_reformulation: z.string().default(''),
    original_sentence: z.string().default(''),
    expanded_context: z.string().default(''),
    drill: PositiveDrillSchema.optional(),
  }),
);

export const RubricScoresSchema = z.object({
  accuracy: z.number().min(0).max(10),
  range_and_precision: z.number().min(0).max(10),
  cohesion_and_flow: z.number().min(0).max(10),
  pragmatics_and_complexity: z.number().min(0).max(10),
});

export type RubricScores = z.infer<typeof RubricScoresSchema>;

export const NoticingTheGapItemSchema = z.object({
  user_fragment: z.string(),
  native_fragment: z.string(),
  noticing_note_es: z.string(),
});

export type NoticingTheGapItem = z.infer<typeof NoticingTheGapItemSchema>;

export const MicroChallengeSchema = z.object({
  question_es: z.string().optional(),
  sentence_with_blank: z.string().optional(),
  options: z.array(z.string()).optional(),
  correct_option_index: z.number().int().optional(),
  explanation_es: z.string().optional(),
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

export const TargetWordFeedbackSchema = z.object({
  word: z.string(),
  used: z.boolean().default(true),
  is_natural: z.boolean().default(true),
  feedback_es: z.string().default(''),
});

export type TargetWordFeedback = z.infer<typeof TargetWordFeedbackSchema>;

export const WritingEvaluationResponseSchema = z.object({
  overall_feedback_es: z.preprocess(stripLeadingGreetings, z.string().default('Evaluación formativa completada.')),
  clean_structural_version: z.string().default(''),
  native_recast_version: z.string().default(''),
  noticing_the_gap_contrasts: z.array(NoticingTheGapItemSchema).default([]),
  rubric_scores: RubricScoresSchema.default({
    accuracy: 8,
    range_and_precision: 8,
    cohesion_and_flow: 8,
    pragmatics_and_complexity: 8,
  }),
  scores: z.object({
    grammar: z.number().min(0).max(10),
    vocabulary: z.number().min(0).max(10),
    coherence: z.number().min(0).max(10),
  }).default({ grammar: 8, vocabulary: 8, coherence: 8 }),
  estimated_cefr: z.preprocess((val) => {
    if (typeof val === 'string') {
      const upper = val.trim().toUpperCase();
      if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(upper)) return upper;
    }
    return 'B1';
  }, z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).catch('B1')),
  qualitative_recommendations_es: z.preprocess((val) => {
    if (Array.isArray(val)) {
      return val.map((item) => (typeof item === 'string' ? item.trim() : String(item))).filter(Boolean).join('\n');
    }
    if (typeof val === 'string') {
      return val;
    }
    return '';
  }, z.string().default('')),
  successful_repairs: z.array(SuccessfulRepairItemSchema).default([]),
  corrections: z.array(CorrectionItemSchema).default([]),
  micro_challenge: MicroChallengeSchema.optional(),
  micro_challenges: z.array(MicroChallengeSchema).optional(),
  target_words_feedback: z.array(TargetWordFeedbackSchema).optional(),
});

export type WritingEvaluationResponse = z.infer<typeof WritingEvaluationResponseSchema>;
export type CorrectionItem = z.infer<typeof CorrectionItemSchema>;
export type MicroChallenge = z.infer<typeof MicroChallengeSchema>;

export const SpellingCorrectionSchema = z.object({
  hasCorrection: z.boolean().default(false),
  originalInput: z.string().default(''),
  correctedWord: z.string().default(''),
  explanationEs: z.string().optional(),
});

export const VerbTensesSchema = z.object({
  infinitive: z.string(),
  pastSimple: z.string(),
  pastParticiple: z.string(),
  thirdPersonPresent: z.string(),
  gerund: z.string(),
  isIrregular: z.boolean().default(false),
  edPhoneticEnding: z.preprocess((val) => {
    if (typeof val !== 'string') return null;
    const v = val.trim();
    if (v.includes('/t/') || v === 't') return '/t/';
    if (v.includes('/d/') || v === 'd') return '/d/';
    if (v.includes('/ɪd/') || v.includes('/id/') || v === 'id' || v === 'ɪd') return '/ɪd/';
    return null;
  }, z.enum(['/t/', '/d/', '/ɪd/']).nullable().optional()),
});

export const StructuredFamilySchema = z.object({
  nouns: z.array(z.string()).default([]),
  verbs: z.array(z.string()).default([]),
  adjectives: z.array(z.string()).default([]),
  adverbs: z.array(z.string()).default([]),
});

export const ExampleSentenceItemSchema = z.object({
  sentenceEn: z.string(),
  sentenceEs: z.string(),
});

export type ExampleSentenceItem = z.infer<typeof ExampleSentenceItemSchema>;

export const VocabSenseSchema = z.object({
  id: z.string().default(() => `sns_${Math.random().toString(36).slice(2, 7)}`),
  domainCategory: z.string().default('Uso General'),
  translationEs: z.string(),
  definitionEn: z.string(),
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
  ]).default('NOUN'),
  exampleSentenceEn: z.string(),
  exampleSentenceEs: z.string(),
  additionalExamples: z.array(ExampleSentenceItemSchema).optional(),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1'),
});

export const VocabEnrichmentResponseSchema = z.object({
  word: z.string(),
  translationEs: z.string(),
  definitionEn: z.string(),
  ipaGeneralAmerican: z.string(),
  ipaReceivedPronunciation: z.string().optional(),
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
  collocations: z.array(z.string()).default([]).optional(),
  exampleSentenceEn: z.string(),
  exampleSentenceEs: z.string(),
  graduatedExamples: z.object({
    basicExampleEn: z.string(),
    basicExampleEs: z.string(),
    advancedExampleEn: z.string(),
    advancedExampleEs: z.string(),
  }).optional(),
  additionalExamples: z.array(ExampleSentenceItemSchema).optional(),
  isFalseFriend: z.boolean(),
  falseFriendNote: z.string().nullable().optional(),
  morphologicalFamily: z.array(z.string()).default([]),
  domainCategory: z.string().default('Uso General'),
  verbTenses: VerbTensesSchema.nullable().optional(),
  structuredFamily: StructuredFamilySchema.default({ nouns: [], verbs: [], adjectives: [], adverbs: [] }),
  senses: z.array(VocabSenseSchema).default([]),
  spellingCorrection: SpellingCorrectionSchema.optional(),
  isValidEnglishWord: z.boolean().default(true),
});

export type VocabEnrichmentResponse = z.infer<typeof VocabEnrichmentResponseSchema>;
export type VerbTensesData = z.infer<typeof VerbTensesSchema>;
export type StructuredFamilyData = z.infer<typeof StructuredFamilySchema>;
export type VocabSenseData = z.infer<typeof VocabSenseSchema>;
export type SpellingCorrectionData = z.infer<typeof SpellingCorrectionSchema>;

