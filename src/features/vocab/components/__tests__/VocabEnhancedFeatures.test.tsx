import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SenseBlock } from '../SenseBlock';
import { VocabDetailDrawer } from '../VocabDetailDrawer';
import * as audioHook from '@/shared/hooks/useAudio';
import * as dbHook from '@/shared/hooks/useDatabase';
import { VocabItem, VocabSense } from '@/core/types/vocab';

describe('Enhanced Vocab Features (RF-VOC-04, RF-VOC-05, RF-VOC-06)', () => {
  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  const mockCardRepo = {
    getCardByTargetId: vi.fn().mockResolvedValue(null),
    createCard: vi.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioHook, 'useAudio').mockReturnValue({
      audioService: mockAudioService as any,
    });
    vi.spyOn(dbHook, 'useDatabase').mockReturnValue({
      cardRepo: mockCardRepo as any,
    } as any);
  });

  describe('SenseBlock Component', () => {
    it('does not render Régimen or Pista in sense block and renders clear hierarchy (RF-VOC-04)', () => {
      const sense: VocabSense = {
        id: 'sense_1',
        translationEs: 'depender',
        definitionEn: 'To be determined or decided by something else.',
        partOfSpeech: 'VERB',
        cefrLevel: 'B1',
        contextualHint: 'depend on circumstances',
        grammarPattern: 'depend + ON',
        countability: null,
        exampleSentenceEn: 'Success will depend on your efforts.',
        exampleSentenceEs: 'El éxito dependerá de tus esfuerzos.',
      };

      const { rerender } = render(
        <SenseBlock
          sense={sense}
          senseNumber={1}
          totalSenses={1}
        />
      );

      // Verify Pista and Régimen are NOT rendered in UI
      expect(screen.queryByText(/Régimen:/i)).toBeNull();
      expect(screen.queryByText(/Pista:/i)).toBeNull();
      expect(screen.queryByText('depend + ON')).toBeNull();

      // With totalSenses = 1, it should NOT render any "Acepción 1" badge
      expect(screen.queryByText(/Acepción 1/i)).toBeNull();
      expect(screen.getByText('depender')).toBeDefined();
      expect(screen.getByText('To be determined or decided by something else.')).toBeDefined();

      // With totalSenses > 1, it renders the sense hierarchy badge: "Acepción 1 de 2 (Principal)"
      rerender(
        <SenseBlock
          sense={sense}
          senseNumber={1}
          totalSenses={2}
        />
      );
      expect(screen.getByText('Acepción 1 de 2 (Principal)')).toBeDefined();
    });

    it('renders noun countability badges [C], [U], and [C/U] accurately (RF-VOC-04)', () => {
      const countableSense: VocabSense = {
        id: 'sense_c',
        translationEs: 'informe, reporte',
        definitionEn: 'A spoken or written account of something.',
        partOfSpeech: 'NOUN',
        cefrLevel: 'A2',
        countability: 'COUNTABLE',
        exampleSentenceEn: 'She wrote a detailed report.',
        exampleSentenceEs: 'Escribió un informe detallado.',
      };

      const { rerender } = render(
        <SenseBlock
          sense={countableSense}
          senseNumber={1}
          totalSenses={1}
        />
      );

      expect(screen.getByText('[C] Contable')).toBeDefined();

      // Rerender with uncountable
      const uncountableSense: VocabSense = {
        ...countableSense,
        countability: 'UNCOUNTABLE',
      };
      rerender(
        <SenseBlock
          sense={uncountableSense}
          senseNumber={1}
          totalSenses={1}
        />
      );
      expect(screen.getByText('[U] Incontable')).toBeDefined();

      // Rerender with both
      const bothSense: VocabSense = {
        ...countableSense,
        countability: 'BOTH',
      };
      rerender(
        <SenseBlock
          sense={bothSense}
          senseNumber={1}
          totalSenses={1}
        />
      );
      expect(screen.getByText('[C/U]')).toBeDefined();
    });
  });

  describe('VocabDetailDrawer Component', () => {
    const vocabItemWithPhoneticsAndPhrasals: VocabItem = {
      id: 'voc_turn_1',
      word: 'turn',
      translationEs: 'girar, dar vuelta',
      definitionEn: 'To move in a circular direction.',
      ipaGeneralAmerican: 'tɜːrn',
      ipaReceivedPronunciation: 'tɜːn',
      ipaWeakForm: 'tən',
      phoneticEdEnding: '/d/',
      cefrLevel: 'A2',
      partOfSpeech: 'VERB',
      grammaticalDimension: 'CONTENT',
      isFalseFriend: false,
      isCore: true,
      masteryStatus: 'LEARNING',
      isSeparable: true,
      createdAt: new Date().toISOString(),
      phrasalVerbsJson: [
        {
          id: 'pv_1',
          text: 'turn down',
          meaningEs: 'rechazar / bajar volumen',
          type: 'TYPE_2_SEPARABLE',
          pronounMustSplit: true,
          cefrLevel: 'B1',
          example1: 'He turned down the job offer.',
          example2: 'Please turn it down.',
        },
        {
          id: 'pv_2',
          text: 'turn into',
          meaningEs: 'convertirse en',
          type: 'TYPE_3_INSEPARABLE',
          pronounMustSplit: false,
          cefrLevel: 'B1',
          example1: 'Caterpillars turn into butterflies.',
        },
      ],
    };

    it('renders weak form, phonetic -ed ending, and separable pronoun rule in Hero (RF-VOC-04, RF-VOC-06)', () => {
      render(
        <VocabDetailDrawer
          vocab={vocabItemWithPhoneticsAndPhrasals}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Weak form badge
      expect(screen.getByText(/Débil \(Schwa\):/i)).toBeDefined();
      expect(screen.getByText(/\/tən\//i)).toBeDefined();

      // -ed ending badge
      expect(screen.getByText(/-ed:/i)).toBeDefined();
      expect(screen.getAllByText(/\/d\//i).length).toBeGreaterThanOrEqual(1);

      // Strict pronoun rule banner for separable verb
      expect(screen.getByText(/Regla Estricta del Pronombre/i)).toBeDefined();
      expect(screen.getByText(/turn it off/i)).toBeDefined();
    });

    it('displays satellite phrasal verbs tab with syntax typology and examples (RF-VOC-04)', () => {
      render(
        <VocabDetailDrawer
          vocab={vocabItemWithPhoneticsAndPhrasals}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Grammar & Phrasals tab button
      const grammarTabBtn = screen.getByRole('button', { name: /Gramática y Formas/i });
      expect(grammarTabBtn).toBeDefined();

      fireEvent.click(grammarTabBtn);

      // Satellite phrasal verbs section with natural language labels
      expect(screen.getByText(/Verbos Frasales Satélites/i)).toBeDefined();
      expect(screen.getByText('turn down')).toBeDefined();
      expect(screen.getByText('rechazar / bajar volumen')).toBeDefined();
      expect(screen.getByText('Separable (con objeto)')).toBeDefined();
      expect(screen.getByText(/Separable: el pronombre divide obligatoriamente/i)).toBeDefined();
      expect(screen.getByText(/He turned down the job offer/i)).toBeDefined();

      expect(screen.getByText('turn into')).toBeDefined();
      expect(screen.getByText('convertirse en')).toBeDefined();
      expect(screen.getByText('Inseparable (con objeto)')).toBeDefined();
    });
  });
});
