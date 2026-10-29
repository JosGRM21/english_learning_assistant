import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WritingStageThree } from '../components/WritingStageThree';
import { WritingEvaluationResponse } from '@/infrastructure/ai/schemas';

describe('WritingStageThree Enhanced (RF-WRT-07, RF-WRT-08, RF-WRT-11)', () => {
  const mockEvalResult: WritingEvaluationResponse = {
    overall_feedback_es: 'Tu redacción muestra una estructura clara y buen manejo de tiempos.',
    estimated_cefr: 'B2',
    clean_structural_version: 'I have been living in London for three years and I really enjoy the atmosphere.',
    native_recast_version: 'Having lived in London for three years, I find its vibrant atmosphere truly captivating.',
    noticing_the_gap_contrasts: [
      {
        user_fragment: 'I have 3 years living',
        native_fragment: 'Having lived... for three years',
        noticing_note_es: 'Se utiliza participio perfecto para indicar duración de una experiencia continua.',
      },
    ],
    rubric_scores: {
      accuracy: 8.5,
      range_and_precision: 8.0,
      cohesion_and_flow: 9.0,
      pragmatics_and_complexity: 7.5,
    },
    qualitative_recommendations_es: 'Practica conectores de contraste.',
    successful_repairs: [],
    corrections: [
      {
        error_span: 'depend of',
        error_type: 'PREPOSITION',
        taxonomy_code: 'PREPOSITION',
        is_l1_spanish_transfer: true,
        explanation_es: 'En inglés se dice depend on.',
        native_reformulation: 'depend on',
        original_sentence: 'It depend of that.',
        expanded_context: 'It depend of that.',
      },
      {
        error_span: 'buyed',
        error_type: 'TENSE_ASPECT',
        taxonomy_code: 'TENSE_ASPECT',
        is_l1_spanish_transfer: false,
        explanation_es: 'El verbo buy es irregular: bought.',
        native_reformulation: 'bought',
        original_sentence: 'I buyed a book.',
        expanded_context: 'I buyed a book.',
      },
    ],
  };

  it('renders 4-axis rubric scores with clear metrics (RF-WRT-08)', () => {
    render(
      <WritingStageThree
        evalResult={mockEvalResult}
        draft1="Initial draft"
        draft2="Revised draft"
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText(/Precisión \(Accuracy\)/i)).toBeDefined();
    expect(screen.getByText('8.5 / 10')).toBeDefined();

    expect(screen.getByText(/Rango Léxico \(Range\)/i)).toBeDefined();
    expect(screen.getByText('8 / 10')).toBeDefined();

    expect(screen.getByText(/Cohesión & Fluidez/i)).toBeDefined();
    expect(screen.getByText('9 / 10')).toBeDefined();

    expect(screen.getByText(/Pragmática & Registro/i)).toBeDefined();
    expect(screen.getByText('7.5 / 10')).toBeDefined();
  });

  it('renders Double Recast panel and Noticing the Gap contrasts (RF-WRT-07)', () => {
    render(
      <WritingStageThree
        evalResult={mockEvalResult}
        draft1="Initial draft"
        draft2="Revised draft"
        onReset={vi.fn()}
      />,
    );

    // 1. Level 1: Grammatical Correction Version
    expect(screen.getByRole('heading', { level: 4, name: /Corrección Gramatical/i })).toBeDefined();
    expect(screen.getByText(/I have been living in London for three years/i)).toBeDefined();

    // 2. Level 2: Natural Native Version
    expect(screen.getByText(/Versión Nativa Natural/i)).toBeDefined();
    expect(screen.getByText(/Having lived in London for three years, I find its vibrant atmosphere/i)).toBeDefined();

    // 3. Noticing the Gap / Expression contrasts
    expect(screen.getByRole('heading', { name: /Cómo sonar más natural/i })).toBeDefined();
    expect(screen.getByText(/I have 3 years living/i)).toBeDefined();
    expect(screen.getByText(/Having lived... for three years/i)).toBeDefined();
    expect(
      screen.getByText(/Se utiliza participio perfecto para indicar duración/i),
    ).toBeDefined();
  });

  it('triggers TTS playback for Level 2 Native Recast when clicked (RF-WRT-11)', () => {
    const handlePlayTts = vi.fn();
    render(
      <WritingStageThree
        evalResult={mockEvalResult}
        draft1="Initial draft"
        draft2="Revised draft"
        onPlayTts={handlePlayTts}
        onReset={vi.fn()}
      />,
    );

    const ttsBtn = screen.getByRole('button', { name: /Escuchar versión nativa natural/i });
    fireEvent.click(ttsBtn);

    expect(handlePlayTts).toHaveBeenCalledWith(
      'Having lived in London for three years, I find its vibrant atmosphere truly captivating.',
    );
  });

  it('renders Puntos de Mejora tab without technical linguistic badges', () => {
    render(
      <WritingStageThree
        evalResult={mockEvalResult}
        draft1="Initial draft"
        draft2="Revised draft"
        onReset={vi.fn()}
      />,
    );

    const correctionsTab = screen.getByRole('button', { name: /Puntos de Mejora/i });
    expect(correctionsTab).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();

    fireEvent.click(correctionsTab);

    expect(screen.getByText(/Correcciones y Puntos de Mejora \(2\)/i)).toBeDefined();
    expect(screen.getByText('depend of')).toBeDefined();
    expect(screen.getByText('buyed')).toBeDefined();

    // Technical badges (PREPOSITION, Influencia del Español) should NOT be rendered
    expect(screen.queryByText('Influencia del Español')).toBeNull();
    expect(screen.queryByText('PREPOSITION')).toBeNull();
  });
});
