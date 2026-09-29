import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Zap,
  Trophy,
  Flame,
  RotateCcw,
  Play,
} from 'lucide-react';
import {
  SpeedDrillTrainer,
  DRILL_PROMPTS_CATALOG,
} from '@/core/drills/SpeedDrillTrainer';
import {
  SpeedDrillType,
  DrillPrompt,
  DrillAnswerResult,
  DrillSessionResult,
} from '@/core/types/drills';
import { AudioService } from '@/infrastructure/audio/AudioService';

interface SpeedDrillArenaProps {
  audioService: AudioService;
  onDrillCompleted?: (result: DrillSessionResult) => void;
}

export function SpeedDrillArena({
  audioService,
  onDrillCompleted,
}: SpeedDrillArenaProps) {
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
  const finishSession = useCallback((finalResults: DrillAnswerResult[], finalMaxCombo: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsPlaying(false);
    const summary = trainer.calculateSummary(drillType, finalResults, finalMaxCombo);
    setSessionSummary(summary);

    if (onDrillCompleted) {
      onDrillCompleted(summary);
    }
  }, [drillType, onDrillCompleted, trainer]);

  // Load next prompt in session
  const loadPrompt = useCallback((promptList: DrillPrompt[], index: number) => {
    if (index >= promptList.length) {
      finishSession(results, maxCombo);
      return;
    }

    setCurrentIndex(index);
    const p = promptList[index];
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
        // Timeout counts as incorrect answer
        handleAnswer(-1, p.timeLimitMs);
      }
    }, 25);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishSession, results, maxCombo]);

  // Start new game
  const handleStart = () => {
    const sessionPrompts = trainer.createSession(drillType, 8);
    setPrompts(sessionPrompts);
    setResults([]);
    setCurrentCombo(0);
    setMaxCombo(0);
    setTotalScore(0);
    setSessionSummary(null);
    setIsPlaying(true);

    loadPrompt(sessionPrompts, 0);
  };

  // Submit answer
  const handleAnswer = (selectedOptionIdx: number, elapsedOverride?: number) => {
    if (!isPlaying || prompts.length === 0) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentPrompt = prompts[currentIndex];
    const responseTime = elapsedOverride ?? Math.round(performance.now() - promptStartRef.current);

    const answerResult = trainer.evaluateAnswer(
      currentPrompt,
      selectedOptionIdx,
      responseTime,
      currentCombo,
    );

    audioService.playFeedback(answerResult.isCorrect);

    const newCombo = answerResult.isCorrect ? currentCombo + 1 : 0;
    const newMaxCombo = Math.max(maxCombo, newCombo);
    const newScore = totalScore + answerResult.pointsEarned;

    setCurrentCombo(newCombo);
    setMaxCombo(newMaxCombo);
    setTotalScore(newScore);

    const newResults = [...results, answerResult];
    setResults(newResults);

    // Auto proceed to next prompt after a brief 300ms pause
    setTimeout(() => {
      if (currentIndex + 1 < prompts.length) {
        loadPrompt(prompts, currentIndex + 1);
      } else {
        finishSession(newResults, newMaxCombo);
      }
    }, 350);
  };

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const currentPrompt = prompts[currentIndex];

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
              <Zap className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Speed-Run Proceduralization Gym (Ráfagas Cronometradas)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Entrenamiento ultrarrápido (3-5s por prompt) para transferir colocaciones y preposiciones
                desde la corteza declarativa a los ganglios basales (Modelo DP de Michael Ullman).
              </p>
            </div>
          </div>
        </div>

        {/* Drill mode tabs */}
        {!isPlaying && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { type: 'COLLOCATION_BLITZ', label: 'Collocation Blitz' },
                { type: 'PREPOSITION_RAPID_FIRE', label: 'Preposition Rapid-Fire' },
                { type: 'CONNECTED_SPEECH_EAR', label: 'Connected Speech' },
              ] as const
            ).map((d) => (
              <button
                key={d.type}
                onClick={() => setDrillType(d.type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  drillType === d.type
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Arena */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-md">
        {!isPlaying && !sessionSummary ? (
          /* Welcome screen */
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Zap className="w-8 h-8 fill-current" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                ¿Listo para la Ráfaga de Velocidad?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                Responderás 8 preguntas en ráfaga con un límite de 3.5 a 4.5 segundos por ítem.
                Los aciertos continuos activan multiplicadores de Combo ($\times 2$, $\times 3$) y bonos de velocidad.
              </p>
            </div>

            <button
              onClick={handleStart}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Ráfaga Ahora</span>
            </button>
          </div>
        ) : isPlaying && currentPrompt ? (
          /* Active game play */
          <div className="space-y-6">
            {/* Top Score & Combo Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Puntaje</span>
                  <span className="text-2xl font-extrabold text-amber-500 font-mono">
                    {totalScore}
                  </span>
                </div>

                {currentCombo >= 3 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-extrabold text-xs animate-bounce">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>COMBO {currentCombo}x ({currentCombo >= 6 ? '3x Puntos' : '2x Puntos'})</span>
                  </div>
                )}
              </div>

              <span className="text-xs font-mono font-bold text-gray-400">
                Pregunta {currentIndex + 1} de {prompts.length}
              </span>
            </div>

            {/* Countdown bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                <span>Tiempo Restante</span>
                <span>{(timeLeftMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-25 ease-linear ${
                    timeLeftMs > 2000
                      ? 'bg-emerald-500'
                      : timeLeftMs > 1000
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${(timeLeftMs / currentPrompt.timeLimitMs) * 100}%` }}
                />
              </div>
            </div>

            {/* Prompt sentence with blank */}
            <div className="py-4 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                {currentPrompt.promptText}
              </span>
              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-xl font-bold text-gray-900 dark:text-white">
                "{currentPrompt.sentenceContext}"
              </div>
            </div>

            {/* 4 Rapid Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentPrompt.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-gray-200 dark:border-gray-700 hover:border-amber-400 text-gray-900 dark:text-white font-mono text-base font-bold transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : sessionSummary ? (
          /* Session Summary screen */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                ¡Ráfaga Completada con Éxito!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tus respuestas automáticas han sido consolidadas en el registro de fluidez procedural.
              </p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Puntaje Final</span>
                <span className="text-xl font-extrabold text-amber-500 font-mono">
                  {sessionSummary.finalScore}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Aciertos</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {sessionSummary.correctCount} / {sessionSummary.totalPrompts}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Mejor Combo</span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {sessionSummary.maxCombo}x
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A]">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Velocidad Media</span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                  {sessionSummary.avgResponseTimeMs}ms
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleStart}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jugar Otra Ráfaga</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
