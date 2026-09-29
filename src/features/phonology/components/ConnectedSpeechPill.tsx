import { useState, useMemo } from 'react';
import { Volume2, Volume1, Info, Sparkles, HelpCircle } from 'lucide-react';
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

  const getBadgeColor = (type: PhoneticBoundary['boundaryType']) => {
    switch (type) {
      case 'LINKING_CV':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'LINKING_VV_J':
      case 'LINKING_VV_W':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'ASSIMILATION_COALESCENT':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'ELISION_T_D':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'WEAK_FORM':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  if (!sentence.trim()) return null;

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-gray-50/80 dark:bg-[#161B26] border border-gray-200/90 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Fonología y Discurso Conectado</span>
        </div>

        {/* Audio buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePlay(1.0)}
            disabled={isPlaying}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Escuchar a velocidad nativa (1.0x)"
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>1.0x</span>
          </button>
          <button
            onClick={() => handlePlay(0.75)}
            disabled={isPlaying}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Escuchar lento para análisis fonético (0.75x)"
          >
            <Volume1 className="w-3.5 h-3.5 text-amber-500" />
            <span>0.75x</span>
          </button>
        </div>
      </div>

      {/* Connected Speech representation */}
      <div className="text-xs text-gray-600 dark:text-gray-300 font-mono mb-2.5 bg-white/60 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-200/50 dark:border-gray-800">
        <span className="text-gray-400 text-[10px] uppercase font-sans font-bold block mb-0.5">
          Ligadura y Catenación:
        </span>
        <span className="text-indigo-700 dark:text-indigo-300 font-medium">
          {analysis.ipaConnected}
        </span>
      </div>

      {/* Detected Boundaries Pills */}
      {analysis.boundaries.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-indigo-500" />
            Fenómenos:
          </span>
          {analysis.boundaries.map((b, idx) => (
            <button
              key={`${b.word1}-${b.boundaryType}-${idx}`}
              onClick={() => setSelectedBoundary(selectedBoundary === b ? null : b)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-transform hover:scale-105 cursor-pointer flex items-center gap-1 ${getBadgeColor(
                b.boundaryType,
              )}`}
              title="Click para ver regla articulatoria"
            >
              <span>
                {b.word1} {b.word2 ? `→ ${b.word2}` : ''}
              </span>
              <span className="opacity-75 font-mono text-[10px]">{b.ipaTransformed}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-gray-400 italic">
          No se detectaron transiciones complejas en este segmento.
        </div>
      )}

      {/* Detail drawer for selected phonetic boundary */}
      {selectedBoundary && (
        <div className="mt-2.5 p-3 rounded-xl bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                {selectedBoundary.ruleName}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                Transformación Acústica: {selectedBoundary.ipaTransformed}
              </div>
            </div>
            <button
              onClick={() => setSelectedBoundary(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1 cursor-pointer"
            >
              ✕
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
