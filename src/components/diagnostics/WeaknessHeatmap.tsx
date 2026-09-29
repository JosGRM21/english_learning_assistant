import { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import {
  WeaknessMetric,
  MicroWorkout,
  ErrorDomain,
} from '@/core/types/diagnostics';
import { WeaknessEngine } from '@/core/diagnostics/WeaknessEngine';
import { AudioService } from '@/infrastructure/audio/AudioService';

interface WeaknessHeatmapProps {
  weaknesses: WeaknessMetric[];
  audioService: AudioService;
  onWeaknessResolved?: (metricId: string) => void;
}

export function WeaknessHeatmap({
  weaknesses,
  audioService,
  onWeaknessResolved,
}: WeaknessHeatmapProps) {
  const engine = new WeaknessEngine();

  const [selectedDomain, setSelectedDomain] = useState<ErrorDomain | 'ALL'>('ALL');
  const [activeWorkout, setActiveWorkout] = useState<MicroWorkout | null>(null);

  // Workout runner state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false);
  const [workoutScore, setWorkoutScore] = useState(0);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  const filtered = weaknesses.filter(
    (w) => selectedDomain === 'ALL' || w.domain === selectedDomain,
  );

  const handleStartWorkout = (metric: WeaknessMetric) => {
    const workout = engine.generateMicroWorkout(metric);
    setActiveWorkout(workout);
    setCurrentExerciseIdx(0);
    setSelectedOption(null);
    setExerciseSubmitted(false);
    setWorkoutScore(0);
    setWorkoutFinished(false);
  };

  const handleSelectOption = (optIdx: number) => {
    if (exerciseSubmitted || !activeWorkout) return;
    setSelectedOption(optIdx);
    setExerciseSubmitted(true);

    const currentEx = activeWorkout.exercises[currentExerciseIdx];
    const isCorrect = optIdx === currentEx.correctOptionIndex;

    audioService.playFeedback(isCorrect);
    if (isCorrect) {
      setWorkoutScore((prev) => prev + 1);
    }
  };

  const handleNextExercise = () => {
    if (!activeWorkout) return;

    if (currentExerciseIdx + 1 < activeWorkout.exercises.length) {
      setCurrentExerciseIdx((prev) => prev + 1);
      setSelectedOption(null);
      setExerciseSubmitted(false);
    } else {
      setWorkoutFinished(true);
      if (onWeaknessResolved) {
        onWeaknessResolved(activeWorkout.weaknessMetricId);
      }
    }
  };

  const handleCloseWorkout = () => {
    setActiveWorkout(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Domain Filters */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <BarChart2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Heatmap de Debilidades Crónicas & Micro-Workouts
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Diagnóstico sistemático de errores recurrentes procedentes de SRS, fonética y redacción,
                con decaimiento temporal y entrenamientos focalizados de 5 preguntas.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'GRAMMAR', 'LEXICON', 'PHONETICS'] as const).map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedDomain === dom
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {dom === 'ALL'
                ? 'Todos los Dominios'
                : dom === 'GRAMMAR'
                  ? 'Gramática L1'
                  : dom === 'LEXICON'
                    ? 'Falsos Amigos'
                    : 'Fonética'}
            </button>
          ))}
        </div>
      </div>

      {/* Weakness List / Heatmap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((w) => {
          const scorePercent = Math.min(100, (w.weaknessScore / 10) * 100);
          return (
            <div
              key={w.id}
              className={`p-6 rounded-3xl border shadow-sm transition-all flex flex-col justify-between ${
                w.isCritical
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                  : 'bg-white dark:bg-[#131722] border-gray-200 dark:border-gray-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {w.domain}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {w.taxonomyCode}
                    </span>
                  </div>

                  {w.isCritical && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      CRÍTICO
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {w.labelEs}
                </h3>

                {/* Score bar */}
                <div className="space-y-1 my-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Severidad de Debilidad:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {w.weaknessScore.toFixed(1)} / 10.0
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        w.weaknessScore >= 6.0
                          ? 'bg-rose-500'
                          : w.weaknessScore >= 3.5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <span>
                    Ocurrencias últimos 7 días:{' '}
                    <strong className="text-gray-900 dark:text-white font-mono">
                      {w.occurrencesLast7Days}
                    </strong>
                  </span>
                  <span>
                    Total:{' '}
                    <strong className="text-gray-900 dark:text-white font-mono">
                      {w.totalOccurrences}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex justify-end">
                <button
                  onClick={() => handleStartWorkout(w)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    w.isCritical
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Iniciar Micro-Workout (5 Ejercicios)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Micro-Workout Modal Runner */}
      {activeWorkout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131722] rounded-3xl max-w-xl w-full p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-6">
            {!workoutFinished ? (
              <>
                {/* Workout Runner Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Entrenamiento Focalizado
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {activeWorkout.title}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Pregunta {currentExerciseIdx + 1} de {activeWorkout.exercises.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{
                      width: `${((currentExerciseIdx + 1) / activeWorkout.exercises.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Exercise question & prompt */}
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {activeWorkout.exercises[currentExerciseIdx].questionEs}
                  </p>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-center font-sans text-lg font-bold text-gray-900 dark:text-white">
                    "{activeWorkout.exercises[currentExerciseIdx].promptSentence}"
                  </div>
                </div>

                {/* Options 4 buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeWorkout.exercises[currentExerciseIdx].options.map((opt, idx) => {
                    const isCorrect =
                      idx === activeWorkout.exercises[currentExerciseIdx].correctOptionIndex;
                    const isSelected = selectedOption === idx;

                    let btnClass =
                      'bg-gray-50 dark:bg-[#181D2A] hover:bg-gray-100 dark:hover:bg-[#202738] border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';

                    if (exerciseSubmitted) {
                      if (isCorrect) {
                        btnClass =
                          'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold';
                      } else if (isSelected && !isCorrect) {
                        btnClass =
                          'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
                      } else {
                        btnClass = 'opacity-40 border-gray-200 dark:border-gray-800';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={exerciseSubmitted}
                        className={`p-3.5 rounded-xl border text-center font-mono text-sm transition-all cursor-pointer flex items-center justify-between ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {exerciseSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {exerciseSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submit */}
                {exerciseSubmitted && (
                  <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                    <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{activeWorkout.exercises[currentExerciseIdx].explanationEs}</span>
                  </div>
                )}

                {/* Next button */}
                {exerciseSubmitted && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextExercise}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      {currentExerciseIdx + 1 < activeWorkout.exercises.length
                        ? 'Siguiente Pregunta →'
                        : 'Ver Resultados Finales →'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Workout Completed Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    ¡Micro-Workout Completado!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Has acertado{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {workoutScore}
                    </strong>{' '}
                    de 5 preguntas. Tu memoria procedural ha reforzado este patrón lingüístico.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCloseWorkout}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Cerrar y Volver al Heatmap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
