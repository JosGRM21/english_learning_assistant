import {
  Flame,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  BookOpen,
  Ear,
  PenTool,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { DailyQuest, UserStreak } from '@/core/types/habits';
import { WeaknessMetric } from '@/core/types/diagnostics';

interface OverviewDashboardProps {
  streak: UserStreak;
  quests: DailyQuest[];
  weaknesses: WeaknessMetric[];
  reviewCount: number;
  onNavigateTab: (tab: string) => void;
  onStartMicroWorkout: (weakness: WeaknessMetric) => void;
}

export function OverviewDashboard({
  streak,
  quests,
  weaknesses,
  reviewCount,
  onNavigateTab,
  onStartMicroWorkout,
}: OverviewDashboardProps) {
  const completedQuests = quests.filter((q) => q.isCompleted).length;
  const totalXp = quests
    .filter((q) => q.isCompleted)
    .reduce((acc, q) => acc + q.xpReward, 0);

  const criticalWeakness = weaknesses.find((w) => w.isCritical);

  const getQuestIcon = (type: DailyQuest['questType']) => {
    switch (type) {
      case 'VOCAB_SRS':
        return <Award className="w-4 h-4 text-indigo-500" />;
      case 'PHONETICS_LISTEN':
        return <Ear className="w-4 h-4 text-purple-500" />;
      case 'SPEED_DRILL':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'WRITING_SUBMISSION':
        return <PenTool className="w-4 h-4 text-emerald-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-blue-500" />;
    }
  };

  const getQuestTargetTab = (type: DailyQuest['questType']) => {
    switch (type) {
      case 'VOCAB_SRS':
        return 'srs';
      case 'PHONETICS_LISTEN':
        return 'minimal_pairs';
      case 'SPEED_DRILL':
        return 'drills';
      case 'WRITING_SUBMISSION':
        return 'writing';
      case 'GRADED_READER':
        return 'reader';
      default:
        return 'srs';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Strip: Streaks, Quests & XP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Streak card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Racha Activa
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-amber-500 font-mono">
                {streak.currentStreak}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">días seguidos</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>{streak.availableFreezes} Streak Freezes disponibles</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <Flame className="w-7 h-7 fill-current" />
          </div>
        </div>

        {/* Daily Quests progress */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Misiones Diarias
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {completedQuests}/{quests.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">completadas</span>
            </div>
            <div className="w-28 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-3">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(completedQuests / Math.max(1, quests.length)) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* XP Earned Today */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              XP Acumulada Hoy
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +{totalXp}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">puntos</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Nivel: Bilingüe en Progreso</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Repasos en Sesión */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Repasos en Sesión
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                {reviewCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">tarjetas FSRS</span>
            </div>
            <button
              onClick={() => onNavigateTab('srs')}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-2 flex items-center gap-1 cursor-pointer"
            >
              <span>Continuar repasos</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Critical Weakness Alert Banner (if any weakness >= 6.0) */}
      {criticalWeakness && (
        <div className="p-6 rounded-3xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Debilidad Crónica Detectada (Score: {criticalWeakness.weaknessScore.toFixed(1)}/10)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-200 font-bold">
                  {criticalWeakness.taxonomyCode}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                {criticalWeakness.labelEs}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Has registrado {criticalWeakness.occurrencesLast7Days} fallos en los últimos 7 días.
                Completa un Micro-Workout de 5 ejercicios para recalibrar tus circuitos cerebrales.
              </p>
            </div>
          </div>

          <button
            onClick={() => onStartMicroWorkout(criticalWeakness)}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>Iniciar Micro-Workout Ahora</span>
          </button>
        </div>
      )}

      {/* Daily Quests Task List */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Plan Diario de Hábitos (Daily Quests)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cumple cada actividad para mantener el momentum cognitivo y proteger tu racha.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {completedQuests}/{quests.length} Hechas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                q.isCompleted
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-gray-50 dark:bg-[#181D2A] border-gray-200 dark:border-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    q.isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {getQuestIcon(q.questType)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {q.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                      +{q.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {q.description}
                  </p>
                  <div className="text-[11px] text-gray-400 font-mono mt-1">
                    Progreso: {q.currentCount} / {q.targetCount}
                  </div>
                </div>
              </div>

              <div>
                {q.isCompleted ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Lista
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigateTab(getQuestTargetTab(q.questType))}
                    className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                    title="Ir a completar"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
