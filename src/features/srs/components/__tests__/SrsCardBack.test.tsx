import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SrsCardBack } from '../SrsCardBack';
import { VocabItem } from '@/core/types/vocab';
import { SrsCard } from '@/core/types/srs';
import * as audioHook from '@/shared/hooks/useAudio';

describe('SrsCardBack Component', () => {
  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioHook, 'useAudio').mockReturnValue({
      audioService: mockAudioService as any,
    });
  });

  const sampleVocab: VocabItem = {
    id: 'voc_test_1',
    word: 'thrive',
    partOfSpeech: 'VERB',
    grammaticalDimension: 'CONTENT',
    domainCategory: 'Crecimiento Personal',
    translationEs: 'prosperar, florecer',
    definitionEn: 'To grow, develop, or be successful in a vigorous way.',
    ipaGeneralAmerican: 'θraɪv',
    ipaReceivedPronunciation: 'θraɪv',
    cefrLevel: 'C1',
    isFalseFriend: false,
    isCore: true,
    masteryStatus: 'LEARNING',
    collocationsJson: ['thrive on challenges', 'thrive in adverse conditions'],
    createdAt: new Date().toISOString(),
    verbTensesJson: {
      infinitive: 'thrive',
      pastSimple: 'thrived',
      pastParticiple: 'thrived',
      thirdPersonPresent: 'thrives',
      gerund: 'thriving',
      isIrregular: false,
    },
  };

  const sampleCard: SrsCard = {
    id: 'card_1',
    userId: 'user_local',
    targetType: 'VOCAB',
    targetId: 'voc_test_1',
    srsProfile: 'VOCAB_AGILE',
    state: 'REVIEW',
    stability: 7.2,
    difficulty: 3.4,
    reps: 5,
    lapses: 0,
    consecutiveLapses: 0,
    isLeech: false,
    scheduledFor: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  it('renders clean hero meaning, definition, collocations, and verb tenses without technical clutter', () => {
    const onRate = vi.fn();
    render(
      <SrsCardBack
        selectedVocab={sampleVocab}
        currentContext={{
          id: 'ctx_1',
          vocabId: sampleVocab.id,
          sentenceEn: 'Small businesses thrive with community support.',
          sentenceEs: 'Los pequeños negocios prosperan con el apoyo comunitario.',
          clozeTarget: 'thrive',
          cefrLevel: 'C1',
          createdAt: new Date().toISOString(),
        }}
        availableContexts={[]}
        srsCard={sampleCard}
        previewIntervals={{ 1: 0, 2: 2, 3: 6, 4: 14 }}
        accent="US"
        onAccentChange={vi.fn()}
        onRotateContext={vi.fn()}
        onRate={onRate}
        audioService={mockAudioService as any}
      />
    );

    // Hero meaning & word
    expect(screen.getByText('prosperar, florecer')).toBeDefined();
    expect(screen.getAllByText('thrive').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\/θraɪv\//i)).toBeDefined();

    // Collocations
    expect(screen.getByText('thrive on challenges')).toBeDefined();

    // Verb tenses
    expect(screen.getByText('Tiempos Verbales')).toBeDefined();
    expect(screen.getAllByText('thrived').length).toBeGreaterThanOrEqual(1);

    // Context sentence
    expect(screen.getByText(/Small businesses thrive with community support/i)).toBeDefined();
    expect(screen.getByText(/Los pequeños negocios prosperan con el apoyo comunitario/i)).toBeDefined();

    // NO technical clutter or algorithmic telemetry
    expect(screen.queryByText(/FSRS/i)).toBeNull();
    expect(screen.queryByText(/Estabilidad:/i)).toBeNull();
    expect(screen.queryByText(/Dificultad:/i)).toBeNull();
    expect(screen.queryByText(/Paso de Consolidación Intradía/i)).toBeNull();
  });

  it('triggers onRate with accurate grade when user clicks rating buttons', () => {
    const onRate = vi.fn();
    render(
      <SrsCardBack
        selectedVocab={sampleVocab}
        currentContext={null}
        availableContexts={[]}
        srsCard={sampleCard}
        previewIntervals={{ 1: 0, 2: 2, 3: 6, 4: 14 }}
        accent="US"
        onAccentChange={vi.fn()}
        onRotateContext={vi.fn()}
        onRate={onRate}
        audioService={mockAudioService as any}
      />
    );

    const goodBtn = screen.getByText('Bueno');
    fireEvent.click(goodBtn);
    expect(onRate).toHaveBeenCalledWith(3);

    const repeatBtn = screen.getByText('Repetir');
    fireEvent.click(repeatBtn);
    expect(onRate).toHaveBeenCalledWith(1);

    const hardBtn = screen.getByText('Difícil');
    fireEvent.click(hardBtn);
    expect(onRate).toHaveBeenCalledWith(2);

    const easyBtn = screen.getByText('Fácil');
    fireEvent.click(easyBtn);
    expect(onRate).toHaveBeenCalledWith(4);
  });
});
