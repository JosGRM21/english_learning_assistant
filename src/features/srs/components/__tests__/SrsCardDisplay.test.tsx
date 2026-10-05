import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SrsCardDisplay } from '../SrsCardDisplay';
import { VocabItem } from '@/core/types/vocab';
import { SrsCard } from '@/core/types/srs';
import * as audioHook from '@/shared/hooks/useAudio';

describe('SrsCardDisplay Component', () => {
  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  vi.spyOn(audioHook, 'useAudio').mockReturnValue({
    audioService: mockAudioService as any,
  });

  const vocabRunFinance: VocabItem = {
    id: 'voc_run_1',
    word: 'run',
    partOfSpeech: 'VERB',
    grammaticalDimension: 'CONTENT',
    domainCategory: 'Finanzas y Negocios',
    translationEs: 'administrar, gestionar',
    definitionEn: 'To be in charge of or manage a business or organization.',
    ipaGeneralAmerican: 'rʌn',
    cefrLevel: 'B2',
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
    verbTensesJson: {
      infinitive: 'run',
      pastSimple: 'ran',
      pastParticiple: 'run',
      thirdPersonPresent: 'runs',
      gerund: 'running',
      isIrregular: true,
    },
  };

  const vocabRunSports: VocabItem = {
    id: 'voc_run_2',
    word: 'run',
    partOfSpeech: 'NOUN',
    grammaticalDimension: 'CONTENT',
    domainCategory: 'Deportes',
    translationEs: 'carrera, anotación',
    definitionEn: 'A point scored in baseball or cricket.',
    ipaGeneralAmerican: 'rʌn',
    cefrLevel: 'B1',
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
  };

  const srsCard: SrsCard = {
    id: 'card_1',
    userId: 'user_local',
    targetType: 'VOCAB',
    targetId: 'voc_run_1',
    state: 'REVIEW',
    stability: 5.0,
    difficulty: 3.0,
    reps: 4,
    lapses: 0,
    lastReviewedAt: new Date().toISOString(),
    scheduledFor: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  it('renders prominent category and domain discriminator on front face for polysemic words', () => {
    render(
      <SrsCardDisplay
        selectedVocab={vocabRunFinance}
        currentContext={null}
        availableContexts={[]}
        srsCard={srsCard}
        showAnswer={false}
        previewIntervals={{ 1: 1, 2: 3, 3: 7, 4: 15 }}
        onRotateContext={vi.fn()}
        onShowAnswer={vi.fn()}
        onRate={vi.fn()}
        audioService={mockAudioService as any}
      />
    );

    // Front face should show the word stimulus
    expect(screen.getAllByText('run').length).toBeGreaterThanOrEqual(1);

    // Must prominently display grammatical category and domain scope so user knows which sense is asked
    expect(screen.getByText(/Categoría:/i)).toBeDefined();
    expect(screen.getAllByText(/Verbo/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Finanzas y Negocios/i).length).toBeGreaterThanOrEqual(1);
  });

  it('disambiguates identical words with different parts of speech and domains', () => {
    const { rerender } = render(
      <SrsCardDisplay
        selectedVocab={vocabRunFinance}
        currentContext={null}
        availableContexts={[]}
        srsCard={srsCard}
        showAnswer={false}
        previewIntervals={{ 1: 1, 2: 3, 3: 7, 4: 15 }}
        onRotateContext={vi.fn()}
        onShowAnswer={vi.fn()}
        onRate={vi.fn()}
        audioService={mockAudioService as any}
      />
    );

    expect(screen.getAllByText(/Verbo/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Finanzas y Negocios/i).length).toBeGreaterThanOrEqual(1);

    // Rerender with noun sports sense of the exact same word "run"
    rerender(
      <SrsCardDisplay
        selectedVocab={vocabRunSports}
        currentContext={null}
        availableContexts={[]}
        srsCard={srsCard}
        showAnswer={false}
        previewIntervals={{ 1: 1, 2: 3, 3: 7, 4: 15 }}
        onRotateContext={vi.fn()}
        onShowAnswer={vi.fn()}
        onRate={vi.fn()}
        audioService={mockAudioService as any}
      />
    );

    expect(screen.getAllByText(/Sustantivo/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Deportes/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders domain category badge and verb tenses card on back face', () => {
    render(
      <SrsCardDisplay
        selectedVocab={vocabRunFinance}
        currentContext={null}
        availableContexts={[]}
        srsCard={srsCard}
        showAnswer={true}
        previewIntervals={{ 1: 1, 2: 3, 3: 7, 4: 15 }}
        onRotateContext={vi.fn()}
        onShowAnswer={vi.fn()}
        onRate={vi.fn()}
        audioService={mockAudioService as any}
      />
    );

    // Back face answer elements
    expect(screen.getByText('administrar, gestionar')).toBeDefined();
    expect(screen.getAllByText(/Finanzas y Negocios/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tiempos Verbales')).toBeDefined();
    expect(screen.getByText('ran')).toBeDefined();
  });
});
