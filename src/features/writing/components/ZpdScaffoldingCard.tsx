import { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SocraticClue, TaxonomyErrorCode } from '@/infrastructure/ai/schemas';
import { normalizeInput } from '@/shared/utils/text';

export interface ZpdScaffoldingCardProps {
  clue: SocraticClue;
  index: number;
  isApplied?: boolean;
  onHighlight?: (clue: SocraticClue | null) => void;
}

const CLUE_TYPE_LABELS_ES: Record<TaxonomyErrorCode, string> = {
  PREPOSITION: 'Preposición dependiente',
  TENSE_ASPECT: 'Tiempo y aspecto verbal',
  FALSE_FRIEND: 'Falso amigo',
  AGREEMENT: 'Concordancia gramatical',
  LEXICAL_COLLOCATION: 'Combinación natural',
  WORD_ORDER: 'Orden de palabras',
  COHESION_LINKERS: 'Conector discursivo',
  SYNTACTIC_VARIETY: 'Fluidez sintáctica',
  REGISTER: 'Registro y tono',
  SPELLING: 'Ortografía',
};

export function ZpdScaffoldingCard({
  clue,
  index,
  isApplied = false,
  onHighlight,
}: ZpdScaffoldingCardProps) {
  // Determine if it is an arbitrary convention/gap (prepositions, collocations, false friends)
  // or a monitoring slip (agreement, verb tense, spelling, word order)
  const isCompetenceGap = [
    'PREPOSITION',
    'LEXICAL_COLLOCATION',
    'FALSE_FRIEND',
    'REGISTER',
    'COHESION_LINKERS',
    'SYNTACTIC_VARIETY',
  ].includes(clue.clue_type);

  // Progressive disclosure states (No rigid numeric tabs)
  const [showPractice, setShowPractice] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [clueUserAnswer, setClueUserAnswer] = useState('');
  const [clueFeedback, setClueFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');

  // Compute dynamic or fallback details
  const getClueDetails = () => {
    const area = clue.highlighted_area;
    const question = clue.hint_question_es;

    const explanation =
      clue.zpd_contrastive_es ||
      (clue.clue_type === 'PREPOSITION'
        ? `En inglés "${area}" suele asociarse a una partícula idiomática fija distinta al español.`
        : clue.clue_type === 'FALSE_FRIEND'
          ? `Cuidado: la palabra "${area}" se parece al español pero tiene un significado diferente en inglés.`
          : clue.clue_type === 'AGREEMENT'
            ? `Revisa la relación entre el sujeto y el verbo principal en la oración.`
            : `Observa la estructura natural en inglés frente a la traducción literal.`);

    const clozeSentence =
      clue.zpd_cloze_sentence ||
      `${area.split(' ')[0] || 'word'} [ ___ ]`;

    const expectedToken =
      clue.zpd_expected_token ||
      (clue.clue_type === 'PREPOSITION' && area.toLowerCase().includes('depend')
        ? 'on'
        : clue.clue_type === 'AGREEMENT' && area.toLowerCase().includes('agree')
          ? 'agree'
          : '');

    const resolvedModel =
      clue.zpd_native_model ||
      `Colocación recomendada: ${expectedToken || area}`;

    return {
      question,
      explanation,
      clozeSentence,
      expectedToken,
      resolvedModel,
    };
  };

  const details = getClueDetails();

  const BLANK_REGEX = /\[\s*[_.-]+\s*\]|_{2,}/;
  const hasClozeBlank = Boolean(details.clozeSentence && BLANK_REGEX.test(details.clozeSentence));
  const fullCompletedCloze =
    hasClozeBlank && details.expectedToken
      ? details.clozeSentence.replace(BLANK_REGEX, details.expectedToken)
      : null;

  const renderCompletedCloze = () => {
    if (!hasClozeBlank || !details.expectedToken) return null;
    const parts = details.clozeSentence.split(BLANK_REGEX);
    return (
      <span className="font-mono text-xs sm:text-sm">
        <span>{parts[0]}</span>
        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-700/80 mx-1">
          {details.expectedToken}
        </span>
        <span>{parts.slice(1).join('')}</span>
      </span>
    );
  };

  const handleValidateAnswer = () => {
    if (!clueUserAnswer.trim()) return;

    if (!details.expectedToken || !details.expectedToken.trim()) {
      setShowSolution(true);
      return;
    }

    const cleanInput = normalizeInput(clueUserAnswer);
    const cleanExpected = normalizeInput(details.expectedToken);

    if (cleanInput === cleanExpected) {
      setClueFeedback('CORRECT');
    } else {
      setClueFeedback('INCORRECT');
    }
  };

  return (
    <div
      onMouseEnter={() => onHighlight?.(clue)}
      onMouseLeave={() => onHighlight?.(null)}
      className={`p-5 rounded-2xl border shadow-xs transition-all duration-200 space-y-4 ${
        isApplied
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-300'
          : 'bg-white dark:bg-[#131722] border-gray-200/90 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-800'
      }`}
    >
      {/* 1. Header: Clue type and snippet */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isApplied
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : isCompetenceGap
                  ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            {isCompetenceGap ? (
              <Sparkles className="w-3.5 h-3.5" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5" />
            )}
          </span>

          <span className="text-xs font-bold text-gray-900 dark:text-white">
            Pista #{index + 1}: {CLUE_TYPE_LABELS_ES[clue.clue_type] ?? clue.clue_type}
          </span>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#181D2A] text-gray-800 dark:text-gray-200 font-semibold border border-gray-200/80 dark:border-gray-700">
            "{clue.highlighted_area}"
          </span>

          {clue.is_l1_spanish_transfer && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 inline-flex items-center gap-1">
              <span>Interferencia L1 (Español)</span>
            </span>
          )}

          {isApplied && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Modificado en Borrador 2</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. BODY: Bifurcated according to error nature */}
      {isCompetenceGap ? (
        /* ========================================================================= */
        /* CASE A: Competence Gap / Idiomatic Convention (Direct recommendation + note) */
        /* ========================================================================= */
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Direct natural expression */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/60 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
              Forma recomendada en inglés:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 line-through font-mono text-xs">
                "{clue.highlighted_area}"
              </span>
              <span className="text-purple-800 dark:text-purple-200 font-bold font-mono text-sm bg-white dark:bg-[#181D2A] px-2.5 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 shadow-2xs">
                {details.expectedToken || details.resolvedModel}
              </span>
            </div>
          </div>

          {/* Clear explanatory note */}
          <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
            <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p>{details.explanation}</p>
          </div>

          {/* Interactive practice toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPractice((prev) => !prev)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>{showPractice ? 'Ocultar práctica' : 'Practicar en una oración'}</span>
              {showPractice ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE B: Monitoring Slip (Agile Socratic question for self-repair)          */
        /* ========================================================================= */
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Guiding question for reflection */}
          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
            {details.question}
          </p>

          {/* Options for progressive help */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => setShowPractice((prev) => !prev)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>{showPractice ? 'Ocultar pista con espacio' : 'Ver pista con espacio en blanco'}</span>
              {showPractice ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!showSolution && (
              <button
                type="button"
                onClick={() => setShowSolution(true)}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                Ver solución
              </button>
            )}
          </div>

          {/* Explicit solution when requested */}
          {showSolution && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-100 font-medium animate-in fade-in duration-150">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
                Solución de referencia:
              </span>
              {fullCompletedCloze ? (
                renderCompletedCloze()
              ) : (
                <p className="font-mono">{details.resolvedModel}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. INTERACTIVE PRACTICE ARENA (CLOZE) - Available when toggled in either case */}
      {showPractice && (
        <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 space-y-3 animate-in fade-in duration-150">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Completa la palabra o preposición requerida:
          </span>

          <div className="p-3 rounded-lg bg-white dark:bg-[#131722] border border-gray-200/80 dark:border-gray-800 text-center font-mono text-xs sm:text-sm font-bold text-gray-900 dark:text-white shadow-2xs">
            {details.clozeSentence}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={clueUserAnswer}
              onChange={(e) => {
                setClueUserAnswer(e.target.value);
                setClueFeedback('IDLE');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleValidateAnswer();
              }}
              placeholder="Escribe la corrección..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#131722] text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
            />
            <button
              type="button"
              onClick={handleValidateAnswer}
              disabled={!clueUserAnswer.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              Comprobar
            </button>
          </div>

          {clueFeedback === 'CORRECT' && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Exacto! Asimilaste la estructura.</span>
            </div>
          )}

          {clueFeedback === 'INCORRECT' && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Intenta nuevamente.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSolution(true)}
                className="text-[11px] font-bold underline cursor-pointer shrink-0"
              >
                Ver solución
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
