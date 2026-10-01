import { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  X,
  Zap,
  Feather,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Plus,
  Target,
  Sliders,
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
  A1: 'Principiante: oraciones simples y vocabulario de supervivencia cotidiana.',
  A2: 'Elemental: descripción de rutinas, gustos y experiencias inmediatas.',
  B1: 'Intermedio: comunicación laboral, anécdotas y argumentación básica.',
  B2: 'Intermedio Alto: fluidez natural, matices semánticos y estilo técnico.',
  C1: 'Avanzado: precisión estilística, colocaciones idiomáticas y cohesión compleja.',
};

const DISCOURSE_CONNECTORS: Record<'A1' | 'A2' | 'B1' | 'B2' | 'C1', Array<{ phrase: string; labelEs: string; category: string }>> = {
  A1: [
    { phrase: 'and', labelEs: 'y', category: 'Adición' },
    { phrase: 'but', labelEs: 'pero', category: 'Contraste' },
    { phrase: 'because', labelEs: 'porque', category: 'Causa' },
    { phrase: 'so', labelEs: 'así que / por eso', category: 'Consecuencia' },
    { phrase: 'also', labelEs: 'también', category: 'Adición' },
  ],
  A2: [
    { phrase: 'for example', labelEs: 'por ejemplo', category: 'Ejemplificación' },
    { phrase: 'first of all', labelEs: 'primero que nada', category: 'Orden' },
    { phrase: 'then', labelEs: 'luego / después', category: 'Secuencia' },
    { phrase: 'finally', labelEs: 'finalmente', category: 'Cierre' },
    { phrase: 'in my opinion', labelEs: 'en mi opinión', category: 'Postura' },
  ],
  B1: [
    { phrase: 'however', labelEs: 'sin embargo', category: 'Contraste' },
    { phrase: 'although', labelEs: 'aunque', category: 'Concesión' },
    { phrase: 'in order to', labelEs: 'para / con el fin de', category: 'Propósito' },
    { phrase: 'therefore', labelEs: 'por lo tanto', category: 'Causa/Efecto' },
    { phrase: 'on the other hand', labelEs: 'por otra parte', category: 'Contraste' },
    { phrase: 'as a result', labelEs: 'como resultado', category: 'Consecuencia' },
  ],
  B2: [
    { phrase: 'furthermore', labelEs: 'es más / además', category: 'Adición formal' },
    { phrase: 'nevertheless', labelEs: 'no obstante', category: 'Contraste fuerte' },
    { phrase: 'whereas', labelEs: 'mientras que', category: 'Comparación' },
    { phrase: 'despite this', labelEs: 'a pesar de esto', category: 'Concesión' },
    { phrase: 'consequently', labelEs: 'consecuentemente', category: 'Causa formal' },
    { phrase: 'in terms of', labelEs: 'en cuanto a', category: 'Enfoque' },
  ],
  C1: [
    { phrase: 'notwithstanding', labelEs: 'a pesar de / sin perjuicio de', category: 'Concesión elevada' },
    { phrase: 'subsequently', labelEs: 'posteriormente', category: 'Secuencia' },
    { phrase: 'conversely', labelEs: 'a la inversa / por contra', category: 'Contraste diametral' },
    { phrase: 'with regard to', labelEs: 'en lo que respecta a', category: 'Precisión' },
    { phrase: 'in essence', labelEs: 'en esencia', category: 'Síntesis' },
  ],
};

