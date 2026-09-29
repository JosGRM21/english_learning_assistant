import { useEffect, useMemo, useCallback } from 'react';
import { useSrsStore } from '../store/srsStore';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useAudio } from '@/shared/hooks/useAudio';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { FsrsScheduler } from '@/core/srs/FsrsScheduler';
import { ContextRotator } from '@/core/srs/ContextRotator';
import { VocabItem } from '@/core/types/vocab';
import { FsrsGrade, ReviewLog } from '@/core/types/srs';

export function useSrsSession() {
  const { vocabRepo, isReady } = useDatabase();
  const { audioService } = useAudio();
  const updateQuestProgress = useHabitsStore((s) => s.updateQuestProgress);
  const updateStreak = useHabitsStore((s) => s.updateStreak);

  const {
    vocabList,
    selectedVocab,
    availableContexts,
    currentContext,
    srsCard,
    reviewLogs,
    searchQuery,
    showAnswer,
    reviewCount,
    setVocabList,
    setSelectedVocab,
    setAvailableContexts,
    setCurrentContext,
    setSrsCard,
    addReviewLog,
    setSearchQuery,
    setShowAnswer,
    incrementReviewCount,
  } = useSrsStore();

  const scheduler = useMemo(() => new FsrsScheduler(0.9), []);
  const rotator = useMemo(() => new ContextRotator(), []);

  // Initialize vocab list and initial card from DB
  useEffect(() => {
    if (!isReady || !vocabRepo || vocabList.length > 0) return;

    let isCancelled = false;

    async function loadInitialVocab() {
      try {
        const all = await vocabRepo!.getAllVocabs(100);
        if (isCancelled || all.length === 0) return;

        setVocabList(all);

        const first = all[0];
        if (first) {
          setSelectedVocab(first);
          const contexts = await vocabRepo!.getContextExamples(first.id);
          if (isCancelled) return;

          setAvailableContexts(contexts);
          if (contexts.length > 0) {
            setCurrentContext(contexts[0]);
          }

          setSrsCard({
            id: `card_${first.id}`,
            userId: 'user_local',
            targetType: 'VOCAB',
            targetId: first.id,
            state: 'NEW',
            stability: 0,
            difficulty: 5.0,
            reps: 0,
            lapses: 0,
            lastReviewedAt: null,
            scheduledFor: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to load initial vocab:', err);
      }
    }

    loadInitialVocab();

    return () => {
      isCancelled = true;
    };
  }, [isReady, vocabRepo, vocabList.length, setVocabList, setSelectedVocab, setAvailableContexts, setCurrentContext, setSrsCard]);

  // Handle vocab selection without recreating the entire database!
  const handleSelectVocab = useCallback(
    async (item: VocabItem) => {
      setSelectedVocab(item);
      setShowAnswer(false);

      if (vocabRepo) {
        try {
          const contexts = await vocabRepo.getContextExamples(item.id);
          setAvailableContexts(contexts);
          setCurrentContext(contexts.length > 0 ? contexts[0] : null);
        } catch (err) {
          console.error('Failed to load contexts for vocab:', err);
        }
      }

      setSrsCard({
        id: `card_${item.id}`,
        userId: 'user_local',
        targetType: 'VOCAB',
        targetId: item.id,
        state: 'NEW',
        stability: 0,
        difficulty: 5.0,
        reps: 0,
        lapses: 0,
        lastReviewedAt: null,
        scheduledFor: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    },
    [vocabRepo, setSelectedVocab, setShowAnswer, setAvailableContexts, setCurrentContext, setSrsCard],
  );

  // Rotate cloze context
  const handleRotateContext = useCallback(() => {
    if (availableContexts.length > 1 && currentContext) {
      const next = rotator.selectNextContext(availableContexts, currentContext.id);
      setCurrentContext(next);
    }
  }, [availableContexts, currentContext, rotator, setCurrentContext]);

  // Grade card with FSRS
  const handleRate = useCallback(
    (grade: FsrsGrade) => {
      if (!srsCard) return;
      const now = new Date();
      const { updatedCard, log } = scheduler.schedule(srsCard, grade, now);
      setSrsCard(updatedCard);

      const fullLog: ReviewLog = {
        id: `rev_${Date.now()}`,
        cardId: srsCard.id,
        reviewedAt: now.toISOString(),
        ...log,
      };
      addReviewLog(fullLog);
      incrementReviewCount();
      setShowAnswer(false);

      // Audio chime on successful completion
      audioService.playFeedback(grade >= 3);

      // Rotate context on review for next repetition
      handleRotateContext();

      // Update VOCAB_SRS quest progress
      updateQuestProgress('VOCAB_SRS', 1);

      // Refresh streak
      updateStreak();
    },
    [
      srsCard,
      scheduler,
      setSrsCard,
      addReviewLog,
      incrementReviewCount,
      setShowAnswer,
      audioService,
      handleRotateContext,
      updateQuestProgress,
      updateStreak,
    ],
  );

  // Filtered vocabulary list
  const filteredVocab = useMemo(() => {
    return vocabList.filter((item) => {
      return (
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.translationEs.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [vocabList, searchQuery]);

  // Preview intervals for FSRS buttons
  const previewIntervals = useMemo(() => {
    if (!srsCard) return { 1: 1, 2: 1, 3: 3, 4: 16 };
    return scheduler.previewIntervals(srsCard);
  }, [srsCard, scheduler]);

  return {
    vocabList,
    selectedVocab,
    availableContexts,
    currentContext,
    srsCard,
    reviewLogs,
    searchQuery,
    showAnswer,
    reviewCount,
    filteredVocab,
    previewIntervals,
    setSearchQuery,
    setShowAnswer,
    handleSelectVocab,
    handleRotateContext,
    handleRate,
    isReady,
  };
}
