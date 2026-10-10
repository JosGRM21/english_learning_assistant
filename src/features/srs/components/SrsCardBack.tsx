import { useState } from 'react';
import {
  AlertTriangle,
  Volume2,
  Volume1,
  RotateCw,
  Repeat,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VocabItem, VocabContextExample, PART_OF_SPEECH_LABELS_ES } from '@/core/types/vocab';
import { SrsCard, FsrsGrade } from '@/core/types/srs';
import { ConnectedSpeechPill } from '@/features/phonology/components/ConnectedSpeechPill';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { VerbTensesCard } from '@/features/vocab/components/VerbTensesCard';

export interface SrsCardBackProps {
  selectedVocab: VocabItem;
  currentContext: VocabContextExample | null;
  availableContexts: VocabContextExample[];
  srsCard: SrsCard | null;
  previewIntervals: Record<number, number>;
  accent: 'US' | 'UK';
  onAccentChange: (accent: 'US' | 'UK') => void;
  onRotateContext: () => void;
  onFlipBack?: () => void;
  onRate: (grade: FsrsGrade) => void;
  isRating?: boolean;
  audioService: AudioService;
}

export const formatInterval = (days: number | undefined) => {
  if (days === undefined || days <= 0) return '<10m';
  if (days === 1) return '1 día';
  return `${days} días`;
};

