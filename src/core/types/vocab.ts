export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

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

export interface VocabItem {
  id: string;
  word: string;
  grammaticalDimension: GrammaticalDimension;
  partOfSpeech: PartOfSpeech;
  subcategory?: string | null;
  definitionEn: string;
  translationEs: string;
  ipaGeneralAmerican: string;
  ipaReceivedPronunciation?: string | null;
  cefrLevel: CefrLevel;
  isFalseFriend: boolean;
  falseFriendNote?: string | null;
  morphologicalFamilyJson?: string[] | null;
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
