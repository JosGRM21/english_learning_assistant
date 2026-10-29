import {
  WritingSocraticSample,
  WritingEvaluationSample,
} from '../schemas/writing-golden-dataset.schema';
import { WritingLayerEvaluator, WritingLayerEvaluationResult } from './writing-layer-evaluator';
import { WritingRegressionRunner, WritingRunReport, WritingRegressionComparisonReport } from './writing-regression-runner';
import { WritingLlmJudge } from '../judges/writing-llm-judge';
import { GeminiAiGateway } from '../../src/infrastructure/ai/GeminiAiGateway';
import { QuotaMatrixOrchestrator } from '../../src/core/ai/QuotaMatrixOrchestrator';
import { resolveGeminiApiKeys } from '../judges/vocab-llm-judge';

export interface WritingLiveOptions {
  isFull: boolean;
  limit?: number;
  modelId?: string;
  judge?: WritingLlmJudge;
  concurrency?: number;
  onProgress?: (idx: number, total: number, sampleId: string, result: WritingLayerEvaluationResult) => void;
}

export class WritingLiveRunner {
  /**
   * Instancia un gateway de producción con las claves configuradas.
   */
  public static createLiveGateway(modelId = 'gemini-3.5-flash-lite'): GeminiAiGateway {
    const keys = resolveGeminiApiKeys();
    const managedKeys = keys.map((key, i) => ({
      id: `live_key_${i + 1}`,
      label: `Live Key ${i + 1}`,
      secretKey: key,
      maskedKey: `${key.slice(0, 6)}...${key.slice(-4)}`,
      isActive: true,
      isPrimary: i === 0,
    }));
    const orchestrator = new QuotaMatrixOrchestrator(managedKeys, modelId);
    return new GeminiAiGateway(orchestrator, modelId);
  }

  /**
   * Ejecuta la evaluación en vivo para Fase 1 (Socrática) invocando a evaluateSocraticPhase1.
   */
  public static async executeLiveSocraticSuite(
    samples: WritingSocraticSample[],
    datasetVersion: string,
    options: WritingLiveOptions,
  ): Promise<{ runReport: WritingRunReport; comparison?: WritingRegressionComparisonReport }> {
    const modelId = options.modelId ?? 'gemini-3.5-flash-lite';
    const gateway = this.createLiveGateway(modelId);
    const candidateOutputsMap = new Map<string, unknown>();

    const samplesToRun = options.limit ? samples.slice(0, options.limit) : samples;
    const activeKeysCount = resolveGeminiApiKeys().length;
    const concurrency = Math.max(
      1,
      Math.min(options.concurrency ?? activeKeysCount, samplesToRun.length),
    );

    console.log(
      `📡 Invocando GeminiAiGateway.evaluateSocraticPhase1 en vivo sobre ${samplesToRun.length} muestras (${concurrency} workers concurrentes)...`,
    );

    let nextIndex = 0;
    let completedCount = 0;

    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= samplesToRun.length) break;

        const s = samplesToRun[i];
        let liveOutput: any = null;
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            liveOutput = await gateway.evaluateSocraticPhase1(
              s.user_input,
              s.context?.cefrTarget,
              {
                readingContext: s.context?.readingContext,
                missionInstructions: s.context?.missionInstructions,
                targetWords: s.context?.targetWords,
              },
            );
            lastErr = null;
            break;
          } catch (err: unknown) {
            lastErr = err;
            if (attempt < 3) {
              await new Promise((res) => setTimeout(res, 2000 * attempt));
            }
          }
        }

        if (liveOutput) {
          candidateOutputsMap.set(s.id, liveOutput);
        } else {
          console.error(`   ⚠️ Fallo definitivo en llamada a Gemini para ${s.id}: ${(lastErr as Error)?.message}`);
          candidateOutputsMap.set(s.id, {
            overall_impression_es: 'Error en generación en vivo',
            error_count: 0,
            allow_self_correction: false,
            scaffolded_clues: [],
          });
        }
        completedCount++;
        console.log(`   └─ [${completedCount}/${samplesToRun.length}] Generadas pistas para ${s.id}`);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const runReport = await WritingRegressionRunner.executeSuite(
      samplesToRun,
      'writing_socratic',
      datasetVersion,
      {
        isFull: options.isFull,
        judge: options.judge,
        modelId,
        concurrency: options.concurrency,
        candidateOutputsMap,
        onProgress: options.onProgress,
      },
    );

    return { runReport };
  }

  /**
   * Ejecuta la evaluación en vivo para Fase 2 (Evaluación y Recast) invocando a evaluateFinalPhase2.
   */
  public static async executeLiveEvaluationSuite(
    samples: WritingEvaluationSample[],
    datasetVersion: string,
    options: WritingLiveOptions,
  ): Promise<{ runReport: WritingRunReport; comparison?: WritingRegressionComparisonReport }> {
    const modelId = options.modelId ?? 'gemini-3.5-flash-lite';
    const gateway = this.createLiveGateway(modelId);
    const candidateOutputsMap = new Map<string, unknown>();

    const samplesToRun = options.limit ? samples.slice(0, options.limit) : samples;
    const activeKeysCount = resolveGeminiApiKeys().length;
    const concurrency = Math.max(
      1,
      Math.min(options.concurrency ?? activeKeysCount, samplesToRun.length),
    );

    console.log(
      `📡 Invocando GeminiAiGateway.evaluateFinalPhase2 en vivo sobre ${samplesToRun.length} muestras (${concurrency} workers concurrentes)...`,
    );

    let nextIndex = 0;
    let completedCount = 0;

    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= samplesToRun.length) break;

        const s = samplesToRun[i];
        let liveOutput: any = null;
        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            liveOutput = await gateway.evaluateFinalPhase2(
              s.context.draft1,
              s.user_input, // Draft 2
              s.context.cefrTarget,
              {
                readingContext: s.context.readingContext,
                missionInstructions: s.context.missionInstructions,
                targetWords: s.context.targetWords,
              },
            );
            lastErr = null;
            break;
          } catch (err: unknown) {
            lastErr = err;
            if (attempt < 3) {
              await new Promise((res) => setTimeout(res, 2000 * attempt));
            }
          }
        }

        if (liveOutput) {
          candidateOutputsMap.set(s.id, liveOutput);
        } else {
          console.error(`   ⚠️ Fallo definitivo en llamada a Gemini para ${s.id}: ${(lastErr as Error)?.message}`);
          candidateOutputsMap.set(s.id, {
            overall_feedback_es: 'Error en generación en vivo',
            clean_structural_version: s.user_input,
            native_recast_version: s.user_input,
            noticing_the_gap_contrasts: [],
            rubric_scores: { accuracy: 5, range_and_precision: 5, cohesion_and_flow: 5, pragmatics_and_complexity: 5 },
            estimated_cefr: 'B1',
            successful_repairs: [],
            corrections: [],
          });
        }
        completedCount++;
        console.log(`   └─ [${completedCount}/${samplesToRun.length}] Generada evaluación para ${s.id}`);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const runReport = await WritingRegressionRunner.executeSuite(
      samplesToRun,
      'writing_evaluation',
      datasetVersion,
      {
        isFull: options.isFull,
        judge: options.judge,
        modelId,
        concurrency: options.concurrency,
        candidateOutputsMap,
        onProgress: options.onProgress,
      },
    );

    return { runReport };
  }
}
