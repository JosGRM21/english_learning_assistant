import { create } from 'zustand';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '@/infrastructure/ai/schemas';

export const SAMPLE_PROMPTS = [
  {
    label: 'Error de Preposición e Interferencia L1',
    text: 'I am agree with your suggestion, but the final decision depend of my company schedule.',
  },
  {
    label: 'Falsos Amigos y Transferencia de Sintaxis',
    text: 'Actually I have 28 years and I want to improve my career because it depend of my effort.',
  },
  {
    label: 'Oración Correcta',
    text: 'I agree with your suggestion because our future success definitely depends on persistent effort.',
  },
];

export interface WritingState {
  currentStage: 1 | 2 | 3;
  draft1: string;
  draft2: string;
  targetCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  isLoading: boolean;
  socraticResult: SocraticFeedbackResponse | null;
  evalResult: WritingEvaluationResponse | null;
  selectedQuizOption: number | null;
  quizSubmitted: boolean;

  setCurrentStage: (stage: 1 | 2 | 3) => void;
  setDraft1: (text: string) => void;
  setDraft2: (text: string) => void;
  setTargetCefr: (cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void;
  setIsLoading: (loading: boolean) => void;
  setSocraticResult: (result: SocraticFeedbackResponse | null) => void;
  setEvalResult: (result: WritingEvaluationResponse | null) => void;
  setSelectedQuizOption: (idx: number | null) => void;
  setQuizSubmitted: (submitted: boolean) => void;
  resetWriting: () => void;
}

export const useWritingStore = create<WritingState>((set) => ({
  currentStage: 1,
  draft1: '',
  draft2: '',
  targetCefr: 'B1',
  isLoading: false,
  socraticResult: null,
  evalResult: null,
  selectedQuizOption: null,
  quizSubmitted: false,

  setCurrentStage: (stage) => set({ currentStage: stage }),
  setDraft1: (text) => set({ draft1: text }),
  setDraft2: (text) => set({ draft2: text }),
  setTargetCefr: (cefr) => set({ targetCefr: cefr }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSocraticResult: (result) => set({ socraticResult: result }),
  setEvalResult: (result) => set({ evalResult: result }),
  setSelectedQuizOption: (idx) => set({ selectedQuizOption: idx }),
  setQuizSubmitted: (submitted) => set({ quizSubmitted: submitted }),

  resetWriting: () =>
    set({
      currentStage: 1,
      socraticResult: null,
      evalResult: null,
      selectedQuizOption: null,
      quizSubmitted: false,
    }),
}));
