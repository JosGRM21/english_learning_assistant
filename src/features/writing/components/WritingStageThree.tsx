import { useState } from 'react';
import {
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  X,
  RotateCcw,
  Volume2,
  BookmarkPlus,
} from 'lucide-react';
import { WritingEvaluationResponse, CorrectionItem } from '@/infrastructure/ai/schemas';
import { DiffVisualizer } from './DiffVisualizer';

export interface WritingStageThreeProps {
  evalResult: WritingEvaluationResponse;
  draft1: string;
  draft2: string;
  selectedQuizOption: number | null;
  quizSubmitted: boolean;
  isPlayingTts?: boolean;
  srsSuccessMessage?: string | null;
  onAnswerQuiz: (idx: number) => void;
  onPlayTts?: (text: string) => void;
  onAddToSrs?: (correction: CorrectionItem) => void;
  onReset: () => void;
}

export function WritingStageThree({
  evalResult,
  draft1,
  draft2,
  selectedQuizOption,
  quizSubmitted,
  isPlayingTts = false,
  srsSuccessMessage,
  onAnswerQuiz,
  onPlayTts,
  onAddToSrs,
  onReset,
}: WritingStageThreeProps) {
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const handleAddSrsCard = (corr: CorrectionItem) => {
    onAddToSrs?.(corr);
    setAddedItems((prev) => ({ ...prev, [corr.error_span]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner for SRS success */}
      {srsSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{srsSuccessMessage}</span>
        </div>
      )}

      {/* CEFR Score Header & Visual Meters */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Award className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Evaluación Final Completada
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Nivel Estimado CEFR:
                  </h3>
                  <span className="px-3.5 py-1 rounded-xl bg-indigo-600 text-white font-mono font-extrabold text-sm shadow-xs shadow-indigo-600/30">
                    {evalResult.estimated_cefr}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans max-w-2xl">
              {evalResult.overall_feedback_es}
            </p>
          </div>

          {/* Audio TTS Button */}
          {onPlayTts && (
            <button
              onClick={() => onPlayTts(draft2)}
              disabled={isPlayingTts}
              className="px-4 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors inline-flex items-center gap-2 cursor-pointer self-start lg:self-center"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingTts ? 'animate-pulse text-indigo-500' : ''}`} />
              <span>{isPlayingTts ? 'Reproduciendo audio nativo...' : 'Escuchar Texto Corregido (TTS)'}</span>
            </button>
          )}
        </div>

        {/* Visual Score Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Grammar */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Gramática</span>
              <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {evalResult.scores.grammar} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${evalResult.scores.grammar * 10}%` }}
              />
            </div>
          </div>

          {/* Vocabulary */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Vocabulario</span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {evalResult.scores.vocabulary} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${evalResult.scores.vocabulary * 10}%` }}
              />
            </div>
          </div>

          {/* Coherence */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Coherencia</span>
              <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                {evalResult.scores.coherence} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${evalResult.scores.coherence * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Word-level Diff Engine */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-sm">
        <DiffVisualizer original={draft1} updated={draft2} />
      </div>

      {/* Detailed Corrections & L1 Transfer Breakdown */}
      {evalResult.corrections.length > 0 && (
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Interferencias Detectadas del Español ({evalResult.corrections.length})</span>
            </div>
            <span className="text-[11px] text-gray-400">
              Registradas en tu diagnóstico de Debilidades
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {evalResult.corrections.map((corr, idx) => {
              const isAdded = addedItems[corr.error_span];

              return (
                <div
                  key={idx}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold line-through">
                        {corr.error_span}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                        {corr.native_reformulation}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        ({corr.taxonomy_code})
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                      {corr.explanation_es}
                    </p>
                  </div>

                  {/* Actions for this correction */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onPlayTts && (
                      <button
                        onClick={() => onPlayTts(corr.native_reformulation)}
                        className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        title="Escuchar pronunciación nativa"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}

                    {onAddToSrs && (
                      <button
                        onClick={() => handleAddSrsCard(corr)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 cursor-default'
                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-gray-700 dark:text-gray-200 hover:text-indigo-600'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>En mazo SRS</span>
                          </>
                        ) : (
                          <>
                            <BookmarkPlus className="w-3.5 h-3.5" />
                            <span>Guardar en SRS</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Micro-Challenge */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            Micro-Reto de Consolidación Inmediata
          </h3>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {evalResult.micro_challenge.question_es}
        </p>

        <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-center font-sans text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          "{evalResult.micro_challenge.sentence_with_blank}"
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {evalResult.micro_challenge.options.map((opt, idx) => {
            const isSelected = selectedQuizOption === idx;
            const isCorrect = idx === evalResult.micro_challenge.correct_option_index;

            let btnStyle =
              'bg-gray-50 dark:bg-[#181D2A] hover:bg-gray-100 dark:hover:bg-[#202738] border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';

            if (quizSubmitted) {
              if (isCorrect) {
                btnStyle =
                  'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold';
              } else if (isSelected && !isCorrect) {
                btnStyle =
                  'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
              } else {
                btnStyle = 'opacity-40 border-gray-200 dark:border-gray-800';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => onAnswerQuiz(idx)}
                disabled={quizSubmitted}
                className={`p-3.5 rounded-xl border text-center font-mono text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
              >
                <span>{opt}</span>
                {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                {quizSubmitted && isSelected && !isCorrect && (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {quizSubmitted && (
          <div
            className={`p-4 rounded-xl text-xs leading-relaxed animate-in fade-in duration-200 ${
              selectedQuizOption === evalResult.micro_challenge.correct_option_index
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {evalResult.micro_challenge.explanation_es}
          </div>
        )}
      </div>

      {/* Action to restart */}
      <div className="text-center pt-2">
        <button
          onClick={onReset}
          className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Iniciar Nuevo Ejercicio de Redacción</span>
        </button>
      </div>
    </div>
  );
}