export function SrsCardBack({
  selectedVocab,
  currentContext,
  availableContexts,
  srsCard,
  previewIntervals,
  accent,
  onAccentChange,
  onRotateContext,
  onFlipBack,
  onRate,
  isRating = false,
  audioService,
}: SrsCardBackProps) {
  const [showPhoneticsDrawer, setShowPhoneticsDrawer] = useState(false);

  const partOfSpeechEs =
    PART_OF_SPEECH_LABELS_ES[selectedVocab.partOfSpeech] ?? selectedVocab.partOfSpeech;

  const activeVoice = accent === 'UK' ? 'bf_emma' : 'af_heart';

  const activeIpa =
    accent === 'UK' && selectedVocab.ipaReceivedPronunciation
      ? selectedVocab.ipaReceivedPronunciation
      : selectedVocab.ipaGeneralAmerican;

  const playWordAudio = (rate: number) => {
    audioService.speak(selectedVocab.word, rate, activeVoice);
  };

  const playSentenceAudio = (sentence: string, rate: number) => {
    audioService.speak(sentence, rate, activeVoice);
  };

  return (
    <div className="backface-hidden rotate-y-180 absolute inset-0 w-full min-h-[580px] bg-gradient-to-b from-white via-white to-slate-50/50 dark:from-[#11141F] dark:via-[#11141F] dark:to-[#0D0F17] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col justify-between select-none overflow-y-auto custom-scrollbar-thin">
      <div className="space-y-4">
        {/* ============================================================ */}
        {/* TOP BAR: Metadatos esenciales & Controles de reproducción    */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 dark:border-slate-800/60 pb-3.5">
          {/* Metadata badges: Nivel, Categoría, Ámbito */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50/90 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 tracking-tight">
              Nivel {selectedVocab.cefrLevel}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100/90 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
              {partOfSpeechEs}
            </span>
            {selectedVocab.domainCategory && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50/90 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                Ámbito: {selectedVocab.domainCategory}
              </span>
            )}
          </div>

          {/* Controls: Acento US/UK y Volver */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
              <button
                type="button"
                onClick={() => onAccentChange('US')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  accent === 'US'
                    ? 'bg-white dark:bg-[#161B28] text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-label="Acento General American"
              >
                🇺🇸 US
              </button>
              <button
                type="button"
                onClick={() => onAccentChange('UK')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  accent === 'UK'
                    ? 'bg-white dark:bg-[#161B28] text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                aria-label="Acento Received Pronunciation"
              >
                🇬🇧 UK
              </button>
            </div>

            {onFlipBack && (
              <button
                type="button"
                onClick={onFlipBack}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Volver al estímulo inicial (Esc)"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* LEECH CALLOUT: Alerta sutil y constructiva                   */}
        {/* ============================================================ */}
        {srsCard?.isLeech && (
          <div className="p-3 px-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Atención pedagógica:</strong> Palabra con tropiezos frecuentes ({srsCard.consecutiveLapses || srsCard.lapses} fallos). Apóyate en su contexto y colocaciones.
              </span>
            </div>
            {availableContexts.length > 1 && (
              <button
                type="button"
                onClick={onRotateContext}
                className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                <span>Rotar contexto</span>
              </button>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* HERO MEANING: Significado principal, Fonética y Audio       */}
        {/* ============================================================ */}
        <div className="space-y-3 py-1">
          {/* Fila principal: Traducción en español */}
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white select-text">
              {selectedVocab.translationEs}
            </h2>

            {/* Audio triggers directos para la palabra */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => playWordAudio(1.0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-200 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Escuchar de nuevo (tecla R)"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Audio</span>
                <kbd className="text-[10px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700/60">R</kbd>
              </button>

              <button
                type="button"
                onClick={() => playWordAudio(0.75)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100/80 hover:bg-amber-50 dark:bg-slate-800/60 dark:hover:bg-amber-950/40 text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 border border-slate-200/50 dark:border-slate-700/50 hover:border-amber-200 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Escuchar de nuevo lento (tecla S)"
              >
                <Volume1 className="w-3.5 h-3.5 text-amber-500" />
                <span>Lento</span>
                <kbd className="text-[10px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700/60">S</kbd>
              </button>
            </div>
          </div>

          {/* Subtítulo: Palabra en inglés + Transcripción IPA */}
          <div className="flex items-center gap-2.5 flex-wrap text-sm">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg select-text">
              {selectedVocab.word}
            </span>
            {activeIpa && (
              <span
                className="text-base text-slate-500 dark:text-slate-400 font-phonetic font-medium"
                style={{ fontFamily: 'var(--font-phonetic)' }}
              >
                /{activeIpa}/
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border border-slate-200/40 dark:border-slate-700/40">
              {accent}
            </span>
          </div>

          {/* Definición en inglés */}
          {selectedVocab.definitionEn && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans max-w-2xl">
              {selectedVocab.definitionEn}
            </p>
          )}

          {/* Colocaciones naturales */}
          {selectedVocab.collocationsJson && selectedVocab.collocationsJson.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Colocaciones:
              </span>
              {selectedVocab.collocationsJson.slice(0, 3).map((colloc, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-medium border border-slate-200/50 dark:border-slate-700/50 italic font-editorial"
                >
                  {colloc}
                </span>
              ))}
            </div>
          )}

          {/* Falso amigo (si aplica) */}
          {selectedVocab.isFalseFriend && selectedVocab.falseFriendNote && (
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  <strong>Falso Amigo:</strong> {selectedVocab.falseFriendNote}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* CONTEXTO & FONOLOGÍA: Oración de uso y análisis auditivo     */}
        {/* ============================================================ */}
        {currentContext ? (
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#151926]/70 border border-slate-200/60 dark:border-slate-800/80 space-y-3">
            {/* Header del bloque de contexto */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Uso en Contexto
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => playSentenceAudio(currentContext.sentenceEn, 1.0)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Escuchar oración (1.0x)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => playSentenceAudio(currentContext.sentenceEn, 0.75)}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Escuchar oración lenta (0.75x)"
                  >
                    <Volume1 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {availableContexts.length > 1 && (
                <button
                  type="button"
                  onClick={onRotateContext}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer font-medium transition-colors"
                  title="Cambiar a otro ejemplo contextual (tecla N)"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotar ejemplo ({availableContexts.length})</span>
                </button>
              )}
            </div>

            {/* Texto de la oración */}
            <p className="font-editorial text-base sm:text-lg text-slate-900 dark:text-slate-100 italic leading-snug">
              &ldquo;{currentContext.sentenceEn}&rdquo;
            </p>

            {currentContext.sentenceEs && (
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {currentContext.sentenceEs}
              </p>
            )}

            {/* Desplegable de análisis fonológico */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowPhoneticsDrawer(!showPhoneticsDrawer)}
                className="w-full flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold cursor-pointer py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Análisis Fonológico & Habla Conectada (Linking, Glides, Weak Forms)</span>
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
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#151926]/70 border border-slate-200/60 dark:border-slate-800/80 space-y-2">
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

        {/* Conjugación verbal (si es verbo) */}
        {selectedVocab.partOfSpeech === 'VERB' && selectedVocab.verbTensesJson && (
          <div className="pt-1">
            <VerbTensesCard tenses={selectedVocab.verbTensesJson} compact />
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* RATING DOCK: Ergonomía de calificación limpia y elegante    */}
      {/* ============================================================ */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            ¿Cómo fue tu nivel de recuerdo?
          </span>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
            Teclas 1, 2, 3, 4
          </span>
        </div>

        {/* 4 Botones ergonómicos de calificación (Estilo Apple / Linear: Superficie Neutra Unificada) */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Grado 1: Repetir */}
          <button
            type="button"
            disabled={isRating}
            onClick={() => onRate(1)}
            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-white dark:bg-[#161B28]/70 dark:hover:bg-[#1C2234] border border-slate-200/70 dark:border-slate-800 hover:border-rose-400/60 dark:hover:border-rose-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:shadow-rose-500/5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
              <span>Repetir</span>
              <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50">
                1
              </kbd>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 mt-1 transition-colors">
              {formatInterval(previewIntervals[1])}
            </span>
          </button>

          {/* Grado 2: Difícil */}
          <button
            type="button"
            disabled={isRating}
            onClick={() => onRate(2)}
            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-white dark:bg-[#161B28]/70 dark:hover:bg-[#1C2234] border border-slate-200/70 dark:border-slate-800 hover:border-amber-400/60 dark:hover:border-amber-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:shadow-amber-500/5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" />
              <span>Difícil</span>
              <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50">
                2
              </kbd>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-1 transition-colors">
              {formatInterval(previewIntervals[2])}
            </span>
          </button>

          {/* Grado 3: Bueno */}
          <button
            type="button"
            disabled={isRating}
            onClick={() => onRate(3)}
            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-white dark:bg-[#161B28]/70 dark:hover:bg-[#1C2234] border border-slate-200/70 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/90" />
              <span>Bueno</span>
              <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50">
                3
              </kbd>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mt-1 transition-colors">
              {formatInterval(previewIntervals[3])}
            </span>
          </button>

          {/* Grado 4: Fácil */}
          <button
            type="button"
            disabled={isRating}
            onClick={() => onRate(4)}
            className="group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 hover:bg-white dark:bg-[#161B28]/70 dark:hover:bg-[#1C2234] border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400/60 dark:hover:border-emerald-500/40 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-medium text-xs text-slate-700 dark:text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
              <span>Fácil</span>
              <kbd className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700/50">
                4
              </kbd>
            </div>
            <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-1 transition-colors">
              {formatInterval(previewIntervals[4])}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
