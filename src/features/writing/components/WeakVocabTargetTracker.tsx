import { useState } from 'react';
import { Target, CheckCircle2, RefreshCw, Plus, Sparkles } from 'lucide-react';
import { TargetWordItem } from '../store/writingStore';

export interface WeakVocabTargetTrackerProps {
  targetWords: TargetWordItem[];
  onInsertWord: (word: string) => void;
  onReplaceWord: (index: number) => void;
  canReplace?: boolean;
}

export function WeakVocabTargetTracker({
  targetWords,
  onInsertWord,
  onReplaceWord,
  canReplace = true,
}: WeakVocabTargetTrackerProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (targetWords.length === 0) return null;

  const usedCount = targetWords.filter((w) => w.isUsed).length;
  const allUsed = usedCount === targetWords.length;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Palabras Objetivo (SRS)</span>
              {allUsed && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>¡Todas usadas!</span>
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Counter pill */}
        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
            usedCount > 0
              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}
        >
          {usedCount} / {targetWords.length}
        </span>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
        Palabras de tu mazo que necesitas activar en memoria. Toca para insertar o cámbialas si no encajan.
      </p>

      {/* Target Word Pills Grid */}
      <div className="flex flex-wrap gap-2 pt-1">
        {targetWords.map((item, idx) => {
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`group relative flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-medium border transition-all select-none ${
                item.isUsed
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 shadow-2xs'
                  : 'bg-gray-50/70 dark:bg-[#131722] hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 text-gray-800 dark:text-gray-200'
              }`}
            >
              {/* Insert trigger */}
              <button
                type="button"
                onClick={() => onInsertWord(item.word)}
                className="flex items-center gap-1.5 cursor-pointer text-left"
                title={`Haz clic para insertar "${item.word}" en el borrador`}
              >
                {item.isUsed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Plus className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                )}

                <span className="font-mono font-bold tracking-tight">{item.word}</span>

                {item.partOfSpeech && (
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 opacity-70">
                    {item.partOfSpeech.slice(0, 3)}
                  </span>
                )}
              </button>

              {/* Translation tooltip / swap button */}
              {canReplace && !item.isUsed && isHovered && (
                <button
                  type="button"
                  onClick={() => onReplaceWord(idx)}
                  className="p-0.5 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Cambiar por otra palabra débil de tu mazo"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
