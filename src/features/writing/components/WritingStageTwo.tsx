import { useState } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Eye,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import { SocraticFeedbackResponse, SocraticClue } from '@/infrastructure/ai/schemas';
import {
  findSnippetMatches,
  sliceTextWithHighlights,
} from '@/core/text/TextSnippetMatcher';
import { ZpdScaffoldingCard } from './ZpdScaffoldingCard';

export interface WritingStageTwoProps {
  socraticResult: SocraticFeedbackResponse;
  draft1: string;
  draft2: string;
  isLoading: boolean;
  onDraftChange: (text: string) => void;
  onBackToStageOne: () => void;
  onEvaluateFinal: () => void;
}

export function WritingStageTwo({
  socraticResult,
  draft1,
  draft2,
  isLoading,
  onDraftChange,
  onBackToStageOne,
  onEvaluateFinal,
}: WritingStageTwoProps) {
  const [activeHighlightClue, setActiveHighlightClue] = useState<SocraticClue | null>(null);
  const [showDraft1Ref, setShowDraft1Ref] = useState(true);

  // Filter visible clues to top 4 items for cognitive ease
  const visibleClues = socraticResult.scaffolded_clues.slice(0, 4);

  // Render draft1 with non-destructive highlights preserving paragraph structure
  const renderHighlightedDraft1 = () => {
    if (!activeHighlightClue) {
      return (
        <div className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 italic leading-relaxed">
          {draft1}
        </div>
      );
    }

    const matches = findSnippetMatches(draft1, {
      snippet: activeHighlightClue.highlighted_area,
      paragraphIndex: activeHighlightClue.paragraph_index,
      sentenceContext: activeHighlightClue.sentence_context,
    });

    const segments = sliceTextWithHighlights(draft1, matches);

    return (
      <div className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 italic leading-relaxed">
        {segments.map((seg) =>
          seg.isHighlighted ? (
            <mark
              key={seg.key}
              className="bg-amber-200/90 dark:bg-amber-800/80 text-amber-950 dark:text-amber-100 font-bold px-1.5 py-0.5 rounded-md transition-all shadow-2xs"
            >
              {seg.text}
            </mark>
          ) : (
            <span key={seg.key}>{seg.text}</span>
          ),
        )}
      </div>
    );
  };

  const draft2Words = draft2.trim().split(/\s+/).filter(Boolean).length;

  const handleResetToDraft1 = () => {
    onDraftChange(draft1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Socratic Mentor Memorandum */}
      <section aria-label="Observaciones del mentor" className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Fase 2: Auto-Corrección y Reflexión
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Observaciones y Pistas del Mentor
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 text-xs font-semibold flex items-center gap-1.5">
              <Sparkle className="w-3.5 h-3.5 text-indigo-500" />
              <span>{visibleClues.length} aspectos a mejorar</span>
            </span>
          </div>
        </div>

        {/* Impression feedback */}
        <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800/80 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans font-medium">
            {socraticResult.overall_impression_es}
          </p>
        </div>
      </section>

      {/* Split-Screen Arena: Left = Clues / Right = Draft 2 Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clues (5 cols) */}
        <section aria-label="Pistas de mejora" className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pistas de Mejora</span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              Mostrando {visibleClues.length} de {socraticResult.scaffolded_clues.length}
            </span>
          </div>

          <div className="space-y-4">
            {visibleClues.map((clue, idx) => (
              <ZpdScaffoldingCard
                key={idx}
                clue={clue}
                index={idx}
                onHighlight={setActiveHighlightClue}
              />
            ))}
          </div>
        </section>

        {/* Right Column: Draft 2 Editor & Reference (7 cols) */}
        <section aria-label="Editor de revisión" className="lg:col-span-7 space-y-4 sticky top-6">
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4">
            {/* Header & Toggle Draft 1 Reference */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Editor de Revisión
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Segundo Borrador (Draft 2)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDraft1Ref((prev) => !prev)}
                  className="px-2.5 py-1 rounded-xl text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showDraft1Ref ? 'Ocultar Borrador 1' : 'Ver Borrador 1'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDraft1}
                  className="p-1 rounded-xl text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Restablecer texto desde el Borrador 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Draft 1 Reference Box */}
            {showDraft1Ref && (
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 text-xs leading-relaxed space-y-1.5 animate-in fade-in duration-150">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Borrador Original:
                </span>
                <div>
                  {renderHighlightedDraft1()}
                </div>
              </div>
            )}

            {/* Textarea for Draft 2 */}
            <div className="space-y-2">
              <textarea
                rows={9}
                value={draft2}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder="Modifica tu texto aplicando las pistas anteriores..."
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                className="w-full p-4 rounded-2xl bg-gray-50/60 dark:bg-[#181D2A] border border-gray-200/90 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-hidden transition-all leading-relaxed font-sans placeholder:text-gray-400 custom-scrollbar"
              />

              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span>Palabras:</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200">
                    {draft2Words}
                  </span>
                </div>
                <span className="text-[11px]">
                  Al confirmar, recibirás el análisis diferencial, CEFR y el micro-reto
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBackToStageOne}
                className="px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Fase 1</span>
              </button>

              <button
                type="button"
                onClick={onEvaluateFinal}
                disabled={isLoading || !draft2.trim()}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Evaluando versión final...</span>
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar y Ver Evaluación Final</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
