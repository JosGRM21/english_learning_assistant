import {
  Zap,
  Trophy,
  Flame,
  RotateCcw,
  Play,
} from 'lucide-react';
import { DrillSessionResult } from '@/core/types/drills';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useSpeedDrill } from '../hooks/useSpeedDrill';
import { MathText } from '@/shared/ui/MathText';
export interface SpeedDrillArenaProps {
  audioService?: AudioService;
  onDrillCompleted?: (result: DrillSessionResult) => void;
}

export function SpeedDrillArena({ onDrillCompleted }: SpeedDrillArenaProps) {
  const {
    drillType,
    isPlaying,
    prompts,
    currentIndex,
    currentCombo,
    totalScore,
    timeLeftMs,
    sessionSummary,
    feedback,
    setDrillType,
    handleStart,
    handleAnswer,
  } = useSpeedDrill(onDrillCompleted);

  const currentPrompt = prompts[currentIndex];

  const DRILL_MODALITIES: { type: typeof drillType; label: string; badge?: string }[] = [
    { type: 'CLAUSE_SHIFT', label: '1. Clause Shift', badge: '3.5s' },
    { type: 'THIRD_PERSON_AUTOMATION', label: '2. 3rd Person -s', badge: '2.5s' },
    { type: 'PREPOSITION_REFLEX', label: '3. Prep Reflex', badge: '2.0s' },
    { type: 'AUDITORY_SNAP_HVPT', label: '4. Auditory Snap', badge: '2.0s' },
    { type: 'COLLOCATION_BLITZ', label: 'Collocation Blitz' },
    { type: 'PREPOSITION_RAPID_FIRE', label: 'Preposition Fire' },
    { type: 'CONNECTED_SPEECH_EAR', label: 'Connected Speech' },
  ];

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
                Entrenamiento Rápido (Ráfagas Cronometradas)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Entrenamiento de respuesta rápida para automatizar estructuras gramaticales, colocaciones y fluidez verbal en inglés.
              </p>
            </div>
          </div>
        </div>

        {/* Drill mode tabs */}
        {!isPlaying && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {DRILL_MODALITIES.map((d) => (
              <button
                key={d.type}
                onClick={() => setDrillType(d.type)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  drillType === d.type
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{d.label}</span>
                {d.badge && (
                  <span className={`text-[10px] px-1 py-0.2 rounded ${
                    drillType === d.type ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                    {d.badge}
                  </span>
                )}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
                <MathText text="Responderás 8 preguntas en ráfaga con un límite de 3.5 a 4.5 segundos por ítem. Los aciertos continuos activan multiplicadores de Combo ($\times 2$, $\times 3$) y bonos de velocidad." />
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

            {/* Prompt sentence with blank and operator badge */}
            <div className="py-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  {currentPrompt.promptText}
                </span>
                {currentPrompt.operatorChange && (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {currentPrompt.operatorChange}
                  </span>
                )}
                {currentPrompt.id.includes('_recovery_n3') && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300">
                    Recuperación N+3 (Mismo Ítem)
                  </span>
                )}
                {currentPrompt.id.includes('_recovery_n7') && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300">
                    Recuperación N+7 (Variante)
                  </span>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-xl font-bold text-gray-900 dark:text-white">
                "{currentPrompt.sentenceContext}"
              </div>

              {/* Instant feedback notification */}
              {feedback && (
                <div className="animate-in fade-in zoom-in-95 duration-150">
                  {feedback.proceduralPass ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-500 fill-current" />
                      <span>¡Automaticidad Procedural! {feedback.responseTimeMs}ms (&lt; 1500ms) → Ganglios Basales</span>
                    </div>
                  ) : feedback.isCorrect ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold text-center">
                      Acierto Declarativo: {feedback.responseTimeMs}ms (Umbral motor: &lt; 1500ms)
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold text-center">
                      Solución Nativa: "{currentPrompt.options[currentPrompt.correctOptionIndex]}" · Reinyectando en N+3 y N+7
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4 Rapid Options */}
            <div className="grid grid-cols-2 gap-3">
              {currentPrompt.options.map((opt, idx) => {
                let btnStyle = 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-400';
                if (feedback) {
                  if (idx === feedback.correctOptionIndex) {
                    btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20';
                  } else if (idx === feedback.selectedOptionIndex && !feedback.isCorrect) {
                    btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100';
                  } else {
                    btnStyle = 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800 opacity-40';
                  }
                }
                return (
                  <button
                    key={idx}
                    disabled={feedback !== null}
                    onClick={() => handleAnswer(idx)}
                    className={`p-4 rounded-2xl border font-mono text-base font-bold transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                  </button>
                );
              })}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                Tus respuestas automáticas han sido consolidadas. Se requieren 3 sesiones independientes con RT &lt; 1.5s para certificar un ítem como proceduralizado.
              </p>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
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
                <span className="text-[10px] text-gray-400 uppercase font-bold block flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> RT &lt; 1.5s
                </span>
                <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {sessionSummary.proceduralPassCount} / {sessionSummary.totalPrompts}
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
