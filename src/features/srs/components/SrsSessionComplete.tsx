import { CheckCircle2, RotateCw, Flame, Clock, Award, Target } from 'lucide-react';
import { SrsSessionStats } from '@/core/srs/SrsSessionEngine';

export interface SrsSessionCompleteProps {
  stats: SrsSessionStats;
  streakDays: number;
  totalDeckCount: number;
  onRestartSession?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function SrsSessionComplete({
  stats,
  streakDays,
  totalDeckCount,
  onRestartSession,
}: SrsSessionCompleteProps) {
  const accuracyPercentage =
    stats.totalReviewed > 0
      ? Math.round((stats.successfulRecalls / stats.totalReviewed) * 100)
      : 100;

  const avgLatencySec = (stats.averageLatencyMs / 1000).toFixed(1);

  return (
    <div className="max-w-xl mx-auto py-8 animate-in fade-in duration-300">
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-gray-800 text-center space-y-6 shadow-sm">
        {/* Celebration Badge */}
        <div className="relative w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </span>
        </div>

        {/* Title and message */}
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            {stats.totalReviewed > 0 ? '¡Sesión de Repaso Completada!' : '¡Tu Mazo está al Día!'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {stats.totalReviewed > 0
              ? 'Has completado todas las tarjetas programadas para esta sesión. El algoritmo FSRS v5 ha recalculado la estabilidad e intervalos óptimos de memoria.'
              : 'No tienes tarjetas vencidas pendientes para hoy. El modelo de decaimiento temporal FSRS te notificará cuando sea el momento exacto para consolidar tu recuerdo.'}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Repasos realizados */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#161B28] border border-gray-100 dark:border-gray-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 mb-1">
              <Award className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Repasos</span>
            </div>
            <div className="text-xl font-black font-mono text-gray-900 dark:text-white">
              {stats.totalReviewed}
            </div>
          </div>

          {/* Precisión / Retención */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#161B28] border border-gray-100 dark:border-gray-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <Target className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Retención</span>
            </div>
            <div className="text-xl font-black font-mono text-gray-900 dark:text-white">
              {stats.totalReviewed > 0 ? `${accuracyPercentage}%` : '100%'}
            </div>
          </div>

          {/* Latencia promedio */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#161B28] border border-gray-100 dark:border-gray-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Velocidad</span>
            </div>
            <div className="text-xl font-black font-mono text-gray-900 dark:text-white">
              {stats.averageLatencyMs > 0 ? `${avgLatencySec}s` : '-'}
            </div>
          </div>

          {/* Racha activa */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#161B28] border border-gray-100 dark:border-gray-800/80 text-center">
            <div className="flex items-center justify-center gap-1 text-rose-500 mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Racha</span>
            </div>
            <div className="text-xl font-black font-mono text-gray-900 dark:text-white">
              {streakDays}d
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-center">
          {onRestartSession && totalDeckCount > 0 && (
            <button
              type="button"
              onClick={onRestartSession}
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Repetir Mazo ({totalDeckCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
