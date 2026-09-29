import { Sparkles, BookOpen, Search, ArrowRight, Layers } from 'lucide-react';
import { useSrsSession } from '../hooks/useSrsSession';
import { SrsCardDisplay } from './SrsCardDisplay';
import { useAudio } from '@/shared/hooks/useAudio';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export interface SrsReviewSessionProps {
  onNavigateTab?: (tab: string) => void;
}

export function SrsReviewSession({ onNavigateTab }: SrsReviewSessionProps) {
  const { audioService } = useAudio();
  const {
    vocabList,
    selectedVocab,
    availableContexts,
    currentContext,
    srsCard,
    searchQuery,
    showAnswer,
    reviewCount,
    filteredVocab,
    previewIntervals,
    setSearchQuery,
    setShowAnswer,
    handleSelectVocab,
    handleRotateContext,
    handleRate,
    isReady,
  } = useSrsSession();

  // 1. Database still connecting
  if (!isReady) {
    return <LoadingSpinner label="Conectando con la base de datos local SQLite..." />;
  }

  // 2. Empty state: database ready but no vocab registered yet
  if (vocabList.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-[#131722] rounded-2xl p-6 border border-gray-200/80 dark:border-gray-800/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                SRS & Fonología Conectada (FSRS v5)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Repaso espaciado con algoritmo matemático FSRS v5 y contexto cloze dinámico.
              </p>
            </div>
          </div>
        </div>

        {/* Empty State Banner */}
        <div className="p-12 rounded-2xl bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800/80 text-center space-y-4 max-w-2xl mx-auto shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Layers className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Tu Mazo de Repaso está Vacío
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 leading-relaxed">
              No tienes tarjetas ni vocabulario registrado en tu base de datos local.
              Agrega tus primeras palabras desde el Catálogo de Vocabulario o extráelas con 1-clic mientras lees en el Lector Graduado.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('vocab')}
                className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Ir al Catálogo de Vocabulario</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal active session when vocab words exist
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Active Card */}
      <div className="lg:col-span-7 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Sesión Activa FSRS & Fonología Conectada
            </h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Repasos en sesión: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{reviewCount}</strong>
          </span>
        </div>

        {selectedVocab && (
          <SrsCardDisplay
            selectedVocab={selectedVocab}
            currentContext={currentContext}
            availableContexts={availableContexts}
            srsCard={srsCard}
            showAnswer={showAnswer}
            previewIntervals={previewIntervals}
            onRotateContext={handleRotateContext}
            onShowAnswer={() => setShowAnswer(true)}
            onRate={handleRate}
            audioService={audioService}
          />
        )}
      </div>

      {/* Right Column: Mini Vocab Selector */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
              Selección Rápida de Vocabulario
            </h3>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar término o traducción..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-800 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="bg-white dark:bg-[#131722] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[500px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60">
          {filteredVocab.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectVocab(item)}
              className={`p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors flex items-center justify-between ${
                selectedVocab?.id === item.id ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''
              }`}
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    {item.word}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {item.cefrLevel}
                  </span>
                  {item.isFalseFriend && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      Falso Amigo
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.translationEs}
                </div>
              </div>

              <span
                className="text-xs font-mono text-gray-400"
                style={{ fontFamily: 'var(--font-phonetic)' }}
              >
                /{item.ipaGeneralAmerican}/
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
