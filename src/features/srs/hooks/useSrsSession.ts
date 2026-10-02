import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSrsStore } from '../store/srsStore';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useAudio } from '@/shared/hooks/useAudio';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { FsrsScheduler } from '@/core/srs/FsrsScheduler';
import { ContextRotator } from '@/core/srs/ContextRotator';
import { SrsSessionEngine, SrsSessionStats } from '@/core/srs/SrsSessionEngine';
import { SrsQueueBuilder } from '@/core/srs/SrsQueueBuilder';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';
import { CardWithTarget, FsrsGrade, ReviewLog } from '@/core/types/srs';
import { eventBus } from '@/core/common/events/DomainEventBus';

export function useSrsSession() {
  const { cardRepo, isReady } = useDatabase();
  const { audioService } = useAudio();
  const updateQuestProgress = useHabitsStore((s) => s.updateQuestProgress);
  const updateStreak = useHabitsStore((s) => s.updateStreak);
  const incrementStoreReviewCount = useSrsStore((s) => s.incrementReviewCount);
  const setStoreVocabList = useSrsStore((s) => s.setVocabList);

  const scheduler = useMemo(() => new FsrsScheduler(0.9), []);
  const rotator = useMemo(() => new ContextRotator(), []);
  const queueBuilder = useMemo(() => new SrsQueueBuilder({ maxNewCardsPerDay: 15 }), []);

  // Session state
  const [sessionEngine, setSessionEngine] = useState<SrsSessionEngine | null>(null);
  const [currentCard, setCurrentCard] = useState<CardWithTarget | null>(null);
  const [deckCards, setDeckCards] = useState<CardWithTarget[]>([]);
  const [currentContextOverride, setCurrentContextOverride] = useState<VocabContextExample | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionReviewCount, setSessionReviewCount] = useState(0);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isRating, setIsRating] = useState(false);

  // Mutex lock to prevent race conditions on double clicks
  const isRatingRef = useRef(false);

  // Reaction time stopwatch
  const presentationStartRef = useRef<number>(performance.now());

  // Load and build session queue from SQLite
  const loadSession = useCallback(async () => {
    if (!isReady || !cardRepo) return;

    try {
      setIsLoadingSession(true);
      const userId = 'user_local';

      // 1. Fetch due cards (scheduled <= now and not NEW)
      const due = await cardRepo.getDueCardsWithDetails(userId, 50);

      // 2. Fetch new cards (state === NEW and scheduled <= now)
      let newCards = await cardRepo.getNewCardsWithDetails(userId, 30);

      // 3. Fetch all deck cards for the deck explorer
      const allDeck = await cardRepo.getAllCardsWithDetails(userId, 200);
      setDeckCards(allDeck);

      // Synchronize vocabList for dashboard/catalog helpers
      const vocabs = allDeck
        .map((c) => c.vocab)
        .filter((v): v is VocabItem => v !== undefined);
      setStoreVocabList(vocabs);

      // 4. Build session queue with daily limit and interleaving
      const queue = queueBuilder.buildQueue(due, newCards);
      const engine = new SrsSessionEngine(queue);
      setSessionEngine(engine);

      const firstCard = engine.getCurrentCard();
      setCurrentCard(firstCard);
      setCurrentContextOverride(firstCard?.currentContext || firstCard?.allContexts[0] || null);
      setShowAnswer(false);
      presentationStartRef.current = performance.now();
    } catch (err) {
      console.error('[useSrsSession] Error loading session queue:', err);
    } finally {
      setIsLoadingSession(false);
    }
  }, [isReady, cardRepo, queueBuilder, setStoreVocabList]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Restart / Free Study session: loads entire deck or restarts
  const handleRestartSession = useCallback(async () => {
    if (!cardRepo) return;
    try {
      setIsLoadingSession(true);
      const allDeck = await cardRepo.getAllCardsWithDetails('user_local', 200);
      setDeckCards(allDeck);

      // Build queue with all available cards
      const engine = new SrsSessionEngine(allDeck);
      setSessionEngine(engine);

      const first = engine.getCurrentCard();
      setCurrentCard(first);
      setCurrentContextOverride(first?.currentContext || first?.allContexts[0] || null);
      setShowAnswer(false);
      presentationStartRef.current = performance.now();
    } catch (err) {
      console.error('[useSrsSession] Error restarting session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  }, [cardRepo]);

  // Select a specific card from the deck explorer
  const handleSelectCard = useCallback(
    (cardItem: CardWithTarget) => {
      setCurrentCard(cardItem);
      setCurrentContextOverride(cardItem.currentContext || cardItem.allContexts[0] || null);
      setShowAnswer(false);
      presentationStartRef.current = performance.now();

      if (sessionEngine) {
        sessionEngine.jumpToCard(cardItem);
      }
    },
    [sessionEngine],
  );

  // Rotate cloze context for current card
  const handleRotateContext = useCallback(() => {
    if (!currentCard || currentCard.allContexts.length <= 1) return;
    const currentId = currentContextOverride?.id;
    const next = rotator.selectNextContext(currentCard.allContexts, currentId);
    setCurrentContextOverride(next);
  }, [currentCard, currentContextOverride, rotator]);

  // Handle rating a card with FSRS v5 & auto-advance
  const handleRate = useCallback(
    async (grade: FsrsGrade) => {
      if (!currentCard || !sessionEngine || !cardRepo || isRatingRef.current) return;
      isRatingRef.current = true;
      setIsRating(true);

      try {
        const now = new Date();
        const latencyMs = Math.round(performance.now() - presentationStartRef.current);

        // 1. Calculate next FSRS intervals and stability
        const { updatedCard, log } = scheduler.schedule(currentCard.card, grade, now);

        const fullLog: ReviewLog = {
          id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          cardId: currentCard.card.id,
          reviewedAt: now.toISOString(),
          ...log,
          elapsedMs: latencyMs,
        };

        // 2. Persist update in SQLite atomically
        try {
          await cardRepo.recordReview(updatedCard, fullLog);
        } catch (dbErr) {
          console.error('[useSrsSession] Failed to persist review to SQLite:', dbErr);
        }

        // 3. Process rating in SessionEngine (auto-advance & intra-session re-queue on Grade 1)
        const result = sessionEngine.processRating(grade, updatedCard, latencyMs);

        // 4. Advance UI to next card!
        setCurrentCard(result.nextCard);
        setCurrentContextOverride(
          result.nextCard?.currentContext || result.nextCard?.allContexts[0] || null,
        );
        setShowAnswer(false);
        presentationStartRef.current = performance.now();

        // 5. Update counts
        setSessionReviewCount((c) => c + 1);
        incrementStoreReviewCount();

        // 6. Play audio feedback chime
        audioService.playFeedback(grade >= 3);

        // 7. Publish domain event
        eventBus.publish('CARD_REVIEWED', {
          userId: 'user_local',
          cardId: currentCard.card.id,
          rating: grade,
          elapsedMs: latencyMs,
          newStability: updatedCard.stability,
          newDifficulty: updatedCard.difficulty,
          stateBefore: currentCard.card.state,
          stateAfter: updatedCard.state,
          timestamp: now.toISOString(),
        });

        // 8. Update habits quest & streak
        updateQuestProgress('VOCAB_SRS', 1);
        updateStreak();
      } finally {
        isRatingRef.current = false;
        setIsRating(false);
      }
    },
    [
      currentCard,
      sessionEngine,
      cardRepo,
      scheduler,
      audioService,
      incrementStoreReviewCount,
      updateQuestProgress,
      updateStreak,
    ],
  );

  // Interval previews for FSRS buttons
  const previewIntervals = useMemo(() => {
    if (!currentCard) return { 1: 0, 2: 1, 3: 3, 4: 16 };
    return scheduler.previewIntervals(currentCard.card);
  }, [currentCard, scheduler]);

  // Filtered deck for drawer
  const filteredVocab = useMemo(() => {
    return deckCards
      .map((c) => c.vocab)
      .filter((v): v is VocabItem => v !== undefined)
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          item.word.toLowerCase().includes(q) ||
          item.translationEs.toLowerCase().includes(q)
        );
      });
  }, [deckCards, searchQuery]);

  // Backward compatibility alias for handleSelectVocab
  const handleSelectVocab = useCallback(
    (item: VocabItem) => {
      const match = deckCards.find((c) => c.vocab?.id === item.id);
      if (match) {
        handleSelectCard(match);
      }
    },
    [deckCards, handleSelectCard],
  );

  const isSessionFinished = sessionEngine ? sessionEngine.isFinished() : false;
  const sessionStats: SrsSessionStats = sessionEngine
    ? sessionEngine.getStats()
    : {
        totalReviewed: 0,
        successfulRecalls: 0,
        lapses: 0,
        averageLatencyMs: 0,
        startedAt: new Date().toISOString(),
        finishedAt: null,
      };

  const remainingCount = sessionEngine ? sessionEngine.getRemainingCount() : 0;
  const completedCount = sessionEngine ? sessionEngine.getCompletedCount() : 0;
  const progressPercentage = sessionEngine ? sessionEngine.getProgressPercentage() : 0;

  // Telemetry for cards currently under the 4-hour consolidation cooldown
  const nowIso = new Date().toISOString();
  const cooldownCards = useMemo(() => {
    return deckCards.filter(
      (c) => c.card.state === 'NEW' && c.card.scheduledFor > nowIso,
    );
  }, [deckCards, nowIso]);

  const earliestCooldownDate = useMemo(() => {
    if (cooldownCards.length === 0) return null;
    const sorted = [...cooldownCards].sort(
      (a, b) => new Date(a.card.scheduledFor).getTime() - new Date(b.card.scheduledFor).getTime(),
    );
    return sorted[0].card.scheduledFor;
  }, [cooldownCards]);

  const handleStartEarlyStudy = useCallback(() => {
    if (deckCards.length === 0) return;
    const pendingNew = deckCards.filter((c) => c.card.state === 'NEW');
    const cardsToStudy = pendingNew.length > 0 ? pendingNew.slice(0, 15) : deckCards.slice(0, 15);
    const engine = new SrsSessionEngine(cardsToStudy);
    setSessionEngine(engine);
    const first = engine.getCurrentCard();
    setCurrentCard(first);
    setCurrentContextOverride(first?.currentContext || first?.allContexts[0] || null);
    setShowAnswer(false);
    presentationStartRef.current = performance.now();
  }, [deckCards]);

  return {
    // Current Active Card Details
    currentCard,
    selectedVocab: currentCard?.vocab || null,
    currentContext: currentContextOverride,
    availableContexts: currentCard?.allContexts || [],
    srsCard: currentCard?.card || null,

    // Queue & Session State
    sessionEngine,
    deckCards,
    vocabList: deckCards.map((c) => c.vocab).filter((v): v is VocabItem => v !== undefined),
    isSessionFinished,
    sessionStats,
    remainingCount,
    completedCount,
    progressPercentage,
    reviewCount: sessionReviewCount,
    isLoadingSession,
    isRating,
    isReady: isReady && !isLoadingSession,
    cooldownCards,
    cooldownCount: cooldownCards.length,
    earliestCooldownDate,

    // UI state & Controls
    showAnswer,
    searchQuery,
    filteredVocab,
    previewIntervals,
    setShowAnswer,
    setSearchQuery,
    handleRate,
    handleRotateContext,
    handleSelectCard,
    handleSelectVocab,
    handleRestartSession,
    handleStartEarlyStudy,
    refreshSession: loadSession,
  };
}
