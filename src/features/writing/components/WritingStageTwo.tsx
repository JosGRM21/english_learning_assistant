import { MessageSquare, HelpCircle, CheckCircle2 } from 'lucide-react';
import { SocraticFeedbackResponse } from '@/infrastructure/ai/schemas';

export interface WritingStageTwoProps {
  socraticResult: SocraticFeedbackResponse;
  draft2: string;
  isLoading: boolean;
  onDraftChange: (text: string) => void;
  onBackToStageOne: () => void;
  onEvaluateFinal: () => void;
}

export function WritingStageTwo({
  socraticResult,
  draft2,
  isLoading,
  onDraftChange,
  onBackToStageOne,
  onEvaluateFinal,
}: WritingStageTwoProps) {
  return (
    <div className="space-y-6">
      {/* Socratic Feedback Summary */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            Impresión Diagnóstica y Pistas Reflexivas
          </h3>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
          {socraticResult.overall_impression_es}
        </p>

        {/* Clues Cards */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Pistas para Auto-Corrección ({socraticResult.scaffolded_clues.length}):
          </div>

          {socraticResult.scaffolded_clues.map((clue, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3"
            >
              <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">
                    {clue.clue_type}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200">
                    Área: "{clue.highlighted_area}"
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  {clue.hint_question_es}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Draft 2 Editor */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-md space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Fase 2: Reescribe y Aplica tus Auto-Correcciones
          </span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
            Borrador 2 (Draft 2)
          </h3>
        </div>

        <textarea
          rows={4}
          value={draft2}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Corrige tu texto aplicando las pistas anteriores..."
          className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all leading-relaxed"
        />

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBackToStageOne}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Volver al Borrador 1
          </button>

          <button
            onClick={onEvaluateFinal}
            disabled={isLoading || !draft2.trim()}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Evaluando Versión Final...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Evaluar Versión Final & Ver Diff</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
