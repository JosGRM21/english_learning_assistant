import coreCorpusRaw from './core-vocab-corpus.json';
import {
  VocabItem,
  CefrLevel,
  FrequencyBand,
  PartOfSpeech,
  GrammaticalDimension,
  VocabMasteryStatus,
} from '@/core/types/vocab';

export interface RawCoreCorpusItem {
  id: string;
  word: string;
  grammaticalDimension: GrammaticalDimension;
  partOfSpeech: PartOfSpeech;
  subcategory: string | null;
  definitionEn: string;
  translationEs: string;
  ipaGeneralAmerican: string;
  ipaReceivedPronunciation: string | null;
  ipaWeakForm?: string | null;
  cefrLevel: CefrLevel;
  frequencyBand: FrequencyBand;
  isCore: number;
  masteryStatus: VocabMasteryStatus;
  collocationsJson: string[];
  isSeparable: boolean | null;
  phoneticEdEnding: '/t/' | '/d/' | '/ɪd/' | null;
  isFalseFriend: number;
  falseFriendNote: string | null;
  morphologicalFamilyJson: string[];
  verbTensesJson: any;
  structuredFamilyJson: any;
  domainCategory: string;
  alternateSensesJson: any;
  graduatedExamples: {
    sentenceBasicEn: string;
    sentenceBasicEs: string;
    clozeTargetBasic?: string;
    sentenceAdvancedEn: string;
    sentenceAdvancedEs: string;
    clozeTargetAdvanced?: string;
  };
}

export interface RawCorePhrasalUnit {
  id: string;
  primaryVocabId: string;
  chunkType: 'PHRASAL_VERB' | 'COLLOCATION' | 'IDIOM' | 'BINOMIAL' | 'SENTENCE_FRAME';
  text: string;
  meaningEs: string;
  phrasalVerbType?: 'TYPE_1_INTRANSITIVE' | 'TYPE_2_SEPARABLE' | 'TYPE_3_INSEPARABLE' | 'TYPE_4_THREE_PART' | null;
  pronounMustSplit: number;
  example1: string;
  example2: string | null;
  cefrLevel: CefrLevel;
}

export let CORE_VOCAB_DATA: RawCoreCorpusItem[] = [...(coreCorpusRaw as unknown as RawCoreCorpusItem[])];

import corePhrasalRaw from './core-phrasal-units.json';
export let CORE_PHRASAL_DATA: RawCorePhrasalUnit[] = [...(corePhrasalRaw as unknown as RawCorePhrasalUnit[])];

// Fast in-memory map for instantaneous O(1) lookups
const lemmaMap = new Map<string, RawCoreCorpusItem>();
const phrasalByVocabIdMap = new Map<string, RawCorePhrasalUnit[]>();

function rebuildLookupMaps(): void {
  lemmaMap.clear();
  for (const item of CORE_VOCAB_DATA) {
    lemmaMap.set(item.word.toLowerCase(), item);
  }

  phrasalByVocabIdMap.clear();
  for (const phrase of CORE_PHRASAL_DATA) {
    if (phrase.primaryVocabId) {
      const list = phrasalByVocabIdMap.get(phrase.primaryVocabId) || [];
      list.push(phrase);
      phrasalByVocabIdMap.set(phrase.primaryVocabId, list);
    }
  }
}

// Initial indexing
rebuildLookupMaps();

/**
 * Resetea y vacía el catálogo en memoria para sincronizar la UI al borrar todo.
 */
export function clearCoreCorpusMemory(): void {
  CORE_VOCAB_DATA = [];
  CORE_PHRASAL_DATA = [];
  rebuildLookupMaps();
}

/**
 * Recarga los datos en memoria si se regeneran o actualizan los archivos.
 */
export function reloadCoreCorpusMemory(newWords: RawCoreCorpusItem[] = [], newPhrases: RawCorePhrasalUnit[] = []): void {
  CORE_VOCAB_DATA = [...newWords];
  CORE_PHRASAL_DATA = [...newPhrases];
  rebuildLookupMaps();
}

/**
 * Retrieves core phrasal units linked to a primary vocab item.
 */
export function getCorePhrasalUnits(vocabId: string): RawCorePhrasalUnit[] {
  return phrasalByVocabIdMap.get(vocabId) || [];
}

/**
 * Searches the Core Corpus locally with 0 network latency and 0 AI tokens.
 * Matches word prefixes or exact word matches.
 */
export function searchCoreCorpusLocally(query: string, limit = 20): RawCoreCorpusItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const exact = lemmaMap.get(clean);
  const results: RawCoreCorpusItem[] = [];

  if (exact) {
    results.push(exact);
  }

  for (const item of CORE_VOCAB_DATA) {
    if (results.length >= limit) break;
    if (item.word.toLowerCase() === clean) continue; // already added
    if (item.word.toLowerCase().startsWith(clean)) {
      results.push(item);
    }
  }

  // If still less than limit and query length >= 3, match substring
  if (results.length < limit && clean.length >= 3) {
    for (const item of CORE_VOCAB_DATA) {
      if (results.length >= limit) break;
      if (results.includes(item)) continue;
      if (item.word.toLowerCase().includes(clean)) {
        results.push(item);
      }
    }
  }

  return results;
}

/**
 * Retrieves a single word from the Core Corpus if it exists.
 */
export function getCoreCorpusWord(word: string): RawCoreCorpusItem | undefined {
  return lemmaMap.get(word.trim().toLowerCase());
}

/**
 * Converts a raw core corpus item into a domain VocabItem.
 */
export function toDomainCoreVocab(raw: RawCoreCorpusItem, activeStatus: VocabMasteryStatus = 'INACTIVE'): VocabItem {
  return {
    id: raw.id,
    word: raw.word,
    grammaticalDimension: raw.grammaticalDimension,
    partOfSpeech: raw.partOfSpeech,
    subcategory: raw.subcategory,
    definitionEn: raw.definitionEn,
    translationEs: raw.translationEs,
    ipaGeneralAmerican: raw.ipaGeneralAmerican,
    ipaReceivedPronunciation: raw.ipaReceivedPronunciation,
    ipaWeakForm: raw.ipaWeakForm || null,
    cefrLevel: raw.cefrLevel,
    frequencyBand: raw.frequencyBand,
    isCore: true,
    masteryStatus: activeStatus,
    collocationsJson: raw.collocationsJson,
    isSeparable: raw.isSeparable,
    phoneticEdEnding: raw.phoneticEdEnding,
    isFalseFriend: Boolean(raw.isFalseFriend),
    falseFriendNote: raw.falseFriendNote,
    morphologicalFamilyJson: raw.morphologicalFamilyJson || [],
    verbTensesJson: raw.verbTensesJson || null,
    structuredFamilyJson: raw.structuredFamilyJson || null,
    domainCategory: raw.domainCategory || 'Uso General',
    alternateSensesJson: raw.alternateSensesJson || null,
    sensesJson: (raw as any).sensesJson || [
      {
        translationEs: raw.translationEs,
        definitionEn: raw.definitionEn,
        partOfSpeech: raw.partOfSpeech,
        cefrLevel: raw.cefrLevel,
        collocations: raw.collocationsJson || [],
        graduatedExamples: raw.graduatedExamples,
      },
      ...((raw.alternateSensesJson as any) || []),
    ],
    phrasalVerbsJson: [],
    createdAt: new Date().toISOString(),
  };
}
