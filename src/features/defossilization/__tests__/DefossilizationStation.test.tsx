import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DefossilizationStationView } from '../components/DefossilizationStationView';
import * as databaseHook from '@/shared/hooks/useDatabase';
import * as audioHook from '@/shared/hooks/useAudio';
import { WritingErrorSrsItem, SrsCard, CardWithTarget } from '@/core/types/srs';

describe('DefossilizationStationView Component', () => {
  const mockAudioService = {
    speak: vi.fn().mockResolvedValue(undefined),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  const sampleCard: SrsCard = {
    id: 'card_err_1',
    userId: 'user_local',
    targetType: 'WRITING_ERROR',
    targetId: 'err_1',
    srsProfile: 'WRITING_ERROR_REFLECTIVE',
    state: 'REVIEW',
    stability: 2.5,
    difficulty: 4.0,
    reps: 1,
    lapses: 0,
    consecutiveLapses: 0,
    isLeech: false,
    scheduledFor: new Date().toISOString(),
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const sampleErrors: WritingErrorSrsItem[] = [
    {
      id: 'err_1',
      submissionId: 'sub_1',
      userId: 'user_local',
      errorSpan: 'depend of',
      errorType: 'PREPOSITION',
      taxonomyCode: 'PREP_REGIME',
      isL1SpanishTransfer: true,
      explanationEs: 'En inglés se dice "depend on", no "depend of".',
      nativeReformulation: 'depend on',
      originalSentence: 'It will always depend of the weather.',
      expandedContext: 'It will always depend of the weather.',
      drillFormat: 'CONTEXTUAL_CLOZE',
      drillData: {
        format: 'CONTEXTUAL_CLOZE',
        clozeSentence: 'It will always [ ___ ] the weather.',
        expectedToken: 'depend on',
        explanationEs: 'La preposición requerida por depend es on.',
        sentenceContext: 'It will always depend of the weather.',
      },
      srsCardId: 'card_err_1',
      masteryStatus: 'LEARNING',
      isFossilizedAlert: false,
      timesRecidivist: 1,
      createdAt: new Date().toISOString(),
      srsCard: sampleCard,
    },
    {
      id: 'err_2',
      submissionId: 'sub_2',
      userId: 'user_local',
      errorSpan: 'i have 25 years',
      errorType: 'LEXICON',
      taxonomyCode: 'FALSE_FRIEND_AGE',
      isL1SpanishTransfer: true,
      explanationEs: 'En inglés se usa el verbo to be para la edad.',
      nativeReformulation: 'I am 25 years old',
      originalSentence: 'I have 25 years and work here.',
      expandedContext: 'I have 25 years and work here.',
      drillFormat: 'CHUNK_SCRAMBLE',
      drillData: {
        format: 'CHUNK_SCRAMBLE',
        scrambledChunks: ['years', 'old', 'I', 'am', '25'],
        expectedSequence: ['I', 'am', '25', 'years', 'old'],
        explanationEs: 'El orden en inglés es sujeto + be + número + years old.',
        sentenceContext: 'I have 25 years and work here.',
      },
      srsCardId: 'card_err_2',
      masteryStatus: 'RECIDIVIST',
      isFossilizedAlert: true,
      timesRecidivist: 3,
      createdAt: new Date().toISOString(),
    },
  ];

  const sampleDueCards: CardWithTarget[] = [
    {
      card: sampleCard,
      writingError: sampleErrors[0],
      allContexts: [],
    },
  ];

  const mockWritingRepo = {
    getAllWritingErrors: vi.fn().mockResolvedValue(sampleErrors),
    getFossilizedErrors: vi.fn().mockResolvedValue([sampleErrors[1]]),
    updateErrorMastery: vi.fn().mockResolvedValue(undefined),
  };

  const mockCardRepo = {
    getDueCardsWithDetails: vi.fn().mockResolvedValue(sampleDueCards),
    updateCard: vi.fn().mockResolvedValue(undefined),
    recordReviewLog: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioHook, 'useAudio').mockReturnValue({
      audioService: mockAudioService as any,
    });
    vi.spyOn(databaseHook, 'useDatabase').mockReturnValue({
      isReady: true,
      db: {} as any,
      error: null,
      retry: vi.fn(),
      writingRepo: mockWritingRepo as any,
      cardRepo: mockCardRepo as any,
      vocabRepo: {} as any,
      notificationRepo: {} as any,
      appSettingsRepo: {} as any,
    });
  });

  it('renders Header, Bento stats and due item in contextual cloze mode', async () => {
    render(<DefossilizationStationView onNavigateTab={vi.fn()} />);

    // Header checks
    expect(screen.getByText('Corrector de Hábitos')).toBeDefined();
    expect(screen.queryByText(/r = 0.92/i)).toBeNull();

    // Bento stats checks
    await waitFor(() => {
      expect(screen.getAllByText('Para Repasar Hoy').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Errores Frecuentes').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('En Práctica').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Dominados').length).toBeGreaterThanOrEqual(1);
    });

    // Cloze prompt for due card
    expect(screen.getByText(/"It will always \[ ___ \] the weather\."/i)).toBeDefined();
    expect(screen.getByText('"depend of"')).toBeDefined();
    expect(screen.getByText('"depend on"')).toBeDefined();
    expect(screen.getByText('PREP_REGIME')).toBeDefined();
  });

  it('verifies correct answer in Cloze input and displays FSRS rating buttons', async () => {
    render(<DefossilizationStationView onNavigateTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Escribe la forma o preposición correcta/i)).toBeDefined();
    });

    const input = screen.getByPlaceholderText(/Escribe la forma o preposición correcta/i);
    fireEvent.change(input, { target: { value: 'depend on' } });

    const verifyBtn = screen.getByRole('button', { name: /Verificar Respuesta/i });
    fireEvent.click(verifyBtn);

    // Audio positive feedback played
    expect(mockAudioService.playFeedback).toHaveBeenCalledWith(true);

    // Success banner
    expect(screen.getByText('¡Excelente respuesta!')).toBeDefined();

    // Rating buttons displayed
    expect(screen.getByRole('button', { name: /Repetir/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Difícil/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Bien/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Fácil/i })).toBeDefined();

    // Grade Good (grade 3)
    const goodBtn = screen.getByRole('button', { name: /Bien/i });
    fireEvent.click(goodBtn);

    await waitFor(() => {
      expect(mockCardRepo.updateCard).toHaveBeenCalled();
      expect(mockCardRepo.recordReviewLog).toHaveBeenCalled();
    });
  });

  it('switches to Fosilizados tab and displays Chunk Scramble exercise with warning banner', async () => {
    render(<DefossilizationStationView onNavigateTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText('Errores Frecuentes').length).toBeGreaterThanOrEqual(1);
    });

    // Click Errores Frecuentes tab
    const fossilTabBtn = screen.getAllByRole('button', { name: /Errores Frecuentes/i })[0];
    fireEvent.click(fossilTabBtn);

    await waitFor(() => {
      expect(screen.getByText(/¡Atención: Error Frecuente Detectado!/i)).toBeDefined();
      expect(screen.getByText(/Ordena los bloques sintácticos correctos/i)).toBeDefined();
    });

    // Click available chunks: I, am, 25, years, old
    const chunkI = screen.getByRole('button', { name: /^I$/i });
    fireEvent.click(chunkI);
    const chunkAm = screen.getByRole('button', { name: /^am$/i });
    fireEvent.click(chunkAm);
    const chunk25 = screen.getByRole('button', { name: /^25$/i });
    fireEvent.click(chunk25);
    const chunkYears = screen.getByRole('button', { name: /^years$/i });
    fireEvent.click(chunkYears);
    const chunkOld = screen.getByRole('button', { name: /^old$/i });
    fireEvent.click(chunkOld);

    // Verify
    const verifyBtn = screen.getByRole('button', { name: /Verificar Respuesta/i });
    fireEvent.click(verifyBtn);

    expect(mockAudioService.playFeedback).toHaveBeenCalledWith(true);
    expect(screen.getByText('¡Excelente respuesta!')).toBeDefined();
  });

  it('plays audio TTS when clicking audio button', async () => {
    render(<DefossilizationStationView onNavigateTab={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('"depend on"')).toBeDefined();
    });

    const audioBtns = screen.getAllByRole('button', { name: /Escuchar audio/i });
    fireEvent.click(audioBtns[0]);

    expect(mockAudioService.speak).toHaveBeenCalledWith('depend on');
  });
});
