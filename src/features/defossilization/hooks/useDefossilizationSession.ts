import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useAudio } from '@/shared/hooks/useAudio';
import { FsrsScheduler } from '@/core/srs/FsrsScheduler';
import {
  WritingErrorSrsItem,
  FsrsGrade,
  SrsCard,
  PositiveDrillFormat,
  PositiveDrillData,
  CardWithTarget,
} from '@/core/types/srs';

export type DefossilizationFilter = 'DUE' | 'FOSSILIZED' | 'LEARNING' | 'INTERNALIZED' | 'ALL';

export interface DefossilizationItem {
  id: string;
  errorSpan: string;
  nativeReformulation: string;
  explanationEs: string;
  taxonomyCode: string;
  isL1SpanishTransfer: boolean;
  masteryStatus: 'LEARNING' | 'INTERNALIZED' | 'RECIDIVIST';
  timesRecidivist: number;
  isFossilizedAlert: boolean;
  drillFormat: PositiveDrillFormat;
  drillData: PositiveDrillData;
  originalSentence: string;
  expandedContext: string;
  createdAt: string;
  srsCard?: SrsCard;
}

export function normalizeInput(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"«»]/g, '')
    .replace(/\s+/g, ' ');
}

export function useDefossilizationSession() {
  const { writingRepo, cardRepo, isReady } = useDatabase();
  const { audioService } = useAudio();

  const [activeFilter, setActiveFilter] = useState<DefossilizationFilter>('DUE');
  const [allErrors, setAllErrors] = useState<WritingErrorSrsItem[]>([]);
  const [dueCards, setDueCards] = useState<CardWithTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Exercise Interaction States
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  const [availableChunks, setAvailableChunks] = useState<string[]>([]);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);

  const scheduler = useMemo(() => new FsrsScheduler(0.92), []);

  // Fetch data from SQLite
  const refreshData = useCallback(async () => {
    if (!writingRepo || !cardRepo) return;
    setIsLoading(true);
    try {
      const [errors, dues] = await Promise.all([
        writingRepo.getAllWritingErrors('user_local'),
        cardRepo.getDueCardsWithDetails('user_local', 50, 'WRITING_ERROR_REFLECTIVE'),
      ]);
      setAllErrors(errors);
      setDueCards(dues);
    } catch (err) {
      console.warn('Failed to load defossilization data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [writingRepo, cardRepo]);

  useEffect(() => {
    if (isReady && writingRepo && cardRepo) {
      refreshData();
    }
  }, [isReady, writingRepo, cardRepo, refreshData]);

  // Map due cards to items
  const dueItems: DefossilizationItem[] = useMemo(() => {
    return dueCards
      .filter((d) => d.writingError)
      .map((d) => {
        const err = d.writingError!;
        return {
          id: err.id,
          errorSpan: err.errorSpan,
          nativeReformulation: err.nativeReformulation,
          explanationEs: err.explanationEs,
          taxonomyCode: err.taxonomyCode,
          isL1SpanishTransfer: err.isL1SpanishTransfer,
          masteryStatus: err.masteryStatus,
          timesRecidivist: err.timesRecidivist,
          isFossilizedAlert: err.isFossilizedAlert,
          drillFormat: err.drillFormat,
          drillData: err.drillData,
          originalSentence: err.originalSentence,
          expandedContext: err.expandedContext,
          createdAt: err.createdAt,
          srsCard: d.card,
        };
      });
  }, [dueCards]);

  // Filtered items
  const filteredItems: DefossilizationItem[] = useMemo(() => {
    const errorMap = new Map<string, SrsCard>();
    dueCards.forEach((d) => {
      if (d.writingError) {
        errorMap.set(d.writingError.id, d.card);
      }
    });

    const mappedAll: DefossilizationItem[] = allErrors.map((err) => ({
      id: err.id,
      errorSpan: err.errorSpan,
      nativeReformulation: err.nativeReformulation,
      explanationEs: err.explanationEs,
      taxonomyCode: err.taxonomyCode,
      isL1SpanishTransfer: err.isL1SpanishTransfer,
      masteryStatus: err.masteryStatus,
      timesRecidivist: err.timesRecidivist,
      isFossilizedAlert: err.isFossilizedAlert,
      drillFormat: err.drillFormat,
      drillData: err.drillData,
      originalSentence: err.originalSentence,
      expandedContext: err.expandedContext,
      createdAt: err.createdAt,
      srsCard: errorMap.get(err.id) ?? err.srsCard,
    }));

    switch (activeFilter) {
      case 'DUE':
        return dueItems;
      case 'FOSSILIZED':
        return mappedAll.filter((item) => item.isFossilizedAlert || item.timesRecidivist >= 2);
      case 'LEARNING':
        return mappedAll.filter((item) => item.masteryStatus === 'LEARNING');
      case 'INTERNALIZED':
        return mappedAll.filter((item) => item.masteryStatus === 'INTERNALIZED');
      case 'ALL':
      default:
        return mappedAll;
    }
  }, [activeFilter, dueItems, allErrors, dueCards]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = allErrors.length;
    const fossilized = allErrors.filter((e) => e.isFossilizedAlert || e.timesRecidivist >= 2).length;
    const learning = allErrors.filter((e) => e.masteryStatus === 'LEARNING').length;
    const internalized = allErrors.filter((e) => e.masteryStatus === 'INTERNALIZED').length;
    const dueCount = dueItems.length;

    return { total, fossilized, learning, internalized, dueCount };
  }, [allErrors, dueItems]);

  const currentItem: DefossilizationItem | undefined = filteredItems[currentIndex];

  // Initialize chunks for CHUNK_SCRAMBLE format
  useEffect(() => {
    setUserAnswer('');
    setSelectedChunks([]);
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setShowExplanation(false);

    if (currentItem && currentItem.drillFormat === 'CHUNK_SCRAMBLE') {
      const chunks =
        currentItem.drillData.scrambledChunks && currentItem.drillData.scrambledChunks.length > 0
          ? [...currentItem.drillData.scrambledChunks]
          : currentItem.nativeReformulation.split(' ').sort(() => Math.random() - 0.5);
      setAvailableChunks(chunks);
    } else {
      setAvailableChunks([]);
    }
  }, [currentIndex, currentItem]);

  // Chunk interactions
  const handleSelectChunk = useCallback((chunk: string, indexInAvailable: number) => {
    setSelectedChunks((prev) => [...prev, chunk]);
    setAvailableChunks((prev) => prev.filter((_, idx) => idx !== indexInAvailable));
  }, []);

  const handleUnselectChunk = useCallback((chunk: string, indexInSelected: number) => {
    setSelectedChunks((prev) => prev.filter((_, idx) => idx !== indexInSelected));
    setAvailableChunks((prev) => [...prev, chunk]);
  }, []);

  // Validation logic
  const checkAnswer = useCallback(() => {
    if (!currentItem || isAnswerChecked) return;

    let correct = false;
    const targetToken = currentItem.drillData.expectedToken || currentItem.nativeReformulation;

    if (currentItem.drillFormat === 'CHUNK_SCRAMBLE') {
      const builtString = selectedChunks.join(' ');
      const expectedString = (currentItem.drillData.expectedSequence || []).join(' ') || targetToken;
      correct = normalizeInput(builtString) === normalizeInput(expectedString);
    } else if (currentItem.drillFormat === 'C_TEST') {
      const prefix = currentItem.drillData.cTestPrefix || '';
      const fullAttempt = prefix + userAnswer.trim();
      correct =
        normalizeInput(fullAttempt) === normalizeInput(targetToken) ||
        normalizeInput(userAnswer) === normalizeInput(targetToken);
    } else if (currentItem.drillFormat === 'SENTENCE_REWRITE') {
      const keyword = currentItem.drillData.rewriteKeyword || '';
      const hasKeyword = keyword ? userAnswer.toLowerCase().includes(keyword.toLowerCase()) : true;
      correct = userAnswer.trim().length > 3 && hasKeyword;
    } else {
      // CONTEXTUAL_CLOZE
      correct = normalizeInput(userAnswer) === normalizeInput(targetToken);
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);
    setShowExplanation(true);
    audioService.playFeedback(correct);
  }, [currentItem, isAnswerChecked, selectedChunks, userAnswer, audioService]);

  // Process FSRS review
  const applyFsrsGrade = useCallback(
    async (grade: FsrsGrade) => {
      if (!currentItem || !cardRepo || !writingRepo) return;

      const card = currentItem.srsCard;
      if (card) {
        const reviewResult = scheduler.schedule(card, grade, new Date(), { applyFuzz: false });

        // Update SRS card in DB
        await cardRepo.updateCard(reviewResult.updatedCard);

        // Record review log
        await cardRepo.recordReviewLog({
          id: `log_defoss_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          cardId: card.id,
          rating: grade,
          stateBefore: card.state,
          stabilityBefore: card.stability,
          difficultyBefore: card.difficulty,
          newStability: reviewResult.updatedCard.stability,
          newDifficulty: reviewResult.updatedCard.difficulty,
          elapsedMs: 0,
          reviewedAt: new Date().toISOString(),
        });
      }

      // Update Mastery Status in writing repository
      if (grade >= 3) {
        const shouldInternalize =
          (card?.reps ?? 0) >= 2 || (card?.stability ?? 0) >= 14 || grade === 4;
        if (shouldInternalize) {
          await writingRepo.updateErrorMastery(currentItem.id, 'INTERNALIZED');
        }
      } else if (grade === 1) {
        await writingRepo.updateErrorMastery(currentItem.id, 'RECIDIVIST');
      }

      // Refresh data and move to next or stay in bounds
      await refreshData();
      if (currentIndex < filteredItems.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    },
    [currentItem, cardRepo, writingRepo, scheduler, refreshData, currentIndex, filteredItems.length],
  );

  // Audio Playback
  const playTts = useCallback(
    async (text?: string) => {
      const phraseToSpeak = text || currentItem?.nativeReformulation || '';
      if (!phraseToSpeak || isPlayingTts) return;
      setIsPlayingTts(true);
      try {
        await audioService.speak(phraseToSpeak);
      } catch (err) {
        console.warn('TTS playback issue in Defossilization:', err);
      } finally {
        setIsPlayingTts(false);
      }
    },
    [currentItem, isPlayingTts, audioService],
  );

  const nextItem = useCallback(() => {
    if (currentIndex < filteredItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, filteredItems.length]);

  const previousItem = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const selectIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < filteredItems.length) {
      setCurrentIndex(idx);
    }
  }, [filteredItems.length]);

  const handleFilterChange = useCallback((filter: DefossilizationFilter) => {
    setActiveFilter(filter);
    setCurrentIndex(0);
  }, []);

  return {
    activeFilter,
    filteredItems,
    currentItem,
    currentIndex,
    stats,
    isLoading,
    userAnswer,
    selectedChunks,
    availableChunks,
    isAnswerChecked,
    isCorrect,
    showExplanation,
    isPlayingTts,
    setUserAnswer,
    handleSelectChunk,
    handleUnselectChunk,
    checkAnswer,
    applyFsrsGrade,
    playTts,
    nextItem,
    previousItem,
    selectIndex,
    handleFilterChange,
    setShowExplanation,
    refreshData,
  };
}
