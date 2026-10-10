import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDrillStation } from '../components/ErrorDrillStation';
import { CorrectionItem } from '@/infrastructure/ai/schemas';

describe('ErrorDrillStation Component', () => {
  const mockCorrections: CorrectionItem[] = [
    {
      error_span: 'depend of',
      error_type: 'PREPOSITION',
      taxonomy_code: 'PREP_REGIME',
      is_l1_spanish_transfer: true,
      explanation_es: 'En inglés se dice "depend on", no "depend of".',
      native_reformulation: 'depend on',
      original_sentence: 'Success will always depend of your consistency.',
      expanded_context: 'Success will always depend of your consistency.',
      drill: {
        cloze_sentence: 'Success will always [ ___ ] your consistency.',
        expected_token: 'depend on',
        options: ['depend of', 'depend on', 'depend from'],
        correct_option_index: 1,
        explanation_es: 'La preposición requerida por el verbo depend es on.',
        transfer_prompt_es: 'Escribe una oración con "depend on".',
      },
    },
    {
      error_span: 'i have 25 years',
      error_type: 'LEXICON',
      taxonomy_code: 'FALSE_FRIEND_AGE',
      is_l1_spanish_transfer: true,
      explanation_es: 'En inglés se usa el verbo "to be" para la edad: "I am 25 years old".',
      native_reformulation: 'I am 25 years old',
      original_sentence: 'My brother has 25 years today.',
      expanded_context: 'My brother has 25 years today.',
      drill: {
        cloze_sentence: 'My brother [ ___ ] today.',
        expected_token: 'is 25 years old',
        options: ['has 25 years', 'is 25 years old'],
        correct_option_index: 1,
        explanation_es: 'Se utiliza el verbo be para la edad.',
      },
    },
  ];

  it('renders flawless state when corrections list is empty', () => {
    render(
      <ErrorDrillStation
        corrections={[]}
        onAnswerDrill={vi.fn()}
      />,
    );

    expect(screen.getByText('¡Redacción Impecable!')).toBeDefined();
    expect(screen.getByText(/No se detectaron errores residuales/i)).toBeDefined();
  });

  it('renders first error drill with stepper, contrastive card, and options', () => {
    const handleAnswerDrill = vi.fn();
    render(
      <ErrorDrillStation
        corrections={mockCorrections}
        onAnswerDrill={handleAnswerDrill}
      />,
    );

    // Stepper checks
    expect(screen.getByText(/Laboratorio de Práctica Deliberada/i)).toBeDefined();
    expect(screen.getByText(/Ejercicios Específicos por Error \(2\)/i)).toBeDefined();

    // Contrastive info
    expect(screen.getByText('"depend of"')).toBeDefined();
    expect(screen.getByText('"depend on"')).toBeDefined();
    expect(screen.getByText(/En inglés se dice "depend on", no "depend of"./i)).toBeDefined();

    // Cloze sentence
    expect(screen.getByText(/"Success will always \[ ___ \] your consistency\."/i)).toBeDefined();

    // Options
    expect(screen.getByRole('button', { name: /^depend of$/i })).toBeDefined();
    expect(screen.getAllByRole('button', { name: /^depend on$/i }).length).toBe(2);
    expect(screen.getByRole('button', { name: /^depend from$/i })).toBeDefined();
  });

  it('answers drill correctly, triggers onAnswerDrill and shows feedback', () => {
    const handleAnswerDrill = vi.fn();
    render(
      <ErrorDrillStation
        corrections={mockCorrections}
        onAnswerDrill={handleAnswerDrill}
      />,
    );

    const dependOnBtns = screen.getAllByRole('button', { name: /^depend on$/i });
    const correctOptionBtn = dependOnBtns[dependOnBtns.length - 1];
    fireEvent.click(correctOptionBtn);

    expect(handleAnswerDrill).toHaveBeenCalledWith(
      'depend of',
      1,
      mockCorrections[0].drill,
    );

    expect(screen.getByText(/La preposición requerida por el verbo depend es on./i)).toBeDefined();
  });

  it('switches between errors using stepper tabs', () => {
    render(
      <ErrorDrillStation
        corrections={mockCorrections}
        onAnswerDrill={vi.fn()}
      />,
    );

    // Switch to Error 2 using stepper button
    const error2Btn = screen.getByRole('button', { name: /I am 25 years old/i });
    fireEvent.click(error2Btn);

    expect(screen.getByText('"i have 25 years"')).toBeDefined();
    expect(screen.getByText('"I am 25 years old"')).toBeDefined();
    expect(screen.getByText(/En inglés se usa el verbo "to be" para la edad/i)).toBeDefined();
  });

  it('triggers onPlayTts when audio button is clicked', () => {
    const handlePlayTts = vi.fn();
    render(
      <ErrorDrillStation
        corrections={mockCorrections}
        onAnswerDrill={vi.fn()}
        onPlayTts={handlePlayTts}
      />,
    );

    const ttsBtn = screen.getByTitle(/Escuchar pronunciación nativa/i);
    fireEvent.click(ttsBtn);

    expect(handlePlayTts).toHaveBeenCalledWith('depend on');
  });

  it('triggers onAddToSrs when Anclar como Tarjeta Cloze en SRS button is clicked', () => {
    const handleAddToSrs = vi.fn();
    render(
      <ErrorDrillStation
        corrections={mockCorrections}
        onAnswerDrill={vi.fn()}
        onAddToSrs={handleAddToSrs}
      />,
    );

    const srsBtn = screen.getByRole('button', { name: /Anclar como Tarjeta Cloze en SRS/i });
    fireEvent.click(srsBtn);

    expect(handleAddToSrs).toHaveBeenCalledWith(mockCorrections[0], undefined);
    expect(screen.getByText(/Guardado en tu Mazo SRS/i)).toBeDefined();
  });
});
