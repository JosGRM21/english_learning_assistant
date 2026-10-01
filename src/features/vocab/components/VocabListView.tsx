import { useState } from 'react';
import { Volume2, AlertCircle, BookOpen } from 'lucide-react';
import { VocabItem, VocabContextExample, PART_OF_SPEECH_LABELS_ES } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export interface VocabListViewProps {
  words: VocabItem[];
  examplesMap: Record<string, VocabContextExample[]>;
  onSelectWord?: (word: VocabItem) => void;
}

export function VocabListView({ words, examplesMap, onSelectWord }: VocabListViewProps) {
  const { audioService } = useAudio();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleSpeak = async (e: React.MouseEvent, item: VocabItem) => {
    e.stopPropagation();
    if (playingId) return;
    try {
      setPlayingId(item.id);
      await audioService.speak(item.word, 1.0);
    } finally {
      setPlayingId(null);
    }
  };

  const getCefrBadgeStyle = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40';
      case 'B1':
      case 'B2':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40';
      case 'C1':
      case 'C2':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800/80 bg-white/90 dark:bg-[#121622]/90 backdrop-blur-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200/60 dark:border-gray-800/60 bg-gray-50/70 dark:bg-[#161B28]/60 text-gray-400 dark:text-gray-500 font-semibold tracking-wider uppercase text-[10px]">
              <th className="py-3 px-4">Término en Inglés</th>
              <th className="py-3 px-3">Fonética IPA</th>
              <th className="py-3 px-3">Nivel</th>
              <th className="py-3 px-3">Categoría</th>
              <th className="py-3 px-4">Traducción al Español</th>
              <th className="py-3 px-4 hidden md:table-cell">Ejemplo Contextual</th>
              <th className="py-3 px-3 text-right">Audio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {words.map((item) => {
              const isPlaying = playingId === item.id;
              const example = examplesMap[item.id]?.[0];

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectWord?.(item)}
                  className="group hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
                >
                  {/* Word & false friend indicator */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.word}
                      </span>
                      {item.isFalseFriend && (
                        <span
                          className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
                          title={item.falseFriendNote || 'Falso amigo con el español'}
                        >
                          <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                          Falso Amigo
                        </span>
                      )}
                    </div>
                  </td>

                  {/* IPA Transcription */}
                  <td className="py-3.5 px-3">
                    {item.ipaGeneralAmerican ? (
                      <span
                        className="font-phonetic text-xs text-indigo-600/90 dark:text-indigo-400/90"
                        style={{ fontFamily: 'var(--font-phonetic)' }}
                      >
                        /{item.ipaGeneralAmerican}/
                      </span>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>

                  {/* CEFR Level */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${getCefrBadgeStyle(
                        item.cefrLevel,
                      )}`}
                    >
                      {item.cefrLevel}
                    </span>
                  </td>

                  {/* Part of Speech */}
                  <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 font-medium">
                    {PART_OF_SPEECH_LABELS_ES[item.partOfSpeech] ?? item.partOfSpeech}
                  </td>

                  {/* Spanish Translation */}
                  <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                    {item.translationEs}
                  </td>

                  {/* Example snippet */}
                  <td className="py-3.5 px-4 hidden md:table-cell max-w-xs">
                    {example ? (
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 truncate">
                        <BookOpen className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="font-editorial italic truncate text-[11px]">
                          &ldquo;{example.sentenceEn}&rdquo;
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Audio action */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => handleSpeak(e, item)}
                      disabled={isPlaying}
                      className={`p-1.5 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer ${
                        isPlaying ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''
                      }`}
                      title="Escuchar pronunciación nativa"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
