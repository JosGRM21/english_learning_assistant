import { GoldenSample } from '../schemas/golden-dataset.schema';
import { DeterministicValidators, DeterministicAssertionError } from '../assertions/deterministic-validators';
import { LexicalOverlapCalculator, NGramScores } from '../heuristics/lexical-overlap';
import { FactualCoverageEvaluator, FactualCoverageReport } from '../heuristics/factual-coverage';
import { VocabLlmJudge } from '../judges/vocab-llm-judge';
import { VocabJudgeVerdict } from '../schemas/judge-verdict.schema';

export interface LayerEvaluationResult {
  sampleId: string;
  category: string;
  passed: boolean;
  shortCircuited: boolean;
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
    coverageReport?: FactualCoverageReport;
    rouge1?: NGramScores;
    rougeL?: NGramScores;
    levenshteinSimilarity?: number;
    warnings: string[];
  };
  layer3?: {
    passed: boolean;
    verdict?: VocabJudgeVerdict;
    error?: string;
  };
}

export class LayerEvaluator {
  /**
   * Ejecuta el pipeline estratificado de evaluación de Capa 1 y Capa 2 (Síncrono, $0.00 de coste)
   * con principio de cortocircuito estricto (Short-Circuit Evaluation).
   */
  public static evaluateSample(
    sample: GoldenSample,
    actualOutput: unknown,
  ): LayerEvaluationResult {
    const startTime = performance.now();
    const result: LayerEvaluationResult = {
      sampleId: sample.id,
      category: sample.category,
      passed: false,
      shortCircuited: false,
      failedLayer: null,
      overallScore: 0.0,
      durationMs: 0,
      layer1: { passed: false },
      layer2: { passed: false, warnings: [] },
    };

    // =========================================================================
    // CAPA 1: Aserciones Deterministas en Código (Coste: $0.00, < 1ms)
    // =========================================================================
    let validatedObject: Record<string, any>;
    try {
      if (typeof actualOutput === 'string') {
        DeterministicValidators.assertLengthBounds(actualOutput, 5, 20000, 'raw_output');
        DeterministicValidators.assertNoLeadingGreetings(actualOutput, 'raw_output');
      }

      // Validar objeto
      validatedObject = typeof actualOutput === 'object' && actualOutput !== null
        ? (actualOutput as Record<string, any>)
        : JSON.parse(String(actualOutput || '{}'));

      // Aserciones de invariantes canónicas de vocabulario
      DeterministicValidators.assertVocabularyInvariants(validatedObject, sample.canonical_assertions);

      result.layer1.passed = true;
    } catch (err: unknown) {
      result.layer1.passed = false;
      result.failedLayer = 1;
      result.shortCircuited = true;
      result.passed = false;
      result.overallScore = 0.0;

      if (err instanceof DeterministicAssertionError) {
        result.layer1.error = err.message;
        result.layer1.errorCode = err.code;
      } else {
        result.layer1.error = (err as Error).message;
        result.layer1.errorCode = 'UNEXPECTED_LAYER1_ERROR';
      }

      result.durationMs = Number((performance.now() - startTime).toFixed(2));
      return result; // Cortocircuito inmediato (Fail-Fast)
    }

    // =========================================================================
    // CAPA 2: Heurísticas Semánticas y Cobertura Factual (10-30ms)
    // =========================================================================
    try {
      // 1. Verificación de hechos obligatorios y términos prohibidos
      const coverage = FactualCoverageEvaluator.computeCoverage(
        validatedObject,
        sample.mandatory_facts,
        sample.prohibited_terms,
      );
      result.layer2.coverageReport = coverage;

      // Si se violan términos prohibidos, falla Capa 2
      if (coverage.prohibitedTermsViolations.length > 0) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Violación de términos prohibidos detectada: ${coverage.prohibitedTermsViolations.join(', ')}`,
        );
      } else if (sample.mandatory_facts.length > 0 && coverage.recall < 0.70) {
        // Si el recall factual de hechos obligatorios es inferior al 70%, falla Capa 2
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Recall factual deficiente: ${(coverage.recall * 100).toFixed(1)}% (mínimo admisible: 70%)`,
        );
      } else {
        result.layer2.passed = true;
      }

