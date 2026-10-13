import { useCallback, useState, useEffect } from 'react';
import { useWritingStore, TargetWordItem } from '../store/writingStore';
import { useAiGateway } from '@/shared/hooks/useAiGateway';
import { useAudio } from '@/shared/hooks/useAudio';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { CorrectionItem } from '@/infrastructure/ai/schemas';
import { synthesizeErrorDrillFallback } from '@/core/text/WeakVocabMatcher';

function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.startsWith('[') && err.message.includes('"message"')) {
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
          const path = parsed[0].path ? parsed[0].path.join('.') : '';
          return `Formato de IA inválido (${path ? path + ': ' : ''}${parsed[0].message})`;
        }
      } catch {
        // Not a JSON array, use standard message
      }
    }
    return err.message;
  }
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message;
  }
  return 'Error al consultar la IA';
}

export function useWritingSession() {
  const { aiGateway, orchestrator } = useAiGateway();
  const { audioService } = useAudio();
  const { writingRepo, vocabRepo, cardRepo, isReady } = useDatabase();
  const updateQuestProgress = useHabitsStore((s) => s.updateQuestProgress);
  const updateStreak = useHabitsStore((s) => s.updateStreak);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [srsSuccessMessage, setSrsSuccessMessage] = useState<string | null>(null);
  const [isPlayingTts, setIsPlayingTts] = useState(false);

  const {
    activeTab,
    currentStage,
    currentSubmissionId,
    submissionMode,
    selectedReading,
    selectedMission,
    draft1,
    draft2,
    targetCefr,
    targetWords,
    availableWeakPool,
    isLoading,
    socraticResult,
    evalResult,
    activeErrorIndex,
    errorDrillsCompleted,
    historySubmissions,
    isLoadingHistory,
    setActiveTab,
    setCurrentStage,
    setCurrentSubmissionId,
    setSubmissionMode,
    setSelectedReading,
    setSelectedMission,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setTargetWords,
    setAvailableWeakPool,
    replaceTargetWord,
    updateTargetWordUsage,
    setIsLoading,
    setSocraticResult,
    setEvalResult,
    setActiveErrorIndex,
    setHistorySubmissions,
    setIsLoadingHistory,
    selectReadingAndApply,
    loadSubmissionIntoStudio,
    resetWriting,
  } = useWritingStore();

  // Load submissions history from SQLite when database is ready
  const refreshHistory = useCallback(async () => {
    if (!writingRepo) return;
    setIsLoadingHistory(true);
    try {
      const subs = await writingRepo.getSubmissions('user_local', 40);
      setHistorySubmissions(subs);
    } catch (err) {
      console.warn('Failed to load writing submissions history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [writingRepo, setIsLoadingHistory, setHistorySubmissions]);

  // Load weak vocabulary suggestions from SRS
  const refreshWeakVocabulary = useCallback(async () => {
    if (!cardRepo) return;
    try {
      const contextCategory = selectedReading?.category ?? null;
      const weakCards = await cardRepo.getWeakVocabularyForWriting('user_local', contextCategory, 16);
      if (weakCards.length > 0) {
        const pool: TargetWordItem[] = weakCards
          .map((c) => ({
            word: c.vocab?.word ?? '',
            translationEs: c.vocab?.translationEs ?? '',
            partOfSpeech: c.vocab?.partOfSpeech,
            domainCategory: c.vocab?.domainCategory ?? undefined,
            isUsed: false,
            cardId: c.card.id,
          }))
          .filter((w) => w.word.trim().length > 0);

        setAvailableWeakPool(pool);
        if (useWritingStore.getState().targetWords.length === 0) {
          const initialTargets = pool.slice(0, 5);
          setTargetWords(initialTargets);
          useWritingStore.getState().updateTargetWordUsage(draft1 || draft2);
        }
      }
    } catch (err) {
      console.warn('Failed to load weak vocabulary for writing:', err);
    }
  }, [cardRepo, selectedReading, setAvailableWeakPool, setTargetWords, draft1, draft2]);

  useEffect(() => {
    if (isReady && writingRepo) {
      refreshHistory();
    }
  }, [isReady, writingRepo, refreshHistory]);

  useEffect(() => {
    if (isReady && cardRepo) {
      refreshWeakVocabulary();
    }
  }, [isReady, cardRepo, refreshWeakVocabulary]);

  // Real-time SRS target vocabulary usage detector
  useEffect(() => {
    const textToCheck = currentStage >= 2 ? draft2 || draft1 : draft1;
    updateTargetWordUsage(textToCheck);
  }, [draft1, draft2, currentStage, updateTargetWordUsage]);

  // Phase 1 -> Phase 2: Request Socratic Scaffolding
  const handleRequestSocratic = useCallback(async () => {
    if (!draft1.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Call AI Gateway with target CEFR
      const response = await aiGateway.evaluateSocraticPhase1(draft1, targetCefr);
      setSocraticResult(response);
      setDraft2(draft1);

      // 2. Create or persist submission record in SQLite
      let subId = currentSubmissionId;
      if (writingRepo) {
        const words = draft1.trim().split(/\s+/).filter(Boolean).length;
        subId = await writingRepo.createSubmission({
          id: subId ?? undefined,
          userId: 'user_local',
          submissionMode,
          userText: draft1,
          wordCount: words,
          status: 'SOCRATIC_PHASE_1',
        });
        setCurrentSubmissionId(subId);

        // 3. Record revision in SQLite
        await writingRepo.recordRevision({
          submissionId: subId,
          revisionNumber: 1,
          draftText: draft1,
          aiScaffoldLevel: 'LEVEL_1_ELICITATION',
          aiHintsJson: JSON.stringify(response),
          resolvedErrorsCount: 0,
        });
        await writingRepo.updateSubmissionStatus(subId, 'SOCRATIC_PHASE_1');
      }

      updateStreak();
      setCurrentStage(2);
    } catch (err: unknown) {
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    draft1,
    targetCefr,
    currentSubmissionId,
    submissionMode,
    aiGateway,
    writingRepo,
    setIsLoading,
    setCurrentSubmissionId,
    setSocraticResult,
    setDraft2,
    setCurrentStage,
    updateStreak,
  ]);

  // Phase 2 -> Phase 3: Final Evaluation, Diff & Diagnostic logging
  const handleEvaluateFinal = useCallback(async () => {
    if (!draft2.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Contextual information for AI
      const contextualInfo = {
        readingContext: selectedReading?.readingTextEn,
        targetWords: targetWords.map((t) => t.word),
      };

      // 2. Call AI Gateway for final evaluation
      const response = await aiGateway.evaluateFinalPhase2(draft1, draft2, targetCefr, contextualInfo);

      // 3. Guarantee every correction has a practice drill
      const enrichedCorrections = response.corrections.map((corr) => ({
        ...corr,
        drill:
          corr.drill ??
          synthesizeErrorDrillFallback({
            error_span: corr.error_span,
            native_reformulation: corr.native_reformulation,
            explanation_es: corr.explanation_es,
            sentence_context: draft2,
          }),
      }));
      response.corrections = enrichedCorrections;

      setEvalResult(response);

      // 4. Save in database if writingRepo is available
      const subId = currentSubmissionId;
      if (writingRepo && subId) {
        // Record revision 2
        await writingRepo.recordRevision({
          submissionId: subId,
          revisionNumber: 2,
          draftText: draft2,
          aiScaffoldLevel: 'LEVEL_4_EXPLICIT_MODEL',
          resolvedErrorsCount: Math.max(0, (socraticResult?.error_count ?? 0) - response.corrections.length),
        });

        // Record evaluation
        const activeModel = orchestrator.getDefaultModel() || 'gemini-3.8-flash';
        await writingRepo.recordEvaluation({
          submissionId: subId,
          modelUsed: activeModel as any,
          evaluation: response,
        });

        // Record detailed error taxonomy log
        await writingRepo.logWritingErrors(subId, response.corrections, 'user_local');

        // Refresh submissions history in background
        refreshHistory();
      }

      // 5. Update habits daily quest & streak
      updateQuestProgress('WRITING_SUBMISSION', 1);
      updateStreak();

      setCurrentStage(3);
    } catch (err: unknown) {
      setErrorMessage(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    draft1,
    draft2,
    targetCefr,
    selectedReading,
    targetWords,
    currentSubmissionId,
    socraticResult,
    aiGateway,
    writingRepo,
    orchestrator,
    refreshHistory,
    setIsLoading,
    setEvalResult,
    updateQuestProgress,
    updateStreak,
    setCurrentStage,
  ]);


  // Play audio TTS for full text or phrases
  const handlePlayTts = useCallback(
    async (text: string) => {
      if (isPlayingTts || !text.trim()) return;
      setIsPlayingTts(true);
      try {
        await audioService.speak(text);
      } catch (err) {
        console.warn('TTS playback issue:', err);
      } finally {
        setIsPlayingTts(false);
      }
    },
    [isPlayingTts, audioService],
  );

  // Add correction to SRS deck with contextual sentence Cloze
  const handleAddCorrectionToSrs = useCallback(
    async (correction: CorrectionItem, draftContext = '') => {
      if (!vocabRepo || !cardRepo) {
        setSrsSuccessMessage('Base de datos no lista');
        return;
      }

      try {
        const textToSearch = draftContext || draft2 || draft1;
        let contextualSentence = '';
        if (textToSearch) {
          const sentences = textToSearch.split(/(?<=[.?!])\s+/);
          const found = sentences.find(
            (s) =>
              s.toLowerCase().includes(correction.native_reformulation.toLowerCase()) ||
              s.toLowerCase().includes(correction.error_span.toLowerCase()),
          );
          if (found) {
            contextualSentence = found.trim();
          }
        }

        // Generate Cloze prompt if sentence exists
        let clozePrompt = '';
        if (contextualSentence) {
          const regex = new RegExp(
            correction.native_reformulation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'i',
          );
          if (regex.test(contextualSentence)) {
            clozePrompt = contextualSentence.replace(regex, '[ ___ ]');
          } else {
            clozePrompt = contextualSentence;
          }
        }

        const vocabId = `voc_phrase_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const vocabItem = await vocabRepo.createVocab({
          id: vocabId,
          word: correction.native_reformulation,
          grammaticalDimension: 'CHUNK',
          partOfSpeech: correction.error_type === 'PREPOSITION' ? 'PREPOSITION' : 'VERB',
          definitionEn: clozePrompt
            ? `Context Cloze: "${clozePrompt}"`
            : `Collocation / Idiomatic structure: ${correction.native_reformulation}`,
          translationEs: `${correction.explanation_es}${contextualSentence ? ` (Contexto: "${contextualSentence}")` : ''}`,
          ipaGeneralAmerican: '',
          cefrLevel: targetCefr,
          isFalseFriend: correction.error_type === 'FALSE_FRIEND',
          falseFriendNote: correction.explanation_es,
        });

        const cardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await cardRepo.createCard({
          id: cardId,
          userId: 'user_local',
          targetType: 'PHRASE',
          targetId: vocabItem.id,
          state: 'NEW',
          stability: 0.0,
          difficulty: 5.0,
          reps: 0,
          lapses: 0,
          lastReviewedAt: null,
          scheduledFor: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        });

        audioService.playFeedback(true);
        setSrsSuccessMessage(
          clozePrompt
            ? `¡Tarjeta Cloze contextual guardada en SRS: "${correction.native_reformulation}"!`
            : `¡Añadido a tu mazo SRS: "${correction.native_reformulation}"!`,
        );
        setTimeout(() => setSrsSuccessMessage(null), 3500);
      } catch (err) {
        console.error('Failed to add correction to SRS:', err);
        setSrsSuccessMessage('No se pudo guardar la tarjeta');
        setTimeout(() => setSrsSuccessMessage(null), 3000);
      }
    },
    [vocabRepo, cardRepo, targetCefr, audioService, draft2, draft1],
  );

  return {
    activeTab,
    currentStage,
    currentSubmissionId,
    submissionMode,
    selectedReading,
    selectedMission,
    draft1,
    draft2,
    targetCefr,
    targetWords,
    availableWeakPool,
    isLoading,
    socraticResult,
    evalResult,
    activeErrorIndex,
    errorDrillsCompleted,
    historySubmissions,
    isLoadingHistory,
    errorMessage,
    srsSuccessMessage,
    isPlayingTts,
    setActiveTab,
    setCurrentStage,
    setSubmissionMode,
    setSelectedReading,
    setSelectedMission,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setTargetWords,
    setErrorMessage,
    setActiveErrorIndex,
    replaceTargetWord,
    selectReadingAndApply,
    loadSubmissionIntoStudio,
    handleRequestSocratic,
    handleEvaluateFinal,
    handlePlayTts,
    handleAddCorrectionToSrs,
    refreshHistory,
    refreshWeakVocabulary,
    resetWriting,
  };
}
