import { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  Eye,
  CheckCircle2,
  Check,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { SocraticClue } from '@/infrastructure/ai/schemas';

export interface ZpdScaffoldingCardProps {
  clue: SocraticClue;
  index: number;
  isApplied?: boolean;
  onHighlight?: (clue: SocraticClue | null) => void;
}

const CLUE_TYPE_LABELS_ES: Record<string, string> = {
  PREPOSITION: 'Preposición dependiente',
  FALSE_FRIEND: 'Falso amigo / Cognado engañoso',
  AGREEMENT: 'Concordancia gramatical',
  TENSE_ASPECT: 'Tiempo y aspecto verbal',
  COLLOCATION: 'Combinación léxica natural',
  WORD_ORDER: 'Orden de palabras sintáctico',
  WORD_CHOICE: 'Selección de vocabulario',
  SPELLING: 'Ortografía y puntuación',
};

export function ZpdScaffoldingCard({
  clue,
  index,
  isApplied = false,
  onHighlight,
}: ZpdScaffoldingCardProps) {
  const [currentZpdLevel, setCurrentZpdLevel] = useState<1 | 2 | 3 | 4>(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [clueUserAnswer, setClueUserAnswer] = useState('');
  const [clueFeedback, setClueFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');

  const unlockAndNavigate = (level: 1 | 2 | 3 | 4) => {
    if (!unlockedLevels.includes(level)) {
      setUnlockedLevels((prev) => [...prev, level]);
    }
    setCurrentZpdLevel(level);
  };

  // Compute dynamic or fallback details
  const getZpdDetails = () => {
    const area = clue.highlighted_area;

    const level1Question = clue.hint_question_es;

    const level2Contrastive =
      clue.zpd_contrastive_es ||
      (clue.clue_type === 'PREPOSITION'
        ? `En español solemos traducir preposiciones como "de", "en" o "con", pero en inglés "${area}" suele asociarse a una partícula idiomática específica e inmutable.`
        : clue.clue_type === 'FALSE_FRIEND'
          ? `Cuidado con la trampa cognitiva de los falsos amigos: la palabra "${area}" tiene una forma similar a una palabra en español, pero su significado en inglés difiere notablemente.`
          : clue.clue_type === 'AGREEMENT'
            ? `Revisa la relación entre el sujeto y el verbo principal. En inglés la flexión verbal y los auxiliares siguen reglas de concordancia estrictas.`
            : `Observa la estructura idiomática del inglés natural frente a la traducción literal directa palabra por palabra.`);

    const level3Cloze =
      clue.zpd_cloze_sentence ||
      `${area.split(' ')[0] || 'word'} [ ___ ]`;

    const expectedToken =
      clue.zpd_expected_token ||
      (clue.clue_type === 'PREPOSITION' && area.toLowerCase().includes('depend')
        ? 'on'
        : clue.clue_type === 'AGREEMENT' && area.toLowerCase().includes('agree')
          ? 'agree'
          : '');

    const level4NativeModel =
      clue.zpd_native_model ||
      `Colocación o reformulación idiomática nativa para "${area}".`;

    return {
      level1Question,
      level2Contrastive,
      level3Cloze,
      expectedToken,
      level4NativeModel,
    };
  };

  const zpd = getZpdDetails();

  const BLANK_REGEX = /\[\s*[_.-]+\s*\]|_{2,}/;
  const hasClozeBlank = Boolean(zpd.level3Cloze && BLANK_REGEX.test(zpd.level3Cloze));
  const fullCompletedCloze =
    hasClozeBlank && zpd.expectedToken
      ? zpd.level3Cloze.replace(BLANK_REGEX, zpd.expectedToken)
      : null;

  const renderCompletedCloze = () => {
    if (!hasClozeBlank || !zpd.expectedToken) return null;
    const parts = zpd.level3Cloze.split(BLANK_REGEX);
    return (
      <span className="font-mono text-xs sm:text-sm">
        <span>{parts[0]}</span>
        <span className="inline-block px-1.5 py-0.5 rounded-md font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-700/80 mx-1">
          {zpd.expectedToken}
        </span>
        <span>{parts.slice(1).join('')}</span>
      </span>
    );
  };

  const handleValidateAnswer = () => {
    if (!clueUserAnswer.trim()) return;

    if (!zpd.expectedToken) {
      setClueFeedback('CORRECT');
      return;
    }

    const cleanInput = clueUserAnswer
      .trim()
      .toLowerCase()
      .replace(/['"´`]/g, "'")
      .replace(/\s+/g, ' ');
    const cleanExpected = zpd.expectedToken
      .trim()
      .toLowerCase()
      .replace(/['"´`]/g, "'")
      .replace(/\s+/g, ' ');

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
      className={`p-5 rounded-2xl border shadow-xs transition-all duration-200 space-y-4 ${isApplied
          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-300'
          : 'bg-white dark:bg-[#131722] border-gray-200/90 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-800'
        }`}
    >
      {/* Header with Clue Type & Progressive Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-gray-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isApplied
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
              }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </span>

          <span className="text-xs font-bold text-gray-900 dark:text-white">
            Pista #{index + 1}: {CLUE_TYPE_LABELS_ES[clue.clue_type] ?? clue.clue_type}
          </span>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#181D2A] text-gray-800 dark:text-gray-200 font-semibold border border-gray-200/80 dark:border-gray-700">
            "{clue.highlighted_area}"
          </span>

          {isApplied && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Aplicado en Borrador 2</span>
            </span>
          )}
        </div>

        {/* ZPD 4-Level Stepper */}
        <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-[#181D2A] p-1 rounded-xl">
          {([1, 2, 3, 4] as const).map((lvl) => {
            const isUnlocked = unlockedLevels.includes(lvl);
            const isActive = currentZpdLevel === lvl;

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => unlockAndNavigate(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${isActive
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : isUnlocked
                      ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
              >
                {!isUnlocked && lvl > 1 && <Lock className="w-2.5 h-2.5 opacity-50" />}
                <span>Nivel {lvl}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Level 1: Guiding Socratic Question */}
      {currentZpdLevel === 1 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nivel 1: Pregunta Guía para Autodescubrimiento</span>
          </div>

          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
            {zpd.level1Question}
          </p>

          <div className="pt-2 flex justify-end border-t border-gray-100 dark:border-gray-800/60">
            <button
              type="button"
              onClick={() => unlockAndNavigate(2)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Level 2: Metalinguistic / L1 Contrastive Explanation */}
      {currentZpdLevel === 2 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nivel 2: Diferencias con el Español</span>
          </div>

          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
            {zpd.level2Contrastive}
          </p>

          <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-gray-800/60">
            <button
              type="button"
              onClick={() => unlockAndNavigate(1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={() => unlockAndNavigate(3)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Level 3: Interactive Cloze with Validation */}
      {currentZpdLevel === 3 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Eye className="w-3.5 h-3.5" />
            <span>Nivel 3: Completa el Espacio en Blanco</span>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200/80 dark:border-gray-800 text-center font-mono text-sm font-bold text-gray-900 dark:text-white shadow-2xs">
            {zpd.level3Cloze}
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
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#181D2A] text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleValidateAnswer}
              disabled={!clueUserAnswer.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Comprobar
            </button>
          </div>

          {clueFeedback === 'CORRECT' && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Exacto! Asimilaste la estructura.</span>
            </div>
          )}

          {clueFeedback === 'INCORRECT' && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Intenta nuevamente o avanza al Nivel 4 para ver la solución.</span>
              </div>
              <button
                type="button"
                onClick={() => unlockAndNavigate(4)}
                className="text-[11px] font-bold underline cursor-pointer shrink-0"
              >
                Ver solución
              </button>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-gray-800/60">
            <button
              type="button"
              onClick={() => unlockAndNavigate(2)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={() => unlockAndNavigate(4)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Level 4: Explicit Native Model */}
      {currentZpdLevel === 4 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nivel 4: Oración Resuelta</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 font-medium">
            {fullCompletedCloze ? (
              renderCompletedCloze()
            ) : (
              <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed font-sans font-medium">
                {zpd.level4NativeModel}
              </p>
            )}
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-gray-100 dark:border-gray-800/60">
            <button
              type="button"
              onClick={() => unlockAndNavigate(3)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              onClick={() => unlockAndNavigate(1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
