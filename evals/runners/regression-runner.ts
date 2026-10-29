import fs from 'fs';
import path from 'path';
import { GoldenSample } from '../schemas/golden-dataset.schema';
import { LayerEvaluator, LayerEvaluationResult } from './layer-evaluator';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';

export interface SampleExecutionRecord {
  sampleId: string;
  word: string;
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
    factualPrecision?: number;
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

export interface RunReport {
  runId: string;
  timestamp: string;
  datasetVersion: string;
  domain: string;
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
  samples: SampleExecutionRecord[];
}

export interface RegressedSampleComparison {
  sampleId: string;
  word: string;
  criticality: number;
  category: string;
  baselinePassed: boolean;
  candidatePassed: boolean;
  baselineScore: number;
  candidateScore: number;
  baselineFailedLayer: 1 | 2 | 3 | null;
  candidateFailedLayer: 1 | 2 | 3 | null;
  regressionType: 'REGRESSION' | 'IMPROVEMENT' | 'UNCHANGED';
  rootCause?: string;
}

export interface RegressionComparisonReport {
  baselineRunId: string;
  candidateRunId: string;
  timestamp: string;
  totalEvaluated: number;
  regressedCount: number;
  improvedCount: number;
  unchangedCount: number;
  deltaRegressionRate: number; // Delta R en %
  deltaImprovementRate: number; // Delta M en %
  deltaScore: number; // candidate.averageScore - baseline.averageScore
  criticalRegressions: RegressedSampleComparison[];
  allRegressions: RegressedSampleComparison[];
  allImprovements: RegressedSampleComparison[];
  verdict:
    | 'APPROVED_NO_REGRESSION'
    | 'APPROVED_ACCEPTABLE_DELTA'
    | 'REJECTED_CRITICAL_REGRESSION'
    | 'REJECTED_EXCESSIVE_DELTA';
  summaryMarkdown: string;
}

export class RegressionRunner {
  private static readonly REPORTS_DIR = path.resolve(process.cwd(), 'evals/reports');
  private static readonly RUNS_DIR = path.resolve(process.cwd(), 'evals/reports/runs');

  public static ensureDirectories(): void {
    if (!fs.existsSync(this.REPORTS_DIR)) {
      fs.mkdirSync(this.REPORTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.RUNS_DIR)) {
      fs.mkdirSync(this.RUNS_DIR, { recursive: true });
    }
  }

  /**
   * Ejecuta la suite de evaluación sobre una lista de muestras del dataset.
   * Si judge está presente, ejecuta las 3 capas (FULL). Si no, ejecuta Capa 1 y 2 (FAST).
   */
  public static async executeSuite(
    samples: GoldenSample[],
    datasetVersion: string,
    judge?: VocabLlmJudge,
    onProgress?: (index: number, total: number, sample: GoldenSample, result: LayerEvaluationResult) => void,
  ): Promise<RunReport> {
    this.ensureDirectories();

    const mode: 'FAST_L1_L2' | 'FULL_L1_L2_L3' = judge ? 'FULL_L1_L2_L3' : 'FAST_L1_L2';
    const runId = `run_${Date.now()}_${mode.toLowerCase()}`;
    const timestamp = new Date().toISOString();

    const concurrency = judge
      ? Math.max(1, Math.min(judge.getActiveKeysCount(), samples.length))
      : 1;

    const records: SampleExecutionRecord[] = new Array(samples.length);
    let totalDuration = 0;
    let l1PassedCount = 0;
    let l2PassedCount = 0;
    let l3PassedCount = 0;
    let completedCount = 0;
    let nextIndex = 0;

    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= samples.length) break;

        const sample = samples[i];
        let result: LayerEvaluationResult;

