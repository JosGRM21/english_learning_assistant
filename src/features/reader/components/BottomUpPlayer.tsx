import { useState } from 'react';
import {
  Volume2,
  RotateCcw,
  Info,
  ChevronRight,
  ChevronLeft,
  Ear,
  Sliders,
} from 'lucide-react';
import {
  bottomUpListeningEngine,
  BottomUpStep,
  ConnectedSpeechMarker,
} from '@/core/domain/reader/services/BottomUpListeningEngine';

export interface BottomUpPlayerProps {
  sentence: string;
  sentenceIndex?: number;
  totalSentences?: number;
  onSelectWord?: (word: string) => void;
  onNextSentence?: () => void;
  onPrevSentence?: () => void;
}

export function BottomUpPlayer({
  sentence,
  sentenceIndex = 0,
  totalSentences = 1,
  onSelectWord,
  onNextSentence,
  onPrevSentence,
}: BottomUpPlayerProps) {
  const [currentStep, setCurrentStep] = useState<BottomUpStep>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState<1.0 | 0.75>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPhenomenon, setSelectedPhenomenon] = useState<ConnectedSpeechMarker | null>(null);

  const sentenceState = bottomUpListeningEngine.generateSentenceState(
    sentence,
    currentStep,
  );

  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'en-US';
    utterance.rate = playbackSpeed;

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-md space-y-6">
      {/* Header and Step Indicators */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Ear className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Decodificación Acústica Bottom-Up (John Field)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Oración {sentenceIndex + 1} de {totalSentences} • {sentenceState.stepName}
            </p>
          </div>
        </div>

        {/* 3 Step Navigation Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            {([1, 2, 3] as const).map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => {
                  setCurrentStep(stepNum);
                  setSelectedPhenomenon(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentStep === stepNum
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>Paso {stepNum}</span>
              </button>
            ))}
          </div>

          {/* Speed Toggle */}
          <button
            onClick={() => setPlaybackSpeed((prev) => (prev === 1.0 ? 0.75 : 1.0))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1A202C] text-xs font-mono font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
            title="Conmutar velocidad de reproducción"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-500" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>
      </div>

      {/* Main Display Area According to Step */}
      <div className="p-8 rounded-2xl bg-gray-50/70 dark:bg-[#0E131E] border border-gray-200 dark:border-gray-800 text-center min-h-[140px] flex flex-col justify-center items-center space-y-4">
        {/* STEP 1: BLIND AUDIO */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-md">
            {/* Simulated Acoustic Waveform / Equalizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-12 py-1">
              {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50, 70, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, Math.round(h * Math.random()))}%` : `${h * 0.4}%`,
                  }}
                />
              ))}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                Texto Oculto para Evitar Apoyo Ortográfico
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Escucha el audio a velocidad natural e intenta segmentar mentalmente los límites de las palabras.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: TONIC SKELETON */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">
              Esqueleto Tónico: Solo Palabras con Carga Semántica
            </span>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xl font-serif">
              {sentenceState.tokens.map((token, tIdx) => {
                if (token.isMaskedInStep2) {
                  return (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-lg border-b-2 border-dashed border-gray-400 text-gray-400 font-mono text-base"
                    >
                      ___
                    </span>
                  );
                }

                return (
                  <span
                    key={tIdx}
                    onClick={() => onSelectWord?.(token.cleanWord)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#192132] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold cursor-pointer hover:border-indigo-400 shadow-xs"
                  >
                    {token.originalWord}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-lg">
              Las palabras funcionales átonas (preposiciones, artículos, auxiliares) están ocultas para entrenar el ritmo isocrónico (*stress-timed rhythm*).
            </p>
          </div>
        )}

        {/* STEP 3: FULL CONNECTED TEXT */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
              Texto Conectado Completo & Marcadores Fonéticos
            </span>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xl font-serif leading-relaxed">
              {sentenceState.tokens.map((token, tIdx) => {
                const marker = token.phenomenon;
                let badgeClass = 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800';

                if (marker) {
                  if (marker.type === 'LINKING') {
                    badgeClass = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500 font-semibold';
                  } else if (marker.type === 'ELISION') {
                    badgeClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-b-2 border-rose-500 font-semibold';
                  } else if (marker.type === 'SCHWA_WEAK') {
                    badgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-500 font-semibold';
                  }
                }

                return (
                  <span
                    key={tIdx}
                    onClick={() => {
                      if (marker) setSelectedPhenomenon(marker);
                      onSelectWord?.(token.cleanWord);
                    }}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${badgeClass}`}
                    title={marker?.labelEs ?? 'Click para glosa'}
                  >
                    {token.originalWord}
                  </span>
                );
              })}
            </div>

            {/* Phonetic Legend */}
            <div className="flex items-center justify-center gap-4 text-xs font-mono pt-2">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Enlace (Linking)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Elisión (/t, d/)</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Schwa (/ə/)</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Phonetic Phenomenon Explanatory Callout */}
      {selectedPhenomenon && (
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-blue-900 dark:text-blue-200">
              {selectedPhenomenon.labelEs}: "{selectedPhenomenon.wordA}" {selectedPhenomenon.wordB ? `+ "${selectedPhenomenon.wordB}"` : ''}
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              {selectedPhenomenon.explanationEs}
            </p>
          </div>
        </div>
      )}

      {/* Audio & Sentence Controls Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          {onPrevSentence && (
            <button
              onClick={onPrevSentence}
              disabled={sentenceIndex <= 0}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Oración anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {onNextSentence && (
            <button
              onClick={onNextSentence}
              disabled={sentenceIndex >= totalSentences - 1}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Siguiente oración"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Audio Action Button */}
        <button
          onClick={handlePlayAudio}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>Reproducir Audio ({playbackSpeed}x)</span>
        </button>

        {/* Advance Step Action */}
        <div className="flex items-center gap-2">
          {currentStep < 3 ? (
            <button
              onClick={() => setCurrentStep((prev) => (prev + 1) as BottomUpStep)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Avanzar al Paso {currentStep + 1}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar al Paso 1</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
