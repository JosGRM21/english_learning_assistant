import {
  BookMarked,
  Sparkles,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { CefrLevel } from '@/core/types/vocab';
import { CoreCorpusCoverage } from '@/core/repositories/IVocabRepository';

export interface VocabMetricsBarProps {
  totalCount: number;
  filteredCount?: number;
  falseFriendsCount: number;
  cefrCounts: Record<string, number>;
  selectedCefr: string;
  onlyFalseFriends: boolean;
  onSelectCefr: (cefr: string) => void;
  onToggleFalseFriends: () => void;
  coverageStats?: CoreCorpusCoverage | null;
  masteryStatusFilter?: string;
  onSelectMasteryStatus?: (status: string) => void;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CEFR_CONFIG: Record<
  CefrLevel,
  {
    bar: string;
    pillBg: string;
    pillText: string;
    pillActive: string;
    description: string;
  }
> = {
  A1: {
    bar: 'bg-emerald-500',
    pillBg: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    pillText: 'text-emerald-700 dark:text-emerald-300',
    pillActive: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30',
    description: 'Principiante básico',
  },
  A2: {
    bar: 'bg-teal-500',
    pillBg: 'hover:bg-teal-50/80 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300',
    pillText: 'text-teal-700 dark:text-teal-300',
    pillActive: 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-500/30',
    description: 'Elemental',
  },
  B1: {
    bar: 'bg-indigo-500',
    pillBg: 'hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300',
    pillText: 'text-indigo-700 dark:text-indigo-300',
    pillActive: 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30',
    description: 'Intermedio',
  },
  B2: {
    bar: 'bg-sky-500',
    pillBg: 'hover:bg-sky-50/80 dark:hover:bg-sky-950/40 text-sky-700 dark:text-sky-300',
    pillText: 'text-sky-700 dark:text-sky-300',
    pillActive: 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-500/30',
    description: 'Intermedio alto',
  },
  C1: {
    bar: 'bg-purple-500',
    pillBg: 'hover:bg-purple-50/80 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300',
    pillText: 'text-purple-700 dark:text-purple-300',
    pillActive: 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-500/30',
    description: 'Avanzado',
  },
  C2: {
    bar: 'bg-amber-500',
    pillBg: 'hover:bg-amber-50/80 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    pillText: 'text-amber-700 dark:text-amber-300',
    pillActive: 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30',
    description: 'Maestría / Fluidez nativa',
  },
};

export function VocabMetricsBar({
  totalCount,
  falseFriendsCount,
  cefrCounts,
  selectedCefr,
  onlyFalseFriends,
  onSelectCefr,
  onToggleFalseFriends,
  coverageStats,
  masteryStatusFilter = 'ALL',
  onSelectMasteryStatus,
}: VocabMetricsBarProps) {
  const totalCore = coverageStats?.totalCore ?? 3500;
  const activeCore = coverageStats?.activeCore ?? 0;
  const coveragePercent = totalCore > 0 ? Math.round((activeCore / totalCore) * 100) : 0;
  const receptiveCount = coverageStats?.receptiveMastery ?? 0;
  const productiveCount = coverageStats?.productiveMastery ?? 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] p-3.5 sm:px-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
      {/* Top metrics row: General Counts & Interactive Mastery Pills */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Total terms + Core corpus coverage progress */}
        <div className="flex items-center gap-3.5 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
            <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookMarked className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono text-sm tracking-tight">{totalCount.toLocaleString()}</span>
            <span className="font-normal text-gray-500 dark:text-gray-400">términos</span>
          </div>

          <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">·</span>

          {/* Mini Core Coverage Progress */}
          <div
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 cursor-help"
            title={`${activeCore.toLocaleString()} de ${totalCore.toLocaleString()} lemas esenciales activos en estudio`}
          >
            <span className="text-gray-400 dark:text-gray-500 font-medium">Core Corpus:</span>
            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, coveragePercent)}%` }}
              />
            </div>
            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {coveragePercent}%
            </span>
          </div>
        </div>

        {/* Right: Quick Interactive Learning Stage Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Nuevos */}
          <button
            type="button"
            onClick={() => onSelectMasteryStatus?.(masteryStatusFilter === 'NEW' ? 'ALL' : 'NEW')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              masteryStatusFilter === 'NEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40'
            }`}
            title="Filtrar por términos nuevos por aprender"
          >
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Nuevos</span>
          </button>

          {/* Receptivos (FSRS) */}
          <button
            type="button"
            onClick={() =>
              onSelectMasteryStatus?.(
                masteryStatusFilter === 'RECEPTIVE_MASTERY' ? 'ALL' : 'RECEPTIVE_MASTERY',
              )
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              masteryStatusFilter === 'RECEPTIVE_MASTERY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40'
            }`}
            title="Filtrar por términos con dominio receptivo validado en repaso espaciado FSRS"
          >
            <BookmarkCheck className="w-3 h-3 text-emerald-500" />
            <span>Receptivos ({receptiveCount})</span>
          </button>

          {/* Productivos (Escritura) */}
          <button
            type="button"
            onClick={() =>
              onSelectMasteryStatus?.(
                masteryStatusFilter === 'PRODUCTIVE_MASTERY' ? 'ALL' : 'PRODUCTIVE_MASTERY',
              )
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              masteryStatusFilter === 'PRODUCTIVE_MASTERY'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40'
            }`}
            title="Filtrar por términos con dominio productivo demostrado en ensayos de escritura"
          >
            <CheckCircle2 className="w-3 h-3 text-purple-500" />
            <span>Productivos ({productiveCount})</span>
          </button>

          {/* Falsos Amigos */}
          <button
            type="button"
            onClick={onToggleFalseFriends}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              onlyFalseFriends
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40'
            }`}
            title="Filtrar falsos amigos (trampas cognitivas léxicas)"
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Falsos amigos ({falseFriendsCount})</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Interactive CEFR Distribution Spectrum */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/[0.04]">
        {/* Continuous Stacked Spectrum Bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-0.5">
          {CEFR_LEVELS.map((lvl) => {
            const count = cefrCounts[lvl] ?? 0;
            const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
            if (percent === 0) return null;
            return (
              <div
                key={lvl}
                style={{ width: `${percent}%` }}
                className={`h-full ${CEFR_CONFIG[lvl].bar} transition-all duration-300`}
                title={`${lvl}: ${count} palabras (${percent.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* CEFR Level Interactive Filter Pills */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 mr-0.5">
              Nivel:
            </span>
            {CEFR_LEVELS.map((lvl) => {
              const count = cefrCounts[lvl] ?? 0;
              const isSelected = selectedCefr === lvl;
              const config = CEFR_CONFIG[lvl];

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSelectCefr(isSelected ? 'ALL' : lvl)}
                  title={`${lvl} (${config.description}): ${count} términos registrados`}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? config.pillActive
                      : `bg-gray-50 dark:bg-gray-800/80 ${config.pillBg}`
                  }`}
                >
                  <span>{lvl}</span>
                  <span className="opacity-75 font-sans text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {selectedCefr !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCefr('ALL')}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Ver todos los niveles</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
