import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';
import { SubmissionMode, TargetWordItem } from '../store/writingStore';
import { CefrLevel } from '../data/discourseConnectors';
import { WritingSessionBar } from './WritingSessionBar';
import { WritingCanvas } from './WritingCanvas';
import { WritingAssistantPanel } from './WritingAssistantPanel';

export interface WritingStageOneProps {
  draft1: string;
  targetCefr: CefrLevel;
  submissionMode: SubmissionMode;
  selectedReading?: ReadingItem | null;
  selectedMission?: WritingMission | null;
  targetWords?: TargetWordItem[];
  isLoading: boolean;
  isPlayingTts?: boolean;
  onDraftChange: (text: string) => void;
  onTargetCefrChange: (cefr: CefrLevel) => void;
  onSubmissionModeChange: (mode: SubmissionMode) => void;
  onOpenReadingModal?: () => void;
  onClearReading?: () => void;
  onReplaceTargetWord?: (index: number) => void;
  onPlayTts?: (text: string) => void;
  onRequestSocratic: () => void;
}

export function WritingStageOne({
  draft1,
  targetCefr,
  submissionMode,
  selectedReading = null,
  selectedMission = null,
  targetWords = [],
  isLoading,
  isPlayingTts = false,
  onDraftChange,
  onTargetCefrChange,
  onSubmissionModeChange,
  onOpenReadingModal,
  onClearReading,
  onReplaceTargetWord,
  onPlayTts,
  onRequestSocratic,
}: WritingStageOneProps) {
  const handleInsertText = (phrase: string) => {
    const trimmed = draft1.trim();
    const isNewSentence =
      trimmed.length === 0 ||
      trimmed.endsWith('.') ||
      trimmed.endsWith('!') ||
      trimmed.endsWith('?');

    const formattedPhrase = isNewSentence
      ? phrase.charAt(0).toUpperCase() + phrase.slice(1)
      : phrase;

    const separator = draft1.length > 0 && !draft1.endsWith(' ') ? ' ' : '';
    onDraftChange(`${draft1}${separator}${formattedPhrase} `);
  };

  return (
    <div className="space-y-4">
      {/* 1. Global Session Configuration Bar */}
      <WritingSessionBar
        submissionMode={submissionMode}
        targetCefr={targetCefr}
        selectedReading={selectedReading}
        onSubmissionModeChange={onSubmissionModeChange}
        onTargetCefrChange={onTargetCefrChange}
        onOpenReadingModal={onOpenReadingModal}
        onClearReading={onClearReading}
      />

      {/* 2. Main Workspace Grid: Canvas (Hero) + Assistant Panel (Sidecar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Writing Canvas (8 cols on large displays) */}
        <section aria-label="Lienzo de redacción" className="lg:col-span-8 space-y-4">
          <WritingCanvas
            draft={draft1}
            selectedReading={selectedReading}
            selectedMission={selectedMission}
            isLoading={isLoading}
            isPlayingTts={isPlayingTts}
            onDraftChange={onDraftChange}
            onInsertText={handleInsertText}
            onPlayTts={onPlayTts}
            onRequestSocratic={onRequestSocratic}
          />
        </section>

        {/* Pedagogical Companion Sidecar (4 cols on large displays) */}
        <aside aria-label="Asistente pedagógico" className="lg:col-span-4 space-y-4">
          <WritingAssistantPanel
            targetCefr={targetCefr}
            targetWords={targetWords}
            selectedReading={selectedReading}
            selectedMission={selectedMission}
            isPlayingTts={isPlayingTts}
            onInsertText={handleInsertText}
            onReplaceTargetWord={onReplaceTargetWord}
            onPlayTts={onPlayTts}
          />
        </aside>
      </div>
    </div>
  );
}
