import { z } from 'zod';

export const CANONICAL_TAXONOMY_CODES = [
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
] as const;

export const TaxonomyErrorCodeEnum = z.enum(CANONICAL_TAXONOMY_CODES);
export type TaxonomyErrorCode = z.infer<typeof TaxonomyErrorCodeEnum>;

export const SocraticClueTypeEnum = TaxonomyErrorCodeEnum;
export type SocraticClueType = z.infer<typeof SocraticClueTypeEnum>;

export const CorrectionErrorTypeEnum = TaxonomyErrorCodeEnum;
export type CorrectionErrorType = z.infer<typeof CorrectionErrorTypeEnum>;

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
    if (typeof val !== 'string') return 'AGREEMENT';
    const upper = val.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if ((CANONICAL_TAXONOMY_CODES as readonly string[]).includes(upper)) return upper;
    if (upper.includes('PREP')) return 'PREPOSITION';
    if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
    if (upper.includes('AGREE')) return 'AGREEMENT';
    if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
    if (upper.includes('COLLOC') || upper.includes('LEXIC') || upper.includes('VOCAB') || upper.includes('CHOICE')) return 'LEXICAL_COLLOCATION';
    if (upper.includes('ORDER')) return 'WORD_ORDER';
    if (upper.includes('COHESION') || upper.includes('LINKER') || upper.includes('CONNECTOR')) return 'COHESION_LINKERS';
    if (upper.includes('VARIETY') || upper.includes('COMPLEX') || upper.includes('SYNTAX')) return 'SYNTACTIC_VARIETY';
    if (upper.includes('REGISTER') || upper.includes('TONE')) return 'REGISTER';
    if (upper.includes('SPELL')) return 'SPELLING';
    return 'AGREEMENT';
  }, SocraticClueTypeEnum.catch('AGREEMENT')),
  hint_question_es: z.preprocess(stripLeadingGreetings, z.string()),
  highlighted_area: z.string(),
  sentence_context: z.preprocess((val) => (typeof val === 'string' ? val.trim() : ''), z.string().min(1, 'sentence_context is required')),
  is_l1_spanish_transfer: z.boolean().default(false),
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

export const CorrectionItemSchema = z.preprocess(
  (raw: any) => {
    if (raw && typeof raw === 'object') {
      const errorSpan = raw.error_span ?? '';
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
      if ((CANONICAL_TAXONOMY_CODES as readonly string[]).includes(upper)) return upper;
      if (upper.includes('PREP')) return 'PREPOSITION';
      if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
      if (upper.includes('AGREE')) return 'AGREEMENT';
      if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
      if (upper.includes('COLLOC') || upper.includes('LEXIC') || upper.includes('VOCAB') || upper.includes('CHOICE')) return 'LEXICAL_COLLOCATION';
      if (upper.includes('ORDER')) return 'WORD_ORDER';
      if (upper.includes('COHESION') || upper.includes('LINKER') || upper.includes('CONNECTOR')) return 'COHESION_LINKERS';
      if (upper.includes('VARIETY') || upper.includes('COMPLEX') || upper.includes('SYNTAX')) return 'SYNTACTIC_VARIETY';
      if (upper.includes('REGISTER') || upper.includes('TONE')) return 'REGISTER';
      if (upper.includes('SPELL')) return 'SPELLING';
      return 'AGREEMENT';
    }, CorrectionErrorTypeEnum.catch('AGREEMENT')),
    taxonomy_code: z.preprocess((val) => {
      if (typeof val !== 'string') return 'AGREEMENT';
      const upper = val.trim().toUpperCase().replace(/[\s-]+/g, '_');
      if ((CANONICAL_TAXONOMY_CODES as readonly string[]).includes(upper)) return upper;
      if (upper.includes('PREP')) return 'PREPOSITION';
      if (upper.includes('TENSE') || upper.includes('ASPECT') || upper.includes('VERB')) return 'TENSE_ASPECT';
      if (upper.includes('AGREE')) return 'AGREEMENT';
      if (upper.includes('FALSE') || upper.includes('FRIEND')) return 'FALSE_FRIEND';
      if (upper.includes('COLLOC') || upper.includes('LEXIC') || upper.includes('VOCAB') || upper.includes('CHOICE')) return 'LEXICAL_COLLOCATION';
      if (upper.includes('ORDER')) return 'WORD_ORDER';
      if (upper.includes('COHESION') || upper.includes('LINKER') || upper.includes('CONNECTOR')) return 'COHESION_LINKERS';
      if (upper.includes('VARIETY') || upper.includes('COMPLEX') || upper.includes('SYNTAX')) return 'SYNTACTIC_VARIETY';
      if (upper.includes('REGISTER') || upper.includes('TONE')) return 'REGISTER';
      if (upper.includes('SPELL')) return 'SPELLING';
      return 'AGREEMENT';
    }, TaxonomyErrorCodeEnum.catch('AGREEMENT')),
    is_l1_spanish_transfer: z.boolean().default(false),
    explanation_es: z.string().default(''),
    native_reformulation: z.string().default(''),
    original_sentence: z.string().default(''),
    expanded_context: z.string().default(''),
    drill: PositiveDrillSchema.optional(),
  }),
);

