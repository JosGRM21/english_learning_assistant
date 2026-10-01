import { useState, useMemo } from 'react';
import { Volume2, Volume1, Sparkles, HelpCircle, X } from 'lucide-react';
import { ConnectedSpeechMatcher } from '@/core/phonology/ConnectedSpeechMatcher';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { PhoneticBoundary } from '@/core/types/phonology';
import { useAudio } from '@/shared/hooks/useAudio';

export interface ConnectedSpeechPillProps {
  sentence: string;
  audioService?: AudioService;
}

export function ConnectedSpeechPill({ sentence, audioService: audioProp }: ConnectedSpeechPillProps) {
  const { audioService: defaultAudio } = useAudio();
  const audioService = audioProp ?? defaultAudio;

  const matcher = useMemo(() => new ConnectedSpeechMatcher(), []);
  const analysis = useMemo(() => matcher.analyze(sentence), [matcher, sentence]);
  const [selectedBoundary, setSelectedBoundary] = useState<PhoneticBoundary | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (rate: number) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await audioService.speak(sentence, rate);
    } finally {
      setIsPlaying(false);
    }
  };

  const getBadgeStyle = (type: PhoneticBoundary['boundaryType']) => {
    switch (type) {
      case 'LINKING_CV':
        return 'bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40';
      case 'LINKING_VV_J':
      case 'LINKING_VV_W':
        return 'bg-purple-50/80 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40';
      case 'ASSIMILATION_COALESCENT':
        return 'bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40';
      case 'ELISION_T_D':
        return 'bg-amber-50/80 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
      case 'WEAK_FORM':
        return 'bg-rose-50/80 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  if (!sentence.trim()) return null;

  return (
    <div className="mt-3.5 p-4 rounded-2xl bg-gray-50/80 dark:bg-[#141824] border border-gray-200/70 dark:border-gray-800/80 space-y-3">
      {/* Header bar with audio controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Fonología & Discurso Conectado</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePlay(1.0)}
            disabled={isPlaying}
            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Pronunciación continua nativa (1.0x)"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>1.0x</span>
          </button>
          <button
            type="button"
            onClick={() => handlePlay(0.75)}
            disabled={isPlaying}
            className="px-2.5 py-1 rounded-xl text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-gray-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Pronunciación ralentizada para articulación (0.75x)"
          >
            <Volume1 className="w-3.5 h-3.5 text-amber-500" />
            <span>0.75x Lento</span>
          </button>
        </div>
      </div>

      {/* Connected Speech transcription */}
      <div className="p-3 rounded-xl bg-white/80 dark:bg-[#10131B]/70 border border-gray-200/60 dark:border-gray-800/80">
        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
          Catenación y Flujo Sonoro (IPA):
        </span>
        <div
          className="font-phonetic text-sm font-semibold tracking-wide text-indigo-600 dark:text-indigo-400"
          style={{ fontFamily: 'var(--font-phonetic)' }}
        >
          {analysis.ipaConnected}
        </div>
      </div>

      {/* Detected Boundaries */}
      {analysis.boundaries.length > 0 ? (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">
            Fenómenos Articularios Detectados:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {analysis.boundaries.map((b, idx) => {
              const isSelected = selectedBoundary === b;
              return (
                <button
                  key={`${b.word1}-${b.boundaryType}-${idx}`}
                  type="button"
                  onClick={() => setSelectedBoundary(isSelected ? null : b)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${getBadgeStyle(
                    b.boundaryType,
                  )} ${isSelected ? 'ring-2 ring-indigo-500/40' : 'hover:scale-[1.02]'}`}
                >
                  <span className="font-semibold">
                    {b.word1} {b.word2 ? `‿ ${b.word2}` : ''}
                  </span>
                  <span className="font-mono text-[10px] opacity-80 font-bold">
                    {b.ipaTransformed}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400 italic">
          No se detectaron ligaduras complejas en este segmento.
        </p>
      )}

      {/* Selected boundary drawer / explainer */}
      {selectedBoundary && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#10131B] border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>{selectedBoundary.ruleName}</span>
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                Transformación Acústica: {selectedBoundary.ipaTransformed}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBoundary(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            {selectedBoundary.descriptionEs}
          </p>
        </div>
      )}
    </div>
  );
}
