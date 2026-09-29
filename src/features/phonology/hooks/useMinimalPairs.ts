import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { MinimalPairsTrainer, MINIMAL_PAIRS_CATALOG } from '@/core/phonology/MinimalPairsTrainer';
import { MinimalPairChallenge, MinimalPairResult, PhonemicContrastType } from '@/core/types/phonology';
import { useAudio } from '@/shared/hooks/useAudio';

export function useMinimalPairs() {
  const { audioService } = useAudio();
  const trainer = useMemo(() => new MinimalPairsTrainer(MINIMAL_PAIRS_CATALOG), []);
  const [filterType, setFilterType] = useState<PhonemicContrastType | 'ALL'>('ALL');

  const [currentChallenge, setCurrentChallenge] = useState<MinimalPairChallenge | null>(null);
  const [lastResult, setLastResult] = useState<MinimalPairResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Timer & latency state
  const [startTime, setStartTime] = useState<number>(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(2000);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Session statistics
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    latencies: [] as number[],
  });

  const handleTimeout = useCallback((challenge: MinimalPairChallenge) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsAnswering(false);
    audioService.playFeedback(false);

    const result: MinimalPairResult = {
      challengeId: challenge.id,
      pairId: challenge.pair.id,
      targetWord: challenge.targetWord,
      selectedWord: 'TIEMPO AGOTADO',
      isCorrect: false,
      responseTimeMs: 2000,
    };

    setLastResult(result);
    setStats((prev) => ({
      ...prev,
      total: prev.total + 1,
      streak: 0,
    }));
  }, [audioService]);

  const nextChallenge = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const challenge = trainer.createChallenge({
      contrastType: filterType === 'ALL' ? undefined : filterType,
    });

    setCurrentChallenge(challenge);
    setLastResult(null);
    setIsAnswering(true);
    setTimeLeftMs(2000);

    setIsPlayingAudio(true);
    audioService.speak(challenge.targetWord).finally(() => {
      setIsPlayingAudio(false);
      const now = performance.now();
      setStartTime(now);

      const interval = window.setInterval(() => {
        const elapsed = performance.now() - now;
        const remaining = Math.max(0, 2000 - elapsed);
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          handleTimeout(challenge);
        }
      }, 30);
      timerRef.current = interval;
    });
  }, [audioService, filterType, trainer, handleTimeout]);

  const handleSelect = useCallback(
    (option: 'A' | 'B') => {
      if (!isAnswering || !currentChallenge) return;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsAnswering(false);
      const latencyMs = Math.round(performance.now() - startTime);
      const result = trainer.evaluate(currentChallenge, option, latencyMs);
      setLastResult(result);

      audioService.playFeedback(result.isCorrect);

      setStats((prev) => {
        const newStreak = result.isCorrect ? prev.streak + 1 : 0;
        return {
          total: prev.total + 1,
          correct: result.isCorrect ? prev.correct + 1 : prev.correct,
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          latencies: [...prev.latencies, latencyMs],
        };
      });
    },
    [isAnswering, currentChallenge, startTime, trainer, audioService],
  );

  const resetStats = useCallback(() => {
    setStats({
      total: 0,
      correct: 0,
      streak: 0,
      bestStreak: 0,
      latencies: [],
    });
    setLastResult(null);
    setCurrentChallenge(null);
  }, []);

  const repeatAudio = useCallback(() => {
    if (currentChallenge) {
      audioService.speak(currentChallenge.targetWord);
    }
  }, [currentChallenge, audioService]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const avgLatency = useMemo(() => {
    if (stats.latencies.length === 0) return 0;
    const sum = stats.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / stats.latencies.length);
  }, [stats.latencies]);

  const accuracy = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.correct / stats.total) * 100);
  }, [stats.total, stats.correct]);

  return {
    filterType,
    currentChallenge,
    lastResult,
    isPlayingAudio,
    timeLeftMs,
    isAnswering,
    stats,
    avgLatency,
    accuracy,
    setFilterType,
    nextChallenge,
    handleSelect,
    repeatAudio,
    resetStats,
  };
}
