export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type FrequencyBand = 'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000';

export type VocabMasteryStatus =
  | 'INACTIVE'
  | 'LEARNING'
  | 'NEW'
  | 'RECEPTIVE_MASTERY'
  | 'RECEPTIVE_MASTERED'
  | 'PRODUCTIVE_MASTERY'
  | 'PRODUCTIVE_ACTIVE';

export type GrammaticalBadge = '[v]' | '[n]' | '[adj]' | '[adv]' | '[phr]';

export type GrammaticalDimension = 'CONTENT' | 'FUNCTION' | 'CHUNK';

export type PartOfSpeech =
  | 'NOUN'
  | 'VERB'
  | 'ADJECTIVE'
  | 'ADVERB'
  | 'PREPOSITION'
  | 'CONJUNCTION'
  | 'ARTICLE_DETERMINER'
  | 'PRONOUN'
  | 'INTERJECTION';

export const PART_OF_SPEECH_LABELS_ES: Record<PartOfSpeech, string> = {
  NOUN: 'Sustantivo',
  VERB: 'Verbo',
  ADJECTIVE: 'Adjetivo',
  ADVERB: 'Adverbio',
  PREPOSITION: 'Preposición',
  CONJUNCTION: 'Conjunción',
  ARTICLE_DETERMINER: 'Artículo / Det.',
  PRONOUN: 'Pronombre',
  INTERJECTION: 'Interjección',
};

export const PART_OF_SPEECH_BADGES: Record<PartOfSpeech, GrammaticalBadge> = {
  VERB: '[v]',
  NOUN: '[n]',
  ADJECTIVE: '[adj]',
  ADVERB: '[adv]',
  PREPOSITION: '[phr]',
  CONJUNCTION: '[phr]',
  ARTICLE_DETERMINER: '[phr]',
  PRONOUN: '[phr]',
  INTERJECTION: '[phr]',
};

export const GRAMMATICAL_DIMENSION_LABELS_ES: Record<GrammaticalDimension, string> = {
  CONTENT: 'Contenido Léxico',
  FUNCTION: 'Palabra Funcional',
  CHUNK: 'Expresión / Frase',
};

export type ChunkType =
  | 'COLLOCATION'
  | 'PHRASAL_VERB'
  | 'IDIOM'
  | 'BINOMIAL'
  | 'SENTENCE_FRAME';

export type PhrasalVerbType =
  | 'TYPE_1_INTRANSITIVE'
  | 'TYPE_2_SEPARABLE'
  | 'TYPE_3_INSEPARABLE'
  | 'TYPE_4_THREE_PART';

export interface VerbTenses {
  infinitive: string;
  pastSimple: string;
  pastParticiple: string;
  thirdPersonPresent: string;
  gerund: string;
  isIrregular: boolean;
  edPhoneticEnding?: '/t/' | '/d/' | '/ɪd/' | null;
}

export interface StructuredWordFamily {
  nouns?: string[];
  verbs?: string[];
  adjectives?: string[];
  adverbs?: string[];
}

export interface VocabSense {
  id?: string;
  senseId?: string;
  contextualHint?: string;
  domainCategory?: string; // Automatic domain category assigned by AI (e.g. "Finanzas", "Tecnología", "Uso Coloquial", "Sentido Literal")
  translationEs: string;
  definitionEn: string;
  partOfSpeech: PartOfSpeech;
  exampleSentenceEn?: string;
  exampleSentenceEs?: string;
  additionalExamples?: Array<{ sentenceEn: string; sentenceEs: string }>;
  cefrLevel: CefrLevel;
  grammarPattern?: string | null;
  countability?: 'COUNTABLE' | 'UNCOUNTABLE' | 'BOTH' | null;
  connotation?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  collocations?: string[];
  graduatedExamples?: {
    sentenceBasicEn: string;
    sentenceBasicEs: string;
    clozeTargetBasic?: string;
    sentenceAdvancedEn: string;
    sentenceAdvancedEs: string;
    clozeTargetAdvanced?: string;
  };
}

export interface SpellingCorrectionInfo {
  hasCorrection: boolean;
  originalInput: string;
  correctedWord: string;
  explanationEs?: string;
}

export interface PhrasalVerbItem {
  id?: string;
  text: string;
  meaningEs: string;
  type: PhrasalVerbType;
  pronounMustSplit?: boolean;
  cefrLevel: CefrLevel;
  example1: string;
  example2?: string | null;
}

export type VocabRegister = 'FORMAL' | 'INFORMAL' | 'NEUTRAL' | 'ACADEMIC' | 'SLANG';

export interface VocabItem {
  id: string;
  word: string;
  grammaticalDimension: GrammaticalDimension;
  partOfSpeech: PartOfSpeech;
  subcategory?: 'PHRASAL_VERB' | string | null;
  definitionEn: string;
  translationEs: string;
  ipaGeneralAmerican: string;
  ipaReceivedPronunciation?: string | null;
  ipaWeakForm?: string | null;
  cefrLevel: CefrLevel;
  frequencyBand?: FrequencyBand | null;
  isCore: boolean;
  masteryStatus: VocabMasteryStatus;
  collocationsJson?: string[] | null;
  isSeparable?: boolean | null;
  phoneticEdEnding?: '/t/' | '/d/' | '/ɪd/' | null;
  isFalseFriend: boolean;
  falseFriendNote?: string | null;
  morphologicalFamilyJson?: string[] | null;
  verbTensesJson?: VerbTenses | null;
  structuredFamilyJson?: StructuredWordFamily | null;
  domainCategory?: string | null;
  alternateSensesJson?: VocabSense[] | null;
  register?: VocabRegister | null;
  sensesJson?: VocabSense[] | null;
  phrasalVerbsJson?: PhrasalVerbItem[] | null;
  createdAt: string;
}

export interface PhraseologicalUnit {
  id: string;
  primaryVocabId?: string | null;
  chunkType: ChunkType;
  text: string;
  meaningEs: string;
  phrasalVerbType?: PhrasalVerbType | null;
  example1: string;
  example2?: string | null;
  cefrLevel: CefrLevel;
  createdAt: string;
}

export interface VocabContextExample {
  id: string;
  vocabId?: string | null;
  phraseId?: string | null;
  sentenceEn: string;
  sentenceEs: string;
  clozeTarget: string;
  audioUrl?: string | null;
  cefrLevel: CefrLevel;
  createdAt: string;
}
