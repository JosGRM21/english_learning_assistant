import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SrsReviewSession } from '../SrsReviewSession';
import * as dbHook from '@/shared/hooks/useDatabase';
import * as audioHook from '@/shared/hooks/useAudio';
import { CardWithTarget, SrsCard } from '@/core/types/srs';
import { VocabItem } from '@/core/types/vocab';

describe('SrsReviewSession Component Integration', () => {
  const createMockCardWithTarget = (id: string, word: string): CardWithTarget => {
    const vocab: VocabItem = {
      id: `voc_${id}`,
      word,
      translationEs: `traducción ${word}`,
      definitionEn: `definition of ${word}`,
      ipaGeneralAmerican: 'ˈtɛst',
      cefrLevel: 'B1',
      partOfSpeech: 'NOUN',
      grammaticalDimension: 'CONTENT',
      isFalseFriend: false,
      createdAt: new Date().toISOString(),
    };

    const card: SrsCard = {
      id: `card_${id}`,
      userId: 'user_local',
      targetType: 'VOCAB',
      targetId: vocab.id,
      state: 'REVIEW',
      stability: 2.0,
      difficulty: 5.0,
      reps: 1,
      lapses: 0,
      lastReviewedAt: new Date().toISOString(),
      scheduledFor: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return { card, vocab, allContexts: [] };
  };

  const mockAudioService = {
    speak: vi.fn(),
    playFeedback: vi.fn(),
    stop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(audioHook, 'useAudio').mockReturnValue({
      audioService: mockAudioService as any,
    });
  });

  it('renders empty deck message when user has no flashcards', async () => {
    vi.spyOn(dbHook, 'useDatabase').mockReturnValue({
      db: {} as any,
      vocabRepo: {} as any,
      cardRepo: {
        getDueCardsWithDetails: vi.fn().mockResolvedValue([]),
        getNewCardsWithDetails: vi.fn().mockResolvedValue([]),
        getAllCardsWithDetails: vi.fn().mockResolvedValue([]),
        recordReview: vi.fn().mockResolvedValue(undefined),
      } as any,
      isReady: true,
      error: null,
      retry: vi.fn(),
    });

    render(<SrsReviewSession />);

    await waitFor(() => {
      expect(screen.getByText('Tu Mazo de Repaso está Vacío')).toBeDefined();
    });
  });

  it('renders active review card and auto-advances to the next card upon rating', async () => {
    const card1 = createMockCardWithTarget('1', 'apple');
    const card2 = createMockCardWithTarget('2', 'banana');
    const mockRecordReview = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(dbHook, 'useDatabase').mockReturnValue({
      db: {} as any,
      vocabRepo: {} as any,
      cardRepo: {
        getDueCardsWithDetails: vi.fn().mockResolvedValue([card1, card2]),
        getNewCardsWithDetails: vi.fn().mockResolvedValue([]),
        getAllCardsWithDetails: vi.fn().mockResolvedValue([card1, card2]),
        recordReview: mockRecordReview,
      } as any,
      isReady: true,
      error: null,
      retry: vi.fn(),
    });

    render(<SrsReviewSession />);

    // 1. First card "apple" should be displayed
    await waitFor(() => {
      const appleElements = screen.getAllByText('apple');
      expect(appleElements.length).toBeGreaterThan(0);
    });

    // 2. Click "Mostrar Respuesta"
    const showAnswerBtn = screen.getByText('Mostrar Respuesta');
    fireEvent.click(showAnswerBtn);

    // 3. FSRS Rating buttons appear on the back
    await waitFor(() => {
      expect(screen.getByText('Bueno')).toBeDefined();
    });

    // 4. Rate "Bueno" (Grade 3)
    const goodBtn = screen.getByText('Bueno');
    fireEvent.click(goodBtn);

    // 5. Must persist to database
    await waitFor(() => {
      expect(mockRecordReview).toHaveBeenCalledTimes(1);
    });

    // 6. AUTO-ADVANCE: The card MUST automatically advance to "banana"!
    await waitFor(() => {
      const bananaElements = screen.getAllByText('banana');
      expect(bananaElements.length).toBeGreaterThan(0);
    });
    expect(screen.queryByText('apple')).toBeNull();
  });

  it('shows SrsSessionComplete when all cards in queue are completed', async () => {
    const singleCard = createMockCardWithTarget('1', 'only_card');
    const mockRecordReview = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(dbHook, 'useDatabase').mockReturnValue({
      db: {} as any,
      vocabRepo: {} as any,
      cardRepo: {
        getDueCardsWithDetails: vi.fn().mockResolvedValue([singleCard]),
        getNewCardsWithDetails: vi.fn().mockResolvedValue([]),
        getAllCardsWithDetails: vi.fn().mockResolvedValue([singleCard]),
        recordReview: mockRecordReview,
      } as any,
      isReady: true,
      error: null,
      retry: vi.fn(),
    });

    render(<SrsReviewSession />);

    await waitFor(() => {
      expect(screen.getAllByText('only_card').length).toBeGreaterThan(0);
    });

    // Reveal and rate
    fireEvent.click(screen.getByText('Mostrar Respuesta'));
    await waitFor(() => {
      expect(screen.getByText('Fácil')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Fácil'));

    // Completion view should appear
    await waitFor(() => {
      expect(screen.getByText('¡Sesión de Repaso Completada!')).toBeDefined();
      expect(screen.getByText('Repasar Mazo de Nuevo (1)')).toBeDefined();
    });
  });

  it('re-queues intra-session when clicking Repetir (Grade 1)', async () => {
    const card1 = createMockCardWithTarget('1', 'first_word');
    const card2 = createMockCardWithTarget('2', 'second_word');
    const mockRecordReview = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(dbHook, 'useDatabase').mockReturnValue({
      db: {} as any,
      vocabRepo: {} as any,
      cardRepo: {
        getDueCardsWithDetails: vi.fn().mockResolvedValue([card1, card2]),
        getNewCardsWithDetails: vi.fn().mockResolvedValue([]),
        getAllCardsWithDetails: vi.fn().mockResolvedValue([card1, card2]),
        recordReview: mockRecordReview,
      } as any,
      isReady: true,
      error: null,
      retry: vi.fn(),
    });

    render(<SrsReviewSession />);

    await waitFor(() => {
      expect(screen.getAllByText('first_word').length).toBeGreaterThan(0);
    });

    // Reveal and rate "Repetir"
    fireEvent.click(screen.getByText('Mostrar Respuesta'));
    await waitFor(() => {
      expect(screen.getByText('Repetir')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Repetir'));

    // Advances to second_word
    await waitFor(() => {
      expect(screen.getAllByText('second_word').length).toBeGreaterThan(0);
    });

    // Rate second_word with Good
    fireEvent.click(screen.getByText('Mostrar Respuesta'));
    await waitFor(() => {
      expect(screen.getByText('Bueno')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Bueno'));

    // Now first_word should reappear because it was re-queued intra-session!
    await waitFor(() => {
      expect(screen.getAllByText('first_word').length).toBeGreaterThan(0);
    });
  });
});
