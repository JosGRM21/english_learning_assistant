import { PenTool, ArrowRight } from 'lucide-react';
import { IAiGateway } from '@/infrastructure/ai/IAiGateway';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { useWritingSession } from '../hooks/useWritingSession';
import { WritingStageOne } from './WritingStageOne';
import { WritingStageTwo } from './WritingStageTwo';
import { WritingStageThree } from './WritingStageThree';

export interface SocraticWritingStudioProps {
  audioService?: AudioService;
  aiGateway?: IAiGateway;
}

export function SocraticWritingStudio(_props: SocraticWritingStudioProps) {
  const {
    currentStage,
    draft1,
    draft2,
    targetCefr,
    isLoading,
    socraticResult,
    evalResult,
    selectedQuizOption,
    quizSubmitted,
    setCurrentStage,
    setDraft1,
    setDraft2,
    setTargetCefr,
    handleRequestSocratic,
    handleEvaluateFinal,
    handleAnswerQuiz,
    resetWriting,
  } = useWritingSession();

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
        <WritingStageOne
          draft1={draft1}
          targetCefr={targetCefr}
          isLoading={isLoading}
          onDraftChange={setDraft1}
          onTargetCefrChange={setTargetCefr}
          onRequestSocratic={handleRequestSocratic}
        />
      )}

      {/* Stage 2: Socratic Hints Scaffolding & Draft 2 Revision */}
      {currentStage === 2 && socraticResult && (
        <WritingStageTwo
          socraticResult={socraticResult}
          draft2={draft2}
          isLoading={isLoading}
          onDraftChange={setDraft2}
          onBackToStageOne={() => setCurrentStage(1)}
          onEvaluateFinal={handleEvaluateFinal}
        />
      )}

      {/* Stage 3: Diff Comparison, CEFR Scores & Micro-Challenge Quiz */}
      {currentStage === 3 && evalResult && (
        <WritingStageThree
          evalResult={evalResult}
          draft1={draft1}
          draft2={draft2}
          selectedQuizOption={selectedQuizOption}
          quizSubmitted={quizSubmitted}
          onAnswerQuiz={handleAnswerQuiz}
          onReset={resetWriting}
        />
      )}
    </div>
  );
}
