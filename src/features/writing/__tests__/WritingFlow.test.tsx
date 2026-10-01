import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWritingStore } from '../store/writingStore';
import { WRITING_PROMPTS_CATALOG } from '@/data/writing-prompts-catalog';
import { ZpdScaffoldingCard } from '../components/ZpdScaffoldingCard';
import { SocraticClue } from '@/infrastructure/ai/schemas';
import { DiffVisualizer } from '../components/DiffVisualizer';

describe('Writing Studio Components & Store', () => {
  beforeEach(() => {
    useWritingStore.getState().resetWriting();
  });

  describe('useWritingStore', () => {
    it('initializes with default state', () => {
      const state = useWritingStore.getState();
      expect(state.currentStage).toBe(1);
      expect(state.draft1).toBe('');
      expect(state.targetCefr).toBe('B1');
      expect(state.selectedPrompt).toBeNull();
      expect(state.activeTab).toBe('STUDIO');
    });

    it('selectPromptAndApply sets prompt, CEFR level and initial draft', () => {
      const samplePrompt = WRITING_PROMPTS_CATALOG[0];
      useWritingStore.getState().selectPromptAndApply(samplePrompt);

      const state = useWritingStore.getState();
      expect(state.selectedPrompt?.id).toBe(samplePrompt.id);
      expect(state.targetCefr).toBe(samplePrompt.cefrLevel);
      expect(state.submissionMode).toBe('GUIDED');
      if (samplePrompt.sampleOpening) {
        expect(state.draft1).toContain(samplePrompt.sampleOpening);
      }
    });

    it('loadSubmissionIntoStudio restores evaluated submission at stage 3', () => {
      const mockSub = {
        id: 'sub_test_1',
        userId: 'user_local',
        promptId: null,
        submissionMode: 'FREE' as const,
        userText: 'Original text',
        draft2Text: 'Corrected text',
        wordCount: 2,
        status: 'EVALUATED' as const,
        submittedAt: '2026-09-30T10:00:00Z',
        evaluation: {
          overall_feedback_es: 'Feedback',
          estimated_cefr: 'B2' as const,
          scores: { grammar: 8.5, vocabulary: 8.0, coherence: 9.0 },
          corrections: [],
          micro_challenge: {
            question_es: 'Q?',
            sentence_with_blank: 'Sentence ___',
            options: ['A', 'B'],
            correct_option_index: 0,
            explanation_es: 'Expl',
          },
        },
      };

      useWritingStore.getState().loadSubmissionIntoStudio(mockSub);

      const state = useWritingStore.getState();
      expect(state.currentStage).toBe(3);
      expect(state.draft1).toBe('Original text');
      expect(state.draft2).toBe('Corrected text');
      expect(state.evalResult?.estimated_cefr).toBe('B2');
    });
  });

  describe('ZpdScaffoldingCard', () => {
    const mockClue: SocraticClue = {
      paragraph_index: 1,
      clue_type: 'PREPOSITION',
      hint_question_es: "¿Cuál es la preposición que rige 'depend'?",
      highlighted_area: 'depend of',
      zpd_contrastive_es: 'En inglés se dice depend on, no depend of.',
      zpd_cloze_sentence: 'depend [ ___ ]',
      zpd_expected_token: 'on',
      zpd_native_model: 'Colocación nativa: depend on.',
    };

    it('renders initial Nivel 1 guiding question', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);
      expect(screen.getByText("¿Cuál es la preposición que rige 'depend'?")).toBeDefined();
      expect(screen.getByText(/Nivel 1: Pregunta Guía/i)).toBeDefined();
    });

    it('navigates to Nivel 2 and displays contrastive explanation', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);
      const lvl2Btn = screen.getByRole('button', { name: /^Nivel 2$/i });
      fireEvent.click(lvl2Btn);

      expect(screen.getByText(/En inglés se dice depend on, no depend of./i)).toBeDefined();
    });

    it('navigates to Nivel 3 and validates cloze input', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);
      const lvl3Btn = screen.getByRole('button', { name: /^Nivel 3$/i });
      fireEvent.click(lvl3Btn);

      const input = screen.getByPlaceholderText(/Escribe la corrección/i);
      const submitBtn = screen.getByRole('button', { name: /Comprobar/i });

      fireEvent.change(input, { target: { value: 'on' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/¡Exacto! Aplica este cambio en tu editor/i)).toBeDefined();
    });
  });

  describe('DiffVisualizer', () => {
    it('computes word diff and allows switching to clean text mode', () => {
      render(
        <DiffVisualizer
          original="I am agree with you"
          updated="I agree with you"
        />,
      );

      // Check metrics
      expect(screen.getByText(/\+0 palabras/i)).toBeDefined();
      expect(screen.getByText(/-1 eliminadas/i)).toBeDefined();

      // Switch to Clean text mode
      const cleanModeBtn = screen.getByRole('button', { name: /Texto Limpio/i });
      fireEvent.click(cleanModeBtn);

      expect(screen.getByText(/"I agree with you"/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Copiar al portapapeles/i })).toBeDefined();
    });
  });
});
