import {
  Sparkles,
  BookOpen,
  X,
  Zap,
  Feather,
  Info,
} from 'lucide-react';
import { WritingPromptItem } from '@/data/writing-prompts-catalog';
import { SubmissionMode } from '../store/writingStore';

export interface WritingStageOneProps {
  draft1: string;
  targetCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  submissionMode: SubmissionMode;
  selectedPrompt: WritingPromptItem | null;
  isLoading: boolean;
  onDraftChange: (text: string) => void;
  onTargetCefrChange: (cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void;
  onSubmissionModeChange: (mode: SubmissionMode) => void;
  onOpenPromptModal: () => void;
  onClearPrompt: () => void;
  onRequestSocratic: () => void;
}

const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: 'Principiante: oraciones simples y vocabulario cotidiano',
  A2: 'Elemental: descripción de rutinas y experiencias inmediatas',
  B1: 'Intermedio: comunicación laboral, anécdotas y explicaciones',
  B2: 'Intermedio Alto: argumentación técnica, fluidez y matices',
  C1: 'Avanzado: precisión idiomática, estilo formal y cohesión compleja',
};

export function WritingStageOne({
  draft1,
  targetCefr,
  submissionMode,
  selectedPrompt,
  isLoading,
  onDraftChange,
  onTargetCefrChange,
  onSubmissionModeChange,
  onOpenPromptModal,
  onClearPrompt,
  onRequestSocratic,
}: WritingStageOneProps) {
  const words = draft1.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const targetMin = selectedPrompt ? selectedPrompt.suggestedWordRange.min : submissionMode === 'MICRO_WRITING' ? 30 : 40;
  const targetMax = selectedPrompt ? selectedPrompt.suggestedWordRange.max : submissionMode === 'MICRO_WRITING' ? 65 : 120;

  const isWordTargetMet = wordCount >= targetMin && wordCount <= targetMax;
  const wordProgressRatio = Math.min(100, Math.round((wordCount / targetMax) * 100));

  return (
    <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Fase 1: Redacción Inicial
          </span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight">
            Escribe o redacta tu borrador en inglés
          </h3>
        </div>

        {/* Mode Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-[#181D2A] rounded-2xl">
          <button
            onClick={() => onSubmissionModeChange('FREE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              submissionMode === 'FREE' && !selectedPrompt
                ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Feather className="w-3.5 h-3.5" />
            <span>Libre</span>
          </button>
          <button
            onClick={() => onSubmissionModeChange('MICRO_WRITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              submissionMode === 'MICRO_WRITING' && !selectedPrompt
                ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Micro-Writing</span>
          </button>
          <button
            onClick={onOpenPromptModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedPrompt
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{selectedPrompt ? 'Prompt Activo' : 'Elegir Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Selected Prompt Banner */}
      {selectedPrompt && (
        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {selectedPrompt.categoryLabelEs}
                </span>
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                  {selectedPrompt.cefrLevel}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                {selectedPrompt.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPromptModal}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Cambiar
              </button>
              <button
                onClick={onClearPrompt}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                title="Quitar prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
            {selectedPrompt.promptText}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400 mr-1">Vocabulario sugerido:</span>
            {selectedPrompt.suggestedVocabulary.map((voc, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#181D2A] text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-900/40 font-mono"
              >
                {voc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CEFR Level Selector Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Nivel Objetivo:
          </span>
          <div className="flex gap-1.5">
            {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onTargetCefrChange(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  targetCefr === lvl
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <span className="text-[11px] text-gray-400 italic">
          {CEFR_DESCRIPTIONS[targetCefr]}
        </span>
      </div>

      {/* Textarea */}
      <div className="space-y-3">
        <textarea
          rows={6}
          value={draft1}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={
            selectedPrompt?.sampleOpening
              ? `Escribe tu texto... (Sugerencia de inicio: "${selectedPrompt.sampleOpening}")`
              : 'Escribe tu texto o borrador en inglés aquí. La IA analizará la formulación socrática...'
          }
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all leading-relaxed font-sans placeholder:text-gray-400"
        />

        {/* Word Counter & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Palabras:</span>
              <span
                className={`font-mono font-bold ${
                  isWordTargetMet
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : wordCount > targetMax
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {wordCount}
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                / meta sugerida: {targetMin}-{targetMax}
              </span>
            </div>

            {/* Micro visual progress bar */}
            <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isWordTargetMet ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${wordProgressRatio}%` }}
              />
            </div>
          </div>

          <span className="text-gray-400 text-[11px] flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            La IA no dará la respuesta directa: guiará tu atención con pistas ZPD
          </span>
        </div>
      </div>

      {/* Action Submit */}
      <div className="pt-2">
        <button
          onClick={onRequestSocratic}
          disabled={isLoading || !draft1.trim()}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analizando borrador con IA socrática...</span>
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Solicitar Pistas y Orientación Socrática</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
