import { useState, useMemo } from 'react';
import {
  PenTool,
  HelpCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Award,
  BookOpen,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import { IAiGateway } from '@/infrastructure/ai/IAiGateway';
import { MockAiGateway } from '@/infrastructure/ai/MockAiGateway';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '@/infrastructure/ai/schemas';
import { DiffVisualizer } from './DiffVisualizer';
import { AudioService } from '@/infrastructure/audio/AudioService';

interface SocraticWritingStudioProps {
  audioService: AudioService;
  aiGateway?: IAiGateway;
}

const SAMPLE_PROMPTS = [
  {
    label: 'Error de Preposición e Interferencia L1',
    text: 'I am agree with your suggestion, but the final decision depend of my company schedule.',
  },
  {
    label: 'Falsos Amigos y Transferencia de Sintaxis',
    text: 'Actually I have 28 years and I want to improve my career because it depend of my effort.',
  },
  {
    label: 'Oración Correcta',
    text: 'I agree with your suggestion because our future success definitely depends on persistent effort.',
  },
];

export function SocraticWritingStudio({
  audioService,
  aiGateway,
}: SocraticWritingStudioProps) {
  const gateway = useMemo(() => aiGateway ?? new MockAiGateway(), [aiGateway]);

  // Stage: 1 = Draft 1 Input, 2 = Socratic Reflection & Draft 2, 3 = Final Evaluation & Diff
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  // Inputs
  const [draft1, setDraft1] = useState(SAMPLE_PROMPTS[0].text);
  const [draft2, setDraft2] = useState('');
  const [targetCefr, setTargetCefr] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('B1');

  // AI responses
  const [isLoading, setIsLoading] = useState(false);
  const [socraticResult, setSocraticResult] = useState<SocraticFeedbackResponse | null>(null);
  const [evalResult, setEvalResult] = useState<WritingEvaluationResponse | null>(null);

  // Micro-challenge quiz interaction
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Request Socratic feedback (Stage 1 -> Stage 2)
  const handleRequestSocratic = async () => {
    if (!draft1.trim()) return;
    setIsLoading(true);
    try {
      const response = await gateway.evaluateSocraticPhase1(draft1);
      setSocraticResult(response);
      setDraft2(draft1); // initialize draft 2 with current draft 1 for convenience
      setCurrentStage(2);
    } catch (err) {
      console.error('Error fetching Socratic feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Draft 2 for final evaluation (Stage 2 -> Stage 3)
  const handleEvaluateFinal = async () => {
    if (!draft2.trim()) return;
    setIsLoading(true);
    try {
      const response = await gateway.evaluateFinalPhase2(draft1, draft2, targetCefr);
      setEvalResult(response);
      setSelectedQuizOption(null);
      setQuizSubmitted(false);
      setCurrentStage(3);
    } catch (err) {
      console.error('Error fetching final evaluation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Micro-challenge selection
  const handleAnswerQuiz = (index: number) => {
    if (quizSubmitted || !evalResult) return;
    setSelectedQuizOption(index);
    setQuizSubmitted(true);

    const isCorrect = index === evalResult.micro_challenge.correct_option_index;
    audioService.playFeedback(isCorrect);
  };

  // Reset to initial state
  const handleReset = () => {
    setCurrentStage(1);
    setSocraticResult(null);
    setEvalResult(null);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Stepper */}
      <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <PenTool className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Taller Socrático de Redacción (Socratic Writing Studio)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Andamiaje en 2 etapas: Pistas reflexivas sin revelar respuestas directas para
                fomentar la metacognición y auto-corrección del estudiante.
              </p>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                currentStage === 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              <span>1</span> Borrador 1
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                currentStage === 2
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              <span>2</span> Pistas & Borrador 2
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                currentStage === 3
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              <span>3</span> Diff & Reto
            </div>
          </div>
        </div>
      </div>

      {/* Stage 1: Draft 1 Input Arena */}
      {currentStage === 1 && (
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
                    onClick={() => setTargetCefr(lvl)}
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
            <div className="text-xs text-gray-400 mb-2 font-medium">O prueba un ejemplo con errores comunes de transferencia del español:</div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setDraft1(p.text)}
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
              onChange={(e) => setDraft1(e.target.value)}
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
              onClick={handleRequestSocratic}
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
      )}

      {/* Stage 2: Socratic Hints Scaffolding & Draft 2 Revision */}
      {currentStage === 2 && socraticResult && (
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
              onChange={(e) => setDraft2(e.target.value)}
              placeholder="Corrige tu texto aplicando las pistas anteriores..."
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all leading-relaxed"
            />

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setCurrentStage(1)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Volver al Borrador 1
              </button>

              <button
                onClick={handleEvaluateFinal}
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
      )}

      {/* Stage 3: Diff Comparison, CEFR Scores & Micro-Challenge Quiz */}
      {currentStage === 3 && evalResult && (
        <div className="space-y-6">
          {/* CEFR Score Strip */}
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      Nivel Estimado CEFR:
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm">
                      {evalResult.estimated_cefr}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {evalResult.overall_feedback_es}
                  </p>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] text-center min-w-[80px]">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Gramática</span>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    {evalResult.scores.grammar}/10
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] text-center min-w-[80px]">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Vocabulario</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {evalResult.scores.vocabulary}/10
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#181D2A] text-center min-w-[80px]">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Coherencia</span>
                  <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                    {evalResult.scores.coherence}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Word-level Diff Engine */}
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <DiffVisualizer original={draft1} updated={draft2} />
          </div>

          {/* Detailed Corrections & L1 Transfer Breakdown */}
          {evalResult.corrections.length > 0 && (
            <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Interferencias Detectadas del Español (L1 Transfer)</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                {evalResult.corrections.map((corr, idx) => (
                  <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                          {corr.error_span}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                          {corr.native_reformulation}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">({corr.taxonomy_code})</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        {corr.explanation_es}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Micro-Reto Quiz */}
          <div className="bg-white dark:bg-[#131722] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Micro-Reto de Consolidación Inmediata
              </h3>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {evalResult.micro_challenge.question_es}
            </p>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181D2A] border border-gray-200 dark:border-gray-800 text-center font-sans text-lg font-semibold text-gray-900 dark:text-white">
              "{evalResult.micro_challenge.sentence_with_blank}"
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {evalResult.micro_challenge.options.map((opt, idx) => {
                const isSelected = selectedQuizOption === idx;
                const isCorrect = idx === evalResult.micro_challenge.correct_option_index;

                let btnStyle =
                  'bg-gray-50 dark:bg-[#181D2A] hover:bg-gray-100 dark:hover:bg-[#202738] border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';

                if (quizSubmitted) {
                  if (isCorrect) {
                    btnStyle =
                      'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle =
                      'bg-rose-100 dark:bg-rose-950/70 border-rose-500 text-rose-900 dark:text-rose-100 font-bold';
                  } else {
                    btnStyle = 'opacity-40 border-gray-200 dark:border-gray-800';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerQuiz(idx)}
                    disabled={quizSubmitted}
                    className={`p-3.5 rounded-xl border text-center font-mono text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {quizSubmitted && isSelected && !isCorrect && (
                      <X className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div
                className={`p-4 rounded-xl text-xs leading-relaxed animate-in fade-in duration-200 ${
                  selectedQuizOption === evalResult.micro_challenge.correct_option_index
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {evalResult.micro_challenge.explanation_es}
              </div>
            )}
          </div>

          {/* Action to restart */}
          <div className="text-center pt-2">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Nuevo Ejercicio de Redacción</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
