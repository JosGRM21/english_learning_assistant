import React, { useState, useEffect } from 'react';
import {
  Volume2,
  ExternalLink,
  CheckSquare,
  Square,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  VocabItem,
  VocabContextExample,
  GRAMMATICAL_DIMENSION_LABELS_ES,
} from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';
import { getVoiceForAccent } from '@/infrastructure/audio/AudioService';

export interface VocabCardProps {
  vocab: VocabItem;
  examples?: VocabContextExample[];
  onSelectWord?: (vocab: VocabItem) => void;
  onActivateWord?: (id: string) => Promise<VocabItem | null>;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (vocab: VocabItem) => void;
  onContextMenu?: (e: React.MouseEvent, vocab: VocabItem) => void;
  accentPreference?: 'US' | 'UK';
}

export const VocabCard = React.memo(function VocabCard({
  vocab,
  examples,
  onSelectWord,
  onActivateWord: _onActivateWord,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onContextMenu,
  accentPreference = 'US',
}: VocabCardProps) {
  const { audioService } = useAudio();
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  const [isPlayingExample, setIsPlayingExample] = useState(false);
  const [currentAccent, setCurrentAccent] = useState<'US' | 'UK'>(accentPreference);

  useEffect(() => {
    setCurrentAccent(accentPreference);
  }, [accentPreference]);

  const activeVoice = getVoiceForAccent(currentAccent);

  // Polysemic senses awareness
  const primarySense =
    vocab.sensesJson && vocab.sensesJson.length > 0
      ? vocab.sensesJson[0]
      : null;

  const totalSensesCount =
    vocab.sensesJson?.length ||
    (vocab.alternateSensesJson ? vocab.alternateSensesJson.length + 1 : 1);

  // Representative values for Primary Sense
  const displayTranslation = primarySense?.translationEs || vocab.translationEs;
  const displayDefinition = primarySense?.definitionEn || vocab.definitionEn;
  const displayCefr = primarySense?.cefrLevel || vocab.cefrLevel;

  // Context graduated example from Sense 1 or fallback
  const basicExampleEn =
    primarySense?.graduatedExamples?.sentenceBasicEn ||
    primarySense?.exampleSentenceEn ||
    (examples && examples.length > 0 ? examples[0].sentenceEn : null);

  const basicExampleEs =
    primarySense?.graduatedExamples?.sentenceBasicEs ||
    primarySense?.exampleSentenceEs ||
    (examples && examples.length > 0 ? examples[0].sentenceEs : null);

  const activeIpa =
    currentAccent === 'UK' && vocab.ipaReceivedPronunciation
      ? vocab.ipaReceivedPronunciation
      : vocab.ipaGeneralAmerican;

  const isPhrasalVerb =
    vocab.subcategory === 'PHRASAL_VERB' ||
    vocab.domainCategory === 'Phrasal Verb' ||
    (vocab.grammaticalDimension === 'CHUNK' && vocab.partOfSpeech === 'VERB');

  const handleSpeakWord = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingWord) return;
    try {
      setIsPlayingWord(true);
      await audioService.speak(vocab.word, 1.0, activeVoice);
    } finally {
      setIsPlayingWord(false);
    }
  };

  const handleSpeakExample = async (e: React.MouseEvent, sentence: string) => {
    e.stopPropagation();
    if (isPlayingExample) return;
    try {
      setIsPlayingExample(true);
      await audioService.speak(sentence, 0.95, activeVoice);
    } finally {
      setIsPlayingExample(false);
    }
  };

  const getCefrBadgeStyle = (level: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-100/80 text-emerald-800 border-emerald-300/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50';
      case 'B1':
        return 'bg-sky-100/80 text-sky-800 border-sky-300/70 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700/50';
      case 'B2':
        return 'bg-indigo-100/80 text-indigo-800 border-indigo-300/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700/50';
      case 'C1':
        return 'bg-purple-100/80 text-purple-800 border-purple-300/70 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-700/50';
      case 'C2':
        return 'bg-amber-100/80 text-amber-800 border-amber-300/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300/70 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const handleCardClick = () => {
    if ((isSelectionMode || isSelected) && onToggleSelect) {
      onToggleSelect(vocab);
    } else {
      onSelectWord?.(vocab);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, vocab);
      }}
      className={`group relative rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${isSelected
        ? 'border-indigo-500 bg-white dark:bg-[#131722] ring-2 ring-indigo-500/50 shadow-md'
        : 'border-gray-200/90 dark:border-white/[0.08] bg-white dark:bg-[#131722] hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
        }`}
    >
      {/* Top ambient accent glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/40 dark:via-indigo-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex-1 flex flex-col justify-between p-5 pb-3.5 space-y-3">
        {/* Headword Row: Word + Speaker Button + CEFR Level beside it */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Selection Checkbox */}
            {(isSelectionMode || isSelected) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(vocab);
                }}
                className={`p-0.5 rounded-md transition-colors cursor-pointer mr-0.5 shrink-0 ${isSelected
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 fill-indigo-100 dark:fill-indigo-950/60" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}

            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sans truncate">
              {vocab.word}
            </h3>

            <button
              type="button"
              onClick={handleSpeakWord}
              disabled={isPlayingWord}
              className={`p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0 ${isPlayingWord ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''
                }`}
              title="Escuchar pronunciación nativa"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* CEFR Level Pill beside the word */}
          <span
            className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-bold border shrink-0 ${getCefrBadgeStyle(
              displayCefr,
            )}`}
          >
            {displayCefr}
          </span>
        </div>

        {/* Phonetic IPA */}
        {activeIpa && (
          <div className="flex items-center gap-1.5 -mt-1.5">
            <span
              className="font-phonetic text-xs font-medium text-indigo-600 dark:text-indigo-400 tracking-wide"
              style={{ fontFamily: 'var(--font-phonetic)' }}
            >
              /{activeIpa}/
            </span>
            {vocab.ipaReceivedPronunciation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentAccent((prev) => (prev === 'US' ? 'UK' : 'US'));
                }}
                className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-gray-100 hover:bg-indigo-100 dark:bg-gray-800 dark:hover:bg-indigo-950 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer"
                title={`Conmutar acento (actual: ${currentAccent})`}
              >
                {currentAccent}
              </button>
            )}
          </div>
        )}

        {/* Tier 3: Meaning & Polysemic Chip */}
        <div className="space-y-1 pt-1.5 border-t border-gray-100 dark:border-white/[0.05]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
              Traducción
            </span>

            {totalSensesCount > 1 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0"
                title={`${totalSensesCount} acepciones`}
              >
                <Layers className="w-2.5 h-2.5 text-indigo-500" />
                <span>{totalSensesCount} acepciones</span>
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
            {displayTranslation}
          </p>

          {displayDefinition && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans line-clamp-2">
              {displayDefinition}
            </p>
          )}
        </div>

        {/* Tier 4: Minimalist Context Example */}
        {basicExampleEn && (
          <div className="p-3 rounded-2xl bg-gray-50/80 dark:bg-[#121626]/80 border border-gray-100 dark:border-white/[0.06] text-xs space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">
                  Ejemplo en Contexto
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => handleSpeakExample(e, basicExampleEn)}
                disabled={isPlayingExample}
                className={`p-1 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0 ${isPlayingExample ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''
                  }`}
                title="Escuchar oración"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-editorial text-xs sm:text-[13px] font-bold text-gray-800 dark:text-slate-100 italic leading-snug line-clamp-2">
              &ldquo;{basicExampleEn}&rdquo;
            </p>
            {basicExampleEs && (
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 line-clamp-1 font-sans">
                {basicExampleEs}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Clean Dimension + Detalles */}
      <div className="px-5 py-2.5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/40 dark:bg-[#111520]/40 group-hover:bg-indigo-50/20 dark:group-hover:bg-indigo-950/20 transition-colors">
        <span className="font-medium text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
          {isPhrasalVerb
            ? 'Expresión / Frase'
            : GRAMMATICAL_DIMENSION_LABELS_ES[vocab.grammaticalDimension] ?? vocab.grammaticalDimension}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-semibold shrink-0">
          <span>Detalles</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.vocab.id === nextProps.vocab.id &&
    prevProps.vocab.masteryStatus === nextProps.vocab.masteryStatus &&
    prevProps.vocab.word === nextProps.vocab.word &&
    prevProps.vocab.translationEs === nextProps.vocab.translationEs &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.accentPreference === nextProps.accentPreference &&
    prevProps.examples?.length === nextProps.examples?.length
  );
});
