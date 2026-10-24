import { useRef, useEffect } from 'react';
import {
  Search,
  X,
  PlusCircle,
  ArrowUpDown,
} from 'lucide-react';
import { Select, ListBox } from '@heroui/react';
import { VocabSuggestion } from '../../hooks/useVocabList';
import { VocabAdvancedFiltersPopover } from './VocabAdvancedFiltersPopover';

export interface VocabSearchToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  suggestions: VocabSuggestion[];
  showSuggestions: boolean;
  onShowSuggestionsChange: (show: boolean) => void;
  onSelectSuggestion: (word: string) => void;
  onActivateSuggestionWord: (id: string) => void;
  originFilter: 'ALL' | 'CORE' | 'VAULT';
  onOriginChange: (origin: 'ALL' | 'CORE' | 'VAULT') => void;
  coreCount?: number;
  vaultCount?: number;
  sortBy: 'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC';
  onSortChange: (sort: 'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC') => void;
  // Advanced filters props
  frequencyBandFilter: string;
  selectedDimension: string;
  selectedPartOfSpeech: string;
  onSelectFrequencyBand: (band: string) => void;
  onSelectDimension: (dim: string) => void;
  onSelectPartOfSpeech: (pos: string) => void;
  onResetAdvancedFilters: () => void;
}

export function VocabSearchToolbar({
  searchQuery,
  onSearchChange,
  suggestions,
  showSuggestions,
  onShowSuggestionsChange,
  onSelectSuggestion,
  onActivateSuggestionWord,
  originFilter,
  onOriginChange,
  coreCount,
  vaultCount,
  sortBy,
  onSortChange,
  frequencyBandFilter,
  selectedDimension,
  selectedPartOfSpeech,
  onSelectFrequencyBand,
  onSelectDimension,
  onSelectPartOfSpeech,
  onResetAdvancedFilters,
}: VocabSearchToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        onShowSuggestionsChange(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onShowSuggestionsChange]);

  // Click outside listener for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        onShowSuggestionsChange(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onShowSuggestionsChange]);

  return (
    <div className="p-3 sm:px-4 rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
      {/* Primary Toolbar Row: Search Input + Origin Tabs + Filter Popover + Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Search Input with Local Instant Autocomplete */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => onShowSuggestionsChange(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onShowSuggestionsChange(true);
            }}
            placeholder="Buscar término, traducción, fonética IPA o definición..."
            className="w-full pl-9 pr-16 py-2 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 hover:border-gray-300 dark:hover:border-gray-700 transition-all font-sans"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200/60 dark:border-gray-700/60">
                Ctrl+K
              </kbd>
            )}
          </div>

          {/* Instant local autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1.5 bg-white dark:bg-[#141824] rounded-2xl border border-gray-200 dark:border-white/[0.1] shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Sugerencias del Corpus Esencial</span>
                <span className="text-indigo-500 font-mono">Búsqueda local instantánea</span>
              </div>
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  onClick={() => {
                    onSelectSuggestion(sug.word);
                    onShowSuggestionsChange(false);
                  }}
                  className="p-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1F30] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {sug.word}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {sug.translationEs}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {sug.cefrLevel}
                    </span>
                    {sug.isActive ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Activo
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivateSuggestionWord(sug.id);
                          onShowSuggestionsChange(false);
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <PlusCircle className="w-2.5 h-2.5" />
                        <span>Activar</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls: Origin Segmented Control + Advanced Filters Popover + Sort Select */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Quick Origin Segmented Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#161B28] p-1 rounded-xl border border-gray-200/60 dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => onOriginChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                originFilter === 'ALL'
                  ? 'bg-white dark:bg-[#202638] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onOriginChange('CORE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                originFilter === 'CORE'
                  ? 'bg-white dark:bg-[#202638] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Core {coreCount !== undefined ? `(${coreCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => onOriginChange('VAULT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                originFilter === 'VAULT'
                  ? 'bg-white dark:bg-[#202638] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Mi Bóveda {vaultCount !== undefined ? `(${vaultCount})` : ''}
            </button>
          </div>

          {/* Advanced Filters Popover Button */}
          <VocabAdvancedFiltersPopover
            frequencyBandFilter={frequencyBandFilter}
            selectedDimension={selectedDimension}
            selectedPartOfSpeech={selectedPartOfSpeech}
            onSelectFrequencyBand={onSelectFrequencyBand}
            onSelectDimension={onSelectDimension}
            onSelectPartOfSpeech={onSelectPartOfSpeech}
            onResetAdvancedFilters={onResetAdvancedFilters}
          />

          {/* Sort Selector */}
          <Select
            selectedKey={sortBy}
            onSelectionChange={(key) => {
              if (key) onSortChange(key as 'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC');
            }}
            aria-label="Criterio de ordenación"
            className="w-36 sm:w-42"
          >
            <Select.Trigger className="h-9 px-2.5 text-xs bg-gray-50 hover:bg-gray-100 dark:bg-[#161B28] dark:hover:bg-[#1C2233] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-1.5 cursor-pointer transition-colors shadow-2xs">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <Select.Value className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" />
              </div>
              <Select.Indicator className="text-gray-400 shrink-0" />
            </Select.Trigger>
            <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] shadow-2xl min-w-[190px] z-50">
              <ListBox className="space-y-0.5 outline-none">
                <ListBox.Item
                  id="RECENT"
                  textValue="Más recientes"
                  className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200"
                >
                  Más recientes
                </ListBox.Item>
                <ListBox.Item
                  id="ALPHA_ASC"
                  textValue="Alfabético (A → Z)"
                  className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200"
                >
                  Alfabético (A → Z)
                </ListBox.Item>
                <ListBox.Item
                  id="ALPHA_DESC"
                  textValue="Alfabético (Z → A)"
                  className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200"
                >
                  Alfabético (Z → A)
                </ListBox.Item>
                <ListBox.Item
                  id="CEFR_ASC"
                  textValue="Nivel CEFR (A1 → C2)"
                  className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200"
                >
                  Nivel CEFR (A1 → C2)
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>
    </div>
  );
}
