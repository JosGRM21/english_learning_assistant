import {
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { WritingEvaluationResponse } from '@/infrastructure/ai/schemas';
import { DiffVisualizer } from './DiffVisualizer';

export interface WritingStageThreeProps {
  evalResult: WritingEvaluationResponse;
  draft1: string;
  draft2: string;
  selectedQuizOption: number | null;
  quizSubmitted: boolean;
  onAnswerQuiz: (idx: number) => void;
  onReset: () => void;
}

export function WritingStageThree({
  evalResult,
  draft1,
  draft2,
  selectedQuizOption,
  quizSubmitted,
  onAnswerQuiz,
  onReset,
}: WritingStageThreeProps) {
  return (
    <div className="space-y-6">
      {/* CEFR Score Strip */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Nivel Estimado CEFR:
                </span>
                <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm">
                  {evalResult.estimated_cefr}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {evalResult.overall_feedback_es}
              </p>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] text-center min-w-[80px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Gramática</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                {evalResult.scores.grammar}/10
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] text-center min-w-[80px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Vocabulario</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {evalResult.scores.vocabulary}/10
              </span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] text-center min-w-[80px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Coherencia</span>
              <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                {evalResult.scores.coherence}/10
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Word-level Diff Engine */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <DiffVisualizer original={draft1} updated={draft2} />
      </div>

      {/* Detailed Corrections & L1 Transfer Breakdown */}
      {evalResult.corrections.length > 0 && (
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Interferencias Detectadas del Español (L1 Transfer)</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {evalResult.corrections.map((corr, idx) => (
              <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                      {corr.error_span}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                      {corr.native_reformulation}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">({corr.taxonomy_code})</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {corr.explanation_es}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Micro-Reto Quiz */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            Micro-Reto de Consolidación Inmediata
          </h3>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {evalResult.micro_challenge.question_es}
        </p>

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-center font-sans text-lg font-semibold text-gray-900 dark:text-white">
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
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nuevo Ejercicio de Redacción</span>
        </button>
      </div>
    </div>
  );
}
