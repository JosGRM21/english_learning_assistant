import fs from 'fs';
import path from 'path';
import { GoldenSample } from '../schemas/golden-dataset.schema';
import { LayerEvaluator, LayerEvaluationResult } from './layer-evaluator';
import { VocabLlmJudge, resolveGeminiApiKeys } from '../judges/vocab-llm-judge';
import { VocabGeneratorPipeline } from '../../scripts/vocab-generator/pipeline';
import { GeneratedVocabWord } from '../../scripts/vocab-generator/schema';
import {
  RegressionRunner,
  RunReport,
  SampleExecutionRecord,
  RegressionComparisonReport,
} from './regression-runner';

export interface LiveGeneratorOptions {
  isFull: boolean;
  limit?: number;
  judge?: VocabLlmJudge;
  batchSize?: number;
  modelId?: string;
  onProgress?: (
    index: number,
    total: number,
    sample: GoldenSample,
    result: LayerEvaluationResult,
    generatedWord?: GeneratedVocabWord,
  ) => void;
}

export class LiveGeneratorRunner {
  private static readonly RUNS_DIR = path.resolve(process.cwd(), 'evals/reports/runs');
  private static readonly REPORTS_DIR = path.resolve(process.cwd(), 'evals/reports');

  public static ensureDirectories(): void {
    if (!fs.existsSync(this.RUNS_DIR)) {
      fs.mkdirSync(this.RUNS_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.REPORTS_DIR)) {
      fs.mkdirSync(this.REPORTS_DIR, { recursive: true });
    }
  }

