import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { MicroWorkout } from '@/core/types/diagnostics';

export interface MicroWorkoutModalProps {
  workout: MicroWorkout;
  currentExerciseIdx: number;
  selectedOption: number | null;
  exerciseSubmitted: boolean;
  workoutScore: number;
  workoutFinished: boolean;
  onSelectOption: (idx: number) => void;
  onNextExercise: () => void;
  onClose: () => void;
}

export function MicroWorkoutModal({
  workout,
  currentExerciseIdx,
  selectedOption,
  exerciseSubmitted,
  workoutScore,
  workoutFinished,
  onSelectOption,
  onNextExercise,
  onClose,
}: MicroWorkoutModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto custom-scrollbar">
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
                  {workout.title}
                </h3>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Pregunta {currentExerciseIdx + 1} de {workout.exercises.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-200"
                style={{
                  width: `${((currentExerciseIdx + 1) / workout.exercises.length) * 100}%`,
                }}
              />
            </div>

            {/* Exercise question & prompt */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {workout.exercises[currentExerciseIdx].questionEs}
              </p>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-center font-sans text-lg font-bold text-gray-900 dark:text-white">
                "{workout.exercises[currentExerciseIdx].promptSentence}"
              </div>
            </div>

            {/* Options 4 buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workout.exercises[currentExerciseIdx].options.map((opt, idx) => {
                const isCorrect = idx === workout.exercises[currentExerciseIdx].correctOptionIndex;
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
                    onClick={() => onSelectOption(idx)}
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
                <span>{workout.exercises[currentExerciseIdx].explanationEs}</span>
              </div>
            )}

            {/* Next button */}
            {exerciseSubmitted && (
              <div className="flex justify-end">
                <button
                  onClick={onNextExercise}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  {currentExerciseIdx + 1 < workout.exercises.length
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
                onClick={onClose}
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
  );
}
