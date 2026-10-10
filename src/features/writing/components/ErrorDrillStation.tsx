import React, { useState } from 'react';
import {
  Check,
  X,
  Volume2,
  BookmarkPlus,
  ArrowRight,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { CorrectionItem, ErrorPracticeDrill } from '@/infrastructure/ai/schemas';
import { synthesizeErrorDrillFallback } from '@/core/text/WeakVocabMatcher';

export interface ErrorDrillStationProps {
  corrections: CorrectionItem[];
  draftContext?: string;
  onAnswerDrill: (errorSpan: string, optionIdx: number, drill: ErrorPracticeDrill) => void;
  onPlayTts?: (text: string) => void;
  onAddToSrs?: (correction: CorrectionItem, draftContext?: string) => void;
}

export function ErrorDrillStation({
  corrections,
  draftContext,
  onAnswerDrill,
  onPlayTts,
  onAddToSrs,
}: ErrorDrillStationProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [typedAnswers, setTypedAnswers] = useState<Record<number, string>>({});
  const [srsSavedItems, setSrsSavedItems] = useState<Record<string, boolean>>({});

  if (corrections.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 text-center space-y-2">
        <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <h4 className="text-base font-bold text-gray-900 dark:text-white">
          ¡Redacción Impecable!
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
          No se detectaron errores residuales en tu segundo borrador. Has asimilado con éxito las estructuras nativas.
        </p>
      </div>
    );
  }

  const currentCorrection = corrections[activeIdx] || corrections[0];
  const drill: ErrorPracticeDrill =
    currentCorrection.drill ||
    synthesizeErrorDrillFallback({
      error_span: currentCorrection.error_span,
      native_reformulation: currentCorrection.native_reformulation,
      explanation_es: currentCorrection.explanation_es,
      sentence_context: draftContext,
    });

  const hasOptions = Array.isArray(drill.options) && drill.options.length > 0;
  const isCurrentAnswered = userAnswers[activeIdx] !== undefined;
  const selectedOptionIdx = userAnswers[activeIdx] ?? null;
  const isCorrect = hasOptions
    ? selectedOptionIdx === (drill.correct_option_index ?? 1)
    : selectedOptionIdx === 1;
  const isSrsSaved = srsSavedItems[currentCorrection.error_span] || false;

  const handleSelectOption = (optIdx: number) => {
    if (isCurrentAnswered) return;
    setUserAnswers((prev) => ({ ...prev, [activeIdx]: optIdx }));
    onAnswerDrill(currentCorrection.error_span, optIdx, drill);
  };

  const handleCheckTypedAnswer = () => {
    if (isCurrentAnswered) return;
    const typed = typedAnswers[activeIdx] || '';
    const target = (drill.expected_token || currentCorrection.native_reformulation || '').trim().toLowerCase();
    const passed = typed.trim().toLowerCase().replace(/[.,!?;:]/g, '') === target.replace(/[.,!?;:]/g, '');
    const optionIdx = passed ? (drill.correct_option_index ?? 1) : 0;
    setUserAnswers((prev) => ({ ...prev, [activeIdx]: optionIdx }));
    onAnswerDrill(currentCorrection.error_span, optionIdx, drill);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isCurrentAnswered && (typedAnswers[activeIdx] || '').trim()) {
      e.preventDefault();
      handleCheckTypedAnswer();
    }
  };

  const handleSaveToSrs = () => {
    onAddToSrs?.(currentCorrection, draftContext);
    setSrsSavedItems((prev) => ({ ...prev, [currentCorrection.error_span]: true }));
  };

  return (
    <section aria-label="Laboratorio de práctica por error" className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Laboratorio de Práctica Deliberada
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Ejercicios Específicos por Error ({corrections.length})
            </h3>
          </div>
        </div>

        {/* Stepper pills if multiple errors */}
        {corrections.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-[#181D2A] rounded-2xl overflow-x-auto no-scrollbar">
            {corrections.map((corr, idx) => {
              const answered = userAnswers[idx] !== undefined;
              const passed = userAnswers[idx] === (corr.drill?.correct_option_index ?? 1);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeIdx === idx
                      ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {answered ? (
                    passed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    )
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  )}
                  <span className="font-mono text-[11px] truncate max-w-[120px]">
                    {corr.native_reformulation}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Error Diagnosis */}
      <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold line-through text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60">
              "{currentCorrection.error_span}"
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60">
              "{currentCorrection.native_reformulation}"
            </span>
          </div>

          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            {currentCorrection.taxonomy_code}
          </span>
        </div>

        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
          {currentCorrection.explanation_es}
        </p>
      </div>

      {/* Interactive Cloze Exercise */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
          <span>Micro-Reto: Completa la oración con la estructura correcta</span>
        </div>

        {/* Cloze Sentence Display */}
        <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-[#181D2A]/80 border border-indigo-100 dark:border-indigo-900/40 text-center font-sans text-base sm:text-lg font-semibold text-gray-900 dark:text-white shadow-2xs">
          "{drill.cloze_sentence}"
        </div>

        {/* Format: Options OR Positive Text Input */}
        {hasOptions ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {drill.options!.map((opt, optIdx) => {
              const isSelected = selectedOptionIdx === optIdx;
              const isOptionCorrect = optIdx === (drill.correct_option_index ?? 1);

              let btnStyle =
                'bg-gray-50 dark:bg-[#181D2A] hover:bg-gray-100 dark:hover:bg-[#202738] border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';

              if (isCurrentAnswered) {
                if (isOptionCorrect) {
                  btnStyle =
                    'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold';
                } else if (isSelected && !isOptionCorrect) {
                  btnStyle =
                    'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
                } else {
                  btnStyle = 'opacity-40 border-gray-200 dark:border-gray-800';
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isCurrentAnswered}
                  className={`p-3 rounded-xl border text-center font-mono text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isCurrentAnswered && isOptionCorrect && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isCurrentAnswered && isSelected && !isOptionCorrect && (
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Positive Input Mode (Zero Negative Priming) */
          <div className="flex items-center gap-3 max-w-lg">
            <input
              type="text"
              value={typedAnswers[activeIdx] || ''}
              onChange={(e) => setTypedAnswers((prev) => ({ ...prev, [activeIdx]: e.target.value }))}
              onKeyDown={handleKeyDown}
              disabled={isCurrentAnswered}
              placeholder="Escribe la palabra o preposición requerida..."
              className="flex-1 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-mono text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              autoFocus
            />
            {!isCurrentAnswered && (
              <button
                type="button"
                onClick={handleCheckTypedAnswer}
                disabled={!(typedAnswers[activeIdx] || '').trim()}
                className="px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs transition-all cursor-pointer shrink-0"
              >
                Verificar
              </button>
            )}
          </div>
        )}

        {/* Feedback box */}
        {isCurrentAnswered && (
          <div
            className={`p-4 rounded-2xl text-xs leading-relaxed animate-in fade-in duration-200 ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {drill.explanation_es}
          </div>
        )}
      </div>

      {/* Transfer & 1-Click SRS Action Footer */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Audio TTS button */}
        <div className="flex items-center gap-2">
          {onPlayTts && (
            <button
              type="button"
              onClick={() => onPlayTts(currentCorrection.native_reformulation)}
              className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-gray-200 dark:border-gray-700 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Escuchar pronunciación nativa"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Escuchar modelo</span>
            </button>
          )}
        </div>

        {/* 1-Click Save to SRS */}
        {onAddToSrs && (
          <button
            type="button"
            onClick={handleSaveToSrs}
            disabled={isSrsSaved}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              isSrsSaved
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
          >
            {isSrsSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guardado en tu Mazo SRS</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Anclar como Tarjeta Cloze en SRS</span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
