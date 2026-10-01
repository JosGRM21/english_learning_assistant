import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWritingStore } from '../store/writingStore';
import { WRITING_PROMPTS_CATALOG } from '@/data/writing-prompts-catalog';
import { ZpdScaffoldingCard } from '../components/ZpdScaffoldingCard';
import { WritingStageOne } from '../components/WritingStageOne';
import { WritingStageTwo } from '../components/WritingStageTwo';
import { WritingStageThree } from '../components/WritingStageThree';
import { SocraticClue, SocraticFeedbackResponse } from '@/infrastructure/ai/schemas';
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
          successful_repairs: [],
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
      sentence_context: 'It will depend of the weather.',
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

    it('navigates to Nivel 3, validates cloze input, and ensures apply button is removed', () => {
      render(
        <ZpdScaffoldingCard
          clue={mockClue}
          index={0}
        />,
      );
      const lvl3Btn = screen.getByRole('button', { name: /Nivel 3/i });
      fireEvent.click(lvl3Btn);

      const input = screen.getByPlaceholderText(/Escribe la corrección/i);
      const submitBtn = screen.getByRole('button', { name: /Comprobar/i });

      fireEvent.change(input, { target: { value: 'on' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/¡Exacto! Asimilaste la estructura/i)).toBeDefined();

      // Ensure 'Aplicar cambio al Borrador 2' button is removed
      expect(screen.queryByRole('button', { name: /Aplicar cambio al Borrador 2/i })).toBeNull();
    });

    it('renders applied status badge when isApplied is true', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} isApplied={true} />);
      expect(screen.getByText(/Aplicado en Borrador 2/i)).toBeDefined();
    });

    it('navigates through levels using brief "Siguiente", "Anterior", and "Reiniciar" buttons', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);

      // Level 1 has a compact "Siguiente" button
      const nextBtnLvl1 = screen.getByRole('button', { name: /^Siguiente$/i });
      fireEvent.click(nextBtnLvl1);

      // Now on Level 2: has "Anterior" and "Siguiente"
      expect(screen.getByText(/Nivel 2: Diferencias con el Español/i)).toBeDefined();
      const prevBtnLvl2 = screen.getByRole('button', { name: /^Anterior$/i });
      const nextBtnLvl2 = screen.getByRole('button', { name: /^Siguiente$/i });
      expect(prevBtnLvl2).toBeDefined();
      expect(nextBtnLvl2).toBeDefined();

      // Go back to Level 1
      fireEvent.click(prevBtnLvl2);
      expect(screen.getByText(/Nivel 1: Pregunta Guía/i)).toBeDefined();

      // Go forward to Level 3
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));
      expect(screen.getByText(/Nivel 3: Completa el Espacio en Blanco/i)).toBeDefined();

      // Go to Level 4
      fireEvent.click(screen.getByRole('button', { name: /^Siguiente$/i }));
      expect(screen.getByText(/Nivel 4: Oración Resuelta/i)).toBeDefined();

      // In Level 4, check "Anterior" and "Reiniciar"
      expect(screen.getByRole('button', { name: /^Anterior$/i })).toBeDefined();
      const resetBtn = screen.getByRole('button', { name: /^Reiniciar$/i });
      fireEvent.click(resetBtn);
      expect(screen.getByText(/Nivel 1: Pregunta Guía/i)).toBeDefined();
    });

    it('ensures consistency between Level 3 cloze and Level 4 resolution', () => {
      const consistencyClue: SocraticClue = {
        paragraph_index: 1,
        clue_type: 'WORD_CHOICE',
        hint_question_es: '¿Cómo expresas recuperar tu energía en inglés?',
        highlighted_area: 'take my energy back',
        sentence_context: 'I need to rest to take my energy back.',
        zpd_contrastive_es: 'En inglés se usa "get energy back" o "regain energy".',
        zpd_cloze_sentence: 'I need to rest to [ ___ ] my energy back.',
        zpd_expected_token: 'get',
        zpd_native_model: 'get more energy',
      };

      render(<ZpdScaffoldingCard clue={consistencyClue} index={0} />);

      // Navigate to Level 4
      const lvl4Btn = screen.getByRole('button', { name: /^Nivel 4$/i });
      fireEvent.click(lvl4Btn);

      // Verify that the completed cloze sentence is displayed with the resolved token directly
      expect(screen.getByText(/Nivel 4: Oración Resuelta/i)).toBeDefined();
      expect(screen.getByText('I need to rest to')).toBeDefined();
      expect(screen.getByText('get')).toBeDefined();
      expect(screen.getByText('my energy back.')).toBeDefined();

      // Verify that "Modelo o colocación idiomática" label is NOT rendered
      expect(screen.queryByText(/Modelo o colocación idiomática:/i)).toBeNull();
      expect(screen.queryByText('get more energy')).toBeNull();
    });

    it('displays Level 2 without amber alert styling or nested container', () => {
      const { container } = render(<ZpdScaffoldingCard clue={mockClue} index={0} />);
      const lvl2Btn = screen.getByRole('button', { name: /^Nivel 2$/i });
      fireEvent.click(lvl2Btn);

      // Check that amber classes are not used in Level 2
      expect(container.querySelector('.bg-amber-50')).toBeNull();
      expect(container.querySelector('.border-amber-200')).toBeNull();
      expect(container.querySelector('.text-amber-600')).toBeNull();
    });
  });

  describe('WritingStageTwo Robust Snippet Highlighting & Scaffolding', () => {
    const multiParaDraft = `This is my first paragraph with writing exercises. I feel this is nice.

Yesterday i went to the store and i bought an apple.

Finally, today I will finish everything.`;

    const socraticResultWithI: SocraticFeedbackResponse = {
      overall_impression_es: 'Buen intento, pero revisa el pronombre personal.',
      error_count: 1,
      allow_self_correction: true,
      scaffolded_clues: [
        {
          paragraph_index: 2,
          clue_type: 'AGREEMENT',
          hint_question_es: 'Observa el uso de la letra "i" minúscula.',
          highlighted_area: 'i',
          sentence_context: 'Yesterday i went to the store and i bought an apple.',
          zpd_contrastive_es: 'En inglés el pronombre "I" siempre se escribe en mayúscula.',
          zpd_cloze_sentence: 'Yesterday [ ___ ] went to the store.',
          zpd_expected_token: 'I',
          zpd_native_model: 'Yesterday I went to the store.',
        },
      ],
    };

    it('highlights ONLY standalone "i" without false positives on words like "This", "is", "writing", "exercises"', () => {
      const { container } = render(
        <WritingStageTwo
          socraticResult={socraticResultWithI}
          draft1={multiParaDraft}
          draft2={multiParaDraft}
          isLoading={false}
          onDraftChange={() => {}}
          onBackToStageOne={() => {}}
          onEvaluateFinal={() => {}}
        />,
      );

      // Find the scaffolding card
      const card = screen.getByText(/Pista #1/i).closest('div[class*="rounded-2xl"]')!;
      expect(card).toBeDefined();

      // Trigger hover over card
      fireEvent.mouseEnter(card);

      // Inspect all <mark> tags generated in the document
      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBeGreaterThan(0);

      marks.forEach((mark) => {
        // Every mark must strictly be the standalone 'i'
        expect(mark.textContent).toBe('i');
      });

      // Verify that words like "This", "is", "writing" are NOT inside any mark
      const markTexts = Array.from(marks).map((m) => m.textContent);
      expect(markTexts).not.toContain('This');
      expect(markTexts).not.toContain('is');
      expect(markTexts).not.toContain('writing');
      expect(markTexts).not.toContain('I'); // uppercase I should not be marked

      // Trigger mouse leave and verify marks are cleared
      fireEvent.mouseLeave(card);
      expect(container.querySelectorAll('mark').length).toBe(0);
    });

    it('allows student to manually edit draft2 in response to socratic clues', () => {
      let updatedDraft2 = multiParaDraft;
      const handleDraftChange = (newText: string) => {
        updatedDraft2 = newText;
      };

      render(
        <WritingStageTwo
          socraticResult={socraticResultWithI}
          draft1={multiParaDraft}
          draft2={multiParaDraft}
          isLoading={false}
          onDraftChange={handleDraftChange}
          onBackToStageOne={() => {}}
          onEvaluateFinal={() => {}}
        />,
      );

      const textarea = screen.getByPlaceholderText(/Modifica tu texto aplicando las pistas/i);
      fireEvent.change(textarea, {
        target: { value: 'This is my corrected draft where I fixed the i pronoun.' },
      });

      expect(updatedDraft2).toBe('This is my corrected draft where I fixed the i pronoun.');
    });
  });

  describe('WritingStageOne Pre-writing Scaffolding', () => {
    it('toggles discourse connectors and inserts selected connector into draft', () => {
      let currentDraft = 'I like coding.';
      const handleDraftChange = (newDraft: string) => {
        currentDraft = newDraft;
      };

      render(
        <WritingStageOne
          draft1={currentDraft}
          targetCefr="B1"
          submissionMode="FREE"
          selectedPrompt={null}
          isLoading={false}
          onDraftChange={handleDraftChange}
          onTargetCefrChange={() => {}}
          onSubmissionModeChange={() => {}}
          onOpenPromptModal={() => {}}
          onClearPrompt={() => {}}
          onRequestSocratic={() => {}}
        />,
      );

      // Open connectors
      const connectorsToggle = screen.getByRole('button', { name: /Conectores \(B1\)/i });
      fireEvent.click(connectorsToggle);

      // Should show B1 connectors like however
      const howeverBtn = screen.getByRole('button', { name: /however/i });
      fireEvent.click(howeverBtn);

      expect(currentDraft).toContain('However');
    });
  });

  describe('WritingStageThree Learner Uptake', () => {
    it('displays learner uptake block when successful_repairs are provided', () => {
      const mockEval = {
        overall_feedback_es: 'Buen trabajo',
        estimated_cefr: 'B1' as const,
        scores: { grammar: 8.5, vocabulary: 8.0, coherence: 8.5 },
        successful_repairs: [
          {
            original_snippet: 'depends of',
            corrected_snippet: 'depends on',
            praise_es: "¡Excelente! Corregiste la preposición fija a 'depend on' de forma autónoma.",
          },
        ],
        corrections: [],
        micro_challenge: {
          question_es: '¿Preposición?',
          sentence_with_blank: 'depend ___ it',
          options: ['of', 'on'],
          correct_option_index: 1,
          explanation_es: 'depend on',
        },
      };

      render(
        <WritingStageThree
          evalResult={mockEval}
          draft1="It depends of money"
          draft2="It depends on money"
          selectedQuizOption={null}
          quizSubmitted={false}
          onAnswerQuiz={() => {}}
          onReset={() => {}}
        />,
      );

      expect(screen.getByText(/Logros de Auto-Corrección \(Learner Uptake\)/i)).toBeDefined();
      expect(screen.getByText(/"depends on"/i)).toBeDefined();
      expect(screen.getByText(/Corregiste la preposición fija a 'depend on'/i)).toBeDefined();
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
