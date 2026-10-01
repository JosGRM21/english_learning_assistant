import { useState } from 'react';
import {
  PenTool,
  AlertCircle,
  History,
  BookOpen,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { IAiGateway } from '@/infrastructure/ai/IAiGateway';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useWritingSession } from '../hooks/useWritingSession';
import { WritingStageOne } from './WritingStageOne';
import { WritingStageTwo } from './WritingStageTwo';
import { WritingStageThree } from './WritingStageThree';
import { WritingHistoryDrawer } from './WritingHistoryDrawer';
import { WritingPromptsModal } from './WritingPromptsModal';

export interface SocraticWritingStudioProps {
  audioService?: AudioService;
  aiGateway?: IAiGateway;
}

export function SocraticWritingStudio(_props: SocraticWritingStudioProps) {
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const {
    activeTab,
    currentStage,
    submissionMode,
    selectedPrompt,
    draft1,
    draft2,
    targetCefr,
    isLoading,
    socraticResult,
    evalResult,
    selectedQuizOption,
    quizSubmitted,
    historySubmissions,
    isLoadingHistory,
    errorMessage,
    srsSuccessMessage,
    isPlayingTts,
    setActiveTab,
    setCurrentStage,
    setSubmissionMode,
    setSelectedPrompt,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setErrorMessage,
    selectPromptAndApply,
    loadSubmissionIntoStudio,
    handleRequestSocratic,
    handleEvaluateFinal,
    handleAnswerQuiz,
    handlePlayTts,
    handleAddCorrectionToSrs,
    resetWriting,
  } = useWritingSession();

  return (
    <div className="space-y-6">
      {/* Studio Unified Header: Title, Action Bar & Connected Stepper */}
      <header className="bg-white dark:bg-[#131722] rounded-3xl p-5 sm:p-6 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Studio Branding */}
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shrink-0 shadow-2xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Taller de Redacción
                </h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Práctica guiada en 3 fases: borrador inicial, revisión con pistas y evaluación con comparativa de cambios.
              </p>
            </div>
          </div>

          {/* Action Toolbar: Tabs & Dedicated Triggers */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {/* View Switcher: Redactor vs Historial */}
            <div className="flex items-center p-1 bg-gray-100/90 dark:bg-[#181D2A] rounded-2xl border border-gray-200/60 dark:border-gray-800/80">
              <button
                type="button"
                onClick={() => setActiveTab('STUDIO')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'STUDIO'
                    ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Redactor</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('HISTORY')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'HISTORY'
                    ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <History className="w-3.5 h-3.5 text-purple-500" />
                <span>Historial</span>
                {historySubmissions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    {historySubmissions.length}
                  </span>
                )}
              </button>
            </div>

            {/* Prompts Catalog Trigger */}
            <button
              type="button"
              onClick={() => setIsPromptModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl text-xs font-semibold bg-white dark:bg-[#181D2A] hover:bg-gray-50 dark:hover:bg-[#202738] text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
              title="Abrir banco de prompts situacionales"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Prompts</span>
            </button>

            {/* Reset Writing Session (Visible when past stage 1 in Studio) */}
            {activeTab === 'STUDIO' && currentStage > 1 && (
              <button
                type="button"
                onClick={resetWriting}
                className="px-3 py-2 rounded-2xl text-xs font-semibold text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reiniciar sesión actual y volver a empezar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
          </div>
        </div>

        {/* Unified 3-Phase Stepper (Integrated in STUDIO view) */}
        {activeTab === 'STUDIO' && (
          <nav aria-label="Progreso de redacción" className="pt-4 border-t border-gray-100 dark:border-gray-800/80">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
              {/* Stage 1 */}
              <div
                className={`relative flex items-center gap-2.5 p-2 rounded-2xl transition-all ${
                  currentStage === 1
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60'
                    : currentStage > 1
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-transform ${
                    currentStage === 1
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 scale-105'
                      : currentStage > 1
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {currentStage > 1 ? '✓' : '1'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    Fase 1
                  </div>
                  <div className="text-xs font-semibold truncate text-gray-900 dark:text-white">
                    Redacción
                  </div>
                </div>
              </div>

              {/* Stage 2 */}
              <div
                className={`relative flex items-center gap-2.5 p-2 rounded-2xl transition-all ${
                  currentStage === 2
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60'
                    : currentStage > 2
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-transform ${
                    currentStage === 2
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 scale-105'
                      : currentStage > 2
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  {currentStage > 2 ? '✓' : '2'}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    Fase 2
                  </div>
                  <div className="text-xs font-semibold truncate text-gray-900 dark:text-white">
                    Pistas y Revisión
                  </div>
                </div>
              </div>

              {/* Stage 3 */}
              <div
                className={`relative flex items-center gap-2.5 p-2 rounded-2xl transition-all ${
                  currentStage === 3
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-transform ${
                    currentStage === 3
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30 scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  3
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                    Fase 3
                  </div>
                  <div className="text-xs font-semibold truncate text-gray-900 dark:text-white">
                    Evaluación & Diff
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] font-semibold underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* VIEW 1: STUDIO (STAGES 1, 2, 3) */}
      {activeTab === 'STUDIO' && (
        <>
          {/* Stage 1: Draft 1 Arena */}
          {currentStage === 1 && (
            <WritingStageOne
              draft1={draft1}
              targetCefr={targetCefr}
              submissionMode={submissionMode}
              selectedPrompt={selectedPrompt}
              isLoading={isLoading}
              onDraftChange={setDraft1}
              onTargetCefrChange={setTargetCefr}
              onSubmissionModeChange={setSubmissionMode}
              onOpenPromptModal={() => setIsPromptModalOpen(true)}
              onClearPrompt={() => setSelectedPrompt(null)}
              onRequestSocratic={handleRequestSocratic}
            />
          )}

          {/* Stage 2: Socratic Hints Scaffolding & Draft 2 Revision */}
          {currentStage === 2 && socraticResult && (
            <WritingStageTwo
              socraticResult={socraticResult}
              draft1={draft1}
              draft2={draft2}
              isLoading={isLoading}
              onDraftChange={setDraft2}
              onBackToStageOne={() => setCurrentStage(1)}
              onEvaluateFinal={handleEvaluateFinal}
            />
          )}

          {/* Stage 3: Diff Comparison, CEFR Scores & Micro-Challenge */}
          {currentStage === 3 && evalResult && (
            <WritingStageThree
              evalResult={evalResult}
              draft1={draft1}
              draft2={draft2}
              selectedQuizOption={selectedQuizOption}
              quizSubmitted={quizSubmitted}
              isPlayingTts={isPlayingTts}
              srsSuccessMessage={srsSuccessMessage}
              onAnswerQuiz={handleAnswerQuiz}
              onPlayTts={handlePlayTts}
              onAddToSrs={handleAddCorrectionToSrs}
              onReset={resetWriting}
            />
          )}
        </>
      )}

      {/* VIEW 2: HISTORY */}
      {activeTab === 'HISTORY' && (
        <WritingHistoryDrawer
          submissions={historySubmissions}
          isLoading={isLoadingHistory}
          onSelectSubmission={loadSubmissionIntoStudio}
          onNewWriting={() => {
            resetWriting();
            setActiveTab('STUDIO');
          }}
        />
      )}

      {/* Prompts Catalog Modal */}
      <WritingPromptsModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSelectPrompt={selectPromptAndApply}
      />
    </div>
  );
}