      // 2. Cálculo opcional de similitud léxica ROUGE frente a expected_output
      if (sample.expected_output && typeof sample.expected_output === 'object') {
        const candidateText = FactualCoverageEvaluator.flattenObjectToText(validatedObject);
        const referenceText = FactualCoverageEvaluator.flattenObjectToText(sample.expected_output);

        result.layer2.rouge1 = LexicalOverlapCalculator.computeRougeN(candidateText, referenceText, 1);
        result.layer2.rougeL = LexicalOverlapCalculator.computeRougeL(candidateText, referenceText);

        if (validatedObject.ipaGeneralAmerican && sample.expected_output.ipaGeneralAmerican) {
          result.layer2.levenshteinSimilarity = LexicalOverlapCalculator.normalizedLevenshteinSimilarity(
            String(validatedObject.ipaGeneralAmerican),
            String(sample.expected_output.ipaGeneralAmerican),
          );
        }
      }

      // Puntuación combinada de Capa 1 y 2
      if (result.layer1.passed && result.layer2.passed) {
        result.passed = true;
        const factualF1 = coverage.f1;
        const rougeF1 = result.layer2.rouge1?.f1 ?? 1.0;
        // Ponderación: 70% cobertura factual + 30% solapamiento léxico
        result.overallScore = Number((factualF1 * 0.7 + rougeF1 * 0.3).toFixed(3));
      } else {
        result.passed = false;
        result.overallScore = Number((coverage.recall * 0.5).toFixed(3));
      }
    } catch (err: unknown) {
      result.layer2.passed = false;
      result.failedLayer = 2;
      result.passed = false;
      result.overallScore = 0.0;
      result.layer2.warnings.push(`Error en motor heurístico de Capa 2: ${(err as Error).message}`);
    }

    result.durationMs = Number((performance.now() - startTime).toFixed(2));
    return result;
  }

  /**
   * Ejecuta el pipeline estratificado completo incluyendo la Capa 3 (LLM-as-a-Judge con Gemini 3.5 Flash-Lite).
   * Respeta rigurosamente el cortocircuito:
   * - Si Capa 1 falla, NO se invoca Capa 2 ni Capa 3 (Ahorro de cuota y $0.00).
   * - Si Capa 2 falla, NO se invoca Capa 3.
   * - Únicamente si Capa 1 y Capa 2 pasan, se invoca al Juez LLM.
   */
  public static async evaluateSampleWithJudge(
    sample: GoldenSample,
    actualOutput: unknown,
    judge: VocabLlmJudge,
  ): Promise<LayerEvaluationResult> {
    const startTime = performance.now();

    // 1. Ejecutar Capa 1 y Capa 2
    const baseResult = this.evaluateSample(sample, actualOutput);

    // Si falló Capa 1 o Capa 2, cortocircuitar y retornar de inmediato sin tocar el LLM
    if (!baseResult.layer1.passed || !baseResult.layer2.passed) {
      baseResult.shortCircuited = true;
      return baseResult;
    }

    // =========================================================================
    // CAPA 3: LLM-as-a-Judge con Rúbricas Atómicas (Gemini 3.5 Flash-Lite)
    // =========================================================================
    baseResult.layer3 = { passed: false };

    try {
      const verdict = await judge.evaluateCandidate({
        lemma: sample.user_input,
        candidateOutput: actualOutput,
        canonicalAssertions: sample.canonical_assertions,
        mandatoryFacts: sample.mandatory_facts,
        prohibitedTerms: sample.prohibited_terms,
      });

      baseResult.layer3.verdict = verdict;
      baseResult.layer3.passed = verdict.overallPassed;

      if (verdict.overallPassed) {
        baseResult.passed = true;
        // Ponderación global final:
        // 20% Capa 1 (determinista cumplido = 1.0)
        // 30% Capa 2 (heurísticas semánticas)
        // 50% Capa 3 (LLM Judge score)
        const l2Score = baseResult.overallScore;
        const l3Score = verdict.score;
        baseResult.overallScore = Number((0.2 * 1.0 + 0.3 * l2Score + 0.5 * l3Score).toFixed(3));
      } else {
        baseResult.passed = false;
        baseResult.failedLayer = 3;
        baseResult.overallScore = Number((verdict.score * 0.5).toFixed(3));
      }
    } catch (judgeErr: unknown) {
      baseResult.layer3.passed = false;
      baseResult.failedLayer = 3;
      baseResult.passed = false;
      baseResult.layer3.error = (judgeErr as Error).message;
    }

    baseResult.durationMs = Number((performance.now() - startTime).toFixed(2));
    return baseResult;
  }
}
