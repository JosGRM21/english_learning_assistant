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

  // End session
  const finishSession = useCallback(
    (finalResults: DrillAnswerResult[], finalMaxCombo: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsPlaying(false);
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

      const nextResults = [...results, evaluation];
      setResults(nextResults);
      setTotalScore((prev) => prev + evaluation.pointsEarned);

      let nextCombo = 0;
      let nextMaxCombo = maxCombo;
      if (evaluation.isCorrect) {
        nextCombo = currentCombo + 1;
        nextMaxCombo = Math.max(maxCombo, nextCombo);
        setCurrentCombo(nextCombo);
        setMaxCombo(nextMaxCombo);
      } else {
        setCurrentCombo(0);
      }

      // Next prompt or finish
      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        if (nextIdx < prompts.length) {
          setCurrentIndex(nextIdx);
          const nextP = prompts[nextIdx];
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
      }, 500);
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
    setDrillType,
    handleStart,
    handleAnswer,
    handleReset,
  };
}
