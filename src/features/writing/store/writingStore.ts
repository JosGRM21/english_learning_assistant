import { create } from 'zustand';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '@/infrastructure/ai/schemas';
import {
  ReadingItem,
  WritingMission,
  READING_TO_WRITE_CATALOG,
} from '@/data/reading-to-write-catalog';
import { WritingSubmissionEntity } from '@/core/repositories/IWritingRepository';
import { isTargetWordUsedInText } from '@/core/text/WeakVocabMatcher';

export type WritingStudioTab = 'STUDIO' | 'HISTORY';
export type SubmissionMode = 'FREE' | 'READING_TO_WRITE';

export interface TargetWordItem {
  word: string;
  translationEs: string;
  partOfSpeech?: string;
  domainCategory?: string;
  isUsed: boolean;
  cardId?: string;
}

export interface WritingState {
  // Navigation
  activeTab: WritingStudioTab;
  currentStage: 1 | 2 | 3;

  // Session content
  currentSubmissionId: string | null;
  submissionMode: SubmissionMode;
  selectedReading: ReadingItem | null;
  selectedMission: WritingMission | null;
  draft1: string;
  draft2: string;
  targetCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

  // Weak vocabulary target activation
  targetWords: TargetWordItem[];
  availableWeakPool: TargetWordItem[];

  // AI & Evaluation state
  isLoading: boolean;
  socraticResult: SocraticFeedbackResponse | null;
  evalResult: WritingEvaluationResponse | null;
  selectedQuizOption: number | null;
  quizSubmitted: boolean;

  // Error Drill station state
  activeErrorIndex: number;
  errorDrillsCompleted: Record<string, boolean>;

  // History & Archive state
  historySubmissions: WritingSubmissionEntity[];
  isLoadingHistory: boolean;
  selectedHistoryItem: WritingSubmissionEntity | null;

