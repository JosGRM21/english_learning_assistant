import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { useSrsStore } from '../store/srsStore';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useAudio } from '@/shared/hooks/useAudio';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { FsrsScheduler } from '@/core/srs/FsrsScheduler';
import { ContextRotator } from '@/core/srs/ContextRotator';
import { SrsSessionEngine, SrsSessionStats } from '@/core/srs/SrsSessionEngine';
import { SrsQueueBuilder } from '@/core/srs/SrsQueueBuilder';
import {
  SrsIngestionCoordinator,
  DEFAULT_SRS_GOAL_SETTINGS,
} from '@/core/srs/SrsIngestionCoordinator';
import { VocabItem, VocabContextExample, CefrLevel } from '@/core/types/vocab';
import { CardWithTarget, FsrsGrade, ReviewLog, SrsGoalSettings } from '@/core/types/srs';

export function useSrsSession() {
  const { cardRepo, vocabRepo, appSettingsRepo, isReady } = useDatabase();
  const { audioService } = useAudio();
  const updateStreak = useHabitsStore((s) => s.updateStreak);
  const incrementStoreReviewCount = useSrsStore((s) => s.incrementReviewCount);
  const setStoreVocabList = useSrsStore((s) => s.setVocabList);
  const lastSessionStats = useSrsStore((s) => s.lastSessionStats);
  const setLastSessionStats = useSrsStore((s) => s.setLastSessionStats);

  const scheduler = useMemo(() => new FsrsScheduler(0.9), []);
  const rotator = useMemo(() => new ContextRotator(), []);
  const coordinator = useMemo(() => new SrsIngestionCoordinator(), []);
  const queueBuilder = useMemo(() => new SrsQueueBuilder({ maxNewCardsPerDay: 15 }), []);

  // Goal & Overload states
  const [srsGoalSettings, setSrsGoalSettings] = useState<SrsGoalSettings>(DEFAULT_SRS_GOAL_SETTINGS);
  const [isOverloaded, setIsOverloaded] = useState(false);
  const [overloadDueCount, setOverloadDueCount] = useState(0);

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

  // Concurrency lock, reload tracking, and mounted flag for loadSession
  const isLoadingSessionRef = useRef(false);
  const pendingReloadRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reaction time stopwatch
  const presentationStartRef = useRef<number>(performance.now());

  // Load and build session queue from SQLite with JIT ingestion
  const loadSession = useCallback(async () => {
    if (!isReady || !cardRepo) return;
    if (isLoadingSessionRef.current) {
      pendingReloadRef.current = true;
      return;
    }

    isLoadingSessionRef.current = true;

    try {
      if (isMountedRef.current) {
        setIsLoadingSession(true);
      }
      const userId = 'user_local';

      // 1. Load active SRS goal settings from SQLite
      const settings = appSettingsRepo
        ? await appSettingsRepo.getSrsGoalSettings()
        : DEFAULT_SRS_GOAL_SETTINGS;
      if (isMountedRef.current) {
        setSrsGoalSettings(settings);
      }

      // 2. Fetch due cards (scheduled <= now and not NEW)
      const due = await cardRepo.getDueCardsWithDetails(userId, 50, 'VOCAB_AGILE');

      // 3. Fetch count of new cards already reviewed today (local midnight-to-midnight)
      const startOfDayIso = dayjs().startOf('day').toISOString();
      const endOfDayIso = dayjs().endOf('day').toISOString();
      const newReviewedToday = cardRepo.getNewCardsReviewedTodayCount
        ? await cardRepo.getNewCardsReviewedTodayCount(userId, startOfDayIso, endOfDayIso)
        : 0;

      // 4. Fetch existing new cards (state === NEW and scheduled <= now)
      let existingNew = await cardRepo.getNewCardsWithDetails(
        userId,
        settings.dailyNewCardsTarget,
        'VOCAB_AGILE',
      );

      // 5. Evaluate Ingestion Plan with Anti-Burnout Throttling & Daily Quota tracking
      const plan = coordinator.evaluatePlan(
        due.length,
        existingNew.length,
        newReviewedToday,
        settings,
      );
      if (isMountedRef.current) {
        setIsOverloaded(plan.isOverloaded);
        setOverloadDueCount(plan.overloadDueCount);
      }

      // 6. Just-In-Time (JIT) replenishment if under overload threshold and quota not met
      if (!plan.isOverloaded && plan.newCardsNeeded > 0) {
        let neededCards = plan.newCardsNeeded;

        // 6a. Check for cascaded polysemous senses (words whose primary sense reached mastery)
        if (vocabRepo && typeof vocabRepo.getNextEligiblePolysemousSenses === 'function') {
          try {
            const eligibleSenses = await vocabRepo.getNextEligiblePolysemousSenses({
              minStabilityDays: 21,
              limit: Math.min(2, neededCards),
            });
            for (const candidate of eligibleSenses) {
              if (!isMountedRef.current || neededCards <= 0) break;
              await vocabRepo.activateVocabSense(candidate.vocabId, candidate.senseIndex);
              neededCards--;
            }
          } catch (err) {
            console.warn('[useSrsSession] Error during polysemous cascaded ingestion:', err);
          }
        }

        // 6b. CEFR-aligned phrasal verbs replenishment (80/20 balanced ratio)
        const goalToCefrMap: Record<string, CefrLevel[]> = {
          TOP_500: ['A1', 'A2'],
          TOP_1000: ['A2', 'B1'],
          TOP_3000: ['B1', 'B2'],
          TOP_5000: ['B2', 'C1'],
        };
        const eligibleCefr = goalToCefrMap[settings.activeGoal] || ['A1', 'A2'];
        const includePhrasal = settings.includePhrasalVerbs !== false;
        const phrasalRatio = settings.phrasalVerbsRatio ?? 0.2;
        const phrasalTarget = includePhrasal && neededCards > 0
          ? Math.max(1, Math.round(neededCards * phrasalRatio))
          : 0;

        if (
          cardRepo &&
          typeof cardRepo.getNextUnactivatedPhrases === 'function' &&
          phrasalTarget > 0 &&
          neededCards > 0
        ) {
          try {
            const unactivatedPhrases = await cardRepo.getNextUnactivatedPhrases({
              cefrLevels: eligibleCefr,
              limit: Math.min(phrasalTarget, neededCards),
            });
            for (const phrase of unactivatedPhrases) {
              if (!isMountedRef.current || neededCards <= 0) break;
              await cardRepo.activatePhraseCard(phrase.id);
              neededCards--;
            }
          } catch (err) {
            console.warn('[useSrsSession] Error during phrasal verbs ingestion:', err);
          }
        }

        // 6c. Replenish remaining quota with base core vocabulary
        if (neededCards > 0 && vocabRepo && typeof vocabRepo.getNextUnactivatedWords === 'function') {
          const unactivated = await vocabRepo.getNextUnactivatedWords({
            frequencyBand: settings.activeGoal,
            limit: neededCards,
          });

          for (const item of unactivated) {
            if (!isMountedRef.current) break;
            await vocabRepo.activateVocabItem(item.id, 'NEW');
          }
        }

        if (isMountedRef.current) {
          existingNew = await cardRepo.getNewCardsWithDetails(
            userId,
            settings.dailyNewCardsTarget,
            'VOCAB_AGILE',
          );
        }
      }

      // 7. Fetch all deck cards for the deck explorer
      const allDeck = await cardRepo.getAllCardsWithDetails(userId, 200, 'VOCAB_AGILE');
      if (isMountedRef.current) {
        setDeckCards(allDeck);
      }

      // Synchronize vocabList for dashboard/catalog helpers
      const vocabs = allDeck
        .map((c) => c.vocab)
        .filter((v): v is VocabItem => v !== undefined);
      setStoreVocabList(vocabs);

      // 8. Build session queue with remaining new quota and interleaving
      const remainingNewQuota = Math.max(0, settings.dailyNewCardsTarget - newReviewedToday);
      const candidateNew = plan.isOverloaded ? [] : existingNew.slice(0, remainingNewQuota);
      const queue = queueBuilder.buildQueue(due, candidateNew, {
        maxNewCards: remainingNewQuota,
      });
      const engine = new SrsSessionEngine(queue);
      if (isMountedRef.current) {
        setSessionEngine(engine);

        const firstCard = engine.getCurrentCard();
        setCurrentCard(firstCard);
        setCurrentContextOverride(firstCard?.currentContext || firstCard?.allContexts[0] || null);
        setShowAnswer(false);
        presentationStartRef.current = performance.now();
      }
    } catch (err) {
      console.error('[useSrsSession] Error loading session queue:', err);
    } finally {
      isLoadingSessionRef.current = false;
      if (isMountedRef.current) {
        setIsLoadingSession(false);
      }
      if (pendingReloadRef.current && isMountedRef.current) {
        pendingReloadRef.current = false;
        loadSession();
      }
    }
  }, [isReady, cardRepo, vocabRepo, appSettingsRepo, coordinator, queueBuilder, setStoreVocabList]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Restart / Free Study session: loads entire deck or restarts
  const handleRestartSession = useCallback(async () => {
    if (!cardRepo) return;
    try {
      setLastSessionStats(null);
      setIsLoadingSession(true);
      const allDeck = await cardRepo.getAllCardsWithDetails('user_local', 200, 'VOCAB_AGILE');
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

          // 2.1 Update vocabulary mastery status when applicable
          if (vocabRepo && typeof vocabRepo.updateMasteryStatus === 'function' && currentCard.card.targetType === 'VOCAB') {
            const targetId = currentCard.card.targetId;
            if (currentCard.card.state === 'NEW' || currentCard.card.reps === 0) {
              await vocabRepo.updateMasteryStatus(targetId, 'LEARNING');
            } else if (
              coordinator.isEligibleForMastery(
                updatedCard.stability,
                updatedCard.reps,
                updatedCard.isLeech,
              )
            ) {
              await vocabRepo.updateMasteryStatus(targetId, 'RECEPTIVE_MASTERY');
            }
          }
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
        setLastSessionStats(sessionEngine.getStats());

        // 6. Play audio feedback chime
        audioService.playFeedback(grade >= 3);

        // 7. Update habits streak
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
      vocabRepo,
      coordinator,
      scheduler,
      audioService,
      incrementStoreReviewCount,
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

  const isSessionFinished = sessionEngine ? sessionEngine.isFinished() : false;
  const engineStats = sessionEngine ? sessionEngine.getStats() : null;
  const sessionStats: SrsSessionStats = useMemo(() => {
    if (engineStats && engineStats.totalReviewed > 0) {
      return engineStats;
    }
    if (lastSessionStats && lastSessionStats.totalReviewed > 0) {
      return lastSessionStats;
    }
    return (
      engineStats || {
        totalReviewed: 0,
        successfulRecalls: 0,
        lapses: 0,
        averageLatencyMs: 0,
        startedAt: new Date().toISOString(),
        finishedAt: null,
      }
    );
  }, [engineStats, lastSessionStats]);

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
    setLastSessionStats(null);
    const pendingNew = deckCards.filter((c) => c.card.state === 'NEW');
    const cardsToStudy = pendingNew.length > 0 ? pendingNew.slice(0, 15) : deckCards.slice(0, 15);
    const engine = new SrsSessionEngine(cardsToStudy);
    setSessionEngine(engine);
    const first = engine.getCurrentCard();
    setCurrentCard(first);
    setCurrentContextOverride(first?.currentContext || first?.allContexts[0] || null);
    setShowAnswer(false);
    presentationStartRef.current = performance.now();
  }, [deckCards, setLastSessionStats]);

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

    // Goal & Overload states
    srsGoalSettings,
    isOverloaded,
    overloadDueCount,

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
    handleRestartSession,
    handleStartEarlyStudy,
    refreshSession: loadSession,
  };
}
