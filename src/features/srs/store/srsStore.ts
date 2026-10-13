import { create } from 'zustand';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';
import { SrsCard, ReviewLog } from '@/core/types/srs';
import { SrsSessionStats } from '@/core/srs/SrsSessionEngine';

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
  lastSessionStats: SrsSessionStats | null;

  setVocabList: (list: VocabItem[] | ((prev: VocabItem[]) => VocabItem[])) => void;
  setSelectedVocab: (item: VocabItem | null) => void;
  setAvailableContexts: (contexts: VocabContextExample[]) => void;
  setCurrentContext: (context: VocabContextExample | null) => void;
  setSrsCard: (card: SrsCard | null) => void;
  addReviewLog: (log: ReviewLog) => void;
  setSearchQuery: (query: string) => void;
  setShowAnswer: (show: boolean) => void;
  incrementReviewCount: () => void;
  setLastSessionStats: (stats: SrsSessionStats | null) => void;
  resetSession: () => void;
  addVocabItem: (item: VocabItem, context?: VocabContextExample | null, cardId?: string) => void;
  addBatchVocabItems: (items: VocabItem[]) => void;
  updateVocabItem: (item: VocabItem) => void;
  removeVocabItem: (id: string) => void;
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
  lastSessionStats: (() => {
    try {
      const saved = localStorage.getItem('ela_last_session_stats');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),

  setVocabList: (listOrFn) =>
    set((state) => ({
      vocabList: typeof listOrFn === 'function' ? listOrFn(state.vocabList) : listOrFn,
    })),

  setSelectedVocab: (item) => set({ selectedVocab: item }),

  setAvailableContexts: (contexts) => set({ availableContexts: contexts }),

  setLastSessionStats: (stats) => {
    try {
      if (stats) {
        localStorage.setItem('ela_last_session_stats', JSON.stringify(stats));
      } else {
        localStorage.removeItem('ela_last_session_stats');
      }
    } catch {
      // ignore
    }
    set({ lastSessionStats: stats });
  },

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

  addVocabItem: (item: VocabItem, context?: VocabContextExample | null, cardId?: string) => {
    const newCard: SrsCard = {
      id: cardId || `card_${item.id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: item.id,
      srsProfile: 'VOCAB_AGILE',
      state: 'NEW',
      stability: 0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      consecutiveLapses: 0,
      isLeech: false,
      lastReviewedAt: null,
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const alreadyExists = state.vocabList.some((v) => v.id === item.id);
      const updatedVocabList = alreadyExists
        ? state.vocabList.map((v) => (v.id === item.id ? item : v))
        : [item, ...state.vocabList];

      const contexts = context ? [context] : [];

      // If no card is currently selected or the deck was previously empty, select this card
      if (!state.selectedVocab || state.vocabList.length === 0) {
        return {
          vocabList: updatedVocabList,
          selectedVocab: item,
          availableContexts: contexts,
          currentContext: context || null,
          srsCard: newCard,
          showAnswer: false,
        };
      }

      return {
        vocabList: updatedVocabList,
      };
    });
  },

  addBatchVocabItems: (items: VocabItem[]) => {
    if (!items || items.length === 0) return;

    set((state) => {
      const existingMap = new Map(state.vocabList.map((v) => [v.id, v]));
      for (const item of items) {
        existingMap.set(item.id, item);
      }
      const updatedVocabList = Array.from(existingMap.values());

      if (!state.selectedVocab && items.length > 0) {
        const first = items[0];
        const newCard: SrsCard = {
          id: `card_${first.id}`,
          userId: 'user_local',
          targetType: 'VOCAB',
          targetId: first.id,
          srsProfile: 'VOCAB_AGILE',
          state: 'NEW',
          stability: 0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          consecutiveLapses: 0,
          isLeech: false,
          lastReviewedAt: null,
          scheduledFor: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        return {
          vocabList: updatedVocabList,
          selectedVocab: first,
          srsCard: newCard,
          showAnswer: false,
        };
      }

      return {
        vocabList: updatedVocabList,
      };
    });
  },

  updateVocabItem: (item: VocabItem) => {
    set((state) => ({
      vocabList: state.vocabList.map((v) => (v.id === item.id ? item : v)),
      selectedVocab: state.selectedVocab?.id === item.id ? item : state.selectedVocab,
    }));
  },

  removeVocabItem: (id: string) => {
    set((state) => ({
      vocabList: state.vocabList.filter((v) => v.id !== id),
      selectedVocab: state.selectedVocab?.id === id ? null : state.selectedVocab,
      srsCard: state.srsCard?.targetId === id ? null : state.srsCard,
      availableContexts: state.selectedVocab?.id === id ? [] : state.availableContexts,
      currentContext: state.selectedVocab?.id === id ? null : state.currentContext,
    }));
  },
}));
