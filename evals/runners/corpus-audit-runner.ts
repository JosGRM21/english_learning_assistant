import fs from 'fs';
import path from 'path';
import { DeterministicValidators } from '../assertions/deterministic-validators';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';
import {
  StatisticalSampling,
  WilsonIntervalResult,
  AcceptanceDecision,
  StratumMetric,
} from '../heuristics/statistical-sampling';
import { CanonicalAssertions } from '../schemas/golden-dataset.schema';
import { VocabJudgeInput } from '../schemas/judge-verdict.schema';
import {
  isCanonicalWeakFormLemma,
  calculatePhoneticEdEnding,
  isModalAuxiliaryVerb,
} from '../../src/core/phonetics/phonetic-rules';

export interface CorpusAuditOptions {
  sampleSize?: number;
  confidenceLevel?: number; // Def: 0.95
  slaThreshold?: number; // Def: 0.95
  isFast?: boolean; // Solo Censo Capa 1 y 2, sin Juez LLM
  onProgress?: (index: number, total: number, word: string, passed: boolean, info?: string) => void;
}

export interface DeterministicWordAuditResult {
  word: string;
  passed: boolean;
  error?: string;
  errorCode?: string;
}

export interface SampledJudgeAuditResult {
  word: string;
  dimension: string;
  passed: boolean;
  score: number;
  criticalFailures?: string[];
  chainOfThought?: string;
  actionableFeedback?: string;
}

export interface CorpusAuditReport {
  reportId: string;
  timestamp: string;
  sourceFile: string;
  totalPopulation: number;
  deterministicAudit: {
    totalChecked: number;
    passedCount: number;
    failedCount: number;
    passRate: number; // Porcentaje
    violations: Array<{ word: string; error: string; code?: string }>;
  };
  statisticalAudit?: {
    sampleSize: number;
    confidenceLevel: number;
    slaThreshold: number;
    successCount: number;
    stats: WilsonIntervalResult;
    decision: AcceptanceDecision;
    sampleDetails: SampledJudgeAuditResult[];
    strataMetrics?: StratumMetric[];
  };
  summaryMarkdown: string;
}

export class CorpusAuditRunner {
  private static readonly REPORTS_DIR = path.resolve(process.cwd(), 'evals/reports');

  public static ensureDirectories(): void {
    if (!fs.existsSync(this.REPORTS_DIR)) {
      fs.mkdirSync(this.REPORTS_DIR, { recursive: true });
    }
  }

