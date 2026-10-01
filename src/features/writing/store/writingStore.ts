import { create } from 'zustand';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '@/infrastructure/ai/schemas';
import { WritingPromptItem, WRITING_PROMPTS_CATALOG } from '@/data/writing-prompts-catalog';
import { WritingSubmissionEntity } from '@/core/repositories/IWritingRepository';

export type WritingStudioTab = 'STUDIO' | 'HISTORY' | 'PROMPTS';
export type SubmissionMode = 'FREE' | 'GUIDED' | 'MICRO_WRITING';

export interface WritingState {
  // Navigation
  activeTab: WritingStudioTab;
  currentStage: 1 | 2 | 3;

  // Session content
  currentSubmissionId: string | null;
  submissionMode: SubmissionMode;
  selectedPrompt: WritingPromptItem | null;
  draft1: string;
  draft2: string;
  targetCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

  // AI & Evaluation state
  isLoading: boolean;
  socraticResult: SocraticFeedbackResponse | null;
  evalResult: WritingEvaluationResponse | null;
  selectedQuizOption: number | null;
  quizSubmitted: boolean;

  // History & Archive state
  historySubmissions: WritingSubmissionEntity[];
  isLoadingHistory: boolean;
  selectedHistoryItem: WritingSubmissionEntity | null;

  // Setters
  setActiveTab: (tab: WritingStudioTab) => void;
  setCurrentStage: (stage: 1 | 2 | 3) => void;
  setCurrentSubmissionId: (id: string | null) => void;
  setSubmissionMode: (mode: SubmissionMode) => void;
  setSelectedPrompt: (prompt: WritingPromptItem | null) => void;
  setDraft1: (text: string) => void;
  setDraft2: (text: string) => void;
  setTargetCefr: (cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void;
  setIsLoading: (loading: boolean) => void;
  setSocraticResult: (result: SocraticFeedbackResponse | null) => void;
  setEvalResult: (result: WritingEvaluationResponse | null) => void;
  setSelectedQuizOption: (idx: number | null) => void;
  setQuizSubmitted: (submitted: boolean) => void;
  setHistorySubmissions: (subs: WritingSubmissionEntity[]) => void;
  setIsLoadingHistory: (loading: boolean) => void;
  setSelectedHistoryItem: (item: WritingSubmissionEntity | null) => void;

  // Composite actions
  selectPromptAndApply: (prompt: WritingPromptItem) => void;
  loadSubmissionIntoStudio: (item: WritingSubmissionEntity) => void;
  resetWriting: () => void;
}

export const useWritingStore = create<WritingState>((set) => ({
  activeTab: 'STUDIO',
  currentStage: 1,
  currentSubmissionId: null,
  submissionMode: 'FREE',
  selectedPrompt: null,
  draft1: '',
  draft2: '',
  targetCefr: 'B1',
  isLoading: false,
  socraticResult: null,
  evalResult: null,
  selectedQuizOption: null,
  quizSubmitted: false,
  historySubmissions: [],
  isLoadingHistory: false,
  selectedHistoryItem: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentStage: (stage) => set({ currentStage: stage }),
  setCurrentSubmissionId: (id) => set({ currentSubmissionId: id }),
  setSubmissionMode: (mode) => set({ submissionMode: mode }),
  setSelectedPrompt: (prompt) => set({ selectedPrompt: prompt }),
  setDraft1: (text) => set({ draft1: text }),
  setDraft2: (text) => set({ draft2: text }),
  setTargetCefr: (cefr) => set({ targetCefr: cefr }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSocraticResult: (result) => set({ socraticResult: result }),
  setEvalResult: (result) => set({ evalResult: result }),
  setSelectedQuizOption: (idx) => set({ selectedQuizOption: idx }),
  setQuizSubmitted: (submitted) => set({ quizSubmitted: submitted }),
  setHistorySubmissions: (subs) => set({ historySubmissions: subs }),
  setIsLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  setSelectedHistoryItem: (item) => set({ selectedHistoryItem: item }),

  selectPromptAndApply: (prompt) =>
    set({
      selectedPrompt: prompt,
      submissionMode: 'GUIDED',
      targetCefr: prompt.cefrLevel,
      draft1: prompt.sampleOpening ? `${prompt.sampleOpening} ` : '',
      activeTab: 'STUDIO',
      currentStage: 1,
      socraticResult: null,
      evalResult: null,
      selectedQuizOption: null,
      quizSubmitted: false,
    }),

  loadSubmissionIntoStudio: (item) => {
    // If it was already evaluated, show Stage 3 directly
    if (item.evaluation) {
      set({
        currentSubmissionId: item.id,
        draft1: item.userText,
        draft2: item.draft2Text ?? item.userText,
        targetCefr: (item.evaluation.estimated_cefr as any) ?? 'B1',
        evalResult: item.evaluation,
        socraticResult: item.socraticResult ?? null,
        currentStage: 3,
        activeTab: 'STUDIO',
        selectedQuizOption: null,
        quizSubmitted: false,
      });
    } else if (item.socraticResult) {
      set({
        currentSubmissionId: item.id,
        draft1: item.userText,
        draft2: item.draft2Text ?? item.userText,
        socraticResult: item.socraticResult,
        evalResult: null,
        currentStage: 2,
        activeTab: 'STUDIO',
        selectedQuizOption: null,
        quizSubmitted: false,
      });
    } else {
      set({
        currentSubmissionId: item.id,
        draft1: item.userText,
        draft2: item.draft2Text ?? '',
        currentStage: 1,
        activeTab: 'STUDIO',
        socraticResult: null,
        evalResult: null,
        selectedQuizOption: null,
        quizSubmitted: false,
      });
    }
  },

  resetWriting: () =>
    set({
      currentSubmissionId: null,
      currentStage: 1,
      draft1: '',
      draft2: '',
      selectedPrompt: null,
      submissionMode: 'FREE',
      socraticResult: null,
      evalResult: null,
      selectedQuizOption: null,
      quizSubmitted: false,
    }),
}));

export { WRITING_PROMPTS_CATALOG };
