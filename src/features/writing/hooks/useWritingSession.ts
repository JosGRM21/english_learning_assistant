import { useCallback } from 'react';
import { useWritingStore } from '../store/writingStore';
import { useAiGateway } from '@/shared/hooks/useAiGateway';
import { useAudio } from '@/shared/hooks/useAudio';
import { useHabitsStore } from '@/features/habits/store/habitsStore';

export function useWritingSession() {
  const { aiGateway } = useAiGateway();
  const { audioService } = useAudio();
  const updateQuestProgress = useHabitsStore((s) => s.updateQuestProgress);

  const {
    currentStage,
    draft1,
    draft2,
    targetCefr,
    isLoading,
    socraticResult,
    evalResult,
    selectedQuizOption,
    quizSubmitted,
    setCurrentStage,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setIsLoading,
    setSocraticResult,
    setEvalResult,
    setSelectedQuizOption,
    setQuizSubmitted,
    resetWriting,
  } = useWritingStore();

  const handleRequestSocratic = useCallback(async () => {
    if (!draft1.trim()) return;
    setIsLoading(true);
    try {
      const response = await aiGateway.evaluateSocraticPhase1(draft1);
      setSocraticResult(response);
      setDraft2(draft1);
      setCurrentStage(2);
    } catch (err) {
      console.error('Error fetching Socratic feedback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [draft1, aiGateway, setIsLoading, setSocraticResult, setDraft2, setCurrentStage]);

  const handleEvaluateFinal = useCallback(async () => {
    if (!draft2.trim()) return;
    setIsLoading(true);
    try {
      const response = await aiGateway.evaluateFinalPhase2(draft1, draft2, targetCefr);
      setEvalResult(response);
      setSelectedQuizOption(null);
      setQuizSubmitted(false);
      setCurrentStage(3);

      updateQuestProgress('WRITING_SUBMISSION', 1);
    } catch (err) {
      console.error('Error fetching final evaluation:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    draft1,
    draft2,
    targetCefr,
    aiGateway,
    setIsLoading,
    setEvalResult,
    setSelectedQuizOption,
    setQuizSubmitted,
    setCurrentStage,
    updateQuestProgress,
  ]);

  const handleAnswerQuiz = useCallback(
    (index: number) => {
      if (quizSubmitted || !evalResult) return;
      setSelectedQuizOption(index);
      setQuizSubmitted(true);

      const isCorrect = index === evalResult.micro_challenge.correct_option_index;
      audioService.playFeedback(isCorrect);
    },
    [quizSubmitted, evalResult, setSelectedQuizOption, setQuizSubmitted, audioService],
  );

  return {
    currentStage,
    draft1,
    draft2,
    targetCefr,
    isLoading,
    socraticResult,
    evalResult,
    selectedQuizOption,
    quizSubmitted,
    setCurrentStage,
    setDraft1,
    setDraft2,
    setTargetCefr,
    handleRequestSocratic,
    handleEvaluateFinal,
    handleAnswerQuiz,
    resetWriting,
  };
}
