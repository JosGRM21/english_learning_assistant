import { useRef, useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  X,
  RotateCcw,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Select, ListBox } from '@heroui/react';

export interface VocabAdvancedFiltersPopoverProps {
  frequencyBandFilter: string;
  selectedDimension: string;
  selectedRegister: string;
  selectedPartOfSpeech: string;
  onSelectFrequencyBand: (band: string) => void;
  onSelectDimension: (dim: string) => void;
  onSelectRegister: (reg: string) => void;
  onSelectPartOfSpeech: (pos: string) => void;
  onResetAdvancedFilters: () => void;
}

export function VocabAdvancedFiltersPopover({
  frequencyBandFilter,
  selectedDimension,
  selectedRegister,
  selectedPartOfSpeech,
  onSelectFrequencyBand,
  onSelectDimension,
  onSelectRegister,
  onSelectPartOfSpeech,
  onResetAdvancedFilters,
}: VocabAdvancedFiltersPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate active advanced filters count
  const activeCount = [
    frequencyBandFilter !== 'ALL',
    selectedDimension !== 'ALL',
    selectedRegister !== 'ALL',
    selectedPartOfSpeech !== 'ALL',
  ].filter(Boolean).length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Popover Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 rounded-xl border transition-all flex items-center gap-2 cursor-pointer text-xs font-semibold shadow-2xs select-none ${
          activeCount > 0 || isOpen
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20'
            : 'bg-gray-50 hover:bg-gray-100 dark:bg-[#161B28] dark:hover:bg-[#1C2233] text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/[0.08]'
        }`}
        title="Filtros analíticos avanzados (Frecuencia, Dimensión, Registro y Categoría)"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>Filtros</span>

        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
            {activeCount}
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Popover Content Panel */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 z-50 w-80 sm:w-96 p-4 rounded-2xl bg-white dark:bg-[#141824] border border-gray-200 dark:border-white/[0.1] shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                  Filtros Avanzados
                </h4>
                <p className="text-[10px] text-gray-400">
                  Refina por propiedades sintácticas y de frecuencia
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={onResetAdvancedFilters}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Restablecer estos 4 filtros"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Limpiar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filters Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {/* 1. Banda de Frecuencia */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-500" />
                <span>Banda de Frecuencia</span>
              </label>
              <Select
                selectedKey={frequencyBandFilter}
                onSelectionChange={(key) => {
                  if (key) onSelectFrequencyBand(key as string);
                }}
                aria-label="Filtrar por banda de frecuencia"
                className="w-full"
              >
                <Select.Trigger className="h-8 px-2.5 text-xs bg-gray-50 dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-1.5 cursor-pointer hover:border-indigo-400 transition-colors">
                  <Select.Value className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" />
                  <Select.Indicator className="text-gray-400 shrink-0" />
                </Select.Trigger>
                <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] shadow-xl min-w-[170px] z-60">
                  <ListBox className="space-y-0.5 outline-none">
                    <ListBox.Item id="ALL" textValue="Todas las Bandas" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Todas las Bandas
                    </ListBox.Item>
                    <ListBox.Item id="TOP_500" textValue="Top 500 Esencial" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Top 500 Esencial
                    </ListBox.Item>
                    <ListBox.Item id="TOP_1000" textValue="Top 1000 Consolidación" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Top 1000 Consolidación
                    </ListBox.Item>
                    <ListBox.Item id="TOP_3000" textValue="Top 3000 Fluidez" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Top 3000 Fluidez
                    </ListBox.Item>
                    <ListBox.Item id="TOP_5000" textValue="Top 5000 Avanzado" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Top 5000 Avanzado
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {/* 2. Dimensión Léxica */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-indigo-500" />
                <span>Dimensión Léxica</span>
              </label>
              <Select
                selectedKey={selectedDimension}
                onSelectionChange={(key) => {
                  if (key) onSelectDimension(key as string);
                }}
                aria-label="Filtrar por dimensión léxica"
                className="w-full"
              >
                <Select.Trigger className="h-8 px-2.5 text-xs bg-gray-50 dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-1.5 cursor-pointer hover:border-indigo-400 transition-colors">
                  <Select.Value className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" />
                  <Select.Indicator className="text-gray-400 shrink-0" />
                </Select.Trigger>
                <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] shadow-xl min-w-[190px] z-60">
                  <ListBox className="space-y-0.5 outline-none">
                    <ListBox.Item id="ALL" textValue="Todas las Dimensiones" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Todas las Dimensiones
                    </ListBox.Item>
                    <ListBox.Item id="CONTENT" textValue="Contenido Léxico" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Contenido Léxico
                    </ListBox.Item>
                    <ListBox.Item id="FUNCTION" textValue="Palabras Funcionales" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Palabras Funcionales
                    </ListBox.Item>
                    <ListBox.Item id="CHUNK" textValue="Expresiones / Chunks" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Expresiones / Chunks
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {/* 3. Registro de Uso */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Filter className="w-3 h-3 text-indigo-500" />
                <span>Registro de Uso</span>
              </label>
              <Select
                selectedKey={selectedRegister}
                onSelectionChange={(key) => {
                  if (key) onSelectRegister(key as string);
                }}
                aria-label="Filtrar por registro de uso"
                className="w-full"
              >
                <Select.Trigger className="h-8 px-2.5 text-xs bg-gray-50 dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-1.5 cursor-pointer hover:border-indigo-400 transition-colors">
                  <Select.Value className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" />
                  <Select.Indicator className="text-gray-400 shrink-0" />
                </Select.Trigger>
                <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] shadow-xl min-w-[170px] z-60">
                  <ListBox className="space-y-0.5 outline-none">
                    <ListBox.Item id="ALL" textValue="Todos los Registros" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Todos los Registros
                    </ListBox.Item>
                    <ListBox.Item id="NEUTRAL" textValue="Neutral" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Neutral
                    </ListBox.Item>
                    <ListBox.Item id="FORMAL" textValue="Formal" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Formal
                    </ListBox.Item>
                    <ListBox.Item id="INFORMAL" textValue="Informal" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Informal
                    </ListBox.Item>
                    <ListBox.Item id="ACADEMIC" textValue="Académico" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Académico
                    </ListBox.Item>
                    <ListBox.Item id="SLANG" textValue="Slang / Coloquial" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Slang / Coloquial
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {/* 4. Categoría Gramatical */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-500" />
                <span>Categoría Gramatical</span>
              </label>
              <Select
                selectedKey={selectedPartOfSpeech}
                onSelectionChange={(key) => {
                  if (key) onSelectPartOfSpeech(key as string);
                }}
                aria-label="Filtrar por categoría gramatical"
                className="w-full"
              >
                <Select.Trigger className="h-8 px-2.5 text-xs bg-gray-50 dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-1.5 cursor-pointer hover:border-indigo-400 transition-colors">
                  <Select.Value className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" />
                  <Select.Indicator className="text-gray-400 shrink-0" />
                </Select.Trigger>
                <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#181D2D] border border-gray-200/80 dark:border-white/[0.08] shadow-xl min-w-[170px] z-60">
                  <ListBox className="space-y-0.5 outline-none">
                    <ListBox.Item id="ALL" textValue="Todas las Categorías" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Todas las Categorías
                    </ListBox.Item>
                    <ListBox.Item id="VERB" textValue="Verbo" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Verbo
                    </ListBox.Item>
                    <ListBox.Item id="NOUN" textValue="Sustantivo" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Sustantivo
                    </ListBox.Item>
                    <ListBox.Item id="ADJECTIVE" textValue="Adjetivo" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Adjetivo
                    </ListBox.Item>
                    <ListBox.Item id="ADVERB" textValue="Adverbio" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Adverbio
                    </ListBox.Item>
                    <ListBox.Item id="PREPOSITION" textValue="Preposición" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Preposición
                    </ListBox.Item>
                    <ListBox.Item id="CONJUNCTION" textValue="Conjunción" className="px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200">
                      Conjunción
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