type ToolkitTab = 'CONTEXT' | 'CONNECTORS' | 'STRUCTURE';

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
  const [activeTab, setActiveTab] = useState<ToolkitTab>('CONTEXT');
  const [useSerifFont, setUseSerifFont] = useState(false);

  // Speed writing sprint state
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [sprintDuration, setSprintDuration] = useState<number>(180); // default 3 min (180s)
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [sprintFinished, setSprintFinished] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isSprintActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSprintActive(false);
            setSprintFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSprintActive, timeLeft]);

  const handleStartSprint = (durationSec = 180) => {
    setSprintDuration(durationSec);
    setTimeLeft(durationSec);
    setIsSprintActive(true);
    setSprintFinished(false);
  };

  const handleResetSprint = () => {
    setIsSprintActive(false);
    setTimeLeft(sprintDuration);
    setSprintFinished(false);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleInsertText = (phrase: string) => {
    const isNewSentence =
      draft1.trim().length === 0 ||
      draft1.trim().endsWith('.') ||
      draft1.trim().endsWith('!') ||
      draft1.trim().endsWith('?');
    const formattedPhrase = isNewSentence
      ? phrase.charAt(0).toUpperCase() + phrase.slice(1)
      : phrase;
    const separator = draft1.length > 0 && !draft1.endsWith(' ') ? ' ' : '';
    onDraftChange(`${draft1}${separator}${formattedPhrase} `);
  };

  const words = draft1.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const targetMin = selectedPrompt ? selectedPrompt.suggestedWordRange.min : submissionMode === 'MICRO_WRITING' ? 30 : 40;
  const targetMax = selectedPrompt ? selectedPrompt.suggestedWordRange.max : submissionMode === 'MICRO_WRITING' ? 65 : 120;

  const isWordTargetMet = wordCount >= targetMin && wordCount <= targetMax;
  const wordProgressRatio = Math.min(100, Math.round((wordCount / targetMax) * 100));
  const activeConnectors = DISCOURSE_CONNECTORS[targetCefr] ?? DISCOURSE_CONNECTORS.B1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ========================================================================= */}
      {/* MAIN WRITING CANVAS (8 cols on desktop) */}
      {/* ========================================================================= */}
      <section aria-label="Lienzo de redacción" className="lg:col-span-8 space-y-4">
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 sm:p-7 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4">
          {/* Canvas Header & Contextual Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Lienzo de Redacción
              </span>

              {/* Mode indicator pill */}
              {selectedPrompt ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 truncate max-w-[220px]">
                  Prompt: {selectedPrompt.title}
                </span>
              ) : submissionMode === 'MICRO_WRITING' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Sprint de Fluidez ({formatTimer(timeLeft)})</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  Modo Libre ({targetCefr})
                </span>
              )}
            </div>

            {/* Typography & Clean Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseSerifFont(!useSerifFont)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${useSerifFont
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-editorial'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 border-gray-200 dark:border-gray-800'
                  }`}
                title="Alternar entre tipografía editorial (Serif) y sans-serif"
              >
                {useSerifFont ? 'Fuente Editorial' : 'Sans Serif'}
              </button>

              {draft1.length > 0 && (
                <button
                  type="button"
                  onClick={() => onDraftChange('')}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Limpiar texto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Primary Textarea Canvas */}
          <div className="relative">
            <textarea
              rows={11}
              value={draft1}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder={
                selectedPrompt?.sampleOpening
                  ? `Escribe tu redacción aquí... (Sugerencia de inicio: "${selectedPrompt.sampleOpening}")`
                  : 'Escribe tu borrador en inglés aquí. Puedes escribir sobre cualquier tema o seleccionar un prompt guiado desde el asistente lateral...'
              }
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              className={`w-full p-5 rounded-2xl bg-gray-50/60 dark:bg-[#181D2A]/80 border border-gray-200/90 dark:border-gray-800/90 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-hidden transition-all leading-relaxed placeholder:text-gray-400 custom-scrollbar ${useSerifFont ? 'font-editorial text-lg tracking-wide' : 'font-sans'
                }`}
            />
          </div>

          {/* Canvas Bottom Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium">Palabras:</span>
                <span
                  className={`font-mono font-bold text-sm ${isWordTargetMet
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : wordCount > targetMax
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                >
                  {wordCount}
                </span>
                <span className="text-gray-400 font-mono text-[11px]">
                  / meta {targetMin}-{targetMax}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-24 sm:w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-300 ${isWordTargetMet
                      ? 'bg-emerald-500'
                      : wordCount > targetMax
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                  style={{ width: `${wordProgressRatio}%` }}
                />
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onRequestSocratic}
              disabled={isLoading || !draft1.trim()}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analizando borrador con IA...</span>
                </span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solicitar Pistas y Orientación</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PEDAGOGICAL ASSISTANT TOOLKIT (4 cols on desktop) */}
      {/* ========================================================================= */}
      <aside aria-label="Asistente pedagógico" className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-[#131722] rounded-3xl p-5 sm:p-6 border border-gray-200/90 dark:border-gray-800 shadow-xs space-y-4">
          {/* Toolkit Navigation Tabs */}
          <div className="space-y-3 pb-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Asistente</span>
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                CEFR {targetCefr}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100/90 dark:bg-[#181D2A] rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('CONTEXT')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${activeTab === 'CONTEXT'
                    ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                Contexto
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CONNECTORS')}
                title={`Conectores (${targetCefr})`}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${activeTab === 'CONNECTORS'
                    ? 'bg-white dark:bg-[#121620] text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                <span>Conectores ({targetCefr})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('STRUCTURE')}
                className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center truncate ${activeTab === 'STRUCTURE'
                    ? 'bg-white dark:bg-[#121620] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
              >
                Estructura
              </button>
            </div>
          </div>

          {/* TAB 1: CONTEXT, MODES & CEFR LEVEL */}
          {activeTab === 'CONTEXT' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Target CEFR Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Nivel CEFR Objetivo:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{targetCefr}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['A1', 'A2', 'B1', 'B2', 'C1'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onTargetCefrChange(lvl)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center ${targetCefr === lvl
                          ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  {CEFR_DESCRIPTIONS[targetCefr]}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800/80">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Modo de Práctica:</span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100/80 dark:bg-[#181D2A] rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      onSubmissionModeChange('FREE');
                      if (selectedPrompt) onClearPrompt();
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${submissionMode === 'FREE' && !selectedPrompt
                        ? 'bg-white dark:bg-[#121620] text-gray-900 dark:text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Feather className="w-3 h-3" />
                    <span>Libre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSubmissionModeChange('MICRO_WRITING');
                      if (selectedPrompt) onClearPrompt();
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${submissionMode === 'MICRO_WRITING' && !selectedPrompt
                        ? 'bg-white dark:bg-[#121620] text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Sprint</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenPromptModal}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${selectedPrompt
                        ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                      }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Prompt</span>
                  </button>
                </div>
              </div>

              {/* Speed Writing Sprint Controller (When MICRO_WRITING is active) */}
              {submissionMode === 'MICRO_WRITING' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-900/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className={`w-4 h-4 text-amber-600 ${isSprintActive ? 'animate-pulse' : ''}`} />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Sprint de Fluidez</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                      {formatTimer(timeLeft)}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    {sprintFinished
                      ? '¡Tiempo completado! Revisa tu texto y solicita las pistas de mejora.'
                      : isSprintActive
                        ? 'Escribe continuo sin detenerte a dudar para desinhibir la automaticidad.'
                        : 'Escribe sin frenar para activar la memoria motora lingüística.'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {!isSprintActive && timeLeft === sprintDuration && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartSprint(180)}
                          className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>3 min</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartSprint(300)}
                          className="flex-1 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>5 min</span>
                        </button>
                      </>
                    )}

                    {isSprintActive && (
                      <button
                        type="button"
                        onClick={() => setIsSprintActive(false)}
                        className="flex-1 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pausar</span>
                      </button>
                    )}

                    {!isSprintActive && timeLeft < sprintDuration && !sprintFinished && (
                      <button
                        type="button"
                        onClick={() => setIsSprintActive(true)}
                        className="flex-1 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Reanudar</span>
                      </button>
                    )}

                    {(timeLeft < sprintDuration || sprintFinished) && (
                      <button
                        type="button"
                        onClick={handleResetSprint}
                        className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="Reiniciar temporizador"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Prompt Details Card */}
              {selectedPrompt && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        {selectedPrompt.categoryLabelEs}
                      </span>
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs mt-1">
                        {selectedPrompt.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={onClearPrompt}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-500 cursor-pointer"
                      title="Quitar prompt"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                    {selectedPrompt.promptText}
                  </p>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Vocabulario sugerido (toca para insertar):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPrompt.suggestedVocabulary.map((voc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInsertText(voc)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-[#181D2A] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-900/40 transition-colors cursor-pointer inline-flex items-center gap-1 group"
                          title="Insertar en borrador"
                        >
                          <span>{voc}</span>
                          <Plus className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISCOURSE CONNECTORS BANK */}
          {activeTab === 'CONNECTORS' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Conectores para Nivel {targetCefr}</span>
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {activeConnectors.map((conn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertText(conn.phrase)}
                    className="w-full p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#181D2A] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-gray-200/80 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer flex items-center justify-between text-left group"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1">
                        <span>{conn.phrase}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {conn.labelEs} • {conn.category}
                      </span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 3-STEP STRUCTURE GUIDE */}
          {activeTab === 'STRUCTURE' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Target className="w-3.5 h-3.5" />
                <span>Estructura de Párrafo en 3 Pasos</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    1. Topic / Situación
                  </span>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    Establece la idea central o el contexto en 1-2 oraciones claras y directas.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    2. Desarrollo & Contraste
                  </span>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    Añade un ejemplo o un matiz de peso utilizando conectores como <span className="font-mono font-semibold">however</span> o <span className="font-mono font-semibold">because</span>.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    3. Cierre / Conclusión
                  </span>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                    Sintetiza el desenlace, tu postura personal o el próximo paso a seguir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