  /**
   * Ejecuta la evaluación en vivo invocando a VocabGeneratorPipeline con el prompt actual,
   * capturando las salidas generadas en memoria y sometiéndolas a la pirámide de evaluación.
   */
  public static async executeLiveEvaluation(
    samples: GoldenSample[],
    datasetVersion: string,
    options: LiveGeneratorOptions,
  ): Promise<{ runReport: RunReport; comparison?: RegressionComparisonReport }> {
    this.ensureDirectories();

    const mode: 'FAST_L1_L2' | 'FULL_L1_L2_L3' = options.isFull ? 'FULL_L1_L2_L3' : 'FAST_L1_L2';
    const runId = `run_${Date.now()}_live_${mode.toLowerCase()}`;
    const timestamp = new Date().toISOString();

    const samplesToProcess = options.limit ? samples.slice(0, options.limit) : samples;
    const apiKeys = resolveGeminiApiKeys();

    console.log(`🔌 Conectando con VocabGeneratorPipeline (${apiKeys.length} claves activas)...`);
    const pipeline = new VocabGeneratorPipeline(apiKeys, 'scripts/.cache/vocab_pipeline', {
      batchSize: options.batchSize ?? 5,
      modelId: options.modelId ?? 'gemini-3.5-flash-lite',
      maxRetriesPerBatch: 3,
    });

    // 1. Extraer lemas de entrada
    const lemmas = samplesToProcess.map((s) => s.user_input);

    console.log(`📡 Generando ${lemmas.length} palabras en vivo con Gemini (${pipeline['config'].modelId})...`);
    const startTime = Date.now();

    // Generar en memoria
    let generatedWords: GeneratedVocabWord[] = [];
    try {
      generatedWords = await pipeline.generateLemmasDirectly(lemmas, (done, total, items) => {
        console.log(`   └─ Lote ${done}/${total} completado (${items.length} palabras generadas)`);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`💥 Error durante la generación en vivo del pipeline: ${msg}`);
      throw new Error(`Fallo en la generación en vivo: ${msg}`);
    }

    const generationDuration = Date.now() - startTime;
    console.log(`✨ Generación completada en ${(generationDuration / 1000).toFixed(1)}s. Iniciando auditoría por capas...\n`);

    // Mapa de palabras generadas por lema normalizado
    const generatedMap = new Map<string, GeneratedVocabWord>();
    for (const gw of generatedWords) {
      generatedMap.set(gw.word.toLowerCase().trim(), gw);
    }

    const concurrency = options.isFull && options.judge
      ? Math.max(1, Math.min(options.judge.getActiveKeysCount(), samplesToProcess.length))
      : 1;

    console.log(`⚡ Evaluando ${samplesToProcess.length} muestra(s) con ${concurrency} worker(s) en paralelo (pool de claves)...`);

    const records: SampleExecutionRecord[] = new Array(samplesToProcess.length);
    let l1PassedCount = 0;
    let l2PassedCount = 0;
    let l3PassedCount = 0;
    let totalDuration = 0;
    let completedCount = 0;
    let nextIndex = 0;

    // 2. Evaluar cada muestra contra la salida viva generada en paralelo
    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= samplesToProcess.length) break;

        const sample = samplesToProcess[i];
        const normalizedInput = sample.user_input.toLowerCase().trim();

        // Buscar por correspondencia directa o por índice secuencial si el lema mutó
        const generatedCandidate: GeneratedVocabWord =
          generatedMap.get(normalizedInput) ?? generatedWords[i];

        let result: LayerEvaluationResult;

        if (!generatedCandidate) {
          // La IA no generó palabra para este lema
          result = {
            sampleId: sample.id,
            passed: false,
            failedLayer: 1,
            overallScore: 0.0,
            durationMs: 0,
            layer1: {
              passed: false,
              error: 'La IA no devolvió ninguna salida para este lema',
              errorCode: 'NO_GENERATED_OUTPUT',
            },
            layer2: {
              passed: false,
              factualRecall: 0,
              factualPrecision: 0,
              prohibitedViolations: [],
              warnings: ['Sin salida generada'],
            },
          };
        } else {
          if (options.isFull && options.judge) {
            result = await LayerEvaluator.evaluateSampleWithJudge(
              sample,
              generatedCandidate,
              options.judge,
            );
          } else {
            result = LayerEvaluator.evaluateSample(sample, generatedCandidate);
          }
        }

        totalDuration += result.durationMs;
        if (result.layer1.passed) l1PassedCount++;
        if (result.layer2.passed) l2PassedCount++;
        if (result.layer3?.passed) l3PassedCount++;

        const record: SampleExecutionRecord = {
          sampleId: sample.id,
          word: sample.user_input,
          category: sample.category,
          criticality: sample.criticality,
          passed: result.passed,
          failedLayer: result.failedLayer,
          overallScore: result.overallScore,
          durationMs: result.durationMs,
          layer1: result.layer1,
          layer2: result.layer2,
          layer3: result.layer3
            ? {
                passed: result.layer3.passed,
                score: result.layer3.score,
                criticalFailures: result.layer3.criticalFailures,
                chainOfThought: result.layer3.chainOfThought,
                actionableFeedback: result.layer3.actionableFeedback,
                error: result.layer3.error,
              }
            : undefined,
        };

        records[i] = record;
        completedCount++;
        options.onProgress?.(completedCount, samplesToProcess.length, sample, result, generatedCandidate);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    // 3. Ensamblar Reporte de Corrida
    const passedSamples = records.filter((r) => r.passed).length;
    const failedSamples = records.length - passedSamples;
    const passRate = parseFloat(((passedSamples / records.length) * 100).toFixed(1));
    const averageScore = parseFloat(
      (records.reduce((acc, r) => acc + r.overallScore, 0) / records.length).toFixed(4),
    );
    const averageDurationMs = parseFloat((totalDuration / records.length).toFixed(2));

    const runReport: RunReport = {
      runId,
      timestamp,
      datasetVersion,
      domain: 'vocab_enrichment',
      mode,
      judgeModel: options.isFull ? 'gemini-3.5-flash-lite' : undefined,
      totalSamples: records.length,
      passedSamples,
      failedSamples,
      passRate,
      averageScore,
      averageDurationMs,
      layerBreakdown: {
        l1Passed: l1PassedCount,
        l2Passed: l2PassedCount,
        l3Passed: options.isFull ? l3PassedCount : undefined,
      },
      samples: records,
    };

    // Guardar trace de corrida
    const runFilePath = path.join(this.RUNS_DIR, `${runId}.json`);
    fs.writeFileSync(runFilePath, JSON.stringify(runReport, null, 2), 'utf-8');

    return { runReport };
  }
}
