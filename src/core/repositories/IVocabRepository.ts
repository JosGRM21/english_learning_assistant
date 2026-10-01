import { VocabItem, VocabContextExample, CefrLevel } from '../types/vocab';

export interface IVocabRepository {
  getVocabById(vocabId: string): Promise<VocabItem | null>;
  searchVocabs(query: string, cefrLevel?: CefrLevel): Promise<VocabItem[]>;
  getContextExamples(vocabId: string): Promise<VocabContextExample[]>;
  getAllVocabs(limit?: number): Promise<VocabItem[]>;
  createVocab(vocab: Omit<VocabItem, 'id' | 'createdAt'> & { id?: string }): Promise<VocabItem>;
  addContextExample(example: Omit<VocabContextExample, 'id' | 'createdAt'> & { id?: string }): Promise<VocabContextExample>;
  updateVocab(vocabId: string, updates: Partial<Omit<VocabItem, 'id' | 'createdAt'>>): Promise<VocabItem>;
  deleteVocab(vocabId: string): Promise<boolean>;
}

