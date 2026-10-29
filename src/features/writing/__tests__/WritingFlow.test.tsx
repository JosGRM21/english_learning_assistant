import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { useWritingStore } from '../store/writingStore';
import { ZpdScaffoldingCard } from '../components/ZpdScaffoldingCard';
import { WritingStageOne } from '../components/WritingStageOne';
import { WritingStageTwo } from '../components/WritingStageTwo';
import { WritingStageThree } from '../components/WritingStageThree';
import { SocraticClue, SocraticFeedbackResponse } from '@/infrastructure/ai/schemas';

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
      expect(state.activeTab).toBe('STUDIO');
    });

    it('loadSubmissionIntoStudio restores evaluated submission at stage 3', () => {
      const mockSub = {
        id: 'sub_test_1',
        userId: 'user_local',
        submissionMode: 'FREE' as const,
        userText: 'Original text',
        draft2Text: 'Corrected text',
        wordCount: 2,
        status: 'EVALUATED' as const,
        submittedAt: '2026-09-30T10:00:00Z',
        evaluation: {
          overall_feedback_es: 'Feedback',
          clean_structural_version: 'Corrected text',
          native_recast_version: 'Polished text',
          noticing_the_gap_contrasts: [],
          rubric_scores: { accuracy: 8.5, range_and_precision: 8.0, cohesion_and_flow: 9.0, pragmatics_and_complexity: 8.0 },
          qualitative_recommendations_es: '',
          estimated_cefr: 'B2' as const,
          successful_repairs: [],
          corrections: [],
        },
      };

      useWritingStore.getState().loadSubmissionIntoStudio(mockSub);

      const state = useWritingStore.getState();
      expect(state.currentStage).toBe(3);
      expect(state.draft1).toBe('Original text');
      expect(state.draft2).toBe('Corrected text');
      expect(state.evalResult?.estimated_cefr).toBe('B2');
      expect(state.submissionMode).toBe('FREE');
    });
  });

  describe('ZpdScaffoldingCard', () => {
    const mockClue: SocraticClue = {
      paragraph_index: 1,
      clue_type: 'PREPOSITION',
      is_l1_spanish_transfer: true,
      hint_question_es: "¿Cuál es la preposición que rige 'depend'?",
      highlighted_area: 'depend of',
      sentence_context: 'It will depend of the weather.',
      zpd_contrastive_es: 'En inglés se dice depend on, no depend of.',
      zpd_cloze_sentence: 'depend [ ___ ]',
      zpd_expected_token: 'on',
      zpd_native_model: 'Colocación nativa: depend on.',
    };

    it('does not render technical L1 transfer badge in clue card', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);
      expect(screen.queryByText(/Interferencia L1 \(Español\)/i)).toBeNull();
    });

    it('renders direct natural expression and explanation for idiomatic conventions (Gaps)', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);

      // Shows natural recommended form directly without rigid level tabs
      expect(screen.getByText(/Forma recomendada en inglés:/i)).toBeDefined();
      expect(screen.getByText('on')).toBeDefined();
      expect(screen.getByText(/En inglés se dice depend on, no depend of./i)).toBeDefined();

      // Ensure NO rigid level 1, 2, 3, 4 tabs exist
      expect(screen.queryByRole('button', { name: /^Nivel 1$/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /^Nivel 2$/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /^Nivel 3$/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /^Nivel 4$/i })).toBeNull();

      // Ensure NO technical pedagogical jargon is exposed to user
      expect(screen.queryByText(/Estrategia de Reformulación/i)).toBeNull();
      expect(screen.queryByText(/Desliz de Monitoreo/i)).toBeNull();
    });

    it('toggles interactive cloze practice and validates input for idiomatic conventions', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} />);

      // Practice is initially closed
      expect(screen.queryByPlaceholderText(/Escribe la corrección/i)).toBeNull();

      // Toggle practice
      const toggleBtn = screen.getByRole('button', { name: /Practicar en una oración/i });
      fireEvent.click(toggleBtn);

      const input = screen.getByPlaceholderText(/Escribe la corrección/i);
      const submitBtn = screen.getByRole('button', { name: /Comprobar/i });

      // Partial input fails
      fireEvent.change(input, { target: { value: 'o' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText(/Intenta nuevamente/i)).toBeDefined();
      expect(screen.queryByText(/¡Exacto! Asimilaste la estructura/i)).toBeNull();

      // Correct input passes
      fireEvent.change(input, { target: { value: 'on' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText(/¡Exacto! Asimilaste la estructura/i)).toBeDefined();
    });

    it('renders guiding question for slips and provides progressive disclosure', () => {
      const slipClue: SocraticClue = {
        paragraph_index: 1,
        clue_type: 'AGREEMENT',
        is_l1_spanish_transfer: false,
        hint_question_es: 'Revisa la concordancia del sujeto con el verbo.',
        highlighted_area: 'he like',
        sentence_context: 'He like apples.',
        zpd_contrastive_es: 'En presente simple de tercera persona se añade -s.',
        zpd_cloze_sentence: 'He [ ___ ] apples.',
        zpd_expected_token: 'likes',
        zpd_native_model: 'He likes apples.',
      };

      render(<ZpdScaffoldingCard clue={slipClue} index={0} />);

      // Shows reflection question
      expect(screen.getByText('Revisa la concordancia del sujeto con el verbo.')).toBeDefined();

      // Does not expose direct answer right away
      expect(screen.queryByText(/Forma recomendada en inglés:/i)).toBeNull();

      // Can reveal solution when requested
      const showSolBtn = screen.getByRole('button', { name: /Ver solución/i });
      fireEvent.click(showSolBtn);
      expect(screen.getByText(/Solución de referencia:/i)).toBeDefined();
      expect(screen.getByText('He')).toBeDefined();
      expect(screen.getByText('likes')).toBeDefined();
    });

    it('renders applied status badge when isApplied is true', () => {
      render(<ZpdScaffoldingCard clue={mockClue} index={0} isApplied={true} />);
      expect(screen.getByText(/Modificado en Borrador 2/i)).toBeDefined();
    });

    it('renders explicit error banner when AI omits required explanation in a gap clue', () => {
      const incompleteClue: SocraticClue = {
        paragraph_index: 1,
        clue_type: 'FALSE_FRIEND',
        is_l1_spanish_transfer: true,
        hint_question_es: 'Revisa esta palabra.',
        highlighted_area: 'assist to',
        sentence_context: 'I assist to the meeting.',
        // zpd_contrastive_es omitted!
        zpd_expected_token: 'attend',
        zpd_native_model: 'attend the meeting',
      };

      render(<ZpdScaffoldingCard clue={incompleteClue} index={0} />);
      expect(screen.getByText(/Error al procesar la pista #1/i)).toBeDefined();
      expect(screen.getByText(/La IA omitió la información pedagógica requerida/i)).toBeDefined();
      // Ensure NO synthetic fallback text was shown!
      expect(screen.queryByText(/partícula idiomática fija/i)).toBeNull();
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
          is_l1_spanish_transfer: false,
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

      marks.forEach((mark: HTMLElement) => {
        // Every mark must strictly be the standalone 'i'
        expect(mark.textContent).toBe('i');
      });

      // Verify that words like "This", "is", "writing" are NOT inside any mark
      const markTexts = Array.from(marks).map((m: HTMLElement) => m.textContent);
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
          isLoading={false}
          onDraftChange={handleDraftChange}
          onTargetCefrChange={() => {}}
          onSubmissionModeChange={() => {}}
          onRequestSocratic={() => {}}
        />
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
        clean_structural_version: 'It depends on money',
        native_recast_version: 'It depends on financial resources',
        noticing_the_gap_contrasts: [],
        rubric_scores: { accuracy: 8.5, range_and_precision: 8.0, cohesion_and_flow: 8.5, pragmatics_and_complexity: 8.0 },
        qualitative_recommendations_es: '',
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
      };

      render(
        <WritingStageThree
          evalResult={mockEval}
          draft1="It depends of money"
          draft2="It depends on money"
          onReset={() => {}}
        />,
      );

      expect(screen.getByText(/Mejoras aplicadas con éxito/i)).toBeDefined();
      expect(screen.getByText(/"depends on"/i)).toBeDefined();
      expect(screen.getByText(/Corregiste la preposición fija a 'depend on'/i)).toBeDefined();
    });
  });


  describe('Reading-to-Write and Target Vocabulary in WritingStore', () => {
    it('selectReadingAndApply configures store for reading-to-write mode', () => {
      const mockReading = {
        id: 'read_1',
        title: 'The Silent Meadow',
        cefrLevel: 'A2' as const,
        category: 'SHORT_STORIES' as const,
        categoryLabelEs: 'Cuentos Cortos',
        readingTimeMin: 2,
        wordCount: 150,
        readingTextEn: 'Once upon a time in a silent meadow...',
        readingSummaryEs: 'Un cuento sobre la tranquilidad de la naturaleza.',
        keyVocabulary: [],
        comprehensionQuestions: [],
        writingMissions: [
          {
            type: 'SUMMARY' as const,
            titleEs: 'Misión: Resumen',
            instructionsEs: 'Resume lo ocurrido.',
            suggestedOpening: 'In this story,',
            suggestedWordRange: { min: 30, max: 60 },
          },
        ],
      };

      const mission = mockReading.writingMissions[0];
      useWritingStore.getState().selectReadingAndApply(mockReading, mission);

      const state = useWritingStore.getState();
      expect(state.submissionMode).toBe('READING_TO_WRITE');
      expect(state.selectedReading?.id).toBe('read_1');
      expect(state.selectedMission?.type).toBe('SUMMARY');
      expect(state.targetCefr).toBe('A2');
      expect(state.draft1).toBe('In this story, ');
      expect(state.currentStage).toBe(1);
    });

    it('updateTargetWordUsage marks target words as used when detected in draft', () => {
      useWritingStore.getState().setTargetWords([
        { word: 'thrive', translationEs: 'prosperar', isUsed: false },
        { word: 'struggle', translationEs: 'luchar', isUsed: false },
      ]);

      // Student writes a draft containing 'thrived'
      useWritingStore.getState().updateTargetWordUsage('Plants thrived in the sunlight.');

      const state = useWritingStore.getState();
      expect(state.targetWords[0].isUsed).toBe(true);
      expect(state.targetWords[1].isUsed).toBe(false);
    });

    it('replaceTargetWord swaps an active target word with one from the weak pool', () => {
      useWritingStore.getState().setTargetWords([
        { word: 'reluctant', translationEs: 'renuente', isUsed: false },
        { word: 'eager', translationEs: 'ansioso', isUsed: false },
      ]);
      useWritingStore.getState().setAvailableWeakPool([
        { word: 'persistent', translationEs: 'persistente', isUsed: false },
      ]);

      useWritingStore.getState().replaceTargetWord(0);

      const state = useWritingStore.getState();
      expect(state.targetWords[0].word).toBe('persistent');
      expect(state.availableWeakPool[0].word).toBe('reluctant');
    });
  });
});

