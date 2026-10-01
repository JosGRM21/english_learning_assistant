import React, { useState } from 'react';
import {
  Volume2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import {
  VocabItem,
  VocabContextExample,
  PART_OF_SPEECH_LABELS_ES,
  GRAMMATICAL_DIMENSION_LABELS_ES,
} from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export interface VocabCardProps {
  vocab: VocabItem;
  examples?: VocabContextExample[];
  onSelectWord?: (vocab: VocabItem) => void;
}

export function VocabCard({ vocab, examples, onSelectWord }: VocabCardProps) {
  const { audioService } = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    try {
      setIsPlaying(true);
      await audioService.speak(vocab.word, 1.0);
    } finally {
      setIsPlaying(false);
    }
  };

  const getCefrBadgeStyle = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
      case 'B1':
      case 'B2':
        return 'bg-indigo-50/90 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60';
      case 'C1':
      case 'C2':
        return 'bg-purple-50/90 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const firstExample = examples && examples.length > 0 ? examples[0] : null;

  return (
    <div
      onClick={() => onSelectWord?.(vocab)}
      className="group relative rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121622] hover:border-indigo-400/80 dark:hover:border-indigo-500/50 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top ambient accent glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex-1 flex flex-col justify-between">
        {/* Card Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sans">
                  {vocab.word}
                </h3>

                {/* Audio Playback button */}
                <button
                  type="button"
                  onClick={handleSpeak}
                  disabled={isPlaying}
                  className={`p-1.5 rounded-full border border-gray-200/70 dark:border-white/[0.08] bg-gray-50 dark:bg-gray-800/80 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer ${
                    isPlaying
                      ? 'text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/30 animate-pulse'
                      : ''
                  }`}
                  title="Escuchar pronunciación nativa"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {vocab.ipaGeneralAmerican && (
                <span
                  className="inline-block font-phonetic text-xs font-semibold text-indigo-600 dark:text-indigo-400/95 tracking-wide"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{vocab.ipaGeneralAmerican}/
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span
                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getCefrBadgeStyle(
                  vocab.cefrLevel,
                )}`}
              >
                {vocab.cefrLevel}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/80 text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                {PART_OF_SPEECH_LABELS_ES[vocab.partOfSpeech] ?? vocab.partOfSpeech}
              </span>

              {vocab.isFalseFriend && (
                <span
                  className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 text-[10px] font-semibold flex items-center gap-1"
                  title="Falso Amigo (clic en la tarjeta para ver detalles)"
                >
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>Falso Amigo</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-5 py-2 space-y-3 flex-1">
          {/* Spanish Translation */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 block mb-0.5">
              Traducción
            </span>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {vocab.translationEs}
            </p>
          </div>

          {/* English Definition */}
          {vocab.definitionEn && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans line-clamp-2">
                {vocab.definitionEn}
              </p>
            </div>
          )}

          {/* Context Example */}
          {firstExample && (
            <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-[#161B28]/60 border border-gray-100 dark:border-white/[0.04] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-600/90 dark:text-indigo-400/90">
                <BookOpen className="w-3 h-3" />
                <span>Ejemplo en Contexto</span>
              </div>
              <p className="font-editorial text-xs text-gray-800 dark:text-gray-200 italic leading-relaxed">
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
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="text-[11px] text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                <span>Familia léxica ({vocab.morphologicalFamilyJson.length})</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {isExpanded && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2 animate-in fade-in duration-200">
                  {vocab.morphologicalFamilyJson.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono border border-purple-200/50 dark:border-purple-900/40"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/50 dark:bg-[#10131B]/50">
        <span className="font-medium text-gray-500 dark:text-gray-400">
          {GRAMMATICAL_DIMENSION_LABELS_ES[vocab.grammaticalDimension] ?? vocab.grammaticalDimension}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-medium">
          <span>Detalles</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