  // Setters
  setActiveTab: (tab: WritingStudioTab) => void;
  setCurrentStage: (stage: 1 | 2 | 3) => void;
  setCurrentSubmissionId: (id: string | null) => void;
  setSubmissionMode: (mode: SubmissionMode) => void;
  setSelectedReading: (reading: ReadingItem | null, mission?: WritingMission | null) => void;
  setSelectedMission: (mission: WritingMission | null) => void;
  setDraft1: (text: string) => void;
  setDraft2: (text: string) => void;
  setTargetCefr: (cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void;
  setTargetWords: (words: TargetWordItem[]) => void;
  setAvailableWeakPool: (pool: TargetWordItem[]) => void;
  replaceTargetWord: (index: number) => void;
  updateTargetWordUsage: (draftText: string) => void;
  setIsLoading: (loading: boolean) => void;
  setSocraticResult: (result: SocraticFeedbackResponse | null) => void;
  setEvalResult: (result: WritingEvaluationResponse | null) => void;
  setSelectedQuizOption: (idx: number | null) => void;
  setQuizSubmitted: (submitted: boolean) => void;
  setActiveErrorIndex: (idx: number) => void;
  setErrorDrillCompleted: (errorSpan: string, completed: boolean) => void;
  setHistorySubmissions: (subs: WritingSubmissionEntity[]) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  setSelectedHistoryItem: (item: WritingSubmissionEntity | null) => void;

  // Composite actions
  selectReadingAndApply: (reading: ReadingItem, mission: WritingMission) => void;
  loadSubmissionIntoStudio: (item: WritingSubmissionEntity) => void;
  resetWriting: () => void;
}

export const useWritingStore = create<WritingState>((set, get) => ({
  activeTab: 'STUDIO',
  currentStage: 1,
  currentSubmissionId: null,
  submissionMode: 'FREE',
  selectedReading: null,
  selectedMission: null,
  draft1: '',
  draft2: '',
  targetCefr: 'B1',
  targetWords: [],
  availableWeakPool: [],
  isLoading: false,
  socraticResult: null,
  evalResult: null,
  selectedQuizOption: null,
  quizSubmitted: false,
  activeErrorIndex: 0,
  errorDrillsCompleted: {},
  historySubmissions: [],
  isLoadingHistory: false,
  selectedHistoryItem: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentStage: (stage) => set({ currentStage: stage }),
  setCurrentSubmissionId: (id) => set({ currentSubmissionId: id }),
  setSubmissionMode: (mode) => set({ submissionMode: mode }),
  setSelectedReading: (reading, mission = null) =>
    set({ selectedReading: reading ? { ...reading } : null, selectedMission: mission }),
  setSelectedMission: (mission) => set({ selectedMission: mission }),
  setDraft1: (text) => {
    set({ draft1: text });
    get().updateTargetWordUsage(text);
  },
  setDraft2: (text) => {
    set({ draft2: text });
    get().updateTargetWordUsage(text);
  },
  setTargetCefr: (cefr) => set({ targetCefr: cefr }),
  setTargetWords: (words) => set({ targetWords: words }),
  setAvailableWeakPool: (pool) => set({ availableWeakPool: pool }),

  replaceTargetWord: (index: number) => {
    const { targetWords, availableWeakPool } = get();
    const currentWord = targetWords[index];
    if (!currentWord) return;

    // Find next candidate from pool not currently in targetWords
    const currentWordsSet = new Set(targetWords.map((t) => t.word.toLowerCase()));
    const candidate = availableWeakPool.find((p) => !currentWordsSet.has(p.word.toLowerCase()));

    if (candidate) {
      const nextTargets = [...targetWords];
      nextTargets[index] = { ...candidate, isUsed: isTargetWordUsedInText(candidate.word, get().draft1 || get().draft2) };
      const nextPool = availableWeakPool.map((p) =>
        p.word.toLowerCase() === candidate.word.toLowerCase() ? currentWord : p,
      );
      set({ targetWords: nextTargets, availableWeakPool: nextPool });
    }
  },

  updateTargetWordUsage: (draftText: string) => {
    const { targetWords } = get();
    if (targetWords.length === 0) return;

    let changed = false;
    const updated = targetWords.map((item) => {
      const isUsed = isTargetWordUsedInText(item.word, draftText);
      if (isUsed !== item.isUsed) changed = true;
      return { ...item, isUsed };
    });

    if (changed) {
      set({ targetWords: updated });
    }
  },

  setIsLoading: (loading) => set({ isLoading: loading }),
  setSocraticResult: (result) => set({ socraticResult: result }),
  setEvalResult: (result) => set({ evalResult: result }),
  setSelectedQuizOption: (idx) => set({ selectedQuizOption: idx }),
  setQuizSubmitted: (submitted) => set({ quizSubmitted: submitted }),
  setActiveErrorIndex: (idx) => set({ activeErrorIndex: idx }),
  setErrorDrillCompleted: (errorSpan, completed) =>
    set((state) => ({
      errorDrillsCompleted: { ...state.errorDrillsCompleted, [errorSpan]: completed },
    })),
  setHistorySubmissions: (subs) => set({ historySubmissions: subs }),
  setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  setSelectedHistoryItem: (item) => set({ selectedHistoryItem: item }),

  selectReadingAndApply: (reading, mission) =>
    set({
      selectedReading: { ...reading },
      selectedMission: mission,
      submissionMode: 'READING_TO_WRITE',
      targetCefr: reading.cefrLevel,
      draft1: mission.suggestedOpening ? `${mission.suggestedOpening} ` : '',
      activeTab: 'STUDIO',
      currentStage: 1,
      socraticResult: null,
      evalResult: null,
      selectedQuizOption: null,
      quizSubmitted: false,
      activeErrorIndex: 0,
      errorDrillsCompleted: {},
    }),

  loadSubmissionIntoStudio: (item) => {
    const resolvedMode = item.submissionMode === 'READING_TO_WRITE' ? 'READING_TO_WRITE' : 'FREE';

    if (item.evaluation) {
      set({
        currentSubmissionId: item.id,
        submissionMode: resolvedMode,
        selectedReading: null,
        selectedMission: null,
        draft1: item.userText,
        draft2: item.draft2Text ?? item.userText,
        targetCefr: (item.evaluation.estimated_cefr as any) ?? 'B1',
        evalResult: item.evaluation,
        socraticResult: item.socraticResult ?? null,
        currentStage: 3,
        activeTab: 'STUDIO',
        selectedQuizOption: null,
        quizSubmitted: false,
        activeErrorIndex: 0,
        errorDrillsCompleted: {},
      });
    } else if (item.socraticResult) {
      set({
        currentSubmissionId: item.id,
        submissionMode: resolvedMode,
        selectedReading: null,
        selectedMission: null,
        draft1: item.userText,
        draft2: item.draft2Text ?? item.userText,
        socraticResult: item.socraticResult,
        evalResult: null,
        currentStage: 2,
        activeTab: 'STUDIO',
        selectedQuizOption: null,
        quizSubmitted: false,
        activeErrorIndex: 0,
        errorDrillsCompleted: {},
      });
    } else {
      set({
        currentSubmissionId: item.id,
        submissionMode: resolvedMode,
        selectedReading: null,
        selectedMission: null,
        draft1: item.userText,
        draft2: item.draft2Text ?? '',
        currentStage: 1,
        activeTab: 'STUDIO',
        socraticResult: null,
        evalResult: null,
        selectedQuizOption: null,
        quizSubmitted: false,
        activeErrorIndex: 0,
        errorDrillsCompleted: {},
      });
    }
  },

  resetWriting: () =>
    set({
      currentSubmissionId: null,
      currentStage: 1,
      draft1: '',
      draft2: '',
      selectedReading: null,
      selectedMission: null,
      submissionMode: 'FREE',
      socraticResult: null,
      evalResult: null,
      selectedQuizOption: null,
      quizSubmitted: false,
      activeErrorIndex: 0,
      errorDrillsCompleted: {},
    }),
}));

export { READING_TO_WRITE_CATALOG };

