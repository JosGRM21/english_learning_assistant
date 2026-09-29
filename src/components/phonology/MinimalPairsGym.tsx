import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Volume2,
  Trophy,
  Zap,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Ear,
  AlertCircle,
} from 'lucide-react';
import {
  MinimalPairsTrainer,
  MINIMAL_PAIRS_CATALOG,
} from '@/core/phonology/MinimalPairsTrainer';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { MinimalPairChallenge, MinimalPairResult, PhonemicContrastType } from '@/core/types/phonology';

interface MinimalPairsGymProps {
  audioService: AudioService;
}

export function MinimalPairsGym({ audioService }: MinimalPairsGymProps) {
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

  // Spawn new challenge
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

    // Speak the target word blindly
    setIsPlayingAudio(true);
    audioService.speak(challenge.targetWord).finally(() => {
      setIsPlayingAudio(false);
      const now = performance.now();
      setStartTime(now);

      // Start countdown
      const interval = window.setInterval(() => {
        const elapsed = performance.now() - now;
        const remaining = Math.max(0, 2000 - elapsed);
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          // Timed out evaluation
          handleTimeout(challenge);
        }
      }, 30);
      timerRef.current = interval;
    });
  }, [audioService, filterType, trainer]);

  // Handle timeout
  const handleTimeout = (challenge: MinimalPairChallenge) => {
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
  };

  // User submits choice A or B
  const handleSelect = (option: 'A' | 'B') => {
    if (!isAnswering || !currentChallenge) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const responseTime = Math.round(performance.now() - startTime);
    const result = trainer.evaluate(currentChallenge, option, responseTime);

    setIsAnswering(false);
    setLastResult(result);
    audioService.playFeedback(result.isCorrect);

    setStats((prev) => {
      const newStreak = result.isCorrect ? prev.streak + 1 : 0;
      return {
        total: prev.total + 1,
        correct: prev.correct + (result.isCorrect ? 1 : 0),
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        latencies: [...prev.latencies, responseTime],
      };
    });
  };

  // Replay audio
  const handleReplay = async () => {
    if (!currentChallenge || isPlayingAudio) return;
    setIsPlayingAudio(true);
    await audioService.speak(currentChallenge.targetWord);
    setIsPlayingAudio(false);
  };

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Compute average latency
  const avgLatency = useMemo(() => {
    if (stats.latencies.length === 0) return 0;
    const sum = stats.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / stats.latencies.length);
  }, [stats.latencies]);

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Ear className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gimnasio de Pares Mínimos (Minimal Pairs Gym)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Entrenamiento de discriminación auditiva rápida (ventana de 2.0s) para reprogramar
                  el sesgo fonológico del español (L1 Transfer).
                </p>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {(['ALL', 'VOWEL', 'CONSONANT'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type === 'ALL' ? 'Todos los Fonemas' : type === 'VOWEL' ? 'Vocales Críticas' : 'Consonantes Críticas'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block">Total Retos</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block">Precisión</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{accuracy}%</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Racha Actual
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.streak}</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-indigo-500" /> Mejor Racha
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.bestStreak}</span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] text-center col-span-2 md:col-span-1">
            <span className="text-[11px] text-gray-400 uppercase font-semibold block flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" /> Latencia Media
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
              {avgLatency > 0 ? `${avgLatency}ms` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Challenge Arena */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-md">
        {!currentChallenge ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
              <Ear className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                ¿Listo para afinar tu oído fonológico?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                Escucharás una palabra a ciegas correspondiente a un par contrastante (ej: <em>sheep</em> vs <em>ship</em>).
                Tendrás 2 segundos para pulsar la opción correcta.
              </p>
            </div>
            <button
              onClick={nextChallenge}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Iniciar Entrenamiento Rápido</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contrast Header */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Contraste Fonémico: {currentChallenge.pair.phonemicContrast}
              </span>

              <button
                onClick={handleReplay}
                disabled={isPlayingAudio}
                className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                title="Repetir audio"
              >
                <Volume2 className="w-4 h-4 text-indigo-500" />
                <span>Re-escuchar</span>
              </button>
            </div>

            {/* Countdown Progress Bar (2.0s) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>Tiempo de Reacción</span>
                <span>{(timeLeftMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-30 ease-linear ${
                    timeLeftMs > 1000
                      ? 'bg-emerald-500'
                      : timeLeftMs > 500
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${(timeLeftMs / 2000) * 100}%` }}
                />
              </div>
            </div>

            {/* Blind Options Choice (A vs B) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option A */}
              <button
                onClick={() => handleSelect('A')}
                disabled={!isAnswering}
                className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                  !lastResult
                    ? 'bg-gray-50 hover:bg-indigo-50/50 dark:bg-[#181D2A] dark:hover:bg-[#1E2435] border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02]'
                    : lastResult.targetWord === currentChallenge.pair.wordA
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : lastResult.selectedWord === currentChallenge.pair.wordA
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100'
                        : 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">
                  {currentChallenge.pair.wordA}
                </div>
                <div
                  className="text-sm font-mono text-indigo-600 dark:text-indigo-400"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{currentChallenge.pair.ipaA}/
                </div>
              </button>

              {/* Option B */}
              <button
                onClick={() => handleSelect('B')}
                disabled={!isAnswering}
                className={`p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                  !lastResult
                    ? 'bg-gray-50 hover:bg-indigo-50/50 dark:bg-[#181D2A] dark:hover:bg-[#1E2435] border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:scale-[1.02]'
                    : lastResult.targetWord === currentChallenge.pair.wordB
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                      : lastResult.selectedWord === currentChallenge.pair.wordB
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100'
                        : 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800 opacity-50'
                }`}
              >
                <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-1">
                  {currentChallenge.pair.wordB}
                </div>
                <div
                  className="text-sm font-mono text-indigo-600 dark:text-indigo-400"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{currentChallenge.pair.ipaB}/
                </div>
              </button>
            </div>

            {/* Result & Pedagogical Feedback */}
            {lastResult && (
              <div
                className={`p-4 rounded-2xl border animate-in fade-in duration-200 ${
                  lastResult.isCorrect
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {lastResult.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {lastResult.isCorrect
                          ? `¡Correcto! Identificaste "${lastResult.targetWord}" en ${lastResult.responseTimeMs}ms`
                          : `Identificación incorrecta. La palabra emitida era "${lastResult.targetWord}".`}
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>
                          <strong>Trampa L1 Español:</strong> {currentChallenge.pair.l1PitfallEs}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={nextChallenge}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Siguiente Reto</span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
