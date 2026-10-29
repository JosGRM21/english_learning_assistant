import { useState } from 'react';
import {
  AlertCircle,
} from 'lucide-react';
import { useWritingSession } from '../hooks/useWritingSession';
import { WritingStudioHeader } from './WritingStudioHeader';
import { WritingStageOne } from './WritingStageOne';
import { WritingStageTwo } from './WritingStageTwo';
import { WritingStageThree } from './WritingStageThree';
import { WritingHistoryDrawer } from './WritingHistoryDrawer';
import { ReadingSelectionModal } from './ReadingSelectionModal';

import { AppTab } from '@/shared/constants/app-tabs';

export interface SocraticWritingStudioProps {
  onNavigateTab?: (tab: AppTab) => void;
}

export function SocraticWritingStudio({ onNavigateTab: _onNavigateTab }: SocraticWritingStudioProps) {
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);

  const {
    activeTab,
    currentStage,
    submissionMode,
    selectedReading,
    selectedMission,
    draft1,
    draft2,
    targetCefr,
    targetWords,
    isLoading,
    socraticResult,
    evalResult,
    historySubmissions,
    isLoadingHistory,
    errorMessage,
    isPlayingTts,
    setActiveTab,
    setCurrentStage,
    setSubmissionMode,
    setSelectedReading,
    setSelectedMission,
    setDraft1,
    setDraft2,
    setTargetCefr,
    setErrorMessage,
    replaceTargetWord,
    selectReadingAndApply,
    loadSubmissionIntoStudio,
    handleRequestSocratic,
    handleEvaluateFinal,
    handlePlayTts,
    handleDeleteSubmission,
    handleClearAllSubmissions,
    resetWriting,
  } = useWritingSession();

  return (
    <div className="space-y-6">
      {/* Studio Unified Header: Title, Action Bar & Connected Stepper */}
      <WritingStudioHeader
        activeTab={activeTab}
        currentStage={currentStage}
        historyCount={historySubmissions.length}
        onTabChange={setActiveTab}
        onReset={resetWriting}
      />

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
              selectedReading={selectedReading}
              selectedMission={selectedMission}
              targetWords={targetWords}
              isLoading={isLoading}
              isPlayingTts={isPlayingTts}
              onDraftChange={setDraft1}
              onTargetCefrChange={setTargetCefr}
              onSubmissionModeChange={setSubmissionMode}
              onOpenReadingModal={() => setIsReadingModalOpen(true)}
              onClearReading={() => {
                setSelectedReading(null);
                setSelectedMission(null);
              }}
              onReplaceTargetWord={replaceTargetWord}
              onPlayTts={handlePlayTts}
              onRequestSocratic={handleRequestSocratic}
            />
          )}

          {/* Stage 2: Socratic Hints Scaffolding & Draft 2 Revision */}
          {currentStage === 2 && socraticResult && (
            <WritingStageTwo
              socraticResult={socraticResult}
              draft1={draft1}
              draft2={draft2}
              selectedReading={selectedReading}
              targetWords={targetWords}
              isLoading={isLoading}
              onDraftChange={setDraft2}
              onBackToStageOne={() => setCurrentStage(1)}
              onEvaluateFinal={handleEvaluateFinal}
            />
          )}

          {/* Stage 3: Diff Comparison & CEFR Scores */}
          {currentStage === 3 && evalResult && (
            <WritingStageThree
              evalResult={evalResult}
              draft1={draft1}
              draft2={draft2}
              isPlayingTts={isPlayingTts}
              onPlayTts={handlePlayTts}
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
          onDeleteSubmission={handleDeleteSubmission}
          onClearAllSubmissions={handleClearAllSubmissions}
          onNewWriting={() => {
            resetWriting();
            setActiveTab('STUDIO');
          }}
        />
      )}

      {/* Reading-to-Write Catalog Modal */}
      <ReadingSelectionModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSelectReadingAndMission={selectReadingAndApply}
      />
    </div>
  );
}
