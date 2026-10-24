import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  FolderOpen,
  Sparkles,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { Button, Pagination } from '@heroui/react';
import { useVocabList, NewVocabPayload } from '../hooks/useVocabList';
import { VocabCard } from './VocabCard';
import { AddVocabModal } from './AddVocabModal';
import { ActiveFilterChips } from './ActiveFilterChips';
import { VocabDetailDrawer } from './VocabDetailDrawer';
import { VocabSkeletonGrid } from './VocabSkeletonCard';
import { VocabStatsBento } from './VocabStatsBento';
import { VocabItem, VocabSense } from '@/core/types/vocab';
import {
  VocabHeader,
  VocabSearchToolbar,
  VocabSelectionBar,
  VocabGoalsModal,
  VocabConfirmModal,
} from './catalog-top';

export function VocabCatalogView() {
  const {
    words,
    allWords,
    totalCount,
    coreCount,
    vaultCount,
    filteredCount,
    hasActiveFilters,
    examplesMap,
    isLoading,
    searchQuery,
    selectedCefr,
    selectedDimension,
    originFilter,
    frequencyBandFilter,
    masteryStatusFilter,
    selectedPartOfSpeech,
    accentPreference,
    sortBy,
    cefrCounts,
    setSearchQuery,
    setSelectedCefr,
    setSelectedDimension,
    setOriginFilter,
    setFrequencyBandFilter,
    setMasteryStatusFilter,
    setSelectedPartOfSpeech,
    setAccentPreference,
    setSortBy,
    resetFilters,
    activateWord,
    activatePhrase,
    batchActivate,
    getSuggestions,
    addWord,
    addMultipleWords,
    updateWord,
    deleteWord,
    deleteMultipleWords,
    clearAllWords,
  } = useVocabList();

  // Modals & Navigation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [selectedWordForDrawer, setSelectedWordForDrawer] = useState<VocabItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    return getSuggestions(searchQuery, 6);
  }, [searchQuery, getSuggestions]);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Clear all words modal state
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Batch activate by goals modal state
  const [isBatchActivating, setIsBatchActivating] = useState(false);

  // Sequential drawer navigation among filtered words
  const currentDrawerIndex = useMemo(() => {
    if (!selectedWordForDrawer) return -1;
    return words.findIndex((w) => w.id === selectedWordForDrawer.id);
  }, [selectedWordForDrawer, words]);

  const hasPrevWord = currentDrawerIndex > 0;
  const hasNextWord = currentDrawerIndex >= 0 && currentDrawerIndex < words.length - 1;

  const handleNavigateWord = (direction: 'prev' | 'next') => {
    if (currentDrawerIndex < 0) return;
    const targetIndex = direction === 'prev' ? currentDrawerIndex - 1 : currentDrawerIndex + 1;
    if (targetIndex >= 0 && targetIndex < words.length) {
      setSelectedWordForDrawer(words[targetIndex]);
    }
  };

  // Pagination state
  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCefr,
    selectedDimension,
    originFilter,
    frequencyBandFilter,
    masteryStatusFilter,
    selectedPartOfSpeech,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredCount);
  const paginatedWords = useMemo(
    () => words.slice(startIndex, endIndex),
    [words, startIndex, endIndex],
  );

  const isAllPageSelected = useMemo(
    () => paginatedWords.length > 0 && paginatedWords.every((w) => selectedIds.has(w.id)),
    [paginatedWords, selectedIds],
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddWord = async (payload: NewVocabPayload) => {
    const created = await addWord(payload);
    showToast(`¡Término "${payload.word}" agregado al catálogo con éxito!`);
    if (created) {
      setSelectedWordForDrawer(created);
    }
  };

  const handleAddMultipleWords = async (payloads: NewVocabPayload[]) => {
    const createdList = await addMultipleWords(payloads);
    if (createdList.length > 0) {
      showToast(`¡Se agregaron ${createdList.length} acepciones al catálogo con éxito!`);
      setSelectedWordForDrawer(createdList[0]);
    }
  };

  const handleCreateCardFromSense = async (
    sense: VocabSense,
    baseWord: VocabItem,
  ): Promise<VocabItem | null> => {
    const payload: NewVocabPayload = {
      word: baseWord.word,
      translationEs: sense.translationEs,
      definitionEn: sense.definitionEn || sense.translationEs,
      ipaGeneralAmerican: baseWord.ipaGeneralAmerican,
      cefrLevel: sense.cefrLevel || baseWord.cefrLevel || 'B1',
      partOfSpeech: sense.partOfSpeech || baseWord.partOfSpeech,
      grammaticalDimension: baseWord.grammaticalDimension,
      domainCategory: sense.domainCategory || 'Uso General',
      exampleSentenceEn: sense.exampleSentenceEn,
      exampleSentenceEs: sense.exampleSentenceEs,
      additionalExamples: sense.additionalExamples || [],
      isFalseFriend: baseWord.isFalseFriend,
      falseFriendNote: baseWord.falseFriendNote || undefined,
      verbTenses: baseWord.verbTensesJson,
      createSrsCard: true,
    };
    const created = await addWord(payload);
    if (created) {
      showToast(`¡Tarjeta independiente creada para "${created.word}" (${created.translationEs})!`);
      setSelectedWordForDrawer(created);
    }
    return created;
  };

  const handleActivateWord = async (id: string): Promise<VocabItem | null> => {
    const activated = await activateWord(id);
    if (activated) {
      showToast(`¡"${activated.word}" activado para repaso en el mazo FSRS!`);
      if (selectedWordForDrawer?.id === id) {
        setSelectedWordForDrawer(activated);
      }
    }
    return activated;
  };

  const handleActivatePhrase = async (phraseId: string): Promise<boolean> => {
    const ok = await activatePhrase(phraseId);
    if (ok) {
      showToast(`¡Verbo frasal activado para repaso en el mazo FSRS!`);
      if (selectedWordForDrawer?.id === phraseId) {
        setSelectedWordForDrawer((prev) => (prev ? { ...prev, masteryStatus: 'LEARNING' } : null));
      }
    }
    return ok;
  };

  const handleExecuteBatchActivate = async (
    target: 'TOP_500' | 'TOP_1000' | 'TOP_3000' | 'TOP_5000',
    count: number,
  ) => {
    try {
      setIsBatchActivating(true);
      const activatedCount = await batchActivate({
        frequencyBand: target,
        limit: count,
      });

      setIsGoalsModalOpen(false);
      if (activatedCount > 0) {
        showToast(
          `¡Se activaron ${activatedCount} nuevos términos de ${target.replace('_', ' ')} para estudio diario!`,
        );
      } else {
        showToast(`No se encontraron más términos inactivos en ${target.replace('_', ' ')}.`);
      }
    } finally {
      setIsBatchActivating(false);
    }
  };

  const handleDeleteWord = async (id: string): Promise<boolean> => {
    const ok = await deleteWord(id);
    if (ok) {
      showToast('Término eliminado del catálogo.');
      if (selectedWordForDrawer?.id === id) {
        setSelectedWordForDrawer(null);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
    return ok;
  };

  const toggleSelectWord = (vocab: VocabItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(vocab.id)) {
        next.delete(vocab.id);
      } else {
        next.add(vocab.id);
      }
      if (next.size > 0 && !isSelectionMode) {
        setIsSelectionMode(true);
      }
      return next;
    });
  };

  const handleSelectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedWords.forEach((w) => next.delete(w.id));
      } else {
        paginatedWords.forEach((w) => next.add(w.id));
      }
      return next;
    });
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsBulkDeleting(true);
      const idsToDelete = Array.from(selectedIds);
      const ok = await deleteMultipleWords(idsToDelete);
      if (ok) {
        showToast(
          `${idsToDelete.length} ${idsToDelete.length === 1 ? 'término eliminado' : 'términos eliminados'} del catálogo.`,
        );
        if (selectedWordForDrawer && selectedIds.has(selectedWordForDrawer.id)) {
          setSelectedWordForDrawer(null);
        }
        handleClearSelection();
        setShowBulkDeleteConfirm(false);
      } else {
        showToast('Error al eliminar los términos seleccionados.');
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      setIsClearingAll(true);
      const ok = await clearAllWords();
      if (ok) {
        showToast('Todas las palabras del banco de vocabulario han sido eliminadas.');
        setSelectedWordForDrawer(null);
        handleClearSelection();
        setShowClearAllConfirm(false);
      } else {
        showToast('Error al vaciar el banco de vocabulario.');
      }
    } finally {
      setIsClearingAll(false);
    }
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

  const handleResetAdvancedFilters = () => {
    setFrequencyBandFilter('ALL');
    setSelectedDimension('ALL');
    setSelectedPartOfSpeech('ALL');
  };

  return (
    <div className="space-y-5">
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

      {/* 1. Header Modular: Título, Conmutador Directo IPA (US/UK), Menú Catálogo y CTA */}
      <VocabHeader
        title="Banco de Vocabulario"
        description="Catálogo léxico con transcripción fonética IPA, familias semánticas y oraciones auténticas en contexto."
        accentPreference={accentPreference}
        onToggleAccent={() => setAccentPreference(accentPreference === 'US' ? 'UK' : 'US')}
        onAddWordClick={() => setIsModalOpen(true)}
        onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={() => {
          if (isSelectionMode) {
            handleClearSelection();
          } else {
            setIsSelectionMode(true);
          }
        }}
        hasWords={words.length > 0}
        onOpenClearAllModal={() => setShowClearAllConfirm(true)}
      />

      {/* 2. Panel Bento: Inventario Léxico y Distribución CEFR */}
      <VocabStatsBento
        totalCount={totalCount}
        filteredCount={filteredCount}
        cefrCounts={cefrCounts}
        selectedCefr={selectedCefr}
        onSelectCefr={(cefr) => setSelectedCefr(cefr)}
        showFalseFriends={false}
      />

      {/* 3. Consola Unificada de Búsqueda y Filtros */}
      <div className="space-y-2">
        <VocabSearchToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          onShowSuggestionsChange={setShowSuggestions}
          onSelectSuggestion={(word) => setSearchQuery(word)}
          onActivateSuggestionWord={handleActivateWord}
          originFilter={originFilter}
          onOriginChange={setOriginFilter}
          coreCount={coreCount}
          vaultCount={vaultCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          frequencyBandFilter={frequencyBandFilter}
          selectedDimension={selectedDimension}
          selectedPartOfSpeech={selectedPartOfSpeech}
          onSelectFrequencyBand={setFrequencyBandFilter}
          onSelectDimension={setSelectedDimension}
          onSelectPartOfSpeech={setSelectedPartOfSpeech}
          onResetAdvancedFilters={handleResetAdvancedFilters}
        />

        {/* Removable Active Filter Chips */}
        {hasActiveFilters && (
          <div className="px-1">
            <ActiveFilterChips
              searchQuery={searchQuery}
              selectedCefr={selectedCefr}
              selectedDimension={selectedDimension}
              frequencyBandFilter={frequencyBandFilter}
              masteryStatusFilter={masteryStatusFilter}
              onlyFalseFriends={false}
              selectedPartOfSpeech={selectedPartOfSpeech}
              originFilter={originFilter}
              onClearSearch={() => setSearchQuery('')}
              onClearCefr={() => setSelectedCefr('ALL')}
              onClearDimension={() => setSelectedDimension('ALL')}
              onClearFrequencyBand={() => setFrequencyBandFilter('ALL')}
              onClearMasteryStatus={() => setMasteryStatusFilter('ALL')}
              onClearFalseFriends={() => {}}
              onClearPartOfSpeech={() => setSelectedPartOfSpeech('ALL')}
              onClearOrigin={() => setOriginFilter('ALL')}
              onResetAll={resetFilters}
            />
          </div>
        )}
      </div>

      {/* 4. Barra de Acciones Flotante para Selección Múltiple */}
      {selectedIds.size > 0 && (
        <VocabSelectionBar
          selectedCount={selectedIds.size}
          isAllPageSelected={isAllPageSelected}
          onToggleSelectAllPage={handleSelectAllCurrentPage}
          onClearSelection={handleClearSelection}
          onConfirmBulkDelete={() => setShowBulkDeleteConfirm(true)}
        />
      )}

      {/* 5. Renderizado del Contenido: Skeletons vs Empty State vs Grid */}
      {isLoading ? (
        <VocabSkeletonGrid count={6} />
      ) : words.length === 0 ? (
        <div className="p-14 rounded-3xl bg-white dark:bg-[#121622] border border-gray-200/80 dark:border-white/[0.08] text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 mx-auto flex items-center justify-center">
            {totalCount > 0 && hasActiveFilters ? (
              <FolderOpen className="w-7 h-7" />
            ) : (
              <Sparkles className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-sans">
            {totalCount > 0 && hasActiveFilters
              ? 'No se encontraron palabras con estos filtros'
              : 'Catálogo de vocabulario vacío'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {totalCount > 0 && hasActiveFilters
              ? 'Prueba modificando el término de búsqueda o restableciendo los filtros de nivel CEFR o dominio.'
              : 'Explora los 3.500 lemas de alta frecuencia precargados o registra términos en tu bóveda personal.'}
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
              Mostrando{' '}
              <strong className="text-gray-700 dark:text-gray-200 font-sans">
                {filteredCount === 0 ? 0 : `${startIndex + 1}–${endIndex}`}
              </strong>{' '}
              de <strong className="text-gray-700 dark:text-gray-200 font-sans">{filteredCount}</strong>{' '}
              términos
              {filteredCount !== totalCount && (
                <span className="text-gray-400"> (inventario total: {totalCount})</span>
              )}
            </span>
          </div>

          {/* Vocab Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedWords.map((item) => (
              <VocabCard
                key={item.id}
                vocab={item}
                examples={examplesMap[item.id]}
                onSelectWord={(word) => setSelectedWordForDrawer(word)}
                onActivateWord={handleActivateWord}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelectWord}
                accentPreference={accentPreference}
              />
            ))}
          </div>

          {/* HeroUI Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
              <Pagination size="sm">
                <Pagination.Summary className="text-xs text-gray-500 dark:text-gray-400">
                  Página {safeCurrentPage} de {totalPages} ({filteredCount}{' '}
                  {filteredCount === 1 ? 'palabra' : 'palabras'})
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
        onAddMultipleWords={handleAddMultipleWords}
        existingWords={allWords}
      />

      {/* Side Sheet Detail Drawer (Lexical Inspector) */}
      <VocabDetailDrawer
        vocab={selectedWordForDrawer}
        isOpen={Boolean(selectedWordForDrawer)}
        onClose={() => setSelectedWordForDrawer(null)}
        examples={selectedWordForDrawer ? examplesMap[selectedWordForDrawer.id] : []}
        allWords={allWords}
        onSelectWord={(targetVocab) => setSelectedWordForDrawer(targetVocab)}
        onCreateCardFromSense={handleCreateCardFromSense}
        onDeleteWord={handleDeleteWord}
        onUpdateWord={handleUpdateWord}
        onActivateWord={handleActivateWord}
        onActivatePhrase={handleActivatePhrase}
        onNavigateWord={handleNavigateWord}
        hasPrev={hasPrevWord}
        hasNext={hasNextWord}
        accentPreference={accentPreference}
      />

      {/* Batch Activation by Goals Modal */}
      <VocabGoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        onExecuteBatchActivate={handleExecuteBatchActivate}
        isBatchActivating={isBatchActivating}
      />

      {/* Bulk Delete Confirmation Modal */}
      <VocabConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`¿Eliminar ${selectedIds.size} ${selectedIds.size === 1 ? 'término' : 'términos'}?`}
        description="Esta acción eliminará los términos seleccionados de tu catálogo, así como todas sus tarjetas de memoria SRS asociadas."
        confirmText={`Sí, eliminar ${selectedIds.size}`}
        isDestructive={true}
        isLoading={isBulkDeleting}
      />

      {/* Clear All Confirmation Modal */}
      <VocabConfirmModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={handleConfirmClearAll}
        title="¿Borrar todas las palabras del banco?"
        description="Esta acción eliminará todas las palabras creadas en tu bóveda personal, restablecerá los lemas del corpus a su estado inactivo y suprimirá todas las tarjetas de memoria SRS y ejemplos asociados. Esta acción no se puede deshacer."
        confirmText="Sí, borrar todo"
        isDestructive={true}
        isLoading={isClearingAll}
      />
    </div>
  );
}
