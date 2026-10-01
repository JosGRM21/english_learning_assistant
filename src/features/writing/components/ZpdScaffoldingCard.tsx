import { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Eye,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';
import { SocraticClue } from '@/infrastructure/ai/schemas';

export interface ZpdScaffoldingCardProps {
  clue: SocraticClue;
  index: number;
  onHighlight?: (snippet: string | null) => void;
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

export function ZpdScaffoldingCard({ clue, index, onHighlight }: ZpdScaffoldingCardProps) {
  const [currentZpdLevel, setCurrentZpdLevel] = useState<1 | 2 | 3 | 4>(1);
  const [clueUserAnswer, setClueUserAnswer] = useState('');
  const [clueFeedback, setClueFeedback] = useState<'IDLE' | 'CORRECT' | 'INCORRECT'>('IDLE');

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

  const handleValidateAnswer = () => {
    if (!clueUserAnswer.trim()) return;

    if (!zpd.expectedToken) {
      // If no token was specified by AI, acknowledge user attempt
      setClueFeedback('CORRECT');
      return;
    }

    const cleanInput = clueUserAnswer.trim().toLowerCase();
    const cleanExpected = zpd.expectedToken.trim().toLowerCase();

    if (cleanInput === cleanExpected || cleanExpected.includes(cleanInput)) {
      setClueFeedback('CORRECT');
    } else {
      setClueFeedback('INCORRECT');
    }
  };

  return (
    <div
      onMouseEnter={() => onHighlight?.(clue.highlighted_area)}
      onMouseLeave={() => onHighlight?.(null)}
      className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs transition-all duration-200 hover:border-amber-300 dark:hover:border-amber-800 space-y-4"
    >
      {/* Header with ZPD Level Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight">
            Pista #{index + 1}: {CLUE_TYPE_LABELS_ES[clue.clue_type] ?? clue.clue_type}
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold">
            "{clue.highlighted_area}"
          </span>
        </div>

        {/* ZPD Level Indicator Tabs */}
        <div className="flex items-center gap-1 bg-amber-100/70 dark:bg-amber-900/40 p-1 rounded-xl">
          {([1, 2, 3, 4] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCurrentZpdLevel(lvl)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                currentZpdLevel === lvl
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-800/40'
              }`}
            >
              Nivel {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Level 1: Guiding Socratic Question */}
      {currentZpdLevel === 1 && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nivel 1: Pregunta Guía para Autodescubrimiento</span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
            {zpd.level1Question}
          </p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setCurrentZpdLevel(2)}
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>¿Necesitas una pista más clara? Ver explicación contrastiva (Nivel 2)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Level 2: Metalinguistic / L1 Contrastive Explanation */}
      {currentZpdLevel === 2 && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Nivel 2: Explicación de Diferencias con el Español</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {zpd.level2Contrastive}
          </p>
          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setCurrentZpdLevel(1)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Volver a Nivel 1</span>
            </button>
            <button
              onClick={() => setCurrentZpdLevel(3)}
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver ejercicio guiado de completar (Nivel 3)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Level 3: Interactive Cloze with Validation */}
      {currentZpdLevel === 3 && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Eye className="w-3.5 h-3.5" />
            <span>Nivel 3: Completa el Espacio en Blanco</span>
          </div>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#121620] border border-amber-200 dark:border-amber-900/50 text-center font-mono text-sm font-bold text-amber-950 dark:text-amber-200">
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
              className="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#181D2A] text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <button
              onClick={handleValidateAnswer}
              disabled={!clueUserAnswer.trim()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Comprobar
            </button>
          </div>

          {clueFeedback === 'CORRECT' && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Exacto! Aplica este cambio en tu editor del segundo borrador.</span>
            </div>
          )}

          {clueFeedback === 'INCORRECT' && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Intenta nuevamente o avanza al Nivel 4 para ver el modelo nativo.</span>
              </div>
              <button
                onClick={() => setCurrentZpdLevel(4)}
                className="text-[11px] font-bold underline cursor-pointer shrink-0"
              >
                Ver solución
              </button>
            </div>
          )}

          <div className="pt-1 flex justify-between items-center">
            <button
              onClick={() => setCurrentZpdLevel(2)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Volver a Nivel 2</span>
            </button>
            <button
              onClick={() => setCurrentZpdLevel(4)}
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver modelo nativo explícito (Nivel 4)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Level 4: Explicit Native Model */}
      {currentZpdLevel === 4 && (
        <div className="space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nivel 4: Modelo y Estructura Nativa Estándar</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs font-sans font-medium text-emerald-900 dark:text-emerald-200 leading-relaxed">
            {zpd.level4NativeModel}
          </div>
          <div className="pt-1 flex justify-start">
            <button
              onClick={() => setCurrentZpdLevel(1)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Reiniciar a Nivel 1</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
