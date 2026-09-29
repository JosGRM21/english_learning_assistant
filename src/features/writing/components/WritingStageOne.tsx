import { Sparkles } from 'lucide-react';
import { SAMPLE_PROMPTS } from '../store/writingStore';

export interface WritingStageOneProps {
  draft1: string;
  targetCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  isLoading: boolean;
  onDraftChange: (text: string) => void;
  onTargetCefrChange: (cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void;
  onRequestSocratic: () => void;
}

export function WritingStageOne({
  draft1,
  targetCefr,
  isLoading,
  onDraftChange,
  onTargetCefrChange,
  onRequestSocratic,
}: WritingStageOneProps) {
  return (
    <div className="bg-white dark:bg-[#131722] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Fase 1: Redacción Inicial
          </span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
            Escribe o pega tu texto en inglés
          </h3>
        </div>

        {/* CEFR Level Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Objetivo CEFR:</span>
          <div className="flex gap-1">
            {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onTargetCefrChange(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  targetCefr === lvl
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sample Prompts */}
      <div>
        <div className="text-xs text-gray-400 mb-2 font-medium">
          O prueba un ejemplo con errores comunes de transferencia del español:
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onDraftChange(p.text)}
              className="px-3 py-1.5 rounded-xl text-xs bg-gray-50 dark:bg-[#181D2A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-indigo-400 transition-colors cursor-pointer text-left"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <textarea
          rows={4}
          value={draft1}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Escribe tu párrafo en inglés..."
          className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all leading-relaxed"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Palabras: {draft1.trim().split(/\s+/).filter(Boolean).length}</span>
          <span>La IA evaluará el texto sin revelar la solución directamente</span>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={onRequestSocratic}
          disabled={isLoading || !draft1.trim()}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <span>Analizando con IA Socrática...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Solicitar Pistas Socráticas (Fase 1)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