  /**
   * Ejecuta la auditoría integral (Censo Determinista 100% + Aceptación por Muestreo con Juez LLM).
   */
  public static async auditCorpus(
    filePath: string,
    options: CorpusAuditOptions = {},
  ): Promise<CorpusAuditReport> {
    this.ensureDirectories();

    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Archivo no encontrado para auditar: ${resolvedPath}`);
    }

    const rawData = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    const items: any[] = Array.isArray(rawData) ? rawData : rawData.items ?? [];

    if (items.length === 0) {
      throw new Error(`El archivo ${filePath} no contiene elementos para auditar.`);
    }

    const reportId = `audit_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const confidenceLevel = options.confidenceLevel ?? 0.95;
    const slaThreshold = options.slaThreshold ?? 0.95; // Exigencia: 95%
    const isFast = options.isFast ?? false;

    console.log('='.repeat(80));
    console.log(`AUDITORÍA DE CONTROL DE CALIDAD Y ACEPTACIÓN POR MUESTREO (MÓDULO 09 SLA)`);
    console.log('='.repeat(80));
    console.log(`📂 Archivo fuente: ${filePath}`);
    console.log(`📦 Población total (N): ${items.length} palabras`);
    console.log(`🎯 SLA de Aceptación: ${(slaThreshold * 100).toFixed(1)}% | Confianza: ${(confidenceLevel * 100).toFixed(0)}%\n`);

    // =========================================================================
    // FASE 1: CENSO DETERMINISTA 100% (Capas 1 y 2 en CPU, Coste $0.00)
    // =========================================================================
    console.log(`▶️ [FASE 1] Ejecutando Censo Determinista al 100% (Capas 1 y 2)...`);
    const deterministicViolations: Array<{ word: string; error: string; code?: string }> = [];
    let l1PassedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const word = item.word || `index_${i}`;

      try {
        // Validar propiedades mínimas obligatorias
        if (!item.word || typeof item.word !== 'string') {
          throw new Error('Falta el lema obligatorio (word)');
        }

        // Si es formato compilado (core-vocab-corpus.json)
        if (item.definitionEn) {
          DeterministicValidators.assertNoLeadingGreetings(item.definitionEn, `${word}.definitionEn`);
          DeterministicValidators.assertLengthBounds(item.definitionEn, 5, 2000, `${word}.definitionEn`);
        }
        if (item.translationEs) {
          DeterministicValidators.assertNoLeadingGreetings(item.translationEs, `${word}.translationEs`);
        }

        // Si es formato generado con senses (batch_XXXXX.json)
        if (Array.isArray(item.senses)) {
          for (const s of item.senses) {
            if (s.definitionEn) {
              DeterministicValidators.assertNoLeadingGreetings(s.definitionEn, `${word}.${s.senseId}.definitionEn`);
            }
            if (s.translationEs) {
              DeterministicValidators.assertNoLeadingGreetings(s.translationEs, `${word}.${s.senseId}.translationEs`);
            }
          }
        }

        // Validaciones SLA por dimensión gramatical y fonética canónica
        const isModal = isModalAuxiliaryVerb(word);
        const hasRegularVerbSense =
          !isModal &&
          (item.partOfSpeech === 'VERB' || (Array.isArray(item.senses) && item.senses.some((s: any) => s.partOfSpeech === 'VERB'))) &&
          !item.verbTenses?.isIrregular &&
          !item.verbTensesJson?.isIrregular &&
          item.verbTenses !== null &&
          item.verbTensesJson !== null;

        const expectedEdAllophone = hasRegularVerbSense
          ? calculatePhoneticEdEnding(item.ipaGeneralAmerican || word, word)
          : undefined;

        const assertions: CanonicalAssertions = {
          disallow_punctuation_in_tokens: true,
          require_valid_english_word: true,
          min_senses: 1,
          max_senses: 5,
          require_weak_form: (item.grammaticalDimension === 'FUNCTION') && isCanonicalWeakFormLemma(word),
          require_phonetic_ed_ending: expectedEdAllophone,
        };

        // Si tiene formato de ficha estándar con senses, aplicar validador SLA
        if (Array.isArray(item.senses)) {
          DeterministicValidators.validateVocabularySLA(item, assertions);
        }

        l1PassedCount++;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const code = (err as any)?.code ?? 'DETERMINISTIC_VIOLATION';
        deterministicViolations.push({ word, error: errorMsg, code });
      }
    }

    const deterministicPassRate = parseFloat(((l1PassedCount / items.length) * 100).toFixed(1));
    console.log(`   └─ Resultado Censo: ${l1PassedCount}/${items.length} aprobadas (${deterministicPassRate}%)`);
    if (deterministicViolations.length > 0) {
      console.warn(`   ⚠️ Se detectaron ${deterministicViolations.length} infracciones deterministas:`);
      for (const v of deterministicViolations.slice(0, 5)) {
        console.warn(`      - [${v.word}] [${v.code}]: ${v.error}`);
      }
      if (deterministicViolations.length > 5) {
        console.warn(`      ... y ${deterministicViolations.length - 5} más.`);
      }
    } else {
      console.log(`   ✅ 100% de la población cumple las reglas deterministas y esquemas tipados.`);
    }

    let statisticalAudit: CorpusAuditReport['statisticalAudit'] | undefined;

