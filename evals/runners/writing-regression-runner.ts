import fs from 'fs';
import path from 'path';
import {
  WritingSocraticSample,
  WritingEvaluationSample,
} from '../schemas/writing-golden-dataset.schema';
import { WritingLayerEvaluator, WritingLayerEvaluationResult } from './writing-layer-evaluator';
import { WritingLlmJudge } from '../judges/writing-llm-judge';
import { StatisticalSampling } from '../heuristics/statistical-sampling';

export interface WritingSampleExecutionRecord {
  sampleId: string;
  domain: 'writing_socratic' | 'writing_evaluation';
  category: string;
  criticality: number;
  passed: boolean;
  failedLayer: 1 | 2 | 3 | null;
  overallScore: number;
  durationMs: number;
  layer1: {
    passed: boolean;
    error?: string;
    errorCode?: string;
  };
  layer2: {
    passed: boolean;
    factualRecall?: number;
    prohibitedViolations: string[];
    warnings: string[];
  };
  layer3?: {
    passed: boolean;
    score?: number;
    criticalFailures?: string[];
    chainOfThought?: string;
    actionableFeedback?: string;
    error?: string;
  };
}

export interface WritingRunReport {
  runId: string;
  timestamp: string;
  datasetVersion: string;
  domain: 'writing_socratic' | 'writing_evaluation';
  mode: 'FAST_L1_L2' | 'FULL_L1_L2_L3';
  judgeModel?: string;
  totalSamples: number;
  passedSamples: number;
  failedSamples: number;
  passRate: number; // 0.0 - 100.0%
  averageScore: number; // 0.0 - 1.0
  averageDurationMs: number;
  layerBreakdown: {
    l1Passed: number;
    l2Passed: number;
    l3Passed?: number;
  };
  samples: WritingSampleExecutionRecord[];
}

export interface WritingRegressionComparisonReport {
  baselineRunId: string;
  candidateRunId: string;
  timestamp: string;
  domain: string;
  totalSamples: number;
  baselinePassRate: number;
  candidatePassRate: number;
  regressedCount: number;
  improvedCount: number;
  unchangedCount: number;
  deltaR: number; // % de regresión
  deltaM: number; // % de mejora
  deltaS: number; // Variación neta de puntuación
  criticalRegressions: number;
  wilsonIntervalCandidate: {
    lower: number;
    upper: number;
    observed: number;
  };
  status: 'APPROVED_NO_REGRESSION' | 'APPROVED_ACCEPTABLE_DELTA' | 'REJECTED_CRITICAL_REGRESSION' | 'REJECTED_EXCESSIVE_DELTA';
  decisionRationale: string;
}

export class WritingRegressionRunner {
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
   * Ejecuta la evaluación sobre una colección de muestras de redacción.
   */
  public static async executeSuite(
    samples: Array<WritingSocraticSample | WritingEvaluationSample>,
    domain: 'writing_socratic' | 'writing_evaluation',
    datasetVersion: string,
    options: {
      isFull: boolean;
      judge?: WritingLlmJudge;
      modelId?: string;
      candidateOutputsMap?: Map<string, unknown>;
      concurrency?: number;
      onProgress?: (idx: number, total: number, sampleId: string, result: WritingLayerEvaluationResult) => void;
    },
  ): Promise<WritingRunReport> {
    this.ensureDirectories();

    const mode = options.isFull ? 'FULL_L1_L2_L3' : 'FAST_L1_L2';
    const runId = `run_writing_${Date.now()}_${mode.toLowerCase()}`;
    const timestamp = new Date().toISOString();

    const executionRecords: WritingSampleExecutionRecord[] = new Array(samples.length);
    let l1PassCount = 0;
    let l2PassCount = 0;
    let l3PassCount = 0;
    let totalDurationMs = 0;
    let totalScore = 0;
    let completedCount = 0;

    // Calcular concurrencia: si hay juez LLM con pool de claves, usar tantas claves activas como sea posible
    const activeKeys = options.judge?.getActiveKeysCount() ?? 1;
    const concurrency = Math.max(
      1,
      Math.min(options.concurrency ?? activeKeys, samples.length),
    );

    let nextIndex = 0;

    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= samples.length) break;

        const sample = samples[i];
        const actualOutput = options.candidateOutputsMap?.get(sample.id) ?? sample.expected_output;

        let result: WritingLayerEvaluationResult;
        if (options.isFull && options.judge) {
          result = await WritingLayerEvaluator.evaluateSampleWithJudge(sample, actualOutput, options.judge);
        } else if (sample.domain === 'writing_socratic') {
          result = WritingLayerEvaluator.evaluateSocraticSample(sample as WritingSocraticSample, actualOutput);
        } else {
          result = WritingLayerEvaluator.evaluateEvaluationSample(sample as WritingEvaluationSample, actualOutput);
        }

