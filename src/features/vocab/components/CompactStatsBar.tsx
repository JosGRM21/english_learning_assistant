
import {
  BookMarked,
  Sparkles,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CefrLevel } from '@/core/types/vocab';
import { CoreCorpusCoverage } from '@/core/repositories/IVocabRepository';

export interface CompactStatsBarProps {
  totalCount: number;
  filteredCount: number;
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

const CEFR_COLORS: Record<CefrLevel, { bar: string; badge: string }> = {
  A1: { bar: 'bg-emerald-500', badge: 'text-emerald-700 dark:text-emerald-300' },
  A2: { bar: 'bg-teal-500', badge: 'text-teal-700 dark:text-teal-300' },
  B1: { bar: 'bg-indigo-500', badge: 'text-indigo-700 dark:text-indigo-300' },
  B2: { bar: 'bg-sky-500', badge: 'text-sky-700 dark:text-sky-300' },
  C1: { bar: 'bg-purple-500', badge: 'text-purple-700 dark:text-purple-300' },
  C2: { bar: 'bg-amber-500', badge: 'text-amber-700 dark:text-amber-300' },
};

export function CompactStatsBar({
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
}: CompactStatsBarProps) {
  const totalCore = coverageStats?.totalCore ?? 3500;
  const activeCore = coverageStats?.activeCore ?? 0;
  const coveragePercent = totalCore > 0 ? Math.round((activeCore / totalCore) * 100) : 0;
  const receptiveCount = coverageStats?.receptiveMastery ?? 0;
  const productiveCount = coverageStats?.productiveMastery ?? 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] p-3 sm:px-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2.5">
      {/* Top metrics row */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
        {/* Left: Total + Core */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-sans font-bold text-gray-900 dark:text-white">
            <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{totalCount}</span>
            <span className="font-normal text-gray-500 dark:text-gray-400">términos</span>
          </div>

          <span className="text-gray-300 dark:text-gray-700">·</span>

          <div
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"
            title={`${activeCore} de ${totalCore} lemas activos`}
          >
            <span className="text-gray-400 dark:text-gray-500 font-medium">Core:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{coveragePercent}%</span>
          </div>
        </div>

        {/* Right: Mastery status interactive filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* New / By Learn */}
          <button
            type="button"
            onClick={() => onSelectMasteryStatus?.(masteryStatusFilter === 'NEW' ? 'ALL' : 'NEW')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              masteryStatusFilter === 'NEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40'
            }`}
            title="Filtrar por términos nuevos"
          >
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Nuevos</span>
          </button>

          {/* Receptive */}
          <button
            type="button"
            onClick={() =>
              onSelectMasteryStatus?.(
                masteryStatusFilter === 'RECEPTIVE_MASTERY' ? 'ALL' : 'RECEPTIVE_MASTERY',
              )
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              masteryStatusFilter === 'RECEPTIVE_MASTERY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40'
            }`}
            title="Filtrar por dominio receptivo (FSRS)"
          >
            <BookmarkCheck className="w-3 h-3 text-emerald-500" />
            <span>Receptivos ({receptiveCount})</span>
          </button>

          {/* Productive */}
          <button
            type="button"
            onClick={() =>
              onSelectMasteryStatus?.(
                masteryStatusFilter === 'PRODUCTIVE_MASTERY' ? 'ALL' : 'PRODUCTIVE_MASTERY',
              )
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              masteryStatusFilter === 'PRODUCTIVE_MASTERY'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40'
            }`}
            title="Filtrar por dominio productivo (escritura)"
          >
            <CheckCircle2 className="w-3 h-3 text-purple-500" />
            <span>Productivos ({productiveCount})</span>
          </button>

          {/* False Friends pill */}
          <button
            type="button"
            onClick={onToggleFalseFriends}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-semibold text-[11px] transition-all cursor-pointer ${
              onlyFalseFriends
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40'
            }`}
            title="Filtrar falsos amigos"
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Falsos amigos ({falseFriendsCount})</span>
          </button>
        </div>
      </div>

      {/* Segmented CEFR stacked progress bar with level buttons */}
      <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-white/[0.04]">
        {/* Stacked bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-0.5">
          {CEFR_LEVELS.map((lvl) => {
            const count = cefrCounts[lvl] ?? 0;
            const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
            if (percent === 0) return null;
            return (
              <div
                key={lvl}
                style={{ width: `${percent}%` }}
                className={`h-full ${CEFR_COLORS[lvl].bar} transition-all duration-300`}
                title={`${lvl}: ${count} (${percent.toFixed(0)}%)`}
              />
            );
          })}
        </div>

        {/* Small CEFR Level pills */}
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {CEFR_LEVELS.map((lvl) => {
              const count = cefrCounts[lvl] ?? 0;
              const isSelected = selectedCefr === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSelectCefr(isSelected ? 'ALL' : lvl)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {lvl} <span className="opacity-70 font-sans">({count})</span>
                </button>
              );
            })}
          </div>

          {selectedCefr !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectCefr('ALL')}
              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Restablecer nivel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