    // =========================================================================
    // FASE 2: MUESTREO ESTRATIFICADO MULTIVARIADO Y JUEZ LLM (Capa 3 Paralela)
    // =========================================================================
    if (!isFast) {
      // 1. Calcular tamaño de muestra óptimo con Cochran + FPC
      const targetSampleSize = options.sampleSize
        ? Math.min(items.length, options.sampleSize)
        : StatisticalSampling.calculateOptimalSampleSize(items.length, 0.05, confidenceLevel, 0.5);

      console.log(`\n▶️ [FASE 2] Muestreo Estratificado Multivariado y Auditoría con Juez LLM...`);
      console.log(`   └─ Tamaño de muestra representativa (n): ${targetSampleSize} palabras`);

      // 2. Extraer muestra balanceada por estratificación multivariada (Dimensión, PoS, Polisemia, Morfología)
      const stratResult = StatisticalSampling.stratifiedSampleWithReport(
        items,
        targetSampleSize,
        (item) => StatisticalSampling.extractVocabStratum(item),
        { minPerStrata: 1 },
      );
      const sampledItems = stratResult.sampledItems;

      console.log(`   └─ Estratos multivariados identificados: ${stratResult.strataMetrics.length}`);
      const topStrata = stratResult.strataMetrics.slice(0, 3).map((m) => `${m.stratumKey} (n=${m.sampledCount})`).join(', ');
      console.log(`   └─ Principales estratos cubiertos: ${topStrata}...`);

      const judge = new VocabLlmJudge();
      const concurrency = judge.getActiveKeysCount();
      console.log(`   └─ Pool de Claves API: ${judge.getKeyPoolStatus()}`);
      console.log(`   └─ Ejecución Paralela: ${concurrency} workers concurrentes (anti-RPM espaciado a 4.1s)\n`);

      // 3. Preparar especificaciones canónicas para cada muestra
      const judgeInputs: VocabJudgeInput[] = sampledItems.map((item) => {
        const word = item.word;
        const dimension = item.grammaticalDimension || 'CONTENT';
        const isModal = isModalAuxiliaryVerb(word);
        const isFunctionalWeak = dimension === 'FUNCTION' && isCanonicalWeakFormLemma(word);
        const hasRegularVerbSense =
          !isModal &&
          (item.partOfSpeech === 'VERB' || (Array.isArray(item.senses) && item.senses.some((s: any) => s.partOfSpeech === 'VERB'))) &&
          !item.verbTenses?.isIrregular &&
          !item.verbTensesJson?.isIrregular &&
          item.verbTenses !== null &&
          item.verbTensesJson !== null;

        const expectedEdAllophone = hasRegularVerbSense
          ? calculatePhoneticEdEnding(item.ipaGeneralAmerican || word, word)
          : undefined;

        const ca: CanonicalAssertions = {
          disallow_punctuation_in_tokens: true,
          require_valid_english_word: true,
          min_senses: 1,
          max_senses: 5,
          require_weak_form: isFunctionalWeak,
          require_phonetic_ed_ending: expectedEdAllophone,
          expected_grammatical_dimension: dimension as any,
          expected_primary_part_of_speech: item.partOfSpeech || item.senses?.[0]?.partOfSpeech,
        };

        const mandatoryFacts: string[] = [];
        if (isFunctionalWeak) {
          mandatoryFacts.push(`Palabra funcional con forma débil legítima canónica.`);
        } else if (dimension === 'FUNCTION') {
          mandatoryFacts.push(`Palabra funcional SIN forma débil reducida en inglés (ipaWeakForm DEBE ser null).`);
        } else if (dimension === 'CONTENT') {
          mandatoryFacts.push(`Palabra de contenido léxico pleno (ipaWeakForm DEBE ser null obligatoriamente).`);
        }

        if (isModal) {
          mandatoryFacts.push(`Verbo modal auxiliar defectivo en inglés (phoneticEdEnding DEBE ser null obligatoriamente).`);
        } else if (hasRegularVerbSense && expectedEdAllophone) {
          mandatoryFacts.push(`Verbo regular en inglés. Alófono canónico de pasado -ed esperado: '${expectedEdAllophone}'.`);
        } else if (item.verbTenses?.isIrregular || item.verbTensesJson?.isIrregular) {
          mandatoryFacts.push(`Verbo irregular en inglés (phoneticEdEnding DEBE ser null).`);
        } else if (item.partOfSpeech !== 'VERB' && (!Array.isArray(item.senses) || !item.senses.some((s: any) => s.partOfSpeech === 'VERB'))) {
          mandatoryFacts.push(`Palabra no verbal (phoneticEdEnding DEBE ser null).`);
        }

        return {
          lemma: word,
          candidateOutput: item,
          canonicalAssertions: ca,
          mandatoryFacts: mandatoryFacts.length > 0 ? mandatoryFacts : undefined,
        };
      });

      // 4. Evaluar en paralelo a través del pool de claves API
      const parallelVerdicts = await judge.evaluateCandidatesParallel(judgeInputs, {
        concurrency,
        onProgress: (done, total, candidate, verdict, err) => {
          const icon = verdict ? (verdict.overallPassed ? '✅' : '❌') : '💥';
          const info = verdict ? `${(verdict.score * 100).toFixed(0)}%` : `Error: ${err?.message ?? 'LLM Error'}`;
          console.log(`   [${done}/${total}] ${icon} [${candidate.lemma}] ${info}`);
          options.onProgress?.(done, total, candidate.lemma, verdict?.overallPassed ?? false, err?.message);
        },
      });

      // 5. Procesar veredictos
      const sampleDetails: SampledJudgeAuditResult[] = [];
      let judgeSuccessCount = 0;

      for (let i = 0; i < sampledItems.length; i++) {
        const item = sampledItems[i];
        const word = item.word;
        const dimension = item.grammaticalDimension || 'CONTENT';
        const res = parallelVerdicts[i];

        if (res.verdict) {
          if (res.verdict.overallPassed) judgeSuccessCount++;
          sampleDetails.push({
            word,
            dimension,
            passed: res.verdict.overallPassed,
            score: res.verdict.score,
            criticalFailures: res.verdict.criticalFailures,
            chainOfThought: res.verdict.chainOfThought,
            actionableFeedback: res.verdict.actionableFeedback,
          });
        } else {
          sampleDetails.push({
            word,
            dimension,
            passed: false,
            score: 0.0,
            criticalFailures: ['JUDGE_EXECUTION_ERROR'],
            actionableFeedback: res.error,
          });
        }
      }

      // 6. Análisis Estadístico de Wilson
      const stats = StatisticalSampling.calculateWilsonScoreInterval(
        judgeSuccessCount,
        sampledItems.length,
        confidenceLevel,
      );

      const decision = StatisticalSampling.evaluateAcceptance(stats, slaThreshold);

      statisticalAudit = {
        sampleSize: sampledItems.length,
        confidenceLevel,
        slaThreshold,
        successCount: judgeSuccessCount,
        stats,
        decision,
        sampleDetails,
        strataMetrics: stratResult.strataMetrics,
      };

      console.log('\n' + '─'.repeat(80));
      console.log(`📊 INFORME DE ACEPTACIÓN ESTADÍSTICA (WILSON SCORE ${confidenceLevel * 100}%):`);
      console.log(`   └─ Aprobadas en Muestra: ${judgeSuccessCount}/${sampledItems.length} (${(stats.observedProportion * 100).toFixed(1)}%)`);
      console.log(`   └─ Intervalo de Confianza IC: [${(stats.lowerBound * 100).toFixed(1)}% , ${(stats.upperBound * 100).toFixed(1)}%]`);
      console.log(`   └─ Margen de Error: ±${(stats.marginOfError * 100).toFixed(1)}%`);
      console.log(`   └─ Dictamen Final: ${decision.verdict === 'APPROVED' ? '🟢 APROBADO' : decision.verdict === 'QUARANTINE' ? '🟡 EN CUARENTENA' : '🔴 RECHAZADO'}`);
      console.log(`   └─ Justificación: ${decision.rationale}`);
    }

