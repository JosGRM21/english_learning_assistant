import { useCallback, useState, useEffect } from 'react';
import { useWritingStore } from '../store/writingStore';
import { useAiGateway } from '@/shared/hooks/useAiGateway';
import { useAudio } from '@/shared/hooks/useAudio';
import { useDatabase } from '@/shared/hooks/useDatabase';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { CorrectionItem } from '@/infrastructure/ai/schemas';

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

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [srsSuccessMessage, setSrsSuccessMessage] = useState<string | null>(null);
  const [isPlayingTts, setIsPlayingTts] = useState(false);

  const {
    activeTab,
    currentStage,
    currentSubmissionId,
    submissionMode,
    selectedPrompt,
    draft1,
    draft2,
    targetCefr,
    isLoading,
    socraticResult,
    evalResult,
    selectedQuizOption,
    quizSubmitted,
    historySubmissions,
    isLoadingHistory,
    selectedHistoryItem,
    setActiveTab,
    setCurrentStage,
    setCurrentSubmissionId,
    setSubmissionMode,
    setSelectedPrompt,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setIsLoading,
    setSocraticResult,
    setEvalResult,
    setSelectedQuizOption,
    setQuizSubmitted,
    setHistorySubmissions,
    setIsLoadingHistory,
    setSelectedHistoryItem,
    selectPromptAndApply,
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

  useEffect(() => {
    if (isReady && writingRepo) {
      refreshHistory();
    }
  }, [isReady, writingRepo, refreshHistory]);

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
          promptId: selectedPrompt?.id ?? null,
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
    selectedPrompt,
    submissionMode,
    aiGateway,
    writingRepo,
    setIsLoading,
    setCurrentSubmissionId,
    setSocraticResult,
    setDraft2,
    setCurrentStage,
  ]);

  // Phase 2 -> Phase 3: Final Evaluation, Diff & Diagnostic logging
  const handleEvaluateFinal = useCallback(async () => {
    if (!draft2.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Call AI Gateway for final evaluation
      const response = await aiGateway.evaluateFinalPhase2(draft1, draft2, targetCefr);
      setEvalResult(response);
      setSelectedQuizOption(null);
      setQuizSubmitted(false);

      // 2. Save in database if writingRepo is available
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

        // Refresh submissions history in background
        refreshHistory();
      }

      // 3. Update habits daily quest
      updateQuestProgress('WRITING_SUBMISSION', 1);

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
    currentSubmissionId,
    socraticResult,
    aiGateway,
    writingRepo,
    orchestrator,
    refreshHistory,
    setIsLoading,
    setEvalResult,
    setSelectedQuizOption,
    setQuizSubmitted,
    updateQuestProgress,
    setCurrentStage,
  ]);

  // Micro-challenge answer
  const handleAnswerQuiz = useCallback(
    (index: number, challengeIdx = 0) => {
      if (!evalResult) return;
      if (challengeIdx === 0) {
        if (quizSubmitted) return;
        setSelectedQuizOption(index);
        setQuizSubmitted(true);
      }

      const allChallenges =
        evalResult.micro_challenges && evalResult.micro_challenges.length > 0
          ? evalResult.micro_challenges
          : [evalResult.micro_challenge];

      const challenge = allChallenges[challengeIdx] ?? evalResult.micro_challenge;
      const isCorrect = index === challenge.correct_option_index;
      audioService.playFeedback(isCorrect);
    },
    [quizSubmitted, evalResult, setSelectedQuizOption, setQuizSubmitted, audioService],
  );

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
    selectedPrompt,
    draft1,
    draft2,
    targetCefr,
    isLoading,
    socraticResult,
    evalResult,
    selectedQuizOption,
    quizSubmitted,
    historySubmissions,
    isLoadingHistory,
    selectedHistoryItem,
    errorMessage,
    srsSuccessMessage,
    isPlayingTts,
    setActiveTab,
    setCurrentStage,
    setSubmissionMode,
    setSelectedPrompt,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setErrorMessage,
    setSelectedHistoryItem,
    selectPromptAndApply,
    loadSubmissionIntoStudio,
    handleRequestSocratic,
    handleEvaluateFinal,
    handleAnswerQuiz,
    handlePlayTts,
    handleAddCorrectionToSrs,
    refreshHistory,
    resetWriting,
  };
}
