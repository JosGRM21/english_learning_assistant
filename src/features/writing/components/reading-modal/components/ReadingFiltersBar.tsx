import { Search, X, Filter } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { CATEGORY_FILTERS, CEFR_LEVELS, CefrFilter } from '../types';
import { ReadingTopicCategory } from '@/data/reading-to-write-catalog';

export interface ReadingFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: ReadingTopicCategory | 'ALL';
  onCategoryChange: (category: ReadingTopicCategory | 'ALL') => void;
  selectedCefr: CefrFilter;
  onCefrChange: (level: CefrFilter) => void;
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function ReadingFiltersBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCefr,
  onCefrChange,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onResetFilters,
}: ReadingFiltersBarProps) {
  return (
    <div className="p-4 bg-gray-50/70 dark:bg-[#151924] border-b border-gray-200/80 dark:border-gray-800 space-y-3">
      {/* Top row: Search input + CEFR Level pill selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por tema, palabra clave o título..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#1B2130] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CEFR Level filter pills */}
        <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1 shrink-0">
            Nivel:
          </span>
          {CEFR_LEVELS.map((lvl) => {
            const isSelected = selectedCefr === lvl;
            return (
              <Button
                key={lvl}
                size="sm"
                variant={isSelected ? 'primary' : 'ghost'}
                onPress={() => onCefrChange(lvl)}
                className={`min-w-8 h-7 px-2 font-mono text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-800'
                }`}
              >
                {lvl}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Category filter pills + results count */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-0.5" />
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onCategoryChange(cat.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center gap-2 shrink-0 pl-2 text-xs">
          <Chip
            size="sm"
            variant="soft"
            className="text-[11px] font-medium h-6 px-2 bg-gray-200/60 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300"
          >
            {filteredCount} de {totalCount}
          </Chip>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