    // =========================================================================
    // FASE 3: ENSAMBLAR REPORTE MARKDOWN
    // =========================================================================
    const summaryMarkdown = this.generateMarkdownReport(
      reportId,
      timestamp,
      filePath,
      items.length,
      l1PassedCount,
      deterministicViolations,
      statisticalAudit,
    );

    const reportPath = path.join(this.REPORTS_DIR, `${reportId}.md`);
    fs.writeFileSync(reportPath, summaryMarkdown, 'utf-8');
    console.log(`\n📄 Reporte Markdown de auditoría guardado en:\n   ${reportPath}`);

    return {
      reportId,
      timestamp,
      sourceFile: filePath,
      totalPopulation: items.length,
      deterministicAudit: {
        totalChecked: items.length,
        passedCount: l1PassedCount,
        failedCount: deterministicViolations.length,
        passRate: deterministicPassRate,
        violations: deterministicViolations,
      },
      statisticalAudit,
      summaryMarkdown,
    };
  }

  private static generateMarkdownReport(
    reportId: string,
    timestamp: string,
    sourceFile: string,
    totalPopulation: number,
    l1PassedCount: number,
    violations: Array<{ word: string; error: string; code?: string }>,
    statistical?: CorpusAuditReport['statisticalAudit'],
  ): string {
    const l1PassRate = ((l1PassedCount / totalPopulation) * 100).toFixed(1);
    const verdict = statistical
      ? statistical.decision.verdict
      : violations.length === 0
      ? 'APPROVED'
      : 'REJECTED';

    const verdictBadge =
      verdict === 'APPROVED'
        ? '🟢 APROBADO PARA PRODUCCIÓN'
        : verdict === 'QUARANTINE'
        ? '🟡 EN CUARENTENA (REQUIERE MUESTRA MAYOR)'
        : '🔴 RECHAZADO (INCUMPLE SLA)';

    let md = `# Reporte de Auditoría y Control Estadístico de Calidad (Módulo 09 SLA)

**ID de Reporte:** \`${reportId}\`  
**Fecha:** ${timestamp}  
**Archivo Fuente:** \`${sourceFile}\`  
**Dictamen General:** **${verdictBadge}**

---

## 1. Fase 1: Censo Determinista 100% (Capas 1 y 2)

* **Población Total Evaluada:** ${totalPopulation} palabras
* **Tasa de Aprobación Determinista:** ${l1PassRate}% (${l1PassedCount}/${totalPopulation})
* **Violaciones Estructurales Detectadas:** ${violations.length}

| Métrica | Valor Observado | Estado SLA |
| :--- | :--- | :--- |
| **Esquema Tipado y Restricciones Regex** | ${violations.length === 0 ? '100% Cumplido' : `${violations.length} defectos`} | ${violations.length === 0 ? '✅ APROBADO' : '❌ BLOQUEANTE'} |
| **Ausencia de Saludos Conversacionales** | ${violations.some((v) => v.code === 'PROHIBITED_GREETING_DETECTED') ? 'Violación Detectada' : '100% Limpio'} | ${violations.some((v) => v.code === 'PROHIBITED_GREETING_DETECTED') ? '❌ BLOQUEANTE' : '✅ APROBADO'} |
| **Formas Débiles Schwa en Funcionales** | ${violations.some((v) => v.code === 'MISSING_WEAK_FORM') ? 'Omisión Detectada' : 'Verificado'} | ${violations.some((v) => v.code === 'MISSING_WEAK_FORM') ? '❌ BLOQUEANTE' : '✅ APROBADO'} |

`;

    if (violations.length > 0) {
      md += `### Detalle de Violaciones Deterministas (Top 10):
| Palabra | Código de Infracción | Descripción del Fallo |
| :--- | :--- | :--- |
`;
      for (const v of violations.slice(0, 10)) {
        md += `| \`${v.word}\` | \`${v.code ?? 'ERROR'}\` | ${v.error} |\n`;
      }
      md += '\n';
    }

    if (statistical) {
      const stats = statistical.stats;
      md += `---

## 2. Fase 2: Control Estadístico por Muestreo Multivariado (Capa 3 - Juez LLM)

* **Tamaño Muestral Auditado (n):** ${statistical.sampleSize} palabras
* **Nivel de Confianza ($1 - \\alpha$):** ${(statistical.confidenceLevel * 100).toFixed(0)}% ($z = ${stats.zScore}$)
* **Umbral SLA Requerido:** ${(statistical.slaThreshold * 100).toFixed(1)}%
* **Tasa Observada en Muestra ($\\hat{p}$):** ${(stats.observedProportion * 100).toFixed(1)}% (${stats.successCount}/${stats.sampleSize})
* **Intervalo de Confianza de Wilson:** **[${(stats.lowerBound * 100).toFixed(1)}% , ${(stats.upperBound * 100).toFixed(1)}%]**
* **Margen de Error:** $\\pm${(stats.marginOfError * 100).toFixed(1)}%$

> **Conclusión Estadística:**  
> ${statistical.decision.rationale}

`;

      if (statistical.strataMetrics && statistical.strataMetrics.length > 0) {
        md += `### Representación de Estratos Multivariados en la Muestra:
| Estrato (Dimensión : PoS : Polisemia : Morfología) | Población Total (N) | Peso Poblacional | Muestra Auditada (n) | Cobertura Muestral |
| :--- | :---: | :---: | :---: | :---: |
`;
        for (const sm of statistical.strataMetrics.slice(0, 15)) {
          const popPct = (sm.populationProportion * 100).toFixed(1);
          const samplePct = (sm.sampledProportion * 100).toFixed(1);
          md += `| \`${sm.stratumKey}\` | ${sm.populationCount} | ${popPct}% | ${sm.sampledCount} | ${samplePct}% |\n`;
        }
        if (statistical.strataMetrics.length > 15) {
          md += `| *(y ${statistical.strataMetrics.length - 15} estratos adicionales balanceados)* | ... | ... | ... | ... |\n`;
        }
        md += '\n';
      }

      md += `### Desglose de Muestras Auditadas por el Juez LLM:
| Lema | Dimensión | Estado | Puntuación | Rúbricas Fallidas |
| :--- | :--- | :---: | :---: | :--- |
`;
      for (const s of statistical.sampleDetails) {
        const icon = s.passed ? '✅' : '❌';
        const failures = s.criticalFailures && s.criticalFailures.length > 0 ? s.criticalFailures.join(', ') : 'Ninguna';
        md += `| \`${s.word}\` | \`${s.dimension}\` | ${icon} | ${(s.score * 100).toFixed(0)}% | ${failures} |\n`;
      }
    }

    return md;
  }
}
