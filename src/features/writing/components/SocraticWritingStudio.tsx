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
      {/* Studio Top Navigation & Status Header */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <PenTool className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Taller de Redacción Socrática
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              Práctica guiada en 3 fases: borrador libre o situacional, pistas de autodescubrimiento y evaluación final con diff.
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#181D2A] rounded-2xl self-start md:self-center">
          <button
            onClick={() => setActiveTab('STUDIO')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'STUDIO'
                ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Redactor Activo</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-500" />
            <span>Historial ({historySubmissions.length})</span>
          </button>

          <button
            onClick={() => setIsPromptModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Prompts</span>
          </button>
        </div>
      </div>

      {/* Stage Indicator Bar (Only visible in STUDIO mode) */}
      {activeTab === 'STUDIO' && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-[#181D2A]/60 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                currentStage === 1
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : currentStage > 1
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px] font-mono">
                1
              </span>
              <span>1. Redacción</span>
            </div>

            <span className="text-gray-300 dark:text-gray-700">→</span>

            <div
              className={`flex items-center gap-1.5 font-semibold ${
                currentStage === 2
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : currentStage > 2
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>2. Pistas ZPD & Revisión</span>
            </div>

            <span className="text-gray-300 dark:text-gray-700">→</span>

            <div
              className={`flex items-center gap-1.5 font-semibold ${
                currentStage === 3
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-gray-400'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[10px] font-mono">
                3
              </span>
              <span>3. Evaluación & Diff</span>
            </div>
          </div>

          {currentStage > 1 && (
            <button
              onClick={resetWriting}
              className="text-[11px] font-semibold text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar sesión</span>
            </button>
          )}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer shrink-0"
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
