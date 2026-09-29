import { useState } from 'react';
import { Volume2, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { Card, Chip, Button } from '@heroui/react';
import { VocabItem, VocabContextExample } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export interface VocabCardProps {
  vocab: VocabItem;
  examples?: VocabContextExample[];
}

export function VocabCard({ vocab, examples }: VocabCardProps) {
  const { audioService } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async () => {
    if (isPlaying) return;
    try {
      setIsPlaying(true);
      await audioService.speak(vocab.word);
    } finally {
      setIsPlaying(false);
    }
  };

  const getCefrBadgeClass = (level: string) => {
    switch (level) {
      case 'A1':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'A2':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'B1':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'B2':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'C1':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'C2':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const firstExample = examples && examples.length > 0 ? examples[0] : null;

  return (
    <Card className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#131722] hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <Card.Header className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {vocab.word}
              </h3>
              <Button
                isIconOnly
                size="sm"
                onClick={handleSpeak}
                className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                aria-label="Escuchar pronunciación"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-indigo-700 dark:text-indigo-300' : ''}`} />
              </Button>
            </div>

            {vocab.ipaGeneralAmerican && (
              <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                /{vocab.ipaGeneralAmerican}/
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getCefrBadgeClass(
                vocab.cefrLevel,
              )}`}
            >
              {vocab.cefrLevel}
            </span>
            <Chip size="sm" className="bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300 font-medium">
              <Chip.Label>{vocab.partOfSpeech.toLowerCase()}</Chip.Label>
            </Chip>
          </div>
        </div>
      </Card.Header>

      <Card.Content className="px-5 py-2 space-y-3 flex-1">
        {/* Spanish Translation */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">
            Traducción
          </span>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {vocab.translationEs}
          </p>
        </div>

        {/* English Definition */}
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">
            Definición en Inglés
          </span>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-sans line-clamp-3">
            {vocab.definitionEn}
          </p>
        </div>

        {/* False Friend Alert */}
        {vocab.isFalseFriend && (
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
              <strong className="font-semibold block mb-0.5">Falso Amigo (False Friend):</strong>
              {vocab.falseFriendNote || 'Cuidado con la traducción literal al español.'}
            </div>
          </div>
        )}

        {/* Example sentence */}
        {firstExample && (
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-3 h-3" />
              <span>Ejemplo en Contexto:</span>
            </div>
            <p className="text-gray-800 dark:text-gray-200 italic font-serif leading-snug">
              &ldquo;{firstExample.sentenceEn}&rdquo;
            </p>
            {firstExample.sentenceEs && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {firstExample.sentenceEs}
              </p>
            )}
          </div>
        )}

        {/* Morphological Family */}
        {vocab.morphologicalFamilyJson && vocab.morphologicalFamilyJson.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
            <span className="text-[10px] text-gray-400">Familia:</span>
            {vocab.morphologicalFamilyJson.map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </Card.Content>

      <Card.Footer className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/50 dark:bg-[#11141C]/50">
        <span className="capitalize">{vocab.grammaticalDimension.toLowerCase()} Dimension</span>
        {vocab.subcategory && (
          <span className="text-gray-500 dark:text-gray-400 truncate max-w-[130px]">
            {vocab.subcategory}
          </span>
        )}
      </Card.Footer>
    </Card>
  );
}
