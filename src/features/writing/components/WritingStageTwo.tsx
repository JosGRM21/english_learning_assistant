import { useState } from 'react';
import {
  MessageSquare,
  Heart,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { SocraticFeedbackResponse } from '@/infrastructure/ai/schemas';
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
  const [highlightedSnippet, setHighlightedSnippet] = useState<string | null>(null);
  const [showDraft1Ref, setShowDraft1Ref] = useState(true);

  // Filter visible clues to top 4 items for cognitive ease
  const visibleClues = socraticResult.scaffolded_clues.slice(0, 4);

  // Render draft1 with highlighted snippet if active
  const renderHighlightedDraft1 = () => {
    if (!highlightedSnippet) return <span>"{draft1}"</span>;

    const regex = new RegExp(`(${highlightedSnippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = draft1.split(regex);

    return (
      <span>
        "
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-amber-200 dark:bg-amber-800/80 text-amber-950 dark:text-amber-100 font-bold px-1.5 py-0.5 rounded-md transition-all shadow-xs"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
        "
      </span>
    );
  };

  const draft2Words = draft2.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Affective Filter & Communicative Validation */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Fase 2: Auto-Corrección y Reflexión
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Observaciones Socráticas del Mentor
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-semibold">
              <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
              <span>{visibleClues.length} puntos focales ZPD</span>
            </div>
          </div>
        </div>

        {/* Impression feedback */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            {socraticResult.overall_impression_es}
          </p>
        </div>
      </div>

      {/* Split-Screen Arena: Left = Clues / Right = Draft 2 Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Socratic Clues (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pistas de Andamiaje ZPD</span>
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
                onHighlight={setHighlightedSnippet}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Draft 2 Editor & Reference (7 cols) */}
        <div className="lg:col-span-7 space-y-4 sticky top-6">
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            {/* Header & Toggle Draft 1 Reference */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Editor de Revisión
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Segundo Borrador (Draft 2)
                </h3>
              </div>

              <button
                onClick={() => setShowDraft1Ref((prev) => !prev)}
                className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showDraft1Ref ? 'Ocultar Borrador 1' : 'Ver Borrador 1'}</span>
              </button>
            </div>

            {/* Draft 1 Reference Box */}
            {showDraft1Ref && (
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-xs leading-relaxed space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Borrador Original (Posa el cursor sobre una pista para ubicar el error):
                </span>
                <div className="font-sans text-gray-700 dark:text-gray-300 italic">
                  {renderHighlightedDraft1()}
                </div>
              </div>
            )}

            {/* Textarea for Draft 2 */}
            <div className="space-y-2">
              <textarea
                rows={6}
                value={draft2}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder="Modifica tu texto aplicando las pistas anteriores..."
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                className="w-full p-4 rounded-2xl bg-gray-50/50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all leading-relaxed font-sans placeholder:text-gray-400"
              />

              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span>Palabras:</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-200">
                    {draft2Words}
                  </span>
                </div>
                <span className="text-[11px]">
                  Al confirmar, recibirás la evaluación CEFR, el diff y el micro-reto
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={onBackToStageOne}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Fase 1</span>
              </button>

              <button
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
        </div>
      </div>
    </div>
  );
}
