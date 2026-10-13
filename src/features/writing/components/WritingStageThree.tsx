import { useState } from 'react';
import {
  Award,
  AlertTriangle,
  ArrowRight,
  Check,
  RotateCcw,
  Volume2,
  BookmarkPlus,
  Trophy,
  GitCompare,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  WritingEvaluationResponse,
  CorrectionItem,
} from '@/infrastructure/ai/schemas';
import { DiffVisualizer } from './DiffVisualizer';

export interface WritingStageThreeProps {
  evalResult: WritingEvaluationResponse;
  draft1: string;
  draft2: string;
  isPlayingTts?: boolean;
  srsSuccessMessage?: string | null;
  onPlayTts?: (text: string) => void;
  onAddToSrs?: (correction: CorrectionItem, draftContext?: string) => void;
  onNavigateToDefossilization?: () => void;
  onReset: () => void;
}

type StageThreeViewTab = 'DIFF' | 'CORRECTIONS';

export function WritingStageThree({
  evalResult,
  draft1,
  draft2,
  isPlayingTts = false,
  srsSuccessMessage,
  onPlayTts,
  onAddToSrs,
  onNavigateToDefossilization,
  onReset,
}: WritingStageThreeProps) {
  const [activeTab, setActiveTab] = useState<StageThreeViewTab>('DIFF');
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const handleAddSrsCard = (corr: CorrectionItem) => {
    onAddToSrs?.(corr, draft2);
    setAddedItems((prev) => ({ ...prev, [corr.error_span]: true }));
  };

  const rubric = evalResult.rubric_scores || {
    accuracy: 8,
    range_and_precision: 8,
    cohesion_and_flow: 8,
    pragmatics_and_complexity: 8,
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
      {/* 1. HERO SCOREBOARD, CEFR & 4-AXIS RUBRIC */}
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
                  Evaluación Final Socrática
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

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* Direct Link to Defossilization */}
            {onNavigateToDefossilization && evalResult.corrections.length > 0 && (
              <button
                type="button"
                onClick={onNavigateToDefossilization}
                className="px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Practicar en Corrector de Hábitos</span>
              </button>
            )}
          </div>
        </div>

        {/* 4-Axis Rubric Score Bars (RF-WRT-08) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-gray-100 dark:border-gray-800/80">
          {/* Axis 1: Accuracy */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Precisión (Accuracy)</span>
              <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {rubric.accuracy} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${rubric.accuracy * 10}%` }}
              />
            </div>
          </div>

          {/* Axis 2: Range & Precision */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Rango Léxico (Range)</span>
              <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {rubric.range_and_precision} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${rubric.range_and_precision * 10}%` }}
              />
            </div>
          </div>

          {/* Axis 3: Cohesion & Flow */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Cohesión & Fluidez</span>
              <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                {rubric.cohesion_and_flow} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${rubric.cohesion_and_flow * 10}%` }}
              />
            </div>
          </div>

          {/* Axis 4: Pragmatics & Complexity */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-100 dark:border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">Pragmática & Registro</span>
              <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {rubric.pragmatics_and_complexity} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${rubric.pragmatics_and_complexity * 10}%` }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. LEARNER UPTAKE & SELF-REPAIR CELEBRATION */}
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
      {/* 6. SEGMENTED DEEP-DIVE: DIFF VISUALIZER & L1 INTERFERENCES */}
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
            <DiffVisualizer
              original={draft1}
              updated={draft2}
              onPlayTts={onPlayTts}
              isPlayingTts={isPlayingTts}
            />
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
