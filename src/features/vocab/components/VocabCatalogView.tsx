import { useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  BookmarkCheck,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { useVocabList, NewVocabPayload } from '../hooks/useVocabList';
import { VocabCard } from './VocabCard';
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
    cefrCounts,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    addWord,
  } = useVocabList();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleAddWord = async (payload: NewVocabPayload) => {
    await addWord(payload);
    setSuccessToast(`¡Palabra "${payload.word}" agregada exitosamente!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const cefrLevels = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-white/80 hover:text-white cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <BookmarkCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Banco de Vocabulario
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tu catálogo personal de palabras aprendidas con fonética IPA, familias y ejemplos reales.
              </p>
            </div>
          </div>

          {/* CEFR Distribution Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-semibold text-gray-400 mr-1">Distribución:</span>
            {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
              <Chip
                key={lvl}
                size="sm"
                className="bg-gray-100 dark:bg-gray-800/80 text-[11px] text-gray-700 dark:text-gray-300 font-mono"
              >
                <Chip.Label>
                  {lvl}: <strong className="text-indigo-600 dark:text-indigo-400">{cefrCounts[lvl] ?? 0}</strong>
                </Chip.Label>
              </Chip>
            ))}
          </div>
        </div>

        {/* Action Button: Add Word */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Palabra</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palabra en inglés, traducción o definición..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* CEFR Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] font-semibold text-gray-400 mr-1 shrink-0">Nivel:</span>
          {cefrLevels.map((lvl) => {
            const isSelected = selectedCefr === lvl;
            const count = lvl === 'ALL' ? totalCount : cefrCounts[lvl] ?? 0;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {lvl === 'ALL' ? 'Todos' : lvl} ({count})
              </button>
            );
          })}
        </div>

        {/* Dimension Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700/80 text-xs text-gray-700 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todas las Dimensiones</option>
            <option value="CONTENT">Contenido Léxico</option>
            <option value="FUNCTION">Palabras Funcionales</option>
            <option value="CHUNK">Chunks / Expresiones</option>
          </select>
        </div>
      </div>

      {/* Vocab Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando vocabulario...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 text-center space-y-3">
          <FolderOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No se encontraron palabras
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery || selectedCefr !== 'ALL' || selectedDimension !== 'ALL'
              ? 'Prueba ajustando los filtros de búsqueda o el nivel CEFR seleccionado.'
              : 'Tu catálogo de vocabulario está vacío. Haz clic en "Agregar Palabra" para registrar tu primera palabra.'}
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Agregar Primera Palabra
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <span>
              Mostrando <strong>{filteredCount}</strong> de <strong>{totalCount}</strong> palabras
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {words.map((item) => (
              <VocabCard
                key={item.id}
                vocab={item}
                examples={examplesMap[item.id]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal for adding word */}
      <AddVocabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddWord={handleAddWord}
      />
    </div>
  );
}
