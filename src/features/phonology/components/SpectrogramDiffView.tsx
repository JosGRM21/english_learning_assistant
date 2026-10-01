import { Volume2, AlertTriangle, Activity } from 'lucide-react';
import { MinimalPairItem } from '@/core/types/phonology';

export interface SpectrogramDiffViewProps {
  pair: MinimalPairItem;
  targetWord: string;
  selectedWord: string;
  onPlayWordA?: () => void;
  onPlayWordB?: () => void;
  onPlaySequence?: () => void;
}

export function SpectrogramDiffView({
  pair,
  targetWord,
  selectedWord,
  onPlayWordA,
  onPlayWordB,
  onPlaySequence,
}: SpectrogramDiffViewProps) {
  const fA = pair.formantDataA ?? {
    f1: pair.contrastType === 'VOWEL' ? 300 : 250,
    f2: pair.contrastType === 'VOWEL' ? 2200 : 1800,
    durationMs: 220,
  };

  const fB = pair.formantDataB ?? {
    f1: pair.contrastType === 'VOWEL' ? 420 : 350,
    f2: pair.contrastType === 'VOWEL' ? 1850 : 1500,
    durationMs: 130,
  };

  const spanishAttractor = fA.spanishAttractor ?? fB.spanishAttractor;

  // Max scale for SVG visualizer
  const maxF1 = 900;
  const maxF2 = 2600;

  return (
    <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-[#151926] p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Análisis Espectrográfico y Formantes Acústicos ($F_1 / F_2$)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Contraste perceptivo para superar el Imán de la Lengua Materna (Kuhl & Flege)
            </p>
          </div>
        </div>

        {onPlaySequence && (
          <button
            onClick={onPlaySequence}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reproducir secuencia de contraste"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Escuchar Secuencia A → B</span>
          </button>
        )}
      </div>

      {/* Comparative Spectrogram Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Word A Box */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            targetWord === pair.wordA
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : selectedWord === pair.wordA
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : 'bg-gray-50 dark:bg-[#1A1F2C] border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {pair.wordA}
              </span>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 ml-2">
                /{pair.ipaA}/
              </span>
            </div>
            {onPlayWordA && (
              <button
                onClick={onPlayWordA}
                className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Formant bars */}
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>F1 (Apertura Mandibular): {fA.f1} Hz</span>
                <span>{Math.round((fA.f1 / maxF1) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (fA.f1 / maxF1) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>F2 (Posición Lingual): {fA.f2} Hz</span>
                <span>{Math.round((fA.f2 / maxF2) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, (fA.f2 / maxF2) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] pt-1 text-gray-600 dark:text-gray-300 font-mono">
              <span>Duración Acústica:</span>
              <span className="font-bold">{fA.durationMs} ms</span>
            </div>
          </div>
        </div>

        {/* Word B Box */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            targetWord === pair.wordB
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : selectedWord === pair.wordB
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : 'bg-gray-50 dark:bg-[#1A1F2C] border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {pair.wordB}
              </span>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 ml-2">
                /{pair.ipaB}/
              </span>
            </div>
            {onPlayWordB && (
              <button
                onClick={onPlayWordB}
                className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Formant bars */}
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>F1 (Apertura Mandibular): {fB.f1} Hz</span>
                <span>{Math.round((fB.f1 / maxF1) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (fB.f1 / maxF1) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>F2 (Posición Lingual): {fB.f2} Hz</span>
                <span>{Math.round((fB.f2 / maxF2) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, (fB.f2 / maxF2) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[11px] pt-1 text-gray-600 dark:text-gray-300 font-mono">
              <span>Duración Acústica:</span>
              <span className="font-bold">{fB.durationMs} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* L1 Spanish Attractor Warning */}
      {spanishAttractor && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold">Efecto Imán de la L1 ({spanishAttractor.phoneme}): </span>
            {spanishAttractor.warning}
          </div>
        </div>
      )}
    </div>
  );
}
