import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Zap,
  BarChart2,
} from 'lucide-react';
import {
  WeaknessMetric,
  MicroWorkout,
  ErrorDomain,
} from '@/core/types/diagnostics';
import { WeaknessEngine } from '@/core/diagnostics/WeaknessEngine';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useAudio } from '@/shared/hooks/useAudio';
import { MicroWorkoutModal } from './MicroWorkoutModal';

import { useDiagnosticsStore } from '../store/diagnosticsStore';
import { MathText } from '@/shared/ui/MathText';

export interface WeaknessHeatmapProps {
  weaknesses?: WeaknessMetric[];
  audioService?: AudioService;
  onWeaknessResolved?: (metricId: string) => void;
}

export function WeaknessHeatmap({
  weaknesses: propWeaknesses,
  audioService: audioProp,
  onWeaknessResolved: propOnWeaknessResolved,
}: WeaknessHeatmapProps) {
  const storeWeaknesses = useDiagnosticsStore((s) => s.weaknesses);
  const storeResolve = useDiagnosticsStore((s) => s.resolveWeakness);
  const weaknesses = propWeaknesses ?? storeWeaknesses;
  const onWeaknessResolved = propOnWeaknessResolved ?? storeResolve;

  const { audioService: defaultAudio } = useAudio();
  const audioService = audioProp ?? defaultAudio;

  const engine = useMemo(() => new WeaknessEngine(), []);

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
                Mapa Térmico de Debilidades (Weakness Heatmap)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <MathText text="Diagnóstico de errores persistentes con ponderación temporal ($3.5\times$ en los últimos 7 días). Lanza Micro-Workouts adaptativos para extinguir fosilizaciones." />
              </p>
            </div>
          </div>
        </div>

        {/* Domain filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'GRAMMAR', 'LEXICON', 'PHONETICS', 'PRAGMATICS'] as const).map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedDomain === domain
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {domain === 'ALL' ? 'Todos los Dominios' : domain}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No se han detectado debilidades activas
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            Tu perfil no tiene errores recurrentes registrados. A medida que completes prácticas en el Taller Socrático, Speed Drills o SRS, el sistema identificará patrones de interferencia lingüística (L1) para generar Micro-Workouts dirigidos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => {
          const scorePercent = (w.weaknessScore / 10) * 100;

          return (
            <div
              key={w.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between shadow-xs ${
                w.isCritical
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                  : 'bg-white dark:bg-[#131722] border-gray-200 dark:border-gray-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      w.isCritical
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {w.domain}
                  </span>

                  {w.isCritical && (
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fosilización Crítica
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {w.labelEs}
                </h3>

                <div className="text-xs font-mono text-gray-400 mb-4">
                  Código: <strong className="text-gray-600 dark:text-gray-300">{w.taxonomyCode}</strong>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Severidad de Error</span>
                    <span
                      className={`font-mono font-bold ${
                        w.isCritical
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {w.weaknessScore.toFixed(1)} / 10.0
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        w.isCritical ? 'bg-rose-600' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#181D2A] p-3 rounded-2xl">
                  <span>
                    Últimos 7 días:{' '}
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
    )}

      {/* Interactive Micro-Workout Modal Runner */}
      {activeWorkout && (
        <MicroWorkoutModal
          workout={activeWorkout}
          currentExerciseIdx={currentExerciseIdx}
          selectedOption={selectedOption}
          exerciseSubmitted={exerciseSubmitted}
          workoutScore={workoutScore}
          workoutFinished={workoutFinished}
          onSelectOption={handleSelectOption}
          onNextExercise={handleNextExercise}
          onClose={handleCloseWorkout}
        />
      )}
    </div>
  );
}
