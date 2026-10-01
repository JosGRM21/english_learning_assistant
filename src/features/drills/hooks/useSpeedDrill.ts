import { useState, useRef, useMemo, useCallback } from 'react';
import { SpeedDrillTrainer, DRILL_PROMPTS_CATALOG } from '@/core/drills/SpeedDrillTrainer';
import {
  SpeedDrillType,
  DrillPrompt,
  DrillAnswerResult,
  DrillSessionResult,
} from '@/core/types/drills';
import { useAudio } from '@/shared/hooks/useAudio';

import { useHabitsStore } from '@/features/habits/store/habitsStore';

export function useSpeedDrill(onDrillCompleted?: (result: DrillSessionResult) => void) {
  const { audioService } = useAudio();
  const updateQuestProgress = useHabitsStore((s) => s.updateQuestProgress);
  const trainer = useMemo(() => new SpeedDrillTrainer(DRILL_PROMPTS_CATALOG), []);

  const [drillType, setDrillType] = useState<SpeedDrillType>('COLLOCATION_BLITZ');
  const [isPlaying, setIsPlaying] = useState(false);

  // Active game session state
  const [prompts, setPrompts] = useState<DrillPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<DrillAnswerResult[]>([]);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  // Per-prompt timer
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const promptStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Summary state
  const [sessionSummary, setSessionSummary] = useState<DrillSessionResult | null>(null);

  // Active feedback state for flash
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctOptionIndex: number;
    selectedOptionIndex: number;
    proceduralPass: boolean;
    responseTimeMs: number;
  } | null>(null);

  // End session
  const finishSession = useCallback(
    (finalResults: DrillAnswerResult[], finalMaxCombo: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsPlaying(false);
      setFeedback(null);
      const summary = trainer.calculateSummary(drillType, finalResults, finalMaxCombo);
      setSessionSummary(summary);

      if (onDrillCompleted) {
        onDrillCompleted(summary);
      } else {
        updateQuestProgress('SPEED_DRILL', 1);
      }
    },
    [drillType, onDrillCompleted, trainer, updateQuestProgress],
  );

  const handleAnswer = useCallback(
    (selectedOptionIndex: number, forcedTimeMs?: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const p = prompts[currentIndex];
      if (!p) return;

      const elapsed = forcedTimeMs ?? Math.round(performance.now() - promptStartRef.current);
      const evaluation = trainer.evaluateAnswer(p, selectedOptionIndex, elapsed, currentCombo);

      audioService.playFeedback(evaluation.isCorrect);

      // Set flash feedback state
      setFeedback({
        isCorrect: evaluation.isCorrect,
        correctOptionIndex: p.correctOptionIndex,
        selectedOptionIndex,
        proceduralPass: evaluation.proceduralPass,
        responseTimeMs: evaluation.responseTimeMs,
      });

      const nextResults = [...results, evaluation];
      setResults(nextResults);
      setTotalScore((prev) => prev + evaluation.pointsEarned);

      let nextCombo = 0;
      let nextMaxCombo = maxCombo;
      let updatedPrompts = prompts;

      if (evaluation.isCorrect) {
        nextCombo = currentCombo + 1;
        nextMaxCombo = Math.max(maxCombo, nextCombo);
        setCurrentCombo(nextCombo);
        setMaxCombo(nextMaxCombo);
      } else {
        setCurrentCombo(0);
        // Error Recovery Loop: re-inject at N+3 and N+7
        updatedPrompts = trainer.planErrorRecovery(prompts, p, currentIndex);
        setPrompts(updatedPrompts);
      }

      // Flash delay: 1000ms for error/noticing flash, 400ms for fast correct
      const delayMs = evaluation.isCorrect ? 400 : 1000;

      // Next prompt or finish
      setTimeout(() => {
        setFeedback(null);
        const nextIdx = currentIndex + 1;
        if (nextIdx < updatedPrompts.length) {
          setCurrentIndex(nextIdx);
          const nextP = updatedPrompts[nextIdx];
          setTimeLeftMs(nextP.timeLimitMs);

          const startTime = performance.now();
          promptStartRef.current = startTime;

          timerRef.current = window.setInterval(() => {
            const el = performance.now() - startTime;
            const remaining = Math.max(0, nextP.timeLimitMs - el);
            setTimeLeftMs(remaining);

            if (remaining <= 0) {
              clearInterval(timerRef.current!);
              handleAnswer(-1, nextP.timeLimitMs);
            }
          }, 25);
        } else {
          finishSession(nextResults, nextMaxCombo);
        }
      }, delayMs);
    },
    [prompts, currentIndex, trainer, currentCombo, audioService, results, maxCombo, finishSession],
  );

  const handleStart = useCallback(() => {
    const sessionPrompts = trainer.createSession(drillType, 8);
    setPrompts(sessionPrompts);
    setCurrentIndex(0);
    setResults([]);
    setCurrentCombo(0);
    setMaxCombo(0);
    setTotalScore(0);
    setSessionSummary(null);
    setIsPlaying(true);

    if (sessionPrompts.length > 0) {
      const p = sessionPrompts[0];
      setTimeLeftMs(p.timeLimitMs);
      const startTime = performance.now();
      promptStartRef.current = startTime;

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, p.timeLimitMs - elapsed);
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          handleAnswer(-1, p.timeLimitMs);
        }
      }, 25);
    }
  }, [drillType, trainer, handleAnswer]);

  const handleReset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setSessionSummary(null);
  }, []);

  return {
    drillType,
    isPlaying,
    prompts,
    currentIndex,
    results,
    currentCombo,
    maxCombo,
    totalScore,
    timeLeftMs,
    sessionSummary,
    feedback,
    setDrillType,
    handleStart,
    handleAnswer,
    handleReset,
  };
}
