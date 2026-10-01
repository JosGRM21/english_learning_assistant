import { BookMarked, Layers, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import { CefrLevel } from '@/core/types/vocab';

export interface VocabStatsBentoProps {
  totalCount: number;
  filteredCount: number;
  falseFriendsCount: number;
  cefrCounts: Record<string, number>;
  selectedCefr: string;
  onlyFalseFriends: boolean;
  onSelectCefr: (cefr: string) => void;
  onToggleFalseFriends: () => void;
}

export function VocabStatsBento({
  totalCount,
  filteredCount,
  falseFriendsCount,
  cefrCounts,
  selectedCefr,
  onlyFalseFriends,
  onSelectCefr,
  onToggleFalseFriends,
}: VocabStatsBentoProps) {
  const cefrLevels: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const cefrColorMap: Record<CefrLevel, { bg: string; text: string; bar: string }> = {
    A1: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
    A2: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-600 dark:text-teal-400', bar: 'bg-teal-500' },
    B1: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
    B2: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
    C1: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
    C2: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total Words Bento Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#121622] p-4 border border-gray-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Inventario Léxico
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <BookMarked className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white font-sans">
            {totalCount}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">términos registrados</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{filteredCount === totalCount ? 'Todos los términos activos' : `${filteredCount} mostrados según filtros`}</span>
        </div>
      </div>

      {/* 2. CEFR Spectrum Bento Card */}
      <div className="sm:col-span-2 relative overflow-hidden rounded-2xl bg-white dark:bg-[#121622] p-4 border border-gray-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Distribución por Nivel CEFR
              </span>
            </div>
            {selectedCefr !== 'ALL' && (
              <button
                type="button"
                onClick={() => onSelectCefr('ALL')}
                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                <span>Ver todos</span>
              </button>
            )}
          </div>

          {/* Segmented spectrum bar */}
          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800/80 rounded-full overflow-hidden flex gap-0.5 p-0.5">
            {cefrLevels.map((lvl) => {
              const count = cefrCounts[lvl] ?? 0;
              const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
              if (percent === 0) return null;
              return (
                <div
                  key={lvl}
                  style={{ width: `${percent}%` }}
                  className={`h-full ${cefrColorMap[lvl].bar} rounded-sm transition-all duration-500`}
                  title={`${lvl}: ${count} términos (${percent.toFixed(0)}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Level click pills */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {cefrLevels.map((lvl) => {
            const count = cefrCounts[lvl] ?? 0;
            const isSelected = selectedCefr === lvl;
            const style = cefrColorMap[lvl];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectCefr(isSelected ? 'ALL' : lvl)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 shadow-xs ' + style.bg + ' ' + style.text + ' border-transparent'
                    : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200/60 dark:border-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {lvl} <span className="opacity-70 font-sans">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. False Friends / L1 Alert Bento Card */}
      <button
        type="button"
        onClick={onToggleFalseFriends}
        className={`group text-left relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 cursor-pointer ${
          onlyFalseFriends
            ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-[0_4px_16px_rgba(245,158,11,0.15)] ring-2 ring-amber-500/30'
            : 'bg-white dark:bg-[#121622] border-gray-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-amber-300 dark:hover:border-amber-700/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Falsos Amigos
          </span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 font-sans">
            {falseFriendsCount}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">trampas léxicas</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
          <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">
            {onlyFalseFriends ? 'Filtro activo (clic para ver todos)' : 'Clic para filtrar falsos amigos'}
          </span>
        </div>
      </button>
    </div>
  );
}
