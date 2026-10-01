import { useState } from 'react';
import {
  Split,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import {
  polysemyDisambiguator,
} from '@/core/domain/semantics/services/PolysemyDisambiguator';
import {
  PolysemicPairItem,
  PolysemicExercise,
} from '@/core/types/semantics';

export function PolysemyStudio() {
  const [catalog] = useState<PolysemicPairItem[]>(polysemyDisambiguator.getCatalog());
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean;
    explanationEs: string;
  } | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  const currentPair = catalog[selectedPairIndex] || catalog[0];
  const currentExercises = currentPair.exercises;
  const currentExercise: PolysemicExercise | undefined = currentExercises[exerciseIndex];

  const handleSelectPair = (idx: number) => {
    setSelectedPairIndex(idx);
    setExerciseIndex(0);
    setSelectedOption(null);
    setEvaluation(null);
  };

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null || !currentExercise) return;

    setSelectedOption(opt);
    const result = polysemyDisambiguator.evaluateExercise(currentExercise, opt);
    setEvaluation(result);

    setStats((prev) => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNextExercise = () => {
    setSelectedOption(null);
    setEvaluation(null);
    setExerciseIndex((prev) => (prev + 1) % currentExercises.length);
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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Split className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Desambiguación de Pares Polisémicos de Alta Confusión
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Distinción morfosintáctica y semántica de los 7 pares de verbos que se colapsan en un único término en español.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 text-xs font-mono font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>
              Aciertos: {stats.correct}/{stats.total} ({stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* 7 Pairs Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80">
          {catalog.map((pair, idx) => {
            const isSelected = selectedPairIndex === idx;
            return (
              <button
                key={pair.id}
                onClick={() => handleSelectPair(idx)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {pair.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Pair Theoretical Core & Guidelines */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentPair.title}
            </h3>
            <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
              {currentPair.pairKey}
            </span>
          </div>
          <div className="p-3.5 mt-2 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-950 dark:text-purple-200 font-medium">
            <strong className="text-purple-700 dark:text-purple-300">Distinción Conceptual Central: </strong>
            {currentPair.coreDistinctionEs}
          </div>
        </div>

        {/* Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentPair.verbGuidelines.map((guideline, gIdx) => (
            <div
              key={gIdx}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181E2B] border border-gray-200 dark:border-gray-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400 uppercase font-mono">
                  {guideline.verb}
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Estructura
                </span>
              </div>

              <div className="text-[11px] font-mono bg-white dark:bg-[#121620] p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                {guideline.syntacticStructure}
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-400">
                {guideline.semanticFocus}
              </p>

              <div className="pt-1 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Colocaciones habituales:
                </span>
                {guideline.examples.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="flex items-center justify-between text-xs text-gray-800 dark:text-gray-200 font-serif italic"
                  >
                    <span>• {ex}</span>
                    <button
                      onClick={() => handlePlayAudio(ex)}
                      className="text-gray-400 hover:text-purple-500 transition-colors p-0.5"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Cloze Exercise */}
        {currentExercise && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                  Ejercicio de Decisión Inmediata
                </span>
                <span className="ml-2 text-xs font-mono text-gray-400">
                  (Contexto: {currentExercise.contextTag})
                </span>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {exerciseIndex + 1} de {currentExercises.length}
              </span>
            </div>

            {/* Sentence with Blank */}
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#141924] border border-gray-200 dark:border-gray-800 text-center">
              <p className="text-lg sm:text-xl font-serif text-gray-900 dark:text-white">
                {currentExercise.sentenceWithBlank.split('___')[0]}
                <span className="inline-block px-4 py-1 mx-1.5 rounded-xl border-b-2 border-dashed border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-bold font-mono">
                  {selectedOption ?? '_____'}
                </span>
                {currentExercise.sentenceWithBlank.split('___')[1]}
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentExercise.options.map((opt, optIdx) => {
                const isSelected = selectedOption === opt;
                const isChecked = evaluation !== null;
                const isCorrect = opt.trim().toLowerCase() === currentExercise.targetVerb.trim().toLowerCase();

                let btnClass =
                  'bg-white dark:bg-[#181E2B] border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:border-purple-400';

                if (isChecked) {
                  if (isCorrect) {
                    btnClass =
                      'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnClass =
                      'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                  }
                } else if (isSelected) {
                  btnClass =
                    'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-700 dark:text-purple-300 font-bold';
                }

                return (
                  <button
                    key={optIdx}
                    disabled={isChecked}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-3.5 rounded-2xl border text-center text-sm font-semibold transition-all cursor-pointer ${btnClass}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation and Next Button */}
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
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider mb-0.5">
                      {evaluation.isCorrect ? '¡Colocación Correcta!' : 'Uso Inexacto'}
                    </h5>
                    <p className="text-xs opacity-90">{evaluation.explanationEs}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNextExercise}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <span>Siguiente Ejercicio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
