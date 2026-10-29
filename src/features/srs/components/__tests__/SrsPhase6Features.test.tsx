import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SrsCardDisplay } from '../SrsCardDisplay';
import { SrsCardBack } from '../SrsCardBack';
import { VocabItem } from '@/core/types/vocab';
import { SrsCard } from '@/core/types/srs';
import * as audioHook from '@/shared/hooks/useAudio';

describe('SRS Flashcards: Enhanced Syntax & Phonetics Conditioning (RF-VOC-04, RF-VOC-05, RF-VOC-06)', () => {
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

  const testVocab: VocabItem = {
    id: 'voc_test_enrich',
    word: 'turn on',
    partOfSpeech: 'VERB',
    grammaticalDimension: 'CHUNK',
    domainCategory: 'Dispositivos',
    translationEs: 'encender',
    definitionEn: 'To start the flow of electricity or activate a device.',
    ipaGeneralAmerican: 'tɜːrn ɑːn',
    ipaWeakForm: 'tən ɒn',
    phoneticEdEnding: '/d/',
    cefrLevel: 'A2',
    isSeparable: true,
    isFalseFriend: false,
    isCore: true,
    masteryStatus: 'LEARNING',
    createdAt: new Date().toISOString(),
    sensesJson: [
      {
        id: 's_1',
        contextualHint: 'activate electrical appliances',
        translationEs: 'encender',
        definitionEn: 'To start the flow of electricity or activate a device.',
        partOfSpeech: 'VERB',
        cefrLevel: 'A2',
        grammarPattern: 'turn + obj + ON',
        countability: null,
      },
    ],
  };

  const testCard: SrsCard = {
    id: 'card_enrich_1',
    userId: 'user_local',
    targetType: 'VOCAB',
    targetId: 'voc_test_enrich',
    srsProfile: 'VOCAB_AGILE',
    state: 'REVIEW',
    stability: 5.5,
    difficulty: 3.0,
    reps: 3,
    lapses: 0,
    consecutiveLapses: 0,
    isLeech: false,
    scheduledFor: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  describe('SrsCardDisplay (Front Face Active Recall)', () => {
    it('renders -ed ending, weak form badge in top strip, and contextual hint anchor', () => {
      render(
        <SrsCardDisplay
          selectedVocab={testVocab}
          currentContext={null}
          availableContexts={[]}
          srsCard={testCard}
          previewIntervals={{ 1: 0, 2: 1, 3: 3, 4: 7 }}
          showAnswer={false}
          onShowAnswer={vi.fn()}
          onRotateContext={vi.fn()}
          onRate={vi.fn()}
          audioService={mockAudioService as any}
        />
      );

      // Top strip phonetics
      expect(screen.getAllByText(/-ed: \/d\//i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/débil/i).length).toBeGreaterThanOrEqual(1);

      // Recall anchors: Contextual hint
      expect(screen.getByText('Pista:')).toBeDefined();
      expect(screen.getByText('activate electrical appliances')).toBeDefined();
    });
  });

  describe('SrsCardBack (Back Face Pedagogical Feedback)', () => {
    it('renders weak form, regular -ed ending, strict separable pronoun rule, and excludes grammar pattern', () => {
      render(
        <SrsCardBack
          selectedVocab={testVocab}
          currentContext={null}
          availableContexts={[]}
          srsCard={testCard}
          previewIntervals={{ 1: 0, 2: 1, 3: 3, 4: 7 }}
          accent="US"
          onAccentChange={vi.fn()}
          onRotateContext={vi.fn()}
          onRate={vi.fn()}
          audioService={mockAudioService as any}
        />
      );

      // Weak form badge
      expect(screen.getByText(/Débil: \/tən ɒn\//i)).toBeDefined();

      // -ed ending
      expect(screen.getByText(/-ed: \/d\//i)).toBeDefined();

      // Grammar pattern should not be displayed
      expect(screen.queryByText('Patrón:')).toBeNull();
      expect(screen.queryByText('turn + obj + ON')).toBeNull();

      // Separable phrasal verb strict pronoun rule banner
      expect(screen.getByText('Regla estricta del pronombre:')).toBeDefined();
      expect(screen.getByText(/Los pronombres deben dividir la partícula/i)).toBeDefined();
    });
  });
});
