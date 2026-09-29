import { CefrLevel } from './vocab';

export interface ReaderArticle {
  id: string;
  title: string;
  cefrLevel: CefrLevel;
  topic: string;
  contentText: string;
  totalWords: number;
  readPercentage: number;
  sourceUrl?: string;
  createdAt: string;
}

export interface AnnotatedToken {
  originalText: string;
  cleanWord: string;
  isPunctuation: boolean;
  isTargetVocab: boolean;
  vocabId?: string;
  ipa?: string;
  translationEs?: string;
}

export interface SentenceSegment {
  sentenceEn: string;
  tokens: AnnotatedToken[];
}

export interface OneClickCardPayload {
  word: string;
  cleanWord: string;
  sentenceEn: string;
  sentenceEs: string;
  cefrLevel: CefrLevel;
  ipa: string;
  translationEs: string;
}