        if (judge) {
          result = await LayerEvaluator.evaluateSampleWithJudge(
            sample,
            sample.expected_output,
            judge,
          );
        } else {
          result = LayerEvaluator.evaluateSample(sample, sample.expected_output);
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
          layer1: {
            passed: result.layer1.passed,
            error: result.layer1.error,
            errorCode: result.layer1.errorCode,
          },
          layer2: {
            passed: result.layer2.passed,
            factualRecall: result.layer2.coverageReport?.recall,
            factualPrecision: result.layer2.coverageReport?.precision,
            prohibitedViolations: result.layer2.coverageReport?.prohibitedTermsViolations ?? [],
            warnings: result.layer2.warnings,
          },
        };

        if (result.layer3) {
          record.layer3 = {
            passed: result.layer3.passed,
            score: result.layer3.verdict?.score,
            criticalFailures: result.layer3.verdict?.criticalFailures,
            chainOfThought: result.layer3.verdict?.chainOfThought,
            actionableFeedback: result.layer3.verdict?.actionableFeedback,
            error: result.layer3.error,
          };
        }

        records[i] = record;
        completedCount++;
        if (onProgress) {
          onProgress(completedCount, samples.length, sample, result);
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    const passedCount = records.filter((r) => r.passed).length;
    const failedCount = records.length - passedCount;
    const passRate = Number(((passedCount / records.length) * 100).toFixed(1));
    const averageScore = Number(
      (records.reduce((acc, r) => acc + r.overallScore, 0) / records.length).toFixed(3),
    );
    const averageDurationMs = Number((totalDuration / records.length).toFixed(2));

    const report: RunReport = {
      runId,
      timestamp,
      datasetVersion,
      domain: 'vocab_enrichment',
      mode,
      judgeModel: judge ? 'gemini-3.5-flash-lite' : undefined,
      totalSamples: records.length,
      passedSamples: passedCount,
      failedSamples: failedCount,
      passRate,
      averageScore,
      averageDurationMs,
      layerBreakdown: {
        l1Passed: l1PassedCount,
        l2Passed: l2PassedCount,
        l3Passed: judge ? l3PassedCount : undefined,
      },
      samples: records,
    };

    // Guardar trazabilidad en disco
    const filePath = path.join(this.RUNS_DIR, `${runId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');

    return report;
  }

  /**
   * Guarda un reporte como la referencia canónica (Baseline)
   */
  public static saveAsBaseline(report: RunReport, filename = 'baseline-vocab.json'): string {
    this.ensureDirectories();
    const baselinePath = path.join(this.REPORTS_DIR, filename);
    fs.writeFileSync(baselinePath, JSON.stringify(report, null, 2), 'utf-8');
    return baselinePath;
  }

  /**
   * Carga el reporte de baseline desde el disco
   */
  public static loadBaseline(filename = 'baseline-vocab.json'): RunReport | null {
    const baselinePath = path.join(this.REPORTS_DIR, filename);
    if (!fs.existsSync(baselinePath)) return null;
    return JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
  }

  /**
   * Compara un Run Candidato frente a un Run Base (Baseline) y computa el Delta de Regresión (Delta R).
   */
  public static compareRuns(
    baseline: RunReport,
    candidate: RunReport,
  ): RegressionComparisonReport {
    const timestamp = new Date().toISOString();
    const candidateMap = new Map(candidate.samples.map((s) => [s.sampleId, s]));

    const comparisons: RegressedSampleComparison[] = [];
    let regressedCount = 0;
    let improvedCount = 0;
    let unchangedCount = 0;

    for (const baseSample of baseline.samples) {
      const candSample = candidateMap.get(baseSample.sampleId);
      if (!candSample) continue;

      let regType: 'REGRESSION' | 'IMPROVEMENT' | 'UNCHANGED' = 'UNCHANGED';
      let rootCause: string | undefined;

      if (baseSample.passed && !candSample.passed) {
        regType = 'REGRESSION';
        regressedCount++;

        // Determinar causa raíz según la capa en que falló
        if (candSample.failedLayer === 1) {
          rootCause = `Capa 1 Determinista: ${candSample.layer1.error || candSample.layer1.errorCode}`;
        } else if (candSample.failedLayer === 2) {
          rootCause = `Capa 2 Heurística: ${candSample.layer2.warnings.join('; ') || 'Recall factual insuficiente'}`;
        } else if (candSample.failedLayer === 3) {
          rootCause = `Capa 3 Juez LLM: ${candSample.layer3?.criticalFailures?.join(', ') || candSample.layer3?.error || 'Rúbrica no cumplida'}`;
        }
      } else if (!baseSample.passed && candSample.passed) {
        regType = 'IMPROVEMENT';
        improvedCount++;
      } else {
        unchangedCount++;
      }

      comparisons.push({
        sampleId: baseSample.sampleId,
        word: baseSample.word,
        category: baseSample.category,
        criticality: baseSample.criticality,
        baselinePassed: baseSample.passed,
        candidatePassed: candSample.passed,
        baselineScore: baseSample.overallScore,
        candidateScore: candSample.overallScore,
        baselineFailedLayer: baseSample.failedLayer,
        candidateFailedLayer: candSample.failedLayer,
        regressionType: regType,
        rootCause,
      });
    }

    const totalEvaluated = comparisons.length;
    const deltaRegressionRate = totalEvaluated > 0
      ? Number(((regressedCount / totalEvaluated) * 100).toFixed(2))
      : 0;
    const deltaImprovementRate = totalEvaluated > 0
      ? Number(((improvedCount / totalEvaluated) * 100).toFixed(2))
      : 0;
    const deltaScore = Number((candidate.averageScore - baseline.averageScore).toFixed(3));

    const criticalRegressions = comparisons.filter(
      (c) => c.regressionType === 'REGRESSION' && (c.criticality >= 5 || c.category === 'adversarial'),
    );
    const allRegressions = comparisons.filter((c) => c.regressionType === 'REGRESSION');
    const allImprovements = comparisons.filter((c) => c.regressionType === 'IMPROVEMENT');

    // Reglas Deterministas de Decisión (Knowledge Vault 03)
    let verdict: RegressionComparisonReport['verdict'];
    if (criticalRegressions.length > 0) {
      verdict = 'REJECTED_CRITICAL_REGRESSION';
    } else if (deltaRegressionRate > 2.0 || deltaScore < -0.05) {
      verdict = 'REJECTED_EXCESSIVE_DELTA';
    } else if (regressedCount > 0) {
      verdict = 'APPROVED_ACCEPTABLE_DELTA';
    } else {
      verdict = 'APPROVED_NO_REGRESSION';
    }

    const summaryMarkdown = this.buildMarkdownReport({
      baselineRunId: baseline.runId,
      candidateRunId: candidate.runId,
      timestamp,
      totalEvaluated,
      regressedCount,
      improvedCount,
      unchangedCount,
      deltaRegressionRate,
      deltaImprovementRate,
      deltaScore,
      criticalRegressions,
      allRegressions,
      allImprovements,
      verdict,
      baseline,
      candidate,
    });

    return {
      baselineRunId: baseline.runId,
      candidateRunId: candidate.runId,
      timestamp,
      totalEvaluated,
      regressedCount,
      improvedCount,
      unchangedCount,
      deltaRegressionRate,
      deltaImprovementRate,
      deltaScore,
      criticalRegressions,
      allRegressions,
      allImprovements,
      verdict,
      summaryMarkdown,
    };
  }

  private static buildMarkdownReport(data: {
    baselineRunId: string;
    candidateRunId: string;
    timestamp: string;
    totalEvaluated: number;
    regressedCount: number;
    improvedCount: number;
    unchangedCount: number;
    deltaRegressionRate: number;
    deltaImprovementRate: number;
    deltaScore: number;
    criticalRegressions: RegressedSampleComparison[];
    allRegressions: RegressedSampleComparison[];
    allImprovements: RegressedSampleComparison[];
    verdict: string;
    baseline: RunReport;
    candidate: RunReport;
  }): string {
    const verdictBadges: Record<string, string> = {
      APPROVED_NO_REGRESSION: '🟢 APROBADO: CERO REGRESIONES (ΔR = 0.0%)',
      APPROVED_ACCEPTABLE_DELTA: '🟡 APROBADO CON ADVERTENCIA: REGRESIÓN MENOR ADMISIBLE (ΔR ≤ 2.0%)',
      REJECTED_CRITICAL_REGRESSION: '🔴 RECHAZADO: REGRESIÓN EN CASO CRÍTICO (Tolerancia Cero Violada)',
      REJECTED_EXCESSIVE_DELTA: '🔴 RECHAZADO: REGRESIÓN EXCESIVA (ΔR > 2.0% o Caída de Score)',
    };

    let md = `# Reporte de Regresión de Prompts e IA (Módulo 09 SLA)\n\n`;
    md += `**Dictamen Final:** ${verdictBadges[data.verdict] || data.verdict}\n\n`;
    md += `* **Fecha de Evaluación:** ${data.timestamp}\n`;
    md += `* **Ejecución Base (Baseline):** \`${data.baselineRunId}\` (${data.baseline.mode})\n`;
    md += `* **Ejecución Candidata:** \`${data.candidateRunId}\` (${data.candidate.mode})\n\n`;

    md += `## 1. Métricas Agregadas Comparativas\n\n`;
    md += `| Métrica | Base (R0) | Candidato (R1) | Delta (Δ) |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    md += `| **Tasa de Aprobación** | ${data.baseline.passRate}% (${data.baseline.passedSamples}/${data.baseline.totalSamples}) | ${data.candidate.passRate}% (${data.candidate.passedSamples}/${data.candidate.totalSamples}) | ${data.candidate.passRate >= data.baseline.passRate ? '+' : ''}${(data.candidate.passRate - data.baseline.passRate).toFixed(1)}% |\n`;
    md += `| **Puntuación Media** | ${(data.baseline.averageScore * 100).toFixed(1)}% | ${(data.candidate.averageScore * 100).toFixed(1)}% | ${data.deltaScore >= 0 ? '+' : ''}${(data.deltaScore * 100).toFixed(1)}% |\n`;
    md += `| **Latencia Media** | ${data.baseline.averageDurationMs} ms | ${data.candidate.averageDurationMs} ms | ${(data.candidate.averageDurationMs - data.baseline.averageDurationMs).toFixed(1)} ms |\n`;
    md += `| **Tasa de Regresión (ΔR)** | - | - | **${data.deltaRegressionRate}%** (${data.regressedCount} casos) |\n`;
    md += `| **Tasa de Mejora (ΔM)** | - | - | **${data.deltaImprovementRate}%** (${data.improvedCount} casos) |\n\n`;

    if (data.allRegressions.length > 0) {
      md += `## 2. Casos Regresados (Breakdown de Fallas)\n\n`;
      md += `| ID Muestra | Lema | Criticidad | Capa Fallida | Causa Raíz |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      for (const reg of data.allRegressions) {
        md += `| \`${reg.sampleId}\` | **${reg.word}** | ${reg.criticality}/5 | Capa ${reg.candidateFailedLayer} | ${reg.rootCause || 'N/A'} |\n`;
      }
      md += `\n`;
    } else {
      md += `## 2. Integridad de Regresión\n\n`;
      md += `✅ **Cero Regresiones Detectadas:** Ningún caso que aprobaba previamente en la línea base ha resultado reprobado.\n\n`;
    }

    if (data.allImprovements.length > 0) {
      md += `## 3. Casos Mejorados\n\n`;
      md += `| ID Muestra | Lema | Criticidad | Score Base | Score Nuevo |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      for (const imp of data.allImprovements) {
        md += `| \`${imp.sampleId}\` | **${imp.word}** | ${imp.criticality}/5 | ${(imp.baselineScore * 100).toFixed(0)}% | ${(imp.candidateScore * 100).toFixed(0)}% |\n`;
      }
      md += `\n`;
    }

    return md;
  }
}
