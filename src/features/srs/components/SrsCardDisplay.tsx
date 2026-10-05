import { useState } from 'react';
import {
  AlertTriangle,
  Volume2,
  Volume1,
  RotateCw,
  Repeat,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VocabItem, VocabContextExample, PART_OF_SPEECH_LABELS_ES } from '@/core/types/vocab';
import { SrsCard, FsrsGrade } from '@/core/types/srs';
import { ConnectedSpeechPill } from '@/features/phonology/components/ConnectedSpeechPill';
import { useAudio } from '@/shared/hooks/useAudio';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { VerbTensesCard } from '@/features/vocab/components/VerbTensesCard';

export interface SrsCardDisplayProps {
  selectedVocab: VocabItem;
  currentContext: VocabContextExample | null;
  availableContexts: VocabContextExample[];
  srsCard: SrsCard | null;
  showAnswer: boolean;
  previewIntervals: Record<number, number>;
  onRotateContext: () => void;
  onShowAnswer: () => void;
  onFlipBack?: () => void;
  onRate: (grade: FsrsGrade) => void;
  isRating?: boolean;
  audioService?: AudioService;
}

const SRS_STATE_LABELS: Record<string, string> = {
  NEW: 'Nueva',
  LEARNING: 'Aprendiendo',
  REVIEW: 'En Repaso',
  RELEARNING: 'Reaprendiendo',
};

