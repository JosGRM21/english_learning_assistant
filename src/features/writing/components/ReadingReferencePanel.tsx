import { useState } from 'react';
import {
  BookOpen,
  Volume2,
  ChevronDown,
  ChevronUp,
  X,
  Target,
} from 'lucide-react';
import { ReadingItem, WritingMission } from '@/data/reading-to-write-catalog';

export interface ReadingReferencePanelProps {
  reading: ReadingItem;
  mission: WritingMission | null;
  isPlayingTts?: boolean;
  onPlayTts?: (text: string) => void;
  onClearReading?: () => void;
}

export function ReadingReferencePanel({
  reading,
  mission,
  isPlayingTts = false,
  onPlayTts,
  onClearReading,
}: ReadingReferencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-3xl bg-white dark:bg-[#131722] border border-gray-200/90 dark:border-gray-800 shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Lectura Base ({reading.cefrLevel})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                {reading.wordCount} palabras
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {reading.title}
            </h3>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onPlayTts && (
            <button
              type="button"
              onClick={() => onPlayTts(reading.readingTextEn)}
              disabled={isPlayingTts}
              className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
              title="Escuchar narración en inglés (TTS)"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingTts ? 'animate-pulse text-indigo-600' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Plegar texto' : 'Desplegar texto'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {onClearReading && (
            <button
              type="button"
              onClick={onClearReading}
              className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Quitar lectura"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Reading Content */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
          {/* Mission Objective Card */}
          {mission && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{mission.titleEs}</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300">
                  Meta: {mission.suggestedWordRange.min}-{mission.suggestedWordRange.max} palabras
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                {mission.instructionsEs}
              </p>
            </div>
          )}

          {/* Reading text */}
          <div className="space-y-3 font-editorial text-sm sm:text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-line tracking-normal max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {reading.readingTextEn}
          </div>
        </div>
      )}
    </div>
  );
}
