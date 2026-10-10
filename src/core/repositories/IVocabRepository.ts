import { VocabItem, VocabContextExample, CefrLevel, VocabMasteryStatus, FrequencyBand } from '../types/vocab';

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

export interface IVocabRepository {
  getVocabById(vocabId: string): Promise<VocabItem | null>;
  searchVocabs(query: string, cefrLevel?: CefrLevel): Promise<VocabItem[]>;
  searchLocalCorpus(query: string, limit?: number): Promise<VocabItem[]>;
  getContextExamples(vocabId: string): Promise<VocabContextExample[]>;
  getAllVocabs(limit?: number): Promise<VocabItem[]>;
  createVocab(vocab: CreateVocabInput): Promise<VocabItem>;
  activateVocabItem(id: string): Promise<VocabItem>;
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