        if (result.layer1.passed) l1PassCount++;
        if (result.layer2.passed) l2PassCount++;
        if (result.layer3?.passed) l3PassCount++;

        totalDurationMs += result.durationMs;
        totalScore += result.overallScore;

        const record: WritingSampleExecutionRecord = {
          sampleId: sample.id,
          domain: sample.domain,
          category: sample.category,
          criticality: sample.criticality,
          passed: result.passed,
          failedLayer: result.failedLayer,
          overallScore: result.overallScore,
          durationMs: result.durationMs,
          layer1: {
            passed: result.layer1.passed,
            error: result.layer1.error,
            errorCode: result.layer1.errorCode,
          },
          layer2: {
            passed: result.layer2.passed,
            factualRecall: result.layer2.coverageReport?.recall,
            prohibitedViolations: result.layer2.coverageReport?.prohibitedTermsViolations || [],
            warnings: result.layer2.warnings,
          },
        };

        if (result.layer3) {
          const v = result.layer3.socraticVerdict || result.layer3.evaluationVerdict;
          record.layer3 = {
            passed: result.layer3.passed,
            score: v?.score,
            criticalFailures: v?.criticalFailures,
            chainOfThought: v?.chainOfThought,
            actionableFeedback: v?.actionableFeedback,
            error: result.layer3.error,
          };
        }

        executionRecords[i] = record;
        completedCount++;
        options.onProgress?.(completedCount, samples.length, sample.id, result);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    const passedCount = executionRecords.filter((r) => r.passed).length;
    const failedCount = executionRecords.length - passedCount;
    const passRate = Number(((passedCount / executionRecords.length) * 100).toFixed(1));
    const averageScore = Number((totalScore / executionRecords.length).toFixed(3));
    const averageDurationMs = Number((totalDurationMs / executionRecords.length).toFixed(2));

    const runReport: WritingRunReport = {
      runId,
      timestamp,
      datasetVersion,
      domain,
      mode,
      judgeModel: options.isFull ? options.modelId ?? 'gemini-3.5-flash-lite' : undefined,
      totalSamples: executionRecords.length,
      passedSamples: passedCount,
      failedSamples: failedCount,
      passRate,
      averageScore,
      averageDurationMs,
      layerBreakdown: {
        l1Passed: l1PassCount,
        l2Passed: l2PassCount,
        l3Passed: options.isFull ? l3PassCount : undefined,
      },
      samples: executionRecords,
    };

    // Guardar en runs/
    const runFilePath = path.join(this.RUNS_DIR, `${runId}.json`);
    fs.writeFileSync(runFilePath, JSON.stringify(runReport, null, 2), 'utf-8');

