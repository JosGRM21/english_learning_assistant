import { create } from 'zustand';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';
import { SrsCard, ReviewLog } from '@/core/types/srs';
import { OneClickCardPayload } from '@/core/types/reader';

export interface SrsState {
  vocabList: VocabItem[];
  selectedVocab: VocabItem | null;
  availableContexts: VocabContextExample[];
  currentContext: VocabContextExample | null;
  srsCard: SrsCard | null;
  reviewLogs: ReviewLog[];
  searchQuery: string;
  showAnswer: boolean;
  reviewCount: number;

  setVocabList: (list: VocabItem[] | ((prev: VocabItem[]) => VocabItem[])) => void;
  setSelectedVocab: (item: VocabItem | null) => void;
  setAvailableContexts: (contexts: VocabContextExample[]) => void;
  setCurrentContext: (context: VocabContextExample | null) => void;
  setSrsCard: (card: SrsCard | null) => void;
  addReviewLog: (log: ReviewLog) => void;
  setSearchQuery: (query: string) => void;
  setShowAnswer: (show: boolean) => void;
  incrementReviewCount: () => void;
  resetSession: () => void;
  addExtractedCard: (payload: OneClickCardPayload) => void;
}

export const useSrsStore = create<SrsState>((set) => ({
  vocabList: [],
  selectedVocab: null,
  availableContexts: [],
  currentContext: null,
  srsCard: null,
  reviewLogs: [],
  searchQuery: '',
  showAnswer: false,
  reviewCount: 0,

  setVocabList: (listOrFn) =>
    set((state) => ({
      vocabList: typeof listOrFn === 'function' ? listOrFn(state.vocabList) : listOrFn,
    })),

  setSelectedVocab: (item) => set({ selectedVocab: item }),

  setAvailableContexts: (contexts) => set({ availableContexts: contexts }),

  setCurrentContext: (context) => set({ currentContext: context }),

  setSrsCard: (card) => set({ srsCard: card }),

  addReviewLog: (log) =>
    set((state) => ({
      reviewLogs: [...state.reviewLogs, log],
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setShowAnswer: (show) => set({ showAnswer: show }),

  incrementReviewCount: () =>
    set((state) => ({
      reviewCount: state.reviewCount + 1,
    })),

  resetSession: () =>
    set({
      showAnswer: false,
    }),

  addExtractedCard: (payload: OneClickCardPayload) => {
    const newItem: VocabItem = {
      id: `voc_extracted_${Date.now()}`,
      word: payload.cleanWord || payload.word,
      grammaticalDimension: 'CONTENT',
      partOfSpeech: 'NOUN',
      definitionEn: `Vocabulary term extracted from reading: "${payload.word}"`,
      translationEs: payload.translationEs || 'Término extraído',
      ipaGeneralAmerican: payload.ipa || 'ˌɛk.strækt',
      cefrLevel: payload.cefrLevel,
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    const newContext: VocabContextExample = {
      id: `ctx_extracted_${Date.now()}`,
      vocabId: newItem.id,
      sentenceEn: payload.sentenceEn,
      sentenceEs: payload.sentenceEs,
      clozeTarget: payload.word,
      cefrLevel: payload.cefrLevel,
      createdAt: new Date().toISOString(),
    };

    const newCard: SrsCard = {
      id: `card_${newItem.id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: newItem.id,
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      vocabList: [newItem, ...state.vocabList],
      selectedVocab: newItem,
      availableContexts: [newContext],
      currentContext: newContext,
      srsCard: newCard,
      showAnswer: false,
    }));
  },
}));
