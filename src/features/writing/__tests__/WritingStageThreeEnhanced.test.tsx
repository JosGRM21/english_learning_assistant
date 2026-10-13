import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { WritingStageThree } from '../components/WritingStageThree';
import { WritingEvaluationResponse } from '@/infrastructure/ai/schemas';

describe('WritingStageThree Enhanced (Doble Reformulación & 4-Axis Rubric)', () => {
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
        taxonomy_code: 'PREP_REGIME',
        is_l1_spanish_transfer: true,
        explanation_es: 'En inglés se dice depend on.',
        native_reformulation: 'depend on',
        original_sentence: 'It depend of that.',
        expanded_context: 'It depend of that.',
      },
    ],
  };

  it('renders 4-axis rubric scores with clear metrics', () => {
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

  it('does NOT render Activación de Vocabulario Objetivo, Doble Reformulación, Noticing the Gap, nor Ejercicios por Error', () => {
    const evalWithVocab = {
      ...mockEvalResult,
      target_words_feedback: [
        { word: 'atmosphere', used: true, is_natural: true, feedback_es: 'Buena integración de vocabulario.' },
      ],
    };

    render(
      <WritingStageThree
        evalResult={evalWithVocab}
        draft1="Initial draft"
        draft2="Revised draft"
        onReset={vi.fn()}
      />,
    );

    // 1. Vocabulario Objetivo (SRS) container must not exist
    expect(screen.queryByText(/Activación de Vocabulario Objetivo \(SRS\)/i)).toBeNull();

    // 2. Doble Reformulación Pedagógica container must not exist
    expect(screen.queryByText(/Doble Reformulación Pedagógica/i)).toBeNull();
    expect(screen.queryByText('Versión Estructural Limpia')).toBeNull();
    expect(screen.queryByText('Versión Nativa Pulida (Recast)')).toBeNull();

    // 3. Noticing the Gap container must not exist
    expect(screen.queryByText(/Noticing the Gap/i)).toBeNull();
    expect(screen.queryByText(/Brecha Lingüística/i)).toBeNull();

    // 4. Ejercicios Específicos por Error container must not exist
    expect(screen.queryByText(/Ejercicios Específicos por Error/i)).toBeNull();
    expect(screen.queryByText(/Laboratorio de Práctica Deliberada/i)).toBeNull();
  });

  it('triggers onNavigateToDefossilization when CTA button is clicked', () => {
    const handleNavigate = vi.fn();
    render(
      <WritingStageThree
        evalResult={mockEvalResult}
        draft1="Initial draft"
        draft2="Revised draft"
        onNavigateToDefossilization={handleNavigate}
        onReset={vi.fn()}
      />,
    );

    const defossBtn = screen.getByRole('button', { name: /Practicar en Corrector de Hábitos/i });
    fireEvent.click(defossBtn);

    expect(handleNavigate).toHaveBeenCalled();
  });
});
