import {
  BookOpen,
  Feather,
  X,
} from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { ReadingItem } from '@/data/reading-to-write-catalog';
import { SubmissionMode } from '../store/writingStore';
import { CefrLevel, CEFR_DESCRIPTIONS } from '../data/discourseConnectors';

export interface WritingSessionBarProps {
  submissionMode: SubmissionMode;
  targetCefr: CefrLevel;
  selectedReading?: ReadingItem | null;
  hasDraftContent?: boolean;
  onSubmissionModeChange: (mode: SubmissionMode) => void;
  onTargetCefrChange: (cefr: CefrLevel) => void;
  onOpenReadingModal?: () => void;
  onClearReading?: () => void;
  onClearDraft?: () => void;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export function WritingSessionBar({
  submissionMode,
  targetCefr,
  selectedReading,
  onSubmissionModeChange,
  onTargetCefrChange,
  onOpenReadingModal,
  onClearReading,
}: WritingSessionBarProps) {
  const currentCefrInfo = CEFR_DESCRIPTIONS[targetCefr];

  return (
    <div className="bg-white/90 dark:bg-[#131722]/90 backdrop-blur-xs rounded-2xl p-3 sm:px-4 sm:py-3 border border-gray-200/80 dark:border-gray-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      {/* Left group: Practice Mode Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:inline">
          Modo:
        </span>

        {/* Free Writing Mode Button */}
        <Button
          size="sm"
          variant={submissionMode === 'FREE' && !selectedReading ? 'primary' : 'ghost'}
          onPress={() => {
            onSubmissionModeChange('FREE');
            if (selectedReading && onClearReading) onClearReading();
          }}
          className={`text-xs font-semibold rounded-xl h-8 px-3 cursor-pointer ${submissionMode === 'FREE' && !selectedReading
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
          <Feather className="w-3.5 h-3.5 mr-1" />
          <span>Modo Libre</span>
        </Button>

        {/* Reading-to-Write Mode Button / Active Reading Pill */}
        {selectedReading ? (
          <div className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold truncate max-w-[150px] sm:max-w-[220px]">
              {selectedReading.title}
            </span>
            <Chip size="sm" variant="soft" color="success" className="text-[10px] h-4.5 px-1 font-mono">
              {selectedReading.cefrLevel}
            </Chip>
            {onOpenReadingModal && (
              <button
                type="button"
                onClick={onOpenReadingModal}
                className="text-[10px] text-emerald-700 dark:text-emerald-300 underline hover:opacity-80 ml-1 cursor-pointer"
                title="Cambiar lectura"
              >
                Cambiar
              </button>
            )}
            {onClearReading && (
              <button
                type="button"
                onClick={onClearReading}
                className="p-1 text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-100 rounded-md transition-colors cursor-pointer"
                title="Quitar lectura y volver a modo libre"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onPress={onOpenReadingModal}
            className="text-xs font-semibold rounded-xl h-8 px-3 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            <span>Lectura Guiada</span>
          </Button>
        )}
      </div>

      {/* Middle/Right group: CEFR Level Segmented Selector & Typography Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* CEFR Level Segment */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:inline">
            Nivel:
          </span>
          <div
            className="flex items-center p-0.5 bg-gray-100 dark:bg-[#181D2A] rounded-xl border border-gray-200/60 dark:border-gray-800/80"
            title={`${currentCefrInfo.name}: ${currentCefrInfo.summary}`}
          >
            {CEFR_LEVELS.map((level) => {
              const isSelected = targetCefr === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onTargetCefrChange(level)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  title={`${level}: ${CEFR_DESCRIPTIONS[level].summary}`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
