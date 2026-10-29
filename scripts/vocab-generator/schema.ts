import { z } from 'zod';

export const VerbTensesSchema = z.object({
  infinitive: z.string().describe('Forma infinitiva del verbo'),
  thirdPersonPresent: z.string().describe('Tercera persona singular del presente'),
  pastSimple: z.string().describe('Pasado simple'),
  pastParticiple: z.string().describe('Participio pasado'),
  gerund: z.string().describe('Gerundio (-ing)'),
  isIrregular: z.boolean().describe('True si el verbo es irregular'),
});

export const GraduatedExamplesSchema = z.object({
  sentenceBasicEn: z.string().describe('Oración pedagógica básica (A1-B1) contextualizando este sentido'),
  sentenceBasicEs: z.string().describe('Traducción fiel y natural al español'),
  clozeTargetBasic: z.string().describe('Fragmento exacto que corresponde a la palabra meta o su forma flexionada a ocultar'),
  sentenceAdvancedEn: z.string().describe('Oración pedagógica avanzada (B2-C1) en un contexto formal o enriquecido'),
  sentenceAdvancedEs: z.string().describe('Traducción fiel y natural al español'),
  clozeTargetAdvanced: z.string().describe('Fragmento exacto que corresponde a la palabra meta o su forma flexionada a ocultar'),
});

export const SenseItemSchema = z.object({
  senseId: z.string().describe('Identificador corto ej. sense_1, sense_2'),
  contextualHint: z.string().describe('Clave o contexto para desambiguar el significado ej: run a business, run 5 miles'),
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
  ]).describe('Categoría gramatical precisa para este sentido'),
  definitionEn: z.string().describe('Definición clara en Learner English'),
  translationEs: z.string().describe('Traducción principal precisa en español para este sentido'),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).describe('Nivel CEFR específico para este sentido'),
  grammarPattern: z.string().nullable().describe('Patrón sintáctico o régimen ej: verb + -ing, depend + ON. null si no aplica'),
  countability: z.enum(['COUNTABLE', 'UNCOUNTABLE', 'BOTH']).nullable().describe('COUNTABLE, UNCOUNTABLE o BOTH para sustantivos. null para otras categorías'),
  connotation: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).describe('Connotación del término en este sentido'),
  graduatedExamples: GraduatedExamplesSchema.describe('Ejemplos básicos y avanzados obligatorios para esta acepción'),
});

export const PhrasalVerbSchema = z.object({
  text: z.string().describe('Texto completo del phrasal verb ej. run out of, give up'),
  meaningEs: z.string().describe('Significado preciso en español'),
  definitionEn: z.string().describe('Definición clara y pedagógica en Learner English'),
  ipaGeneralAmerican: z.string().describe('Transcripción fonética IPA GA con acentuación ej. ˌraɪt ˈdaʊn'),
  ipaReceivedPronunciation: z.string().nullable().describe('Transcripción IPA RP británica o null si no difiere'),
  type: z.enum([
    'TYPE_1_INTRANSITIVE',
    'TYPE_2_SEPARABLE',
    'TYPE_3_INSEPARABLE',
    'TYPE_4_THREE_PART',
  ]).describe('Tipo sintáctico del phrasal verb'),
  pronounMustSplit: z.boolean().describe('True si los pronombres deben dividir la partícula obligatoriamente (separable)'),
  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']).describe('Nivel CEFR del phrasal verb'),
  example1: z.string().describe('Oración de ejemplo 1'),
  example1Es: z.string().describe('Traducción fiel y natural al español de la oración 1'),
  example2: z.string().nullable().describe('Oración de ejemplo 2 opcional o null'),
  example2Es: z.string().nullable().describe('Traducción fiel y natural al español de la oración 2 o null'),
});

export const GeneratedVocabWordSchema = z.object({
  word: z.string().describe('Lema o palabra base en minúsculas'),
  grammaticalDimension: z.enum(['CONTENT', 'FUNCTION', 'CHUNK']).describe('Dimensión gramatical'),
  frequencyBand: z.enum(['TOP_500', 'TOP_1000', 'TOP_3000', 'TOP_5000']).describe('Banda de frecuencia léxica'),
  ipaGeneralAmerican: z.string().describe('Transcripción IPA GA estándar ej: rʌn'),
  ipaReceivedPronunciation: z.string().nullable().describe('Transcripción IPA RP británica o null si no difiere'),
  ipaWeakForm: z.string().nullable().describe('Forma débil reducida a Schwa para palabras funcionales en habla conectada, o null'),
  phoneticEdEnding: z.enum(['/t/', '/d/', '/ɪd/']).nullable().describe('Alófono del sufijo -ed para verbos regulares en pasado, o null'),
  verbTenses: VerbTensesSchema.nullable().describe('Conjugación completa si funciona como verbo, o null'),
  isFalseFriend: z.boolean().describe('True si es un falso amigo gráfico con el español'),
  falseFriendNote: z.string().nullable().describe('Explicación y alternativa en español si isFalseFriend es true, o null'),
  register: z.enum(['FORMAL', 'INFORMAL', 'NEUTRAL', 'ACADEMIC', 'SLANG']).describe('Registro de uso'),
  senses: z.array(SenseItemSchema).describe('1 a 3 acepciones principales jerarquizadas por frecuencia de uso real'),
  phrasalVerbs: z.array(PhrasalVerbSchema).describe('De 1 a 4 phrasal verbs esenciales vinculados al lema, o array vacío'),
});

export const BatchVocabResponseSchema = z.object({
  items: z.array(GeneratedVocabWordSchema).describe('Lista de lemas enriquecidos generados'),
});

export type PhrasalVerbItem = z.infer<typeof PhrasalVerbSchema>;
export type GeneratedVocabWord = z.infer<typeof GeneratedVocabWordSchema>;
export type BatchVocabResponse = z.infer<typeof BatchVocabResponseSchema>;