export function SrsCardDisplay({
  selectedVocab,
  currentContext,
  availableContexts,
  srsCard,
  showAnswer,
  previewIntervals,
  onRotateContext,
  onShowAnswer,
  onFlipBack,
  onRate,
  isRating = false,
  audioService: audioProp,
}: SrsCardDisplayProps) {
  const { audioService: defaultAudio } = useAudio();
  const audioService = audioProp ?? defaultAudio;
  const [showHint, setShowHint] = useState(false);
  const [showPhoneticsDrawer, setShowPhoneticsDrawer] = useState(false);

  const partOfSpeechEs =
    PART_OF_SPEECH_LABELS_ES[selectedVocab.partOfSpeech] ?? selectedVocab.partOfSpeech;

  const formatInterval = (days: number | undefined) => {
    if (days === undefined || days <= 0) return '<10m';
    if (days === 1) return '1 día';
    return `${days} días`;
  };

  return (
    <div className="perspective-1000 w-full min-h-[560px]">
      <div
        className={`relative w-full min-h-[560px] transition-transform duration-500 transform-style-3d ${
          showAnswer ? 'rotate-y-180' : ''
        }`}
      >
        {/* ============================================================ */}
        {/* FRONT FACE (ANVERSO - ESTÍMULO DE ACTIVE RECALL)             */}
        {/* ============================================================ */}
        <div className="backface-hidden w-full min-h-[560px] bg-white dark:bg-[#11141F] rounded-3xl p-8 border border-gray-200/80 dark:border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between select-none">
          <div className="space-y-6">
            {/* Top metadata strip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Nivel {selectedVocab.cefrLevel}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {partOfSpeechEs}
                </span>
                {selectedVocab.domainCategory && (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    {selectedVocab.domainCategory}
                  </span>
                )}
              </div>

              {selectedVocab.isFalseFriend && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Falso Amigo
                </span>
              )}
            </div>

            {/* Stimulus Presentation */}
            <div className="text-center py-10 border-b border-gray-100 dark:border-gray-800/60 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block">
                Palabra Objetivo
              </span>

              <h2 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {selectedVocab.word}
              </h2>

              {selectedVocab.ipaGeneralAmerican && (
                <p
                  className="text-lg text-indigo-600 dark:text-indigo-400 font-phonetic font-medium pt-1"
                  style={{ fontFamily: 'var(--font-phonetic)' }}
                >
                  /{selectedVocab.ipaGeneralAmerican}/
                </p>
              )}

              {/* Contextual Meaning / Category Discriminator for Polysemic Words */}
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70 shadow-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Categoría: <strong>{partOfSpeechEs}</strong></span>
                  {selectedVocab.domainCategory && (
                    <>
                      <span className="text-indigo-300 dark:text-indigo-700">•</span>
                      <span>Ámbito: <strong>{selectedVocab.domainCategory}</strong></span>
                    </>
                  )}
                </span>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => audioService.speak(selectedVocab.word, 1.0)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100/80 hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-950/60 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Pronunciación nativa (1.0x)"
                >
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                  <span>1.0x Nativo</span>
                </button>

                <button
                  type="button"
                  onClick={() => audioService.speak(selectedVocab.word, 0.75)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100/80 hover:bg-amber-50 dark:bg-gray-800 dark:hover:bg-amber-950/60 text-gray-700 hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Pronunciación lenta (0.75x)"
                >
                  <Volume1 className="w-4 h-4 text-amber-500" />
                  <span>0.75x Lento</span>
                </button>
              </div>
            </div>

            {/* Context Cloze Hint */}
            {currentContext ? (
              <div className="py-1">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-semibold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showHint ? 'Ocultar pista' : '¿Pista? Ver contexto cloze'}</span>
                  </button>

                  {availableContexts.length > 1 && showHint && (
                    <button
                      type="button"
                      onClick={onRotateContext}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Rotar a otro ejemplo contextual"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotar</span>
                    </button>
                  )}
                </div>

                {showHint && (
                  <div className="mt-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#161B28] border border-gray-200/60 dark:border-gray-800 text-xs animate-in fade-in duration-200">
                    <p className="font-editorial text-sm text-gray-800 dark:text-gray-200 italic">
                      &ldquo;{currentContext.sentenceEn}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Action: Reveal Answer */}
          <div className="pt-4">
            <button
              type="button"
              onClick={onShowAnswer}
              className="w-full py-4 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer group"
            >
              <Repeat className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
              <span>Mostrar Respuesta</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BACK FACE (REVERSO - DISEÑO RADICAL MINIMALISTA Y ELEGANTE)   */}
        {/* ============================================================ */}
        <div className="backface-hidden rotate-y-180 absolute inset-0 w-full min-h-[560px] bg-gradient-to-b from-white to-[#FBFBFA] dark:from-[#11141F] dark:to-[#0D0F17] rounded-3xl p-8 border border-gray-200/80 dark:border-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.04)] flex flex-col justify-between select-none overflow-y-auto custom-scrollbar-thin">
          <div className="space-y-5">
            {/* Header: Level & Navigation controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Nivel {selectedVocab.cefrLevel}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {partOfSpeechEs}
                </span>
                {selectedVocab.domainCategory && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                    Ámbito: {selectedVocab.domainCategory}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Audio quick replay */}
                <button
                  type="button"
                  onClick={() => audioService.speak(selectedVocab.word, 1.0)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  title="Escuchar de nuevo"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {onFlipBack && (
                  <button
                    type="button"
                    onClick={onFlipBack}
                    className="text-xs text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Volver al anverso"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hero Answer Card (Spacious, Elegant, No Box-in-Box) */}
            <div className="space-y-2 py-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {selectedVocab.translationEs}
                </h2>
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <span>/</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedVocab.word}</span>
                  {selectedVocab.ipaGeneralAmerican && (
                    <span
                      className="font-phonetic text-xs text-indigo-600 dark:text-indigo-400"
                      style={{ fontFamily: 'var(--font-phonetic)' }}
                    >
                      /{selectedVocab.ipaGeneralAmerican}/
                    </span>
                  )}
                </div>
                {selectedVocab.domainCategory && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-200/50 dark:border-purple-800/40">
                    {selectedVocab.domainCategory}
                  </span>
                )}
              </div>

              {selectedVocab.definitionEn && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans max-w-xl">
                  {selectedVocab.definitionEn}
                </p>
              )}

              {/* False friend subtle callout */}
              {selectedVocab.isFalseFriend && selectedVocab.falseFriendNote && (
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-900/60">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span><strong>Falso Amigo:</strong> {selectedVocab.falseFriendNote}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Contextual Narrative Section (Clean & Typographic) */}
            {currentContext ? (
              <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#161B28]/60 border border-gray-100 dark:border-gray-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Uso Auténtico en Contexto
                  </span>
                  {availableContexts.length > 1 && (
                    <button
                      type="button"
                      onClick={onRotateContext}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotar ejemplo ({availableContexts.length})</span>
                    </button>
                  )}
                </div>

                <p className="font-editorial text-base text-gray-900 dark:text-gray-100 italic leading-snug">
                  &ldquo;{currentContext.sentenceEn}&rdquo;
                </p>

                {currentContext.sentenceEs && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentContext.sentenceEs}
                  </p>
                )}

                {/* Collapsible Phonetics & Connected Speech Drawer */}
                <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800/60">
                  <button
                    type="button"
                    onClick={() => setShowPhoneticsDrawer(!showPhoneticsDrawer)}
                    className="w-full flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold cursor-pointer py-0.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Análisis Fonológico & Discurso Conectado</span>
                    </span>
                    {showPhoneticsDrawer ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {showPhoneticsDrawer && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      <ConnectedSpeechPill
                        sentence={currentContext.sentenceEn}
                        audioService={audioService}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* When no context sentence is registered, ensure phonetic analysis is still fully accessible for the word */
              <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#161B28]/60 border border-gray-100 dark:border-gray-800/80 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneticsDrawer(!showPhoneticsDrawer)}
                  className="w-full flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold cursor-pointer py-0.5"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Análisis Fonológico de la Palabra</span>
                  </span>
                  {showPhoneticsDrawer ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showPhoneticsDrawer && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <ConnectedSpeechPill
                      sentence={selectedVocab.word}
                      audioService={audioService}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Verb Tenses Pill if word is a verb */}
            {selectedVocab.partOfSpeech === 'VERB' && selectedVocab.verbTensesJson && (
              <div className="pt-1">
                <VerbTensesCard tenses={selectedVocab.verbTensesJson} compact />
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* FSRS RATING DOCK (HERO INTERACTION)                         */}
          {/* ============================================================ */}
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800/80">
            {/* Intraday learning / relearning step callout to prevent false priming expectations */}
            {(srsCard?.state === 'LEARNING' || srsCard?.state === 'RELEARNING') && (
              <div className="flex items-center gap-2 p-2.5 px-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  <strong>Paso de Consolidación Intradía:</strong> Al repasar esta tarjeta en la misma sesión, las opciones exitosas la afianzan para mañana (1-2 días) evitando sobrestimar tu memoria por recuerdo inmediato (<em>priming</em>).
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Califica tu retención (FSRS v5):
              </span>
            </div>

            {/* 4 Ergonomic Precision Buttons */}
            <div className="grid grid-cols-4 gap-2.5">
              {/* Grade 1: Repetir */}
              <button
                type="button"
                disabled={isRating}
                onClick={() => onRate(1)}
                className="group py-3 px-2 rounded-2xl bg-gray-50/90 dark:bg-[#161B28] hover:bg-white dark:hover:bg-[#1D2335] border border-gray-200/70 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-900/60 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800 dark:text-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
                  <span>Repetir</span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-medium transition-colors">
                  {formatInterval(previewIntervals[1])}
                </div>
              </button>

              {/* Grade 2: Difícil */}
              <button
                type="button"
                disabled={isRating}
                onClick={() => onRate(2)}
                className="group py-3 px-2 rounded-2xl bg-gray-50/90 dark:bg-[#161B28] hover:bg-white dark:hover:bg-[#1D2335] border border-gray-200/70 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-900/60 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800 dark:text-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
                  <span>Difícil</span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-medium transition-colors">
                  {formatInterval(previewIntervals[2])}
                </div>
              </button>

              {/* Grade 3: Bueno (Sugerido / Hero Option) */}
              <button
                type="button"
                disabled={isRating}
                onClick={() => onRate(3)}
                className="group py-3 px-2 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  <span>Bueno</span>
                </div>
                <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {formatInterval(previewIntervals[3])}
                </div>
              </button>

              {/* Grade 4: Fácil */}
              <button
                type="button"
                disabled={isRating}
                onClick={() => onRate(4)}
                className="group py-3 px-2 rounded-2xl bg-gray-50/90 dark:bg-[#161B28] hover:bg-white dark:hover:bg-[#1D2335] border border-gray-200/70 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-900/60 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800 dark:text-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  <span>Fácil</span>
                </div>
                <div className="text-[11px] font-mono text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-medium transition-colors">
                  {formatInterval(previewIntervals[4])}
                </div>
              </button>
            </div>

            {/* Memory Telemetry Footer */}
            {srsCard && (
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800/80 font-mono">
                <span>
                  Estado: <strong className="text-gray-700 dark:text-gray-300 font-sans">{SRS_STATE_LABELS[srsCard.state] ?? srsCard.state}</strong>
                </span>
                <span>
                  Estabilidad: <strong className="text-indigo-600 dark:text-indigo-400">{srsCard.stability.toFixed(2)}d</strong>
                </span>
                <span>
                  Dificultad: <strong>{srsCard.difficulty.toFixed(1)}/10</strong>
                </span>
                <span>
                  Repasos: <strong>{srsCard.reps}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