/**
 * Detects whether a string is composed entirely of punctuation characters or whitespace.
 */
export function isPunctuationOnlyToken(token?: string | null): boolean {
  if (!token) return false;
  const stripped = token.trim();
  if (!stripped) return false;
  return /^[\s,.:;!?'"¿¡`´\-_/\\()[\]{}«»“”‘’—–…]+$/.test(stripped);
}

/**
 * Detects whether a socratic clue inappropriately targets punctuation marks.
 * Per RF-WRT-09, punctuation is strictly excluded from writing workshop feedback.
 */
export function isPunctuationClue(clue: SocraticClue): boolean {
  if (isPunctuationOnlyToken(clue.highlighted_area)) return true;
  if (isPunctuationOnlyToken(clue.zpd_expected_token)) return true;

  const questionLower = (clue.hint_question_es || '').toLowerCase();
  const punctuationPatterns = [
    /signo\s+de\s+puntuaci[oó]n/,
    /\bpuntuaci[oó]n\b/,
    /\bcomas?\b/,
    /\bpunto\s+y\s+coma\b/,
    /\bcomma\s+splice\b/,
    /\bcomma\b/,
    /\bpunto\s+final\b/,
    /\bap[oó]strofe\b/,
    /\bsemicolon\b/,
  ];

  return punctuationPatterns.some((pattern) => pattern.test(questionLower));
}

/**
 * Detects whether a correction item inappropriately targets punctuation.
 */
export function isPunctuationCorrection(corr: CorrectionItem): boolean {
  if (isPunctuationOnlyToken(corr.error_span)) return true;
  if (isPunctuationOnlyToken(corr.native_reformulation)) return true;

  const strippedError = corr.error_span.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, '').trim().toLowerCase();
  const strippedReform = corr.native_reformulation.replace(/[.,/#!$%^&*;:{}=\-_`~()'"?]/g, '').trim().toLowerCase();
  if (strippedError.length > 0 && strippedError === strippedReform) {
    return true;
  }

  const expLower = (corr.explanation_es || '').toLowerCase();
  const punctuationPatterns = [
    /signo\s+de\s+puntuaci[oó]n/,
    /\bpuntuaci[oó]n\b/,
    /\bfalta\s+(?:una\s+)?coma\b/,
    /\bcoma\s+faltante\b/,
    /\bseparar\s+con\s+coma\b/,
    /\bcomma\s+splice\b/,
    /\bsemicolon\b/,
  ];
  return punctuationPatterns.some((pattern) => pattern.test(expLower));
}

export function sanitizeSocraticFeedback(response: SocraticFeedbackResponse): SocraticFeedbackResponse {
  const filteredClues = (response.scaffolded_clues || [])
    .filter((clue) => !isPunctuationClue(clue))
    .slice(0, 3);

  return {
    ...response,
    scaffolded_clues: filteredClues,
    error_count: filteredClues.length,
  };
}

export function sanitizeWritingEvaluation(response: WritingEvaluationResponse): WritingEvaluationResponse {
  const filteredCorrections = (response.corrections || []).filter(
    (corr) => !isPunctuationCorrection(corr),
  );

  return {
    ...response,
    corrections: filteredCorrections,
  };
}


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
  target_words_feedback: z.array(TargetWordFeedbackSchema).optional(),
});

export type WritingEvaluationResponse = z.infer<typeof WritingEvaluationResponseSchema>;
export type CorrectionItem = z.infer<typeof CorrectionItemSchema>;

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

