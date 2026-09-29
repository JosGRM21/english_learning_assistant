import { VocabItem, VocabContextExample, CefrLevel } from '../types/vocab';

export interface IVocabRepository {
  getVocabById(vocabId: string): Promise<VocabItem | null>;
  searchVocabs(query: string, cefrLevel?: CefrLevel): Promise<VocabItem[]>;
  getContextExamples(vocabId: string): Promise<VocabContextExample[]>;
  getAllVocabs(limit?: number): Promise<VocabItem[]>;
}
