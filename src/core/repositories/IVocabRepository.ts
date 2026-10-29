import { VocabItem, VocabContextExample, VocabSense, CefrLevel, VocabMasteryStatus, FrequencyBand } from '../types/vocab';

export interface CoreCorpusCoverage {
  totalCore: number;
  activeCore: number;
  receptiveMastery: number;
  productiveMastery: number;
  byBand: Record<FrequencyBand, { total: number; active: number; mastered: number }>;
}

export type CreateVocabInput = Omit<VocabItem, 'id' | 'createdAt' | 'isCore' | 'masteryStatus'> & {
  id?: string;
  isCore?: boolean;
  masteryStatus?: VocabMasteryStatus;
};

export interface VocabPageFilter {
  page: number;
  pageSize: number;
  search?: string;
  cefrLevel?: string;
  dimension?: string;
  origin?: 'ALL' | 'CORE' | 'VAULT';
  frequencyBand?: string;
  masteryStatus?: string;
  partOfSpeech?: string;
  onlyFalseFriends?: boolean;
  sortBy?: 'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC';
}

export interface VocabPageResult {
  items: VocabItem[];
  totalCount: number;
  coreCount: number;
  vaultCount: number;
  filteredCount: number;
  cefrCounts: Record<string, number>;
}

export interface IVocabRepository {
  getVocabById(vocabId: string): Promise<VocabItem | null>;
  getVocabsPage(filter: VocabPageFilter): Promise<VocabPageResult>;
  searchVocabs(query: string, cefrLevel?: CefrLevel): Promise<VocabItem[]>;
  searchLocalCorpus(query: string, limit?: number): Promise<VocabItem[]>;
  getContextExamples(vocabId: string): Promise<VocabContextExample[]>;
  getContextExamplesForVocabs(vocabIds: string[]): Promise<Record<string, VocabContextExample[]>>;
  getAllVocabs(limit?: number): Promise<VocabItem[]>;
  createVocab(vocab: CreateVocabInput): Promise<VocabItem>;
  activateVocabItem(id: string, initialStatus?: VocabMasteryStatus): Promise<VocabItem>;
  activateVocabSense(vocabId: string, senseIndex: number): Promise<void>;
  getNextEligiblePolysemousSenses(options: {
    minStabilityDays?: number;
    limit: number;
  }): Promise<Array<{ vocabId: string; senseIndex: number; sense: VocabSense; word: string }>>;
  getNextUnactivatedWords(options: { frequencyBand: FrequencyBand; limit: number }): Promise<VocabItem[]>;
  batchActivateByCriteria(options: { cefrLevel?: CefrLevel; frequencyBand?: FrequencyBand; limit?: number }): Promise<VocabItem[]>;
  updateMasteryStatus(id: string, status: VocabMasteryStatus): Promise<void>;
  getCoreCorpusCoverage(): Promise<CoreCorpusCoverage>;
  addContextExample(example: Omit<VocabContextExample, 'id' | 'createdAt'> & { id?: string }): Promise<VocabContextExample>;
  findExistingByWord(word: string): Promise<VocabItem[]>;
  updateVocab(vocabId: string, updates: Partial<Omit<VocabItem, 'id' | 'createdAt'>>): Promise<VocabItem>;
  deleteVocab(vocabId: string): Promise<boolean>;
  deleteVocabs(vocabIds: string[]): Promise<number>;
  clearAllVocabs(): Promise<number>;
}
