import { useState } from 'react';
import {
  Volume2,
  ExternalLink,
  PlusCircle,
  CheckCircle,
} from 'lucide-react';
import { VocabSense, VocabItem } from '@/core/types/vocab';
import { useAudio } from '@/shared/hooks/useAudio';

export interface SenseBlockProps {
  sense: VocabSense;
  senseNumber: number;
  totalSenses?: number;
  onSpeakExample?: (text: string) => void;
  matchingCard?: VocabItem | null;
  onNavigateToCard?: (vocab: VocabItem) => void;
  onCreateIndependentCard?: (sense: VocabSense) => Promise<void>;
  isCreatingCard?: boolean;
}

export function SenseBlock({
  sense,
  senseNumber,
  totalSenses: _totalSenses = 1,
  onSpeakExample,
  matchingCard,
  onNavigateToCard,
  onCreateIndependentCard,
  isCreatingCard = false,
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
      await audioService.speak(text, 0.95);
    } finally {
      setPlayingAudioKey(null);
    }
  };

  const basicExample = sense.graduatedExamples?.sentenceBasicEn || sense.exampleSentenceEn;
  const basicTranslation = sense.graduatedExamples?.sentenceBasicEs || sense.exampleSentenceEs;
  const advancedExample = sense.graduatedExamples?.sentenceAdvancedEn;
  const advancedTranslation = sense.graduatedExamples?.sentenceAdvancedEs;

  return (
    <section
      aria-label={`Acepción ${senseNumber}: ${sense.translationEs}`}
      className="group/sense relative rounded-2xl border border-white/[0.06] bg-[#0c101c]/90 p-5 space-y-4 shadow-sm"
    >
      {/* Top Header: Translation */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          TRADUCCIÓN AL ESPAÑOL
        </span>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {sense.translationEs}
          </h3>

          {/* Action buttons if available */}
          <div className="flex items-center gap-2 shrink-0">
            {matchingCard && onNavigateToCard && (
              <button
                type="button"
                onClick={() => onNavigateToCard(matchingCard)}
                className="h-7 px-2.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                title="Abrir la tarjeta de estudio de esta acepción"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Tarjeta</span>
                <ExternalLink className="w-3 h-3 text-emerald-400/70" />
              </button>
            )}

            {!matchingCard && onCreateIndependentCard && (
              <button
                type="button"
                onClick={() => onCreateIndependentCard(sense)}
                disabled={isCreatingCard}
                className="h-7 px-2.5 rounded-lg bg-[#181D2D] hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-white/[0.08] hover:border-indigo-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs disabled:opacity-50"
                title="Convertir esta acepción en una tarjeta de estudio independiente con su propio FSRS"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isCreatingCard ? 'Creando...' : 'Crear Tarjeta'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* English Definition */}
      {sense.definitionEn && (
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            DEFINICIÓN EN INGLÉS
          </span>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {sense.definitionEn}
          </p>
        </div>
      )}

      {/* Oraciones en contexto */}
      {basicExample && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
              ORACIONES EN CONTEXTO ({advancedExample ? 2 : 1})
            </span>
          </div>

          {/* Example 1 Container */}
          <div className="relative rounded-2xl bg-[#121626]/80 border border-white/[0.06] p-4 pr-11 space-y-2">
            <p className="font-editorial text-sm sm:text-[15px] font-bold text-slate-100 italic leading-snug">
              &ldquo;{basicExample}&rdquo;
            </p>
            {basicTranslation && (
              <p className="text-xs sm:text-[13px] text-slate-400 font-sans leading-relaxed">
                {basicTranslation}
              </p>
            )}
            <button
              type="button"
              onClick={() => handleSpeak(`basic_${senseNumber}`, basicExample)}
              disabled={playingAudioKey === `basic_${senseNumber}`}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer ${
                playingAudioKey === `basic_${senseNumber}` ? 'text-indigo-400 animate-pulse' : ''
              }`}
              title="Escuchar oración"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Example 2 Container */}
          {advancedExample && (
            <div className="relative rounded-2xl bg-[#121626]/80 border border-white/[0.06] p-4 pr-11 space-y-2">
              <p className="font-editorial text-sm sm:text-[15px] font-bold text-slate-100 italic leading-snug">
                &ldquo;{advancedExample}&rdquo;
              </p>
              {advancedTranslation && (
                <p className="text-xs sm:text-[13px] text-slate-400 font-sans leading-relaxed">
                  {advancedTranslation}
                </p>
              )}
              <button
                type="button"
                onClick={() => handleSpeak(`adv_${senseNumber}`, advancedExample)}
                disabled={playingAudioKey === `adv_${senseNumber}`}
                className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer ${
                  playingAudioKey === `adv_${senseNumber}` ? 'text-indigo-400 animate-pulse' : ''
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