export const ExampleSentenceItemSchema = z.object({
  sentenceEn: z.string(),
  sentenceEs: z.string(),
});

export type ExampleSentenceItem = z.infer<typeof ExampleSentenceItemSchema>;

export const GraduatedExamplesItemSchema = z.object({
  sentenceBasicEn: z.string().describe('Oración pedagógica básica (A1-B1) contextualizando este sentido'),
  sentenceBasicEs: z.string().describe('Traducción fiel y natural al español'),
  clozeTargetBasic: z.string().optional().describe('Fragmento exacto de la palabra meta a ocultar'),
  sentenceAdvancedEn: z.string().describe('Oración pedagógica avanzada (B2-C1) en un contexto formal o enriquecido'),
  sentenceAdvancedEs: z.string().describe('Traducción fiel y natural al español'),
  clozeTargetAdvanced: z.string().optional().describe('Fragmento exacto a ocultar'),
});

export type GraduatedExamplesItem = z.infer<typeof GraduatedExamplesItemSchema>;

export const PhrasalVerbItemSchema = z.object({
  text: z.string().describe('Texto completo del phrasal verb ej. run out of, give up'),
  meaningEs: z.string().describe('Significado preciso en español'),
  definitionEn: z.string().default('').describe('Definición pedagógica concisa en Learner English'),
  ipaGeneralAmerican: z.string().default('').describe('Transcripción fonética IPA GA con acentuación ej. ˌraɪt ˈdaʊn'),
  ipaReceivedPronunciation: z.string().nullable().optional().describe('Transcripción IPA RP británica o null si no difiere'),
  type: z.enum([
    'TYPE_1_INTRANSITIVE',
    'TYPE_2_SEPARABLE',
    'TYPE_3_INSEPARABLE',
    'TYPE_4_THREE_PART',
  ]).describe('Tipo sintáctico del phrasal verb'),
  pronounMustSplit: z.boolean().default(false).describe('True si los pronombres deben dividir la partícula obligatoriamente (separable)'),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1').describe('Nivel CEFR del phrasal verb'),
  example1: z.string().describe('Oración de ejemplo 1'),
  example1Es: z.string().default('').describe('Traducción fiel y natural al español de la oración 1'),
  example2: z.string().nullable().optional().describe('Oración de ejemplo 2 opcional o null'),
  example2Es: z.string().nullable().optional().describe('Traducción fiel al español de la oración 2 o null'),
});

export type PhrasalVerbItemData = z.infer<typeof PhrasalVerbItemSchema>;

export const VocabSenseSchema = z.object({
  id: z.string().default(() => `sns_${Math.random().toString(36).slice(2, 7)}`),
  contextualHint: z.string().optional(),
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
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).default('B1'),
  grammarPattern: z.string().nullable().optional(),
  countability: z.enum(['COUNTABLE', 'UNCOUNTABLE', 'BOTH']).nullable().optional(),
  connotation: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).default('NEUTRAL').optional(),
  collocations: z.array(z.string()).default([]).optional(),
  graduatedExamples: GraduatedExamplesItemSchema.optional(),
  exampleSentenceEn: z.string().default(''),
  exampleSentenceEs: z.string().default(''),
  additionalExamples: z.array(ExampleSentenceItemSchema).optional(),
});

export const VocabEnrichmentResponseSchema = z.object({
  word: z.string(),
  translationEs: z.string(),
  definitionEn: z.string(),
  ipaGeneralAmerican: z.string(),
  ipaReceivedPronunciation: z.string().nullable().optional(),
  ipaWeakForm: z.string().nullable().optional(),
  phoneticEdEnding: z.enum(['/t/', '/d/', '/ɪd/']).nullable().optional(),
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
  domainCategory: z.string().default('Uso General'),
  verbTenses: VerbTensesSchema.nullable().optional(),
  senses: z.array(VocabSenseSchema).default([]),
  phrasalVerbs: z.array(PhrasalVerbItemSchema).default([]).optional(),
  spellingCorrection: SpellingCorrectionSchema.optional(),
  isValidEnglishWord: z.boolean().default(true),
});

export type VocabEnrichmentResponse = z.infer<typeof VocabEnrichmentResponseSchema>;
export type VerbTensesData = z.infer<typeof VerbTensesSchema>;
export type VocabSenseData = z.infer<typeof VocabSenseSchema>;
export type SpellingCorrectionData = z.infer<typeof SpellingCorrectionSchema>;

