import { useState } from 'react';
import {
  Compass,
  ArrowRight,
  Volume2,
  CheckCircle2,
  XCircle,
  Trophy,
} from 'lucide-react';
import {
  conceptualFramingEngine,
} from '@/core/domain/semantics/services/ConceptualFramingEngine';
import { SatelliteMotionVerbItem } from '@/core/types/semantics';

export function MotionVerbsStudio() {
  const [catalog] = useState<SatelliteMotionVerbItem[]>(
    conceptualFramingEngine.getCatalog(),
  );
  const [selectedCefr, setSelectedCefr] = useState<string>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean;
    explanationEs: string;
  } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const filteredCatalog = catalog.filter((item) =>
    selectedCefr === 'ALL' ? true : item.cefrLevel === selectedCefr,
  );

  const currentItem = filteredCatalog[currentIndex] || filteredCatalog[0];

  const handleSelectOption = (idx: number) => {
    if (selectedOptionIndex !== null || !currentItem) return;

    setSelectedOptionIndex(idx);
    const result = conceptualFramingEngine.evaluateSelection(currentItem.id, idx);
    setEvaluation(result);

    setScore((prev) => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    setSelectedOptionIndex(null);
    setEvaluation(null);
    setCurrentIndex((prev) => (prev + 1) % filteredCatalog.length);
  };

  const handlePlayAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentItem) {
    return <div className="p-8 text-center text-gray-500">Cargando catálogo de verbos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Verbos de Movimiento & Expresión Nativa
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Aprende a expresar movimiento en inglés combinando verbos de acción y dirección para lograr una expresión natural y fluida.
                </p>
              </div>
            </div>
          </div>

          {/* CEFR Level Filter and Score */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-2xl">
              {['ALL', 'B1', 'B2', 'C1'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedCefr(lvl);
                    setCurrentIndex(0);
                    setSelectedOptionIndex(null);
                    setEvaluation(null);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCefr === lvl
                      ? 'bg-white dark:bg-[#1C2230] text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-xs font-mono font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {score.correct}/{score.total} ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Challenge */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">
              Nivel CEFR: {currentItem.cefrLevel}
            </span>
            <span className="text-xs text-gray-400 font-mono">
              Ítem {currentIndex + 1} de {filteredCatalog.length}
            </span>
          </div>

          <button
            onClick={() => handlePlayAudio(currentItem.satelliteFramedSentence)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            Escuchar modelo nativo
          </button>
        </div>

        {/* Latinate Static Input Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
            <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider block mb-1">
              Redacción Latina Típica (Verb-Framed / Calco del Español)
            </span>
            <p className="text-base font-serif italic text-gray-800 dark:text-gray-200">
              "{currentItem.latinateStaticSentence}"
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
              Usa un verbo de movimiento general con un adverbio o gerundio explicativo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block mb-1">
              Anatomía Satelital Nativa
            </span>
            <div className="flex items-center gap-3 text-sm mt-1">
              <div className="flex-1 p-2 rounded-xl bg-white dark:bg-[#1E2433] border border-indigo-100 dark:border-indigo-800">
                <span className="text-[10px] font-mono font-bold text-indigo-400 block">MANNER (Manera):</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-300">{currentItem.mannerVerb}</span>
                <p className="text-[11px] text-gray-500">{currentItem.mannerMeaningEs}</p>
              </div>
              <span className="text-gray-400 font-bold">+</span>
              <div className="flex-1 p-2 rounded-xl bg-white dark:bg-[#1E2433] border border-indigo-100 dark:border-indigo-800">
                <span className="text-[10px] font-mono font-bold text-indigo-400 block">SATELLITE (Trayectoria):</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-300">{currentItem.satellitePreposition}</span>
                <p className="text-[11px] text-gray-500">{currentItem.pathMeaningEs}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Challenge Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Selecciona la reformulación nativa en marco satelital:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentItem.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              const isChecked = evaluation !== null;
              const isCorrect = idx === currentItem.correctOptionIndex;

              let borderClass = 'border-gray-200 dark:border-gray-800 hover:border-indigo-400';
              let bgClass = 'bg-white dark:bg-[#181E2C]';

              if (isChecked) {
                if (isCorrect) {
                  borderClass = 'border-emerald-500 ring-2 ring-emerald-500/20';
                  bgClass = 'bg-emerald-50/50 dark:bg-emerald-950/20';
                } else if (isSelected && !isCorrect) {
                  borderClass = 'border-rose-500 ring-2 ring-rose-500/20';
                  bgClass = 'bg-rose-50/50 dark:bg-rose-950/20';
                }
              } else if (isSelected) {
                borderClass = 'border-indigo-500';
                bgClass = 'bg-indigo-50 dark:bg-indigo-950/30';
              }

              return (
                <button
                  key={idx}
                  disabled={isChecked}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${borderClass} ${bgClass}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {option}
                      </span>
                    </div>

                    {isChecked && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                    {isChecked && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Evaluation Banner and Next Button */}
        {evaluation && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                evaluation.isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {evaluation.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h5 className="font-bold text-xs uppercase tracking-wider">
                  {evaluation.isCorrect ? '¡Precisión Nativa Reconocida!' : 'Patrón No Recomendado'}
                </h5>
                <p className="text-xs opacity-90">{evaluation.explanationEs}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Siguiente Verbo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
