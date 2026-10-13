import React from 'react';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  ArrowRight,
  BookOpen,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ExternalLink,
  Layers,
  GraduationCap,
} from 'lucide-react';
import {
  useDefossilizationSession,
  DefossilizationFilter,
} from '../hooks/useDefossilizationSession';
import { FsrsGrade } from '@/core/types/srs';
import { AppTab } from '@/shared/constants/app-tabs';
import { ErrorContrastCard } from '@/shared/ui/ErrorContrastCard';

export interface DefossilizationStationViewProps {
  onNavigateTab?: (tab: AppTab) => void;
}

export function DefossilizationStationView({ onNavigateTab }: DefossilizationStationViewProps) {
  const {
    activeFilter,
    filteredItems,
    currentItem,
    currentIndex,
    stats,
    isLoading,
    userAnswer,
    selectedChunks,
    availableChunks,
    isAnswerChecked,
    isCorrect,
    showExplanation,
    isPlayingTts,
    setUserAnswer,
    handleSelectChunk,
    handleUnselectChunk,
    checkAnswer,
    applyFsrsGrade,
    playTts,
    nextItem,
    previousItem,
    handleFilterChange,
    setShowExplanation,
    refreshData,
  } = useDefossilizationSession();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isAnswerChecked && userAnswer.trim().length > 0) {
      e.preventDefault();
      checkAnswer();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER */}
      {/* ========================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200/80 dark:border-gray-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Superación de Hábitos e Interferencias
              </span>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Corrector de Hábitos
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Practica y afianza las estructuras correctas en inglés para dejar atrás los errores frecuentes y la traducción literal.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Recargar datos"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('writing')}
              className="px-4 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ir al Taller de Redacción</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. STATS BENTO GRID */}
      {/* ========================================================================= */}
      <section aria-label="Métricas de hábitos y errores" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Due */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-5 border border-indigo-100 dark:border-indigo-950/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>Para Repasar Hoy</span>
            <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white font-mono">
            {stats.dueCount}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            Ejercicios sugeridos para hoy
          </p>
        </div>

        {/* Card 2: Fossilized */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-5 border border-amber-100 dark:border-amber-950/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span>Errores Frecuentes</span>
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.fossilized}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            2 o más repeticiones detectadas
          </p>
        </div>

        {/* Card 3: In Learning */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span>En Práctica</span>
            <div className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white font-mono">
            {stats.learning}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            En proceso de mejora
          </p>
        </div>

        {/* Card 4: Internalized */}
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-5 border border-emerald-100 dark:border-emerald-950/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Dominados</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.internalized}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            Estructuras aprendidas con éxito
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FILTER TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'DUE', label: 'Para Repasar Hoy', count: stats.dueCount },
            { id: 'FOSSILIZED', label: 'Errores Frecuentes', count: stats.fossilized },
            { id: 'LEARNING', label: 'En Práctica', count: stats.learning },
            { id: 'INTERNALIZED', label: 'Dominados', count: stats.internalized },
            { id: 'ALL', label: 'Todos los Errores', count: stats.total },
          ] as { id: DefossilizationFilter; label: string; count: number }[]
        ).map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => handleFilterChange(filter.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-white dark:bg-[#131722] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/80 dark:border-gray-800'
              }`}
            >
              <span>{filter.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. PRACTICE ARENA OR EMPTY STATE */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-12 text-center border border-gray-200/80 dark:border-gray-800">
          <Sparkles className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs text-gray-500">Cargando ejercicios...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-12 text-center border border-gray-200/80 dark:border-gray-800 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {activeFilter === 'DUE'
                ? '¡No tienes ejercicios pendientes para hoy!'
                : 'No se encontraron errores en esta categoría.'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              {activeFilter === 'DUE'
                ? 'Tus expresiones y estructuras están al día. Practica una nueva redacción para identificar nuevas áreas de mejora.'
                : 'Explora otras pestañas o realiza nuevos ejercicios en el Taller de Redacción.'}
            </p>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('writing')}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Redactar en el Taller de Redacción</span>
            </button>
          )}
        </div>
      ) : currentItem ? (
        <div className="space-y-6">
          {/* Fossilized Warning Alert */}
          {(currentItem.isFossilizedAlert || currentItem.timesRecidivist >= 2) && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  ¡Atención: Error Frecuente Detectado!
                </span>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-sans">
                  Has repetido esta estructura en {currentItem.timesRecidivist} ocasiones distintas.
                  Este ejercicio te ayuda a afianzar la forma natural en inglés y evitar traducir directamente del español.
                </p>
              </div>
            </div>
          )}

          {/* Practice Exercise Card */}
          <section
            aria-label="Ejercicio de práctica"
            className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-6"
          >
            {/* Header: Item Index & Taxonomy */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800/80">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono text-xs font-bold">
                  {currentIndex + 1} / {filteredItems.length}
                </span>

                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] font-mono font-semibold">
                  {currentItem.taxonomyCode}
                </span>

                {currentItem.isL1SpanishTransfer && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-semibold">
                    Influencia del Español
                  </span>
                )}

                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
                    currentItem.masteryStatus === 'INTERNALIZED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : currentItem.masteryStatus === 'RECIDIVIST'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  {currentItem.masteryStatus === 'INTERNALIZED'
                    ? 'Dominado'
                    : currentItem.masteryStatus === 'RECIDIVIST'
                    ? 'Error Frecuente'
                    : 'En Práctica'}
                </span>
              </div>

              {/* Navigation stepper buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={previousItem}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 disabled:opacity-30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextItem}
                  disabled={currentIndex >= filteredItems.length - 1}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 disabled:opacity-30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Contrast strip */}
            <ErrorContrastCard
              errorSpan={currentItem.errorSpan}
              nativeReformulation={currentItem.nativeReformulation}
              onPlayTts={playTts}
              isPlayingTts={isPlayingTts}
            />

            {/* ========================================================================= */}
            {/* INTERACTIVE DRILL FORMAT: POSITIVE PRODUCTION */}
            {/* ========================================================================= */}
            <div className="space-y-4">
              {/* Context / Cloze Sentence Prompt */}
              {currentItem.drillFormat === 'CHUNK_SCRAMBLE' ? (
                /* CHUNK SCRAMBLE MODE */
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Ordena los bloques sintácticos correctos:</span>
                  </div>

                  {/* Selected chunks display */}
                  <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-[#181D2A] border border-indigo-200/80 dark:border-indigo-900/50 min-h-[70px] flex items-center flex-wrap gap-2">
                    {selectedChunks.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">
                        Haz clic en los bloques de abajo para ordenarlos aquí...
                      </span>
                    ) : (
                      selectedChunks.map((chunk, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUnselectChunk(chunk, idx)}
                          disabled={isAnswerChecked}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121620] border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-mono text-sm font-bold shadow-2xs hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer"
                        >
                          {chunk}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Available chunks chips */}
                  {availableChunks.length > 0 && (
                    <div className="flex items-center flex-wrap gap-2 pt-2">
                      {availableChunks.map((chunk, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectChunk(chunk, idx)}
                          disabled={isAnswerChecked}
                          className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm font-semibold transition-all cursor-pointer"
                        >
                          {chunk}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : currentItem.drillFormat === 'C_TEST' ? (
                /* C-TEST MODE */
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Completa la palabra a partir de su prefijo:
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-[#181D2A] border border-indigo-100 dark:border-indigo-900/40 text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {currentItem.drillData.clozeSentence ? (
                      <span>{currentItem.drillData.clozeSentence}</span>
                    ) : (
                      <span>Contexto: Completa el término nativo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 max-w-lg">
                    {currentItem.drillData.cTestPrefix && (
                      <span className="px-3.5 py-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-mono text-base font-bold border border-indigo-200 dark:border-indigo-800">
                        {currentItem.drillData.cTestPrefix}
                      </span>
                    )}
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isAnswerChecked}
                      placeholder={
                        currentItem.drillData.expectedLength
                          ? `Escribe las ${currentItem.drillData.expectedLength} letras restantes...`
                          : 'Completa la palabra...'
                      }
                      className="flex-1 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                </div>
              ) : currentItem.drillFormat === 'SENTENCE_REWRITE' ? (
                /* SENTENCE REWRITE MODE */
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Reescribe la oración utilizando la estructura requerida:
                  </div>

                  {currentItem.drillData.rewriteKeyword && (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-gray-400">Palabra clave obligatoria:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                        {currentItem.drillData.rewriteKeyword}
                      </span>
                    </div>
                  )}

                  <textarea
                    rows={3}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={isAnswerChecked}
                    placeholder="Escribe la versión reescrita correcta..."
                    className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-sans text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              ) : (
                /* CONTEXTUAL CLOZE MODE (DEFAULT) */
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Completa la oración con la estructura correcta:
                  </div>

                  <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-[#181D2A] border border-indigo-100 dark:border-indigo-900/40 text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {currentItem.drillData.clozeSentence ? (
                      <span>"{currentItem.drillData.clozeSentence}"</span>
                    ) : (
                      <span>
                        "{currentItem.originalSentence || currentItem.expandedContext || currentItem.nativeReformulation}"
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 max-w-lg">
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isAnswerChecked}
                      placeholder="Escribe la forma o preposición correcta..."
                      className="flex-1 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Verify button */}
              {!isAnswerChecked && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={checkAnswer}
                    disabled={
                      currentItem.drillFormat === 'CHUNK_SCRAMBLE'
                        ? selectedChunks.length === 0
                        : !userAnswer.trim()
                    }
                    className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Verificar Respuesta</span>
                  </button>
                </div>
              )}

              {/* ========================================================================= */}
              {/* FEEDBACK & RATING */}
              {/* ========================================================================= */}
              {isAnswerChecked && (
                <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                  <div
                    className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {isCorrect ? (
                          <>
                            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>¡Excelente respuesta!</span>
                          </>
                        ) : (
                          <>
                            <X className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>Forma correcta:</span>
                            <span className="font-mono underline font-extrabold">
                              {currentItem.drillData.expectedToken || currentItem.nativeReformulation}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">
                        {currentItem.explanationEs}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => playTts(currentItem.nativeReformulation)}
                      disabled={isPlayingTts}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      <span>Escuchar audio</span>
                    </button>
                  </div>

                  {/* Rating Buttons */}
                  <div className="p-5 rounded-3xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-bold uppercase tracking-wider">
                        ¿Qué tan fácil fue recordarlo?:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyFsrsGrade(1 as FsrsGrade)}
                        className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        <div>Repetir</div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">No lo recordé</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyFsrsGrade(2 as FsrsGrade)}
                        className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        <div>Difícil</div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">Requirió esfuerzo</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyFsrsGrade(3 as FsrsGrade)}
                        className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        <div>Bien</div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">Lo recordé bien</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyFsrsGrade(4 as FsrsGrade)}
                        className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        <div>Fácil</div>
                        <div className="text-[10px] font-normal opacity-80 mt-0.5">Dominado</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation Toggle */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80">
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold inline-flex items-center gap-1.5 hover:underline cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showExplanation ? 'Ocultar explicación' : 'Ver explicación en español'}</span>
              </button>

              {showExplanation && (
                <div className="mt-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans animate-in fade-in duration-150">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                    ¿Por qué se usa así en inglés?:
                  </p>
                  <p>{currentItem.explanationEs}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
