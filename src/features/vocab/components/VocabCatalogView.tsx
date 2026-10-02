import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  BookmarkCheck,
  CheckCircle2,
  FolderOpen,
  ArrowUpDown,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button, Pagination, Select, ListBox } from '@heroui/react';
import { useVocabList, NewVocabPayload } from '../hooks/useVocabList';
import { VocabCard } from './VocabCard';
import { AddVocabModal } from './AddVocabModal';
import { VocabStatsBento } from './VocabStatsBento';
import { VocabDetailDrawer } from './VocabDetailDrawer';
import { VocabSkeletonGrid } from './VocabSkeletonCard';
import { PageHeader } from '@/shared/ui/PageHeader';
import { VocabItem } from '@/core/types/vocab';

export function VocabCatalogView() {
  const {
    words,
    totalCount,
    filteredCount,
    falseFriendsCount,
    hasActiveFilters,
    examplesMap,
    isLoading,
    searchQuery,
    selectedCefr,
    selectedDimension,
    onlyFalseFriends,
    sortBy,
    cefrCounts,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    setOnlyFalseFriends,
    setSortBy,
    resetFilters,
    addWord,
    updateWord,
    deleteWord,
  } = useVocabList();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWordForDrawer, setSelectedWordForDrawer] = useState<VocabItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search input ref & Ctrl+K shortcut
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pagination state
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCefr, selectedDimension, onlyFalseFriends, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCount);
  const paginatedWords = useMemo(
    () => words.slice(startIndex, endIndex),
    [words, startIndex, endIndex],
  );

  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (current > 3) {
      pages.push('ellipsis');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push('ellipsis');
    }
    pages.push(total);
    return pages;
  };

  const handleAddWord = async (payload: NewVocabPayload) => {
    const created = await addWord(payload);
    showToast(`¡Término "${payload.word}" agregado al catálogo con éxito!`);
    if (created) {
      setSelectedWordForDrawer(created);
    }
  };

  const handleDeleteWord = async (id: string): Promise<boolean> => {
    const ok = await deleteWord(id);
    if (ok) {
      showToast('Término eliminado del catálogo.');
      if (selectedWordForDrawer?.id === id) {
        setSelectedWordForDrawer(null);
      }
    }
    return ok;
  };

  const handleUpdateWord = async (
    id: string,
    updates: Partial<VocabItem>,
  ): Promise<VocabItem | null> => {
    const updated = await updateWord(id, updates);
    if (updated) {
      showToast('Término actualizado correctamente.');
      setSelectedWordForDrawer(updated);
    }
    return updated;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-3.5 px-4 rounded-2xl bg-indigo-600 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-200" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unified Page Header */}
      <PageHeader
        title="Banco de Vocabulario"
        description="Catálogo léxico con transcripción fonética IPA, familias semánticas y oraciones auténticas en contexto."
        icon={BookmarkCheck}
        actions={
          <Button
            onPress={() => setIsModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Palabra</span>
          </Button>
        }
      />

      {/* Vocab Stats Bento Mini-Dashboard */}
      <VocabStatsBento
        totalCount={totalCount}
        filteredCount={filteredCount}
        falseFriendsCount={falseFriendsCount}
        cefrCounts={cefrCounts}
        selectedCefr={selectedCefr}
        onlyFalseFriends={onlyFalseFriends}
        onSelectCefr={(cefr) => setSelectedCefr(cefr)}
        onToggleFalseFriends={() => setOnlyFalseFriends(!onlyFalseFriends)}
      />

      {/* Command & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input with Ctrl+K badge */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar término, traducción, fonética IPA o definición..."
              className="w-full pl-9 pr-16 py-2 rounded-xl bg-gray-50 dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200/60 dark:border-gray-700/60">
                  Ctrl+K
                </kbd>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sorting selector with HeroUI Select */}
            <Select
              selectedKey={sortBy}
              onSelectionChange={(key) => {
                if (key) setSortBy(key as 'RECENT' | 'ALPHA_ASC' | 'ALPHA_DESC' | 'CEFR_ASC');
              }}
              aria-label="Criterio de ordenación"
              className="w-44 sm:w-52"
            >
              <Select.Trigger className="h-9 px-3 text-xs bg-gray-50 dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <Select.Value className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" />
                </div>
                <Select.Indicator className="text-gray-400 shrink-0" />
              </Select.Trigger>
              <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] shadow-lg min-w-[200px] z-50">
                <ListBox className="space-y-0.5 outline-none">
                  <ListBox.Item id="RECENT" textValue="Más recientes" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Más recientes</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="ALPHA_ASC" textValue="Alfabético (A → Z)" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Alfabético (A → Z)</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="ALPHA_DESC" textValue="Alfabético (Z → A)" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Alfabético (Z → A)</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="CEFR_ASC" textValue="Nivel CEFR (A1 → C2)" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Nivel CEFR (A1 → C2)</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            {/* Dimension Filter with HeroUI Select */}
            <Select
              selectedKey={selectedDimension}
              onSelectionChange={(key) => {
                if (key) setSelectedDimension(key as string);
              }}
              aria-label="Filtrar por dimensión léxica"
              className="w-48 sm:w-56"
            >
              <Select.Trigger className="h-9 px-3 text-xs bg-gray-50 dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] rounded-xl flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-1.5 truncate">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <Select.Value className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate" />
                </div>
                <Select.Indicator className="text-gray-400 shrink-0" />
              </Select.Trigger>
              <Select.Popover className="p-1 rounded-xl bg-white dark:bg-[#161B28] border border-gray-200/80 dark:border-white/[0.08] shadow-lg min-w-[210px] z-50">
                <ListBox className="space-y-0.5 outline-none">
                  <ListBox.Item id="ALL" textValue="Todas las Dimensiones" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Todas las Dimensiones</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="CONTENT" textValue="Contenido Léxico" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Contenido Léxico</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="FUNCTION" textValue="Palabras Funcionales" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Palabras Funcionales</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="CHUNK" textValue="Expresiones / Chunks" className="px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-200 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 focus:outline-none flex items-center justify-between">
                    <span>Expresiones / Chunks</span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Rendering: Grid vs List */}
      {isLoading ? (
        <VocabSkeletonGrid count={6} />
      ) : words.length === 0 ? (
        <div className="p-14 rounded-3xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 mx-auto flex items-center justify-center">
            {totalCount > 0 && hasActiveFilters ? <FolderOpen className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-sans">
            {totalCount > 0 && hasActiveFilters ? 'No se encontraron palabras con estos filtros' : 'Catálogo de vocabulario vacío'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {totalCount > 0 && hasActiveFilters
              ? 'Prueba modificando el término de búsqueda o desactivando el filtro de nivel CEFR o falsos amigos.'
              : 'Empieza a registrar palabras o expresiones en inglés para enriquecer tu léxico con fonética IPA y oraciones auténticas.'}
          </p>

          <div className="pt-2 flex items-center justify-center gap-2">
            {totalCount > 0 && hasActiveFilters ? (
              <Button
                onPress={resetFilters}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </Button>
            ) : (
              <Button
                onPress={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Primera Palabra</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>
              Mostrando <strong className="text-gray-700 dark:text-gray-200 font-sans">{filteredCount === 0 ? 0 : `${startIndex + 1}–${endIndex}`}</strong> de{' '}
              <strong className="text-gray-700 dark:text-gray-200 font-sans">{filteredCount}</strong> términos
              {filteredCount !== totalCount && (
                <span className="text-gray-400"> (total: {totalCount})</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedWords.map((item) => (
              <VocabCard
                key={item.id}
                vocab={item}
                examples={examplesMap[item.id]}
                onSelectWord={(word) => setSelectedWordForDrawer(word)}
              />
            ))}
          </div>

          {/* HeroUI Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
              <Pagination size="sm">
                <Pagination.Summary className="text-xs text-gray-500 dark:text-gray-400">
                  Página {safeCurrentPage} de {totalPages} ({filteredCount} {filteredCount === 1 ? 'palabra' : 'palabras'})
                </Pagination.Summary>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={safeCurrentPage <= 1}
                      onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <Pagination.PreviousIcon />
                      <span className="hidden sm:inline">Anterior</span>
                    </Pagination.Previous>
                  </Pagination.Item>

                  {getPageNumbers(safeCurrentPage, totalPages).map((p, idx) => {
                    if (p === 'ellipsis') {
                      return (
                        <Pagination.Item key={`ellipsis-${idx}`}>
                          <Pagination.Ellipsis />
                        </Pagination.Item>
                      );
                    }
                    return (
                      <Pagination.Item key={p}>
                        <Pagination.Link
                          isActive={p === safeCurrentPage}
                          onPress={() => setCurrentPage(p as number)}
                        >
                          {p}
                        </Pagination.Link>
                      </Pagination.Item>
                    );
                  })}

                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={safeCurrentPage >= totalPages}
                      onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Add Word Modal */}
      <AddVocabModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddWord={handleAddWord}
      />

      {/* Side Sheet Detail Drawer (Lexical Inspector) */}
      <VocabDetailDrawer
        vocab={selectedWordForDrawer}
        isOpen={Boolean(selectedWordForDrawer)}
        onClose={() => setSelectedWordForDrawer(null)}
        examples={selectedWordForDrawer ? examplesMap[selectedWordForDrawer.id] : []}
        onDeleteWord={handleDeleteWord}
        onUpdateWord={handleUpdateWord}
      />
    </div>
  );
}
