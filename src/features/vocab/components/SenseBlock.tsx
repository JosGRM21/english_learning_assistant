import { useState } from 'react';
import {
  Volume2,
  ExternalLink,
  PlusCircle,
  CheckCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  VocabSense,
  VocabItem,
  PART_OF_SPEECH_LABELS_ES,
} from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';
import { getVoiceForAccent } from '@/infrastructure/audio/AudioService';

export interface SenseBlockProps {
  sense: VocabSense;
  senseNumber: number;
  totalSenses?: number;
  onSpeakExample?: (text: string) => void;
  matchingCard?: VocabItem | null;
  onNavigateToCard?: (vocab: VocabItem) => void;
  onCreateIndependentCard?: (sense: VocabSense) => Promise<void>;
  isCreatingCard?: boolean;
  isPhrasalVerb?: boolean;
  accentPreference?: 'US' | 'UK';
}

export function SenseBlock({
  sense,
  senseNumber,
  totalSenses = 1,
  onSpeakExample,
  matchingCard,
  onNavigateToCard,
  onCreateIndependentCard,
  isCreatingCard = false,
  isPhrasalVerb = false,
  accentPreference = 'US',
}: SenseBlockProps) {
  const { audioService } = useAudio();
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);

  const handleSpeak = async (key: string, text: string) => {
    if (onSpeakExample) {
      onSpeakExample(text);
      return;
    }
    if (playingAudioKey) return;
    try {
      setPlayingAudioKey(key);
      await audioService.speak(text, 0.95, getVoiceForAccent(accentPreference));
    } finally {
      setPlayingAudioKey(null);
    }
  };

  const basicExample = sense.graduatedExamples?.sentenceBasicEn || sense.exampleSentenceEn;
  const basicTranslation = sense.graduatedExamples?.sentenceBasicEs || sense.exampleSentenceEs;
  const advancedExample = sense.graduatedExamples?.sentenceAdvancedEn;
  const advancedTranslation = sense.graduatedExamples?.sentenceAdvancedEs;

  const cleanBasic = basicExample?.trim().toLowerCase();
  const cleanAdv = advancedExample?.trim().toLowerCase();
  const hasValidAdvanced = Boolean(cleanAdv && cleanAdv !== cleanBasic);

  const isPrimary = senseNumber === 1;
  const hasMultipleSenses = totalSenses > 1;

  return (
    <section
      aria-label={`Acepción ${senseNumber}: ${sense.translationEs}`}
      className={`group/sense relative rounded-3xl p-5 space-y-4 shadow-xs transition-all ${
        hasMultipleSenses
          ? isPrimary
            ? 'border-l-4 border-l-indigo-500 bg-white dark:bg-[#111524] border border-indigo-200/60 dark:border-indigo-900/40 shadow-sm'
            : 'border-l-4 border-l-slate-400 dark:border-l-slate-600 bg-white dark:bg-[#0e121f] border border-gray-200/80 dark:border-white/[0.06]'
          : 'bg-white dark:bg-[#111524] border border-gray-200/80 dark:border-white/[0.06]'
      }`}
    >
      {/* Sense Hierarchy Ribbon / Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasMultipleSenses && (
            isPrimary ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Acepción 1 de {totalSenses} (Principal)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                <span>
                  Acepción {senseNumber} de {totalSenses}
                </span>
              </span>
            )
          )}

          {/* CEFR Level Chip */}
          {sense.cefrLevel && (
            <span
              className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold border ${
                sense.cefrLevel === 'A1' || sense.cefrLevel === 'A2'
                  ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
                  : sense.cefrLevel === 'B1'
                  ? 'bg-sky-100/80 text-sky-800 border-sky-300/70 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700/50'
                  : sense.cefrLevel === 'B2'
                  ? 'bg-indigo-100/80 text-indigo-800 border-indigo-300/70 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700/50'
                  : sense.cefrLevel === 'C1'
                  ? 'bg-purple-100/80 text-purple-800 border-purple-300/70 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-700/50'
                  : 'bg-amber-100/80 text-amber-800 border-amber-300/70 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50'
              }`}
            >
              {sense.cefrLevel}
            </span>
          )}

          {/* Part of Speech or Phrasal Verb Badge */}
          {isPhrasalVerb ? (
            <span className="px-2 py-0.5 rounded-lg font-medium text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-500/40">
              Phrasal Verb
            </span>
          ) : sense.partOfSpeech ? (
            <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-[#141824] text-gray-700 dark:text-slate-300 font-medium text-[10px] border border-gray-200 dark:border-white/[0.08]">
              {PART_OF_SPEECH_LABELS_ES[sense.partOfSpeech] ?? sense.partOfSpeech}
            </span>
          ) : null}

          {/* Domain Category / Uso General */}
          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-[10px] border border-indigo-200 dark:border-indigo-500/40">
            {sense.domainCategory && sense.domainCategory !== 'Phrasal Verb'
              ? sense.domainCategory
              : 'Uso General'}
          </span>
        </div>

        {/* Action buttons: Ver Tarjeta o Crear Tarjeta */}
        <div className="flex items-center gap-2 shrink-0">
          {matchingCard && onNavigateToCard && (
            <button
              type="button"
              onClick={() => onNavigateToCard(matchingCard)}
              className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Abrir la tarjeta de estudio de esta acepción"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ver Tarjeta</span>
              <ExternalLink className="w-3 h-3 text-emerald-500/70" />
            </button>
          )}

          {!matchingCard && onCreateIndependentCard && (
            <button
              type="button"
              onClick={() => onCreateIndependentCard(sense)}
              disabled={isCreatingCard}
              className="h-7 px-2.5 rounded-lg bg-gray-100 hover:bg-indigo-50 dark:bg-[#181D2D] dark:hover:bg-indigo-950/60 text-gray-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-gray-200/80 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-indigo-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs disabled:opacity-50"
              title="Convertir esta acepción en una tarjeta de estudio independiente con su propio FSRS"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{isCreatingCard ? 'Creando...' : 'Crear Tarjeta'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Translation Heading */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-400 uppercase">
          Traducción en Español
        </span>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {sense.translationEs}
        </h3>
      </div>

      {/* Syntactic Dimensions: Countability & Connotation (Pista y Régimen eliminados por RF-VOC UI) */}
      {(sense.countability || (sense.connotation && sense.connotation !== 'NEUTRAL')) && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {sense.countability && (
            <span
              className="px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold bg-gray-100 dark:bg-[#141824] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-slate-300"
              title={
                sense.countability === 'COUNTABLE'
                  ? 'Sustantivo Contable [C]'
                  : sense.countability === 'UNCOUNTABLE'
                  ? 'Sustantivo Incontable [U]'
                  : 'Sustantivo con doble uso Contable e Incontable [C/U]'
              }
            >
              {sense.countability === 'COUNTABLE' ? '[C] Contable' : sense.countability === 'UNCOUNTABLE' ? '[U] Incontable' : '[C/U]'}
            </span>
          )}

          {sense.connotation && sense.connotation !== 'NEUTRAL' && (
            <span
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                sense.connotation === 'POSITIVE'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
            >
              {sense.connotation === 'POSITIVE' ? 'Connotación Favorable' : 'Peyorativo / Desfavorable'}
            </span>
          )}
        </div>
      )}

      {/* English Definition */}
      {sense.definitionEn && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-slate-400 uppercase">
            Definición en Inglés
          </span>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed font-sans">
            {sense.definitionEn}
          </p>
        </div>
      )}

      {/* Oraciones en contexto */}
      {basicExample && (
        <div className="space-y-2.5 pt-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-slate-300 uppercase">
              Oraciones en Contexto ({hasValidAdvanced ? 2 : 1})
            </span>
          </div>

          {/* Example 1 Container */}
          <div className="relative rounded-2xl bg-gray-50/80 dark:bg-[#121626]/80 border border-gray-200/70 dark:border-white/[0.06] p-4 pr-11 space-y-1.5 shadow-2xs">
            <p className="font-editorial text-sm sm:text-[15px] font-bold text-gray-900 dark:text-slate-100 italic leading-snug">
              &ldquo;{basicExample}&rdquo;
            </p>
            {basicTranslation && (
              <p className="text-xs sm:text-[13px] text-gray-600 dark:text-slate-400 font-sans leading-relaxed">
                {basicTranslation}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleSpeak(`basic_${senseNumber}`, basicExample)}
              disabled={playingAudioKey === `basic_${senseNumber}`}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer ${
                playingAudioKey === `basic_${senseNumber}` ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''
              }`}
              title="Escuchar oración"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Example 2 Container */}
          {hasValidAdvanced && (
            <div className="relative rounded-2xl bg-gray-50/80 dark:bg-[#121626]/80 border border-gray-200/70 dark:border-white/[0.06] p-4 pr-11 space-y-1.5 shadow-2xs">
              <p className="font-editorial text-sm sm:text-[15px] font-bold text-gray-900 dark:text-slate-100 italic leading-snug">
                &ldquo;{advancedExample}&rdquo;
              </p>
              {advancedTranslation && (
                <p className="text-xs sm:text-[13px] text-gray-600 dark:text-slate-400 font-sans leading-relaxed">
                  {advancedTranslation}
                </p>
              )}

              <button
                type="button"
                onClick={() => handleSpeak(`adv_${senseNumber}`, advancedExample!)}
                disabled={playingAudioKey === `adv_${senseNumber}`}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer ${
                  playingAudioKey === `adv_${senseNumber}` ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : ''
                }`}
                title="Escuchar oración"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