    return runReport;
  }

  /**
   * Guarda un reporte como la línea base oficial del dominio.
   */
  public static saveBaseline(report: WritingRunReport, baselineFilename: string): string {
    this.ensureDirectories();
    const baselinePath = path.join(this.REPORTS_DIR, baselineFilename);
    fs.writeFileSync(baselinePath, JSON.stringify(report, null, 2), 'utf-8');
    return baselinePath;
  }

  /**
   * Compara una corrida candidata contra una línea base existente.
   */
  public static compareRuns(
    baselineReport: WritingRunReport,
    candidateReport: WritingRunReport,
  ): WritingRegressionComparisonReport {
    const baselineMap = new Map(baselineReport.samples.map((s) => [s.sampleId, s]));

    let regressedCount = 0;
    let improvedCount = 0;
    let unchangedCount = 0;
    let criticalRegressions = 0;

    for (const cand of candidateReport.samples) {
      const base = baselineMap.get(cand.sampleId);
      if (!base) continue;

      if (base.passed && !cand.passed) {
        regressedCount++;
        if (cand.criticality >= 5 || cand.category === 'adversarial') {
          criticalRegressions++;
        }
      } else if (!base.passed && cand.passed) {
        improvedCount++;
      } else {
        unchangedCount++;
      }
    }

    const N = candidateReport.totalSamples;
    const deltaR = Number(((regressedCount / N) * 100).toFixed(1));
    const deltaM = Number(((improvedCount / N) * 100).toFixed(1));
    const deltaS = Number((candidateReport.averageScore - baselineReport.averageScore).toFixed(3));

    const wilson = StatisticalSampling.calculateWilsonScoreInterval(candidateReport.passedSamples, N, 0.95);

    let status: WritingRegressionComparisonReport['status'];
    let decisionRationale: string;

    if (criticalRegressions > 0) {
      status = 'REJECTED_CRITICAL_REGRESSION';
      decisionRationale = `BLOQUEADO: Se detectaron ${criticalRegressions} regresiones críticas (criticidad 5 o adversarial).`;
    } else if (deltaR > 2.0 || deltaS < -0.05) {
      status = 'REJECTED_EXCESSIVE_DELTA';
      decisionRationale = `BLOQUEADO: Regresión excesiva (ΔR = ${deltaR}%, ΔS = ${deltaS}).`;
    } else if (deltaR > 0) {
      status = 'APPROVED_ACCEPTABLE_DELTA';
      decisionRationale = `APROBADO CON ADVERTENCIA: Regresión marginal no crítica (ΔR = ${deltaR}%).`;
    } else {
      status = 'APPROVED_NO_REGRESSION';
      decisionRationale = `APROBADO: Cero regresiones detectadas (ΔR = 0.0%). Despliegue seguro.`;
    }

    return {
      baselineRunId: baselineReport.runId,
      candidateRunId: candidateReport.runId,
      timestamp: new Date().toISOString(),
      domain: candidateReport.domain,
      totalSamples: N,
      baselinePassRate: baselineReport.passRate,
      candidatePassRate: candidateReport.passRate,
      regressedCount,
      improvedCount,
      unchangedCount,
      deltaR,
      deltaM,
      deltaS,
      criticalRegressions,
      wilsonIntervalCandidate: {
        lower: Number(wilson.lowerBound.toFixed(3)),
        upper: Number(wilson.upperBound.toFixed(3)),
        observed: Number(wilson.observedProportion.toFixed(3)),
      },
      status,
      decisionRationale,
    };
  }

  /**
   * Genera el reporte en Markdown para auditoría.
   */
  public static generateMarkdownAuditReport(
    run: WritingRunReport,
    comparison?: WritingRegressionComparisonReport,
  ): string {
    const lines: string[] = [
      `# Informe de Auditoría y Regresión: Taller de Redacción`,
      ``,
      `- **Run ID:** \`${run.runId}\``,
      `- **Dominio:** \`${run.domain}\``,
      `- **Modo:** \`${run.mode}\``,
      `- **Fecha:** ${run.timestamp}`,
      `- **Muestras Totales:** ${run.totalSamples}`,
      `- **Tasa de Aprobación:** **${run.passRate}%** (${run.passedSamples}/${run.totalSamples})`,
      `- **Puntuación Media:** ${run.averageScore} / 1.0`,
      `- **Latencia Media:** ${run.averageDurationMs} ms`,
      ``,
      `## Desglose por Capa`,
      `| Capa | Aprobadas | Tasa |`,
      `| :--- | :--- | :--- |`,
      `| **Capa 1 (Determinista)** | ${run.layerBreakdown.l1Passed} / ${run.totalSamples} | ${((run.layerBreakdown.l1Passed / run.totalSamples) * 100).toFixed(1)}% |`,
      `| **Capa 2 (Heurísticas)** | ${run.layerBreakdown.l2Passed} / ${run.totalSamples} | ${((run.layerBreakdown.l2Passed / run.totalSamples) * 100).toFixed(1)}% |`,
    ];

    if (run.layerBreakdown.l3Passed !== undefined) {
      lines.push(
        `| **Capa 3 (Juez LLM)** | ${run.layerBreakdown.l3Passed} / ${run.totalSamples} | ${((run.layerBreakdown.l3Passed / run.totalSamples) * 100).toFixed(1)}% |`,
      );
    }

    if (comparison) {
      lines.push(
        ``,
        `## Veredicto de Regresión vs Línea Base`,
        `- **Estado:** **${comparison.status}**`,
        `- **Dictamen:** ${comparison.decisionRationale}`,
        `- **Tasa de Regresión (ΔR):** ${comparison.deltaR}%`,
        `- **Tasa de Mejora (ΔM):** ${comparison.deltaM}%`,
        `- **Delta de Puntuación (ΔS):** ${comparison.deltaS > 0 ? '+' : ''}${comparison.deltaS}`,
        `- **Regresiones Críticas:** ${comparison.criticalRegressions}`,
        `- **Intervalo de Wilson 95%:** [${(comparison.wilsonIntervalCandidate.lower * 100).toFixed(1)}%, ${(comparison.wilsonIntervalCandidate.upper * 100).toFixed(1)}%]`,
      );
    }

    return lines.join('\n');
  }
}
