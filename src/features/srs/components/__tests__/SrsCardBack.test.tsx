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

  it('renders clean hero meaning, definition, and verb tenses without technical clutter', () => {
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

    // Domain category badge without "Ámbito:" prefix and clean Normal audio button
    expect(screen.getByText('Crecimiento Personal')).toBeDefined();
    expect(screen.queryByText(/Ámbito:/i)).toBeNull();
    expect(screen.getByText('Normal')).toBeDefined();
    expect(screen.queryByText('Audio')).toBeNull();

    // Clean US and UK accent toggles without emojis
    const usBtn = screen.getByRole('button', { name: /Acento General American/i });
    const ukBtn = screen.getByRole('button', { name: /Acento Received Pronunciation/i });
    expect(usBtn.textContent?.trim()).toBe('US');
    expect(ukBtn.textContent?.trim()).toBe('UK');

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

  it('renders phrasal verbs with distinct Spanish meaning in hero and English definition in body', () => {
    const phrasalCard: SrsCard = {
      ...sampleCard,
      id: 'card_phr_1',
      targetType: 'PHRASE',
      targetId: 'phr_1',
    };

    const phrasalVocab: VocabItem = {
      id: 'phr_1',
      word: 'be about to',
      grammaticalDimension: 'CHUNK',
      partOfSpeech: 'VERB',
      subcategory: 'PHRASAL_VERB',
      translationEs: 'estar a punto de',
      definitionEn: 'To be very close to doing something.',
      ipaGeneralAmerican: 'bi əˈbaʊt tu',
      cefrLevel: 'B1',
      isCore: true,
      masteryStatus: 'LEARNING',
      domainCategory: 'Phrasal Verb',
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    render(
      <SrsCardBack
        cardWithTarget={{
          card: phrasalCard,
          vocab: phrasalVocab,
          phrase: {
            id: 'phr_1',
            chunkType: 'PHRASAL_VERB',
            text: 'be about to',
            meaningEs: 'estar a punto de',
            definitionEn: 'To be very close to doing something.',
            phrasalVerbType: 'TYPE_3_INSEPARABLE',
            example1: 'We are about to leave.',
            cefrLevel: 'B1',
            createdAt: new Date().toISOString(),
          },
          currentSenseIndex: 0,
          currentSense: {
            senseId: 'sense_phr_1',
            translationEs: 'estar a punto de',
            definitionEn: 'To be very close to doing something.',
            partOfSpeech: 'VERB',
            cefrLevel: 'B1',
          },
          allContexts: [],
        }}
        selectedVocab={phrasalVocab}
        currentContext={null}
        availableContexts={[]}
        srsCard={phrasalCard}
        previewIntervals={{ 1: 0, 2: 2, 3: 6, 4: 14 }}
        accent="US"
        onAccentChange={vi.fn()}
        onRotateContext={vi.fn()}
        onRate={vi.fn()}
        audioService={mockAudioService as any}
      />
    );

    // Hero meaning in Spanish
    expect(screen.getByText('estar a punto de')).toBeDefined();

    // Definition in English (must be distinct from Spanish translation)
    expect(screen.getByText('To be very close to doing something.')).toBeDefined();

    // Specific phrasal verb type badge is displayed cleanly
    expect(screen.getByText('Inseparable (con objeto)')).toBeDefined();
    expect(screen.queryByText('Uso General')).toBeNull();
  });
});
