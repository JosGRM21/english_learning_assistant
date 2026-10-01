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
  Trophy,
  GitCompare,
  CheckCircle2,
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
  onAddToSrs?: (correction: CorrectionItem, draftContext?: string) => void;
  onReset: () => void;
}

type StageThreeViewTab = 'DIFF' | 'CORRECTIONS';

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
  const [activeTab, setActiveTab] = useState<StageThreeViewTab>('DIFF');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Multiple micro-challenges support
  const allChallenges = [
    evalResult.micro_challenge,
    ...(evalResult.micro_challenges || []).filter(
      (c) => c.sentence_with_blank !== evalResult.micro_challenge.sentence_with_blank,
    ),
  ];
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const [localQuizAnswers, setLocalQuizAnswers] = useState<Record<number, number>>({});

  const handleAddSrsCard = (corr: CorrectionItem) => {
    onAddToSrs?.(corr, draft2);
    setAddedItems((prev) => ({ ...prev, [corr.error_span]: true }));
  };

  const currentChallenge = allChallenges[activeChallengeIdx] || evalResult.micro_challenge;
  const isChallengeAnswered =
    activeChallengeIdx === 0
      ? quizSubmitted
      : localQuizAnswers[activeChallengeIdx] !== undefined;
  const selectedOptionForCurrent =
    activeChallengeIdx === 0
      ? selectedQuizOption
      : localQuizAnswers[activeChallengeIdx] ?? null;

  const handleSelectOption = (idx: number) => {
    if (isChallengeAnswered) return;
    if (activeChallengeIdx === 0) {
      onAnswerQuiz(idx);
    }
    setLocalQuizAnswers((prev) => ({ ...prev, [activeChallengeIdx]: idx }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner for SRS success */}
      {srsSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{srsSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HERO SCOREBOARD & CEFR MASTERY */}
      {/* ========================================================================= */}
      <section aria-label="Resumen de evaluación" className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-8 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Evaluación Final Completada
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    Nivel Estimado CEFR:
                  </h2>
                  <span className="px-3.5 py-1 rounded-xl bg-indigo-600 text-white font-mono font-extrabold text-sm shadow-xs shadow-indigo-600/30">
                    {evalResult.estimated_cefr}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans font-medium">
              {evalResult.overall_feedback_es}
            </p>
          </div>

          {/* Audio TTS Button */}
          {onPlayTts && (
            <button
              type="button"
              onClick={() => onPlayTts(draft2)}
              disabled={isPlayingTts}
              className="px-4 py-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all inline-flex items-center gap-2 cursor-pointer self-start lg:self-center shadow-2xs"
            >
              <Volume2 className={`w-4 h-4 ${isPlayingTts ? 'animate-pulse text-indigo-500' : ''}`} />
              <span>{isPlayingTts ? 'Reproduciendo audio...' : 'Escuchar Versión Final (TTS)'}</span>
            </button>
          )}
        </div>

        {/* Visual Score Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
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
              <span className="font-bold text-gray-700 dark:text-gray-300">Coherencia & Cohesión</span>
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
      </section>

      {/* ========================================================================= */}
      {/* LEARNER UPTAKE & SELF-REPAIR CELEBRATION */}
      {/* ========================================================================= */}
      {evalResult.successful_repairs && evalResult.successful_repairs.length > 0 && (
        <section aria-label="Auto-correcciones exitosas" className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-emerald-200/90 dark:border-emerald-900/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Logros de Auto-Corrección (Learner Uptake) ({evalResult.successful_repairs.length})</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Corregido autónomamente entre Borrador 1 y 2</span>
            </span>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
            ¡Felicitaciones! Has corregido de forma autónoma los siguientes puntos aplicando las pistas de mejora:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {evalResult.successful_repairs.map((repair, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {repair.original_snippet && (
                    <>
                      <span className="line-through text-rose-600 dark:text-rose-400 font-mono font-semibold">
                        "{repair.original_snippet}"
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </>
                  )}
                  <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold bg-white dark:bg-[#181D2A] px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    "{repair.corrected_snippet}"
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                  {repair.praise_es}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SEGMENTED DEEP-DIVE: DIFF VISUALIZER & L1 INTERFERENCES */}
      {/* ========================================================================= */}
      <section aria-label="Análisis detallado" className="space-y-4">
        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 dark:bg-[#181D2A] rounded-2xl border border-gray-200/80 dark:border-gray-800 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('DIFF')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'DIFF'
                ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-500" />
            <span>Comparativa Diferencial (Diff)</span>
          </button>

          {evalResult.corrections.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('CORRECTIONS')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'CORRECTIONS'
                  ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Interferencias del Español</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {evalResult.corrections.length}
              </span>
            </button>
          )}
        </div>

        {/* Tab 1: Diff Visualizer */}
        {activeTab === 'DIFF' && (
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs animate-in fade-in duration-150">
            <DiffVisualizer original={draft1} updated={draft2} />
          </div>
        )}

        {/* Tab 2: Detailed L1 Transfer Breakdown */}
        {activeTab === 'CORRECTIONS' && evalResult.corrections.length > 0 && (
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Interferencias Detectadas del Español ({evalResult.corrections.length})</span>
              </div>
              <span className="text-[11px] text-gray-400">
                Guarda los patrones más engañosos directamente en tu mazo SRS
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
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                          {corr.taxonomy_code}
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
                          type="button"
                          onClick={() => onPlayTts(corr.native_reformulation)}
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                          title="Escuchar pronunciación nativa"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}

                      {onAddToSrs && (
                        <button
                          type="button"
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
      </section>

      {/* ========================================================================= */}
      {/* INTERACTIVE MICRO-CHALLENGE ARENA */}
      {/* ========================================================================= */}
      <section aria-label="Micro-reto" className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Consolidación Inmediata
              </span>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Micro-Reto Gramatical
              </h3>
            </div>
          </div>

          {allChallenges.length > 1 && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#181D2A] p-1 rounded-xl self-start sm:self-auto">
              {allChallenges.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveChallengeIdx(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChallengeIdx === idx
                      ? 'bg-white dark:bg-[#121620] text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  Reto {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {currentChallenge.question_es}
        </p>

        <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 text-center font-sans text-base sm:text-lg font-semibold text-gray-900 dark:text-white shadow-2xs">
          "{currentChallenge.sentence_with_blank}"
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {currentChallenge.options.map((opt, idx) => {
            const isSelected = selectedOptionForCurrent === idx;
            const isCorrect = idx === currentChallenge.correct_option_index;

            let btnStyle =
              'bg-gray-50 dark:bg-[#181D2A] hover:bg-gray-100 dark:hover:bg-[#202738] border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';

            if (isChallengeAnswered) {
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
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isChallengeAnswered}
                className={`p-3.5 rounded-xl border text-center font-mono text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
              >
                <span>{opt}</span>
                {isChallengeAnswered && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                {isChallengeAnswered && isSelected && !isCorrect && (
                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {isChallengeAnswered && (
          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed animate-in fade-in duration-200 ${
              selectedOptionForCurrent === currentChallenge.correct_option_index
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {currentChallenge.explanation_es}
          </div>
        )}
      </section>

      {/* Restart writing session CTA */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Iniciar Nuevo Ejercicio de Redacción</span>
        </button>
      </div>
    </div>
  );
}
