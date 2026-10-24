import { ArrowRight, Volume2 } from 'lucide-react';

export interface ErrorContrastCardProps {
  errorSpan: string;
  nativeReformulation: string;
  taxonomyCode?: string;
  explanationEs?: string;
  onPlayTts?: (text: string) => void;
  isPlayingTts?: boolean;
}

export function ErrorContrastCard({
  errorSpan,
  nativeReformulation,
  taxonomyCode,
  explanationEs,
  onPlayTts,
  isPlayingTts,
}: ErrorContrastCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold line-through text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/50">
            "{errorSpan}"
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50">
            "{nativeReformulation}"
          </span>
        </div>

        <div className="flex items-center gap-2">
          {taxonomyCode && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {taxonomyCode}
            </span>
          )}
          {onPlayTts && (
            <button
              type="button"
              onClick={() => onPlayTts(nativeReformulation)}
              disabled={isPlayingTts}
              className="px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold inline-flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer text-xs"
              title="Escuchar pronunciación nativa"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isPlayingTts ? 'animate-pulse text-indigo-500' : ''}`} />
              <span>Escuchar audio</span>
            </button>
          )}
        </div>
      </div>

      {explanationEs && (
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
          {explanationEs}
        </p>
      )}
    </div>
  );
}
