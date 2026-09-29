import { useState, useMemo, useCallback } from 'react';
import { WeaknessMetric, MicroWorkout, ErrorDomain } from '@/core/types/diagnostics';
import { WeaknessEngine } from '@/core/diagnostics/WeaknessEngine';
import { useAudio } from '@/shared/hooks/useAudio';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { useDiagnosticsStore } from '../store/diagnosticsStore';

export function useWeaknessData() {
  const weaknesses = useDiagnosticsStore((s) => s.weaknesses);
  const resolveWeaknessStore = useDiagnosticsStore((s) => s.resolveWeakness);
  const setWeaknesses = useDiagnosticsStore((s) => s.setWeaknesses);

  const [selectedDomain, setSelectedDomain] = useState<ErrorDomain | 'ALL'>('ALL');
  const [activeWorkout, setActiveWorkout] = useState<MicroWorkout | null>(null);

  // Workout runner state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
  const [workoutScore, setWorkoutScore] = useState(0);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  const engine = useMemo(() => new WeaknessEngine(), []);
  const { audioService } = useAudio();
  const updateQuestProgress = useHabitsStore((s) => s.updateQuestProgress);

  const filteredWeaknesses = useMemo(() => {
    return weaknesses.filter(
      (w) => selectedDomain === 'ALL' || w.domain === selectedDomain,
    );
  }, [weaknesses, selectedDomain]);

  const handleStartWorkout = useCallback(
    (metric: WeaknessMetric) => {
      const workout = engine.generateMicroWorkout(metric);
      setActiveWorkout(workout);
      setCurrentExerciseIdx(0);
      setSelectedOption(null);
      setExerciseSubmitted(false);
      setWorkoutScore(0);
      setWorkoutFinished(false);
    },
    [engine],
  );

  const handleSelectOption = useCallback(
    (optIdx: number) => {
      if (exerciseSubmitted || !activeWorkout) return;
      setSelectedOption(optIdx);
      setExerciseSubmitted(true);

      const currentEx = activeWorkout.exercises[currentExerciseIdx];
      const isCorrect = optIdx === currentEx.correctOptionIndex;

      audioService.playFeedback(isCorrect);
      if (isCorrect) {
        setWorkoutScore((prev) => prev + 1);
      }
    },
    [exerciseSubmitted, activeWorkout, currentExerciseIdx, audioService],
  );

  const resolveWeakness = useCallback(
    (metricId: string) => {
      resolveWeaknessStore(metricId);
      updateQuestProgress('MICRO_WORKOUT', 1);
    },
    [resolveWeaknessStore, updateQuestProgress],
  );

  const handleNextExercise = useCallback(() => {
    if (!activeWorkout) return;

    if (currentExerciseIdx + 1 < activeWorkout.exercises.length) {
      setCurrentExerciseIdx((prev) => prev + 1);
      setSelectedOption(null);
      setExerciseSubmitted(false);
    } else {
      setWorkoutFinished(true);
      resolveWeakness(activeWorkout.weaknessMetricId);
    }
  }, [activeWorkout, currentExerciseIdx, resolveWeakness]);

  const handleCloseWorkout = useCallback(() => {
    setActiveWorkout(null);
  }, []);

  return {
    weaknesses,
    filteredWeaknesses,
    selectedDomain,
    activeWorkout,
    currentExerciseIdx,
    selectedOption,
    exerciseSubmitted,
    workoutScore,
    workoutFinished,
    setSelectedDomain,
    handleStartWorkout,
    handleSelectOption,
    handleNextExercise,
    handleCloseWorkout,
    resolveWeakness,
    setWeaknesses,
  };
}
