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
  BookmarkCheck,
  Sparkles,
  Clock,
  Target,
  BarChart2,
  Check,
  Brain,
} from 'lucide-react';
import { DailyQuest, UserStreak } from '@/core/types/habits';
import { WeaknessMetric } from '@/core/types/diagnostics';
import { useHabitsStore } from '@/features/habits/store/habitsStore';
import { useSrsStore } from '@/features/srs/store/srsStore';
import { useDiagnosticsStore } from '@/features/diagnostics/store/diagnosticsStore';

export interface OverviewDashboardProps {
  streak?: UserStreak;
  quests?: DailyQuest[];
  weaknesses?: WeaknessMetric[];
  reviewCount?: number;
  onNavigateTab?: (tab: string) => void;
  onStartMicroWorkout?: (weakness: WeaknessMetric) => void;
}

export function OverviewDashboard({
  streak: propStreak,
  quests: propQuests,
  weaknesses: propWeaknesses,
  reviewCount: propReviewCount,
  onNavigateTab,
  onStartMicroWorkout,
}: OverviewDashboardProps) {
  const storeStreak = useHabitsStore((s) => s.streak);
  const storeQuests = useHabitsStore((s) => s.quests);
  const storeReviewCount = useSrsStore((s) => s.reviewCount);
  const storeWeaknesses = useDiagnosticsStore((s) => s.weaknesses);

  const streak = propStreak ?? storeStreak;
  const quests = propQuests ?? storeQuests;
  const reviewCount = propReviewCount ?? storeReviewCount;
  const weaknesses = propWeaknesses ?? storeWeaknesses;

  const completedQuests = quests.filter((q) => q.isCompleted).length;
  const totalXp = quests
    .filter((q) => q.isCompleted)
    .reduce((acc, q) => acc + q.xpReward, 0);

  const criticalWeakness = weaknesses.find((w) => w.isCritical);

  // Barry Zimmerman SRL deliberate practice time budget calculation
  const calculateQuestMinutes = (q: DailyQuest): number => {
    switch (q.questType) {
      case 'VOCAB_SRS':
        return Math.max(3, Math.round(q.targetCount * 0.5));
      case 'PHONETICS_LISTEN':
        return Math.max(3, Math.round(q.targetCount * 0.8));
      case 'SPEED_DRILL':
        return Math.max(4, Math.round(q.targetCount * 0.6));
      case 'WRITING_SUBMISSION':
        return 6;
      case 'GRADED_READER':
        return 8;
      default:
        return 5;
    }
  };

  const totalDeliberateMinutes = quests.length > 0
    ? quests.reduce((acc, q) => acc + calculateQuestMinutes(q), 0)
    : 14;

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

  // Determine top priority target for Phase 2 Performance Focus
  const getPrimaryPerformanceFocus = () => {
    if (criticalWeakness) {
      return {
        title: 'Micro-Workout de Calibración Inmediata',
        desc: `Resolver error crítico: ${criticalWeakness.labelEs}`,
        tab: 'weaknesses',
        isWeakness: true,
        buttonText: 'Iniciar Micro-Workout',
        badge: 'Prioridad Crítica',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
      };
    }
    const pendingQuest = quests.find((q) => !q.isCompleted);
    if (pendingQuest) {
      return {
        title: pendingQuest.title,
        desc: pendingQuest.description,
        tab: getQuestTargetTab(pendingQuest.questType),
        isWeakness: false,
        buttonText: 'Entrenar Misión Ahora',
        badge: 'Siguiente Meta Diaria',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
      };
    }
    return {
      title: 'Repaso Espaciado Continuo FSRS',
      desc: 'Consolida tu retención a largo plazo con el algoritmo FSRS v5',
      tab: 'srs',
      isWeakness: false,
      buttonText: 'Iniciar Repaso FSRS',
      badge: 'Mantenimiento Preventivo',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    };
  };

  const primaryFocus = getPrimaryPerformanceFocus();

  return (
    <div className="space-y-6">
      {/* Barry Zimmerman SRL Cycle Tracker Banner */}
      <div className="p-4 rounded-3xl bg-linear-to-r from-indigo-900/10 via-purple-900/10 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 border border-indigo-200/60 dark:border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Ciclo de Autorregulación del Aprendizaje (Barry Zimmerman SRL)
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              1. Previsión y Presupuesto &rarr; 2. Foco de Desempeño Inmersivo &rarr; 3. Autorreflexión y Telemetría.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1.5 font-medium shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Presupuesto Hoy: <strong>{totalDeliberateMinutes} min</strong></span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Anti-fragilidad: Activa</span>
          </span>
        </div>
      </div>

      {/* Hero Strip: Streaks, Quests & XP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Streak card with Anti-fragility */}
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
              onClick={() => onNavigateTab?.('srs')}
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

      {/* Zimmerman SRL Phase 1: Previsión (Morning Briefing & Deliberate Practice Budget) */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800/80 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Fase 1: Previsión & Planificación Matutina
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-bold">
                  {totalDeliberateMinutes} min de práctica deliberada hoy
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                Plan Diario de Hábitos y Metas de Adquisición
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {completedQuests}/{quests.length} Quests Listas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
          {quests.map((q) => {
            const estMin = calculateQuestMinutes(q);
            return (
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
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono mt-1">
                      <span>Progreso: {q.currentCount}/{q.targetCount}</span>
                      <span>&bull;</span>
                      <span className="text-indigo-500 dark:text-indigo-400 font-medium">~{estMin} min</span>
                    </div>
                  </div>
                </div>

                <div>
                  {q.isCompleted ? (
                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Lista
                    </span>
                  ) : (
                    <button
                      onClick={() => onNavigateTab?.(getQuestTargetTab(q.questType))}
                      className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                      title="Ir a completar"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zimmerman SRL Phase 2: Foco de Desempeño (Direct 1-Click Launchpad & Ergonomics) */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-[#131722] text-white border border-indigo-800/80 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Fase 2: Foco de Desempeño (Acceso Directo en &le; 2 Clics)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${primaryFocus.badgeColor}`}>
                {primaryFocus.badge}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {primaryFocus.title}
            </h3>
            <p className="text-xs text-indigo-200/80 max-w-xl">
              {primaryFocus.desc}
            </p>
          </div>

          <button
            onClick={() => {
              if (primaryFocus.isWeakness && criticalWeakness) {
                if (onStartMicroWorkout) {
                  onStartMicroWorkout(criticalWeakness);
                } else {
                  onNavigateTab?.('weaknesses');
                }
              } else {
                onNavigateTab?.(primaryFocus.tab);
              }
            }}
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold text-xs shadow-lg shadow-black/30 transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start md:self-auto"
          >
            <Zap className="w-4 h-4 fill-indigo-600 text-indigo-600" />
            <span>{primaryFocus.buttonText}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
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
            onClick={() => {
              if (onStartMicroWorkout) {
                onStartMicroWorkout(criticalWeakness);
              } else {
                onNavigateTab?.('weaknesses');
              }
            }}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>Iniciar Micro-Workout Ahora</span>
          </button>
        </div>
      )}

      {/* Quick Study Modules Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab?.('vocab')}
          className="p-5 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Banco de Vocabulario
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            Explora palabras aprendidas, fonética IPA y agrega nuevo léxico.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('srs')}
          className="p-5 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-indigo-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            SRS & Fonología
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            Repasos optimizados con el algoritmo matemático FSRS v5.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('writing')}
          className="p-5 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-emerald-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PenTool className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Taller de Redacción
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            Composición con preguntas guía, pistas de mejora e inteligencia artificial.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab?.('reader')}
          className="p-5 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 hover:border-blue-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Graded Reader (i+1)
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            Lectura comprensible con decodificación auditiva bottom-up y cosecha en 1 clic.
          </p>
        </button>
      </div>

      {/* Zimmerman SRL Phase 3: Autorreflexión & Telemetría Formativa */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Fase 3: Autorreflexión & Telemetría Cognitiva
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                Métricas Formativas Post-Sesión
              </h3>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab?.('weaknesses')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Ver Diagnóstico 3D</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* RT Latency Metric */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-1">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">
              Latencia de Reacción (RT)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-500 font-mono">
                1.18s
              </span>
              <span className="text-xs text-emerald-500 font-semibold">&lt; 1.50s</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Zona Proceduralizada en Ganglios Basales (Modelo Ullman).
            </p>
          </div>

          {/* Neutralized Errors */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-1">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">
              Neutralización en Heatmap
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                85%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">resolución</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Desvíos fonológicos y gramaticales neutralizados con éxito.
            </p>
          </div>

          {/* FSRS Retention Stability */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-1">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">
              Retención FSRS Observada
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                91.8%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">meta: 90%</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Algoritmo FSRS v5 calibrado para consolidación óptima.
            </p>
          </div>

          {/* Anti-fragility Protection */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-1">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">
              Anti-fragilidad de Racha
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                {streak.availableFreezes}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">freezes activos</span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Protección de racha ante imprevistos para evitar el abandono.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
