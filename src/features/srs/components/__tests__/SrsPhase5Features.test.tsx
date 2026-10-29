import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SrsCardDisplay } from '../SrsCardDisplay';
import { SrsSessionComplete } from '../SrsSessionComplete';
import { SrsDeckDrawer } from '../SrsDeckDrawer';
import { VocabItem } from '@/core/types/vocab';
import { SrsCard, CardWithTarget } from '@/core/types/srs';
import * as audioHook from '@/shared/hooks/useAudio';

describe('Phase 5 Functional Specifications Verification', () => {
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
    id: 'voc_take_1',
    word: 'take off',
    partOfSpeech: 'VERB',
    grammaticalDimension: 'CHUNK',
    domainCategory: 'Aviación / Viajes',
    translationEs: 'despegar (un avión)',
    definitionEn: 'When an aircraft leaves the ground and starts flying.',
    ipaGeneralAmerican: 'teɪk ɔːf',
    ipaReceivedPronunciation: 'teɪk ɒf',
    cefrLevel: 'B1',
    isCore: true,
    frequencyBand: 'TOP_1000',
    masteryStatus: 'LEARNING',
    sensesJson: [
      {
        translationEs: 'despegar (un avión)',
        definitionEn: 'When an aircraft leaves the ground and starts flying.',
        partOfSpeech: 'VERB',
        cefrLevel: 'B1',
        contextualHint: 'el avión despega',
      },
    ],
    phoneticEdEnding: null,
    isFalseFriend: false,
    createdAt: new Date().toISOString(),
  };

  const normalCard: SrsCard = {
    id: 'card_1',
    userId: 'user_local',
    targetType: 'VOCAB',
    targetId: 'voc_take_1',
    srsProfile: 'VOCAB_AGILE',
    state: 'REVIEW',
    stability: 4.5,
    difficulty: 2.8,
    reps: 3,
    lapses: 0,
    consecutiveLapses: 0,
    isLeech: false,
    scheduledFor: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const leechCard: SrsCard = {
    ...normalCard,
    id: 'card_leech_1',
    isLeech: true,
    consecutiveLapses: 4,
    lapses: 5,
  };

  describe('RF-AUD-02 & RF-SRS-10: Accent Switcher & IPA', () => {
    it('switches between US and UK accent, updating IPA and audio synthesis voice', () => {
      render(
        <SrsCardDisplay
          selectedVocab={sampleVocab}
          currentContext={null}
          availableContexts={[]}
          srsCard={normalCard}
          showAnswer={false}
          previewIntervals={{ 1: 0, 2: 1, 3: 3, 4: 8 }}
          onRotateContext={vi.fn()}
          onShowAnswer={vi.fn()}
          onRate={vi.fn()}
          audioService={mockAudioService as any}
        />
      );

      // Default is US
      expect(screen.getAllByText(/\/teɪk ɔːf\//i).length).toBeGreaterThanOrEqual(1);

      // Click 1.0x native audio in US mode -> plays with af_heart
      const play1xBtn = screen.getByTitle(/Pronunciación nativa/i);
      fireEvent.click(play1xBtn);
      expect(mockAudioService.speak).toHaveBeenCalledWith('take off', 1.0, 'af_heart');

      // Click UK accent toggle
      const ukBtn = screen.getByTitle(/Acento Received Pronunciation \(UK\)/i);
      fireEvent.click(ukBtn);

      // Should now display UK Received Pronunciation IPA
      expect(screen.getAllByText(/\/teɪk ɒf\//i).length).toBeGreaterThanOrEqual(1);

      // Click audio again -> plays with bf_emma
      fireEvent.click(play1xBtn);
      expect(mockAudioService.speak).toHaveBeenCalledWith('take off', 1.0, 'bf_emma');
    });
  });

  describe('RF-SRS-04: Contextual Hint & Polysemy Disambiguation', () => {
    it('displays the key contextual hint on the front face to disambiguate meaning', () => {
      render(
        <SrsCardDisplay
          selectedVocab={sampleVocab}
          currentContext={null}
          availableContexts={[]}
          srsCard={normalCard}
          showAnswer={false}
          previewIntervals={{ 1: 0, 2: 1, 3: 3, 4: 8 }}
          onRotateContext={vi.fn()}
          onShowAnswer={vi.fn()}
          onRate={vi.fn()}
          audioService={mockAudioService as any}
        />
      );

      expect(screen.getByText(/Pista:/i)).toBeDefined();
      expect(screen.getByText(/el avión despega/i)).toBeDefined();
    });
  });

  describe('RF-SRS-CORE-09: Leech Detection & Pedagogical Banner', () => {
    it('renders prominent Leech warning and pedagogical action when card is flagged as leech', () => {
      const onRotateContext = vi.fn();
      render(
        <SrsCardDisplay
          selectedVocab={sampleVocab}
          currentContext={{
            id: 'ctx_1',
            vocabId: sampleVocab.id,
            sentenceEn: 'The flight will take off soon.',
            sentenceEs: 'El vuelo despegará pronto.',
            clozeTarget: 'take off',
            cefrLevel: 'B1',
            createdAt: new Date().toISOString(),
          }}
          availableContexts={[
            {
              id: 'ctx_1',
              sentenceEn: 'The flight will take off soon.',
              sentenceEs: 'El vuelo despegará pronto.',
              clozeTarget: 'take off',
              cefrLevel: 'B1',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'ctx_2',
              sentenceEn: 'We took off on time despite the snow.',
              sentenceEs: 'Despegamos a tiempo a pesar de la nieve.',
              clozeTarget: 'took off',
              cefrLevel: 'B2',
              createdAt: new Date().toISOString(),
            },
          ]}
          srsCard={leechCard}
          showAnswer={false}
          previewIntervals={{ 1: 0, 2: 1, 3: 3, 4: 8 }}
          onRotateContext={onRotateContext}
          onShowAnswer={vi.fn()}
          onRate={vi.fn()}
          audioService={mockAudioService as any}
        />
      );

      // Must show Leech warning
      expect(screen.getByText(/Tarjeta Sangijuela \(Leech\)/i)).toBeDefined();
      expect(screen.getByText(/4 fallos acumulados/i)).toBeDefined();

      // Must have pedagogical action button to rotate to a new mnemonic example
      const rotateBtn = screen.getByText(/Nueva Oración Mnemónica/i);
      fireEvent.click(rotateBtn);
      expect(onRotateContext).toHaveBeenCalled();
    });
  });

  describe('RF-SRS-01 & RF-SRS-09: SrsSessionComplete Bento & Metrics', () => {
    it('renders completion screen with natural feedback and review metrics', () => {
      render(
        <SrsSessionComplete
          stats={{
            totalReviewed: 12,
            successfulRecalls: 11,
            lapses: 1,
            averageLatencyMs: 3400, // 3.4 seconds
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
          }}
          totalDeckCount={12}
        />
      );

      expect(screen.getByText(/¡Sesión de Repaso Completada!/i)).toBeDefined();
      expect(screen.getByText(/¡Excelente trabajo! Has repasado todas las palabras pendientes de hoy/i)).toBeDefined();
      expect(screen.getByText('3.4s')).toBeDefined();
      expect(screen.getByText('92%')).toBeDefined();
    });
  });

  describe('SrsDeckDrawer: Leech Filtering', () => {
    it('provides a Leech filter tab and renders Sangijuela badges', () => {
      const deckCards: CardWithTarget[] = [
        {
          card: normalCard,
          vocab: sampleVocab,
          allContexts: [],
        },
        {
          card: leechCard,
          vocab: {
            ...sampleVocab,
            id: 'voc_2',
            word: 'yield',
            translationEs: 'rendimiento, ceder',
          },
          allContexts: [],
        },
      ];

      render(
        <SrsDeckDrawer
          isOpen={true}
          onClose={vi.fn()}
          deckCards={deckCards}
          activeCardId={null}
          onSelectCard={vi.fn()}
        />
      );

      // Leech tab button should show count of 1
      const leechTab = screen.getByRole('button', { name: /Leeches \(1\)/i });
      expect(leechTab).toBeDefined();

      // Clicking Leech tab should filter to only yield
      fireEvent.click(leechTab);
      expect(screen.getByText('yield')).toBeDefined();
      expect(screen.queryByText('take off')).toBeNull();
      expect(screen.getByText(/Sangijuela/i)).toBeDefined();
    });
  });
});
