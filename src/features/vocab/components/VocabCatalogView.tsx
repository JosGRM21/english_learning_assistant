import { useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  BookmarkCheck,
  CheckCircle2,
  FolderOpen,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { useVocabList, NewVocabPayload } from '../hooks/useVocabList';
import { VocabCard } from './VocabCard';
import { VocabListView } from './VocabListView';
import { AddVocabModal } from './AddVocabModal';

export function VocabCatalogView() {
  const {
    words,
    totalCount,
    filteredCount,
    examplesMap,
    isLoading,
    searchQuery,
    selectedCefr,
    selectedDimension,
    sortBy,
    cefrCounts,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    setSortBy,
    addWord,
  } = useVocabList();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleAddWord = async (payload: NewVocabPayload) => {
    await addWord(payload);
    setSuccessToast(`¡Término "${payload.word}" añadido con éxito!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const cefrLevels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 px-4 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-white/80 hover:text-white cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header & Actions Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookmarkCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Banco de Vocabulario
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Catálogo léxico con transcripción fonética IPA, familias semánticas y oraciones auténticas en contexto.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* View mode toggle */}
          <div className="p-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Vista de cuadrícula con tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Vista compacta de lista y tabla"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Palabra</span>
          </Button>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/70 dark:border-gray-800/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por término en inglés, traducción, fonética o definición..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200/70 dark:border-gray-700/60 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sorting selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#161B28] border border-gray-200/70 dark:border-gray-700/60 rounded-xl px-2.5 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC')}
                className="bg-transparent border-none text-xs text-gray-700 dark:text-gray-300 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="RECENT">Más recientes</option>
                <option value="ALPHA_ASC">Alfabético (A → Z)</option>
                <option value="ALPHA_DESC">Alfabético (Z → A)</option>
                <option value="CEFR_ASC">Nivel CEFR (A1 → C2)</option>
              </select>
            </div>

            {/* Dimension Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#161B28] border border-gray-200/70 dark:border-gray-700/60 rounded-xl px-2.5 py-1 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedDimension}
                onChange={(e) => setSelectedDimension(e.target.value)}
                className="bg-transparent border-none text-xs text-gray-700 dark:text-gray-300 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Todas las Dimensiones</option>
                <option value="CONTENT">Contenido Léxico</option>
                <option value="FUNCTION">Palabras Funcionales</option>
                <option value="CHUNK">Expresiones / Chunks</option>
              </select>
            </div>
          </div>
        </div>

        {/* CEFR Segmented Filter Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 border-t border-gray-100 dark:border-gray-800/60">
          <span className="text-[11px] font-semibold text-gray-400 mr-1 shrink-0">Nivel CEFR:</span>
          {cefrLevels.map((lvl) => {
            const isSelected = selectedCefr === lvl;
            const count = lvl === 'ALL' ? totalCount : cefrCounts[lvl] ?? 0;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : lvl}
                <span className={`ml-1 text-[10px] opacity-75 font-mono`}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Rendering: Grid vs List */}
      {isLoading ? (
        <div className="p-16 text-center text-gray-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Cargando catálogo léxico...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="p-14 rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/70 dark:border-gray-800/80 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800/60 text-gray-400 mx-auto flex items-center justify-center">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No se encontraron palabras
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchQuery || selectedCefr !== 'ALL' || selectedDimension !== 'ALL'
              ? 'Prueba ajustando los filtros de búsqueda o el nivel CEFR seleccionado.'
              : 'Tu catálogo de vocabulario está vacío. Registra tu primera palabra para comenzar.'}
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Agregar Primera Palabra
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Mostrando <strong className="text-gray-700 dark:text-gray-200">{filteredCount}</strong> de{' '}
              <strong className="text-gray-700 dark:text-gray-200">{totalCount}</strong> términos
            </span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {words.map((item) => (
                <VocabCard
                  key={item.id}
                  vocab={item}
                  examples={examplesMap[item.id]}
                />
              ))}
            </div>
          ) : (
            <VocabListView
              words={words}
              examplesMap={examplesMap}
            />
          )}
        </div>
      )}

      {/* Add Word Modal */}
      <AddVocabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddWord={handleAddWord}
      />
    </div>
  );
}
