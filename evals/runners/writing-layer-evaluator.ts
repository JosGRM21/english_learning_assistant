import {
  WritingSocraticSample,
  WritingEvaluationSample,
} from '../schemas/writing-golden-dataset.schema';
import { WritingDeterministicValidators } from '../assertions/writing-deterministic-validators';
import { DeterministicAssertionError, DeterministicValidators } from '../assertions/deterministic-validators';
import { WritingHeuristicsEvaluator, VoicePreservationReport, LearnerUptakeReport, TaxonomyCoverageReport } from '../heuristics/writing-heuristics';
import { FactualCoverageEvaluator, FactualCoverageReport } from '../heuristics/factual-coverage';
import { LexicalOverlapCalculator, NGramScores } from '../heuristics/lexical-overlap';
import { WritingLlmJudge } from '../judges/writing-llm-judge';
import {
  WritingSocraticJudgeVerdict,
  WritingEvaluationJudgeVerdict,
} from '../schemas/writing-judge-verdict.schema';
import {
  SocraticFeedbackResponse,
  WritingEvaluationResponse,
} from '../../src/infrastructure/ai/schemas';

export interface WritingLayerEvaluationResult {
  sampleId: string;
  domain: 'writing_socratic' | 'writing_evaluation';
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
    taxonomyReport?: TaxonomyCoverageReport;
    voicePreservationReport?: VoicePreservationReport;
    learnerUptakeReport?: LearnerUptakeReport;
    rouge1?: NGramScores;
    warnings: string[];
  };
  layer3?: {
    passed: boolean;
    socraticVerdict?: WritingSocraticJudgeVerdict;
    evaluationVerdict?: WritingEvaluationJudgeVerdict;
    error?: string;
  };
}

export class WritingLayerEvaluator {
  /**
   * Evalúa una muestra de Fase 1 (Socrática) en Capas 1 y 2 ($0.00 de coste, < 10ms)
   * con principio de cortocircuito estricto.
   */
  public static evaluateSocraticSample(
    sample: WritingSocraticSample,
    actualOutput: unknown,
  ): WritingLayerEvaluationResult {
    const startTime = performance.now();
    const result: WritingLayerEvaluationResult = {
      sampleId: sample.id,
      domain: 'writing_socratic',
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
    // CAPA 1: Aserciones Deterministas en Código (< 1ms, $0.00)
    // =========================================================================
    let validatedObject: SocraticFeedbackResponse;
    try {
      if (typeof actualOutput === 'string') {
        DeterministicValidators.assertLengthBounds(actualOutput, 5, 20000, 'raw_socratic_output');
        DeterministicValidators.assertNoLeadingGreetings(actualOutput, 'raw_socratic_output');
      }

      validatedObject = typeof actualOutput === 'object' && actualOutput !== null
        ? (actualOutput as SocraticFeedbackResponse)
        : JSON.parse(String(actualOutput || '{}'));

      // 1. Cota cognitiva máxima de pistas (RF-WRT-06)
      const maxClues = sample.canonical_assertions.max_clues ?? 3;
      WritingDeterministicValidators.assertSocraticCognitiveLoadBounds(validatedObject, maxClues);

      // 2. Exclusión total de signos de puntuación (RF-WRT-09)
      if (sample.canonical_assertions.disallow_punctuation !== false) {
        WritingDeterministicValidators.assertNoPunctuationViolations(validatedObject);
      }

      // 3. Prohibición de saludos
      if (sample.canonical_assertions.disallow_greetings !== false) {
        WritingDeterministicValidators.assertNoLeadingGreetingsInWriting(validatedObject);
      }

      // 4. Taxonomía canónica exclusiva
      WritingDeterministicValidators.assertCanonicalTaxonomyIntegrity(validatedObject);

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
      return result; // Cortocircuito inmediato
    }

    // =========================================================================
    // CAPA 2: Heurísticas Semánticas y Cobertura Taxonómica (1-5ms)
    // =========================================================================
    try {
      // 1. Cobertura de hechos obligatorios y términos prohibidos
      const coverage = FactualCoverageEvaluator.computeCoverage(
        validatedObject,
        sample.mandatory_facts,
        sample.prohibited_terms,
      );
      result.layer2.coverageReport = coverage;

      if (coverage.prohibitedTermsViolations.length > 0) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Violación de términos prohibidos: ${coverage.prohibitedTermsViolations.join(', ')}`,
        );
      } else if (sample.mandatory_facts.length > 0 && coverage.recall < 0.60) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Recall factual insuficiente: ${(coverage.recall * 100).toFixed(1)}% (mínimo: 60%)`,
        );
      } else {
        result.layer2.passed = true;
      }

      // 2. Cobertura taxonómica
      const detectedCodes = (validatedObject.scaffolded_clues || []).map((c) => c.clue_type);
      const expectedCodes = sample.canonical_assertions.expected_taxonomy_codes || [];
      const forbiddenCodes = sample.canonical_assertions.forbidden_taxonomy_codes || [];

      const taxonomyReport = WritingHeuristicsEvaluator.evaluateTaxonomyCoverage(
        detectedCodes,
        expectedCodes,
        forbiddenCodes,
      );
      result.layer2.taxonomyReport = taxonomyReport;

      if (!taxonomyReport.passed) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Fallo en cobertura taxonómica: esperados=[${taxonomyReport.missedExpected.join(', ')}], prohibidos detectados=[${taxonomyReport.forbiddenViolations.join(', ')}]`,
        );
      }

      // Cálculo de solapamiento opcional
      if (sample.expected_output) {
        const candText = FactualCoverageEvaluator.flattenObjectToText(validatedObject);
        const refText = FactualCoverageEvaluator.flattenObjectToText(sample.expected_output);
        result.layer2.rouge1 = LexicalOverlapCalculator.computeRougeN(candText, refText, 1);
      }

      if (result.layer1.passed && result.layer2.passed) {
        result.passed = true;
        const factualF1 = coverage.f1;
        const taxF1 = taxonomyReport.f1;
        result.overallScore = Number((factualF1 * 0.5 + taxF1 * 0.5).toFixed(3));
      } else {
        result.passed = false;
        result.overallScore = Number((coverage.recall * 0.5).toFixed(3));
      }
    } catch (err: unknown) {
      result.layer2.passed = false;
      result.failedLayer = 2;
      result.passed = false;
      result.overallScore = 0.0;
      result.layer2.warnings.push(`Error en heurísticas de Capa 2: ${(err as Error).message}`);
    }

    result.durationMs = Number((performance.now() - startTime).toFixed(2));
    return result;
  }

  /**
   * Evalúa una muestra de Fase 2 (Evaluación Final y Doble Recast) en Capas 1 y 2.
   */
  public static evaluateEvaluationSample(
    sample: WritingEvaluationSample,
    actualOutput: unknown,
  ): WritingLayerEvaluationResult {
    const startTime = performance.now();
    const result: WritingLayerEvaluationResult = {
      sampleId: sample.id,
      domain: 'writing_evaluation',
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
    // CAPA 1: Aserciones Deterministas en Código (< 1ms, $0.00)
    // =========================================================================
    let validatedObject: WritingEvaluationResponse;
    try {
      if (typeof actualOutput === 'string') {
        DeterministicValidators.assertLengthBounds(actualOutput, 10, 30000, 'raw_evaluation_output');
        DeterministicValidators.assertNoLeadingGreetings(actualOutput, 'raw_evaluation_output');
      }

      validatedObject = typeof actualOutput === 'object' && actualOutput !== null
        ? (actualOutput as WritingEvaluationResponse)
        : JSON.parse(String(actualOutput || '{}'));

      // 1. Exclusión de puntuación en correcciones
      if (sample.canonical_assertions.disallow_punctuation_in_corrections !== false) {
        WritingDeterministicValidators.assertNoPunctuationViolations(validatedObject);
      }

      // 2. Prohibición de saludos
      if (sample.canonical_assertions.disallow_greetings !== false) {
        WritingDeterministicValidators.assertNoLeadingGreetingsInWriting(validatedObject);
      }

      // 3. Taxonomía canónica en correcciones
      WritingDeterministicValidators.assertCanonicalTaxonomyIntegrity(validatedObject);

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
      return result;
    }

    // =========================================================================
    // CAPA 2: Heurísticas Semánticas (Voz, Uptake, Target Words) (1-10ms)
    // =========================================================================
    try {
      // 1. Cobertura factual
      const coverage = FactualCoverageEvaluator.computeCoverage(
        validatedObject,
        sample.mandatory_facts,
        sample.prohibited_terms,
      );
      result.layer2.coverageReport = coverage;

      if (coverage.prohibitedTermsViolations.length > 0) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Violación de términos prohibidos: ${coverage.prohibitedTermsViolations.join(', ')}`,
        );
      } else if (sample.mandatory_facts.length > 0 && coverage.recall < 0.60) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Recall factual deficiente: ${(coverage.recall * 100).toFixed(1)}%`,
        );
      } else {
        result.layer2.passed = true;
      }

      // 2. Métrica de Preservación de Voz (RF-WRT-07)
      const minVoiceSim = sample.canonical_assertions.min_voice_preservation_similarity ?? 0.70;
      const voiceReport = WritingHeuristicsEvaluator.computeVoicePreservationRatio(
        sample.user_input, // Draft 2
        validatedObject.clean_structural_version,
        validatedObject.native_recast_version,
        minVoiceSim,
      );
      result.layer2.voicePreservationReport = voiceReport;

      if (!voiceReport.voicePreserved) {
        result.layer2.warnings.push(...voiceReport.warnings);
        if (sample.category !== 'adversarial' && voiceReport.cleanStructuralSimilarity < minVoiceSim) {
          result.layer2.passed = false;
          result.failedLayer = 2;
        }
      }

      // 3. Verificación de Auto-Reparación (Learner Uptake / Anti-Phantom Repairs)
      const uptakeReport = WritingHeuristicsEvaluator.verifyLearnerUptakeFaithfulness(
        sample.context.draft1,
        sample.user_input, // Draft 2
        validatedObject.successful_repairs || [],
      );
      result.layer2.learnerUptakeReport = uptakeReport;

      if (!uptakeReport.passed) {
        result.layer2.passed = false;
        result.failedLayer = 2;
        result.layer2.warnings.push(
          `Alucinación de reparaciones fantasma detectada: ${uptakeReport.phantomRepairs.map((p) => p.reason).join('; ')}`,
        );
      }

      // 4. Verificación de palabras objetivo SRS
      if (sample.context.targetWords && sample.context.targetWords.length > 0) {
        const twReport = WritingHeuristicsEvaluator.verifyTargetWordsEngagement(
          sample.context.targetWords,
          sample.user_input,
          validatedObject.target_words_feedback,
        );
        if (!twReport.passed) {
          result.layer2.warnings.push(
            `Inconsistencia en reporte de palabras meta: detectadas ${twReport.correctlyReportedCount}/${twReport.targetWordsCount}`,
          );
        }
      }

      // Puntuación combinada Capas 1 y 2
      if (result.layer1.passed && result.layer2.passed) {
        result.passed = true;
        const factScore = coverage.f1;
        const voiceScore = voiceReport.cleanStructuralSimilarity;
        const uptakeScore = uptakeReport.uptakeFaithfulnessScore;
        result.overallScore = Number((factScore * 0.4 + voiceScore * 0.3 + uptakeScore * 0.3).toFixed(3));
      } else {
        result.passed = false;
        result.overallScore = Number((coverage.recall * 0.5).toFixed(3));
      }
    } catch (err: unknown) {
      result.layer2.passed = false;
      result.failedLayer = 2;
      result.passed = false;
      result.overallScore = 0.0;
      result.layer2.warnings.push(`Error en heurísticas de Capa 2: ${(err as Error).message}`);
    }

    result.durationMs = Number((performance.now() - startTime).toFixed(2));
    return result;
  }

  /**
   * Ejecuta la evaluación completa incluyendo la Capa 3 (LLM-as-a-Judge con Gemini 3.5 Flash-Lite)
   * respetando rigurosamente el cortocircuito si Capa 1 o 2 fallan.
   */
  public static async evaluateSampleWithJudge(
    sample: WritingSocraticSample | WritingEvaluationSample,
    actualOutput: unknown,
    judge: WritingLlmJudge,
  ): Promise<WritingLayerEvaluationResult> {
    const startTime = performance.now();

    // 1. Ejecutar Capa 1 y Capa 2
    const isSocratic = sample.domain === 'writing_socratic';
    const baseResult = isSocratic
      ? this.evaluateSocraticSample(sample as WritingSocraticSample, actualOutput)
      : this.evaluateEvaluationSample(sample as WritingEvaluationSample, actualOutput);

    // Cortocircuito estricto si falla Capa 1 o Capa 2
    if (!baseResult.layer1.passed || !baseResult.layer2.passed) {
      baseResult.shortCircuited = true;
      return baseResult;
    }

    // =========================================================================
    // CAPA 3: Juez LLM Pedagógico con Rúbricas Atómicas W1-W6 o W7-W12
    // =========================================================================
    baseResult.layer3 = { passed: false };

    try {
      if (isSocratic) {
        const sSample = sample as WritingSocraticSample;
        const verdict = await judge.evaluateSocraticCandidate({
          userInput: sSample.user_input,
          candidateOutput: actualOutput,
          canonicalAssertions: sSample.canonical_assertions,
          cefrTarget: sSample.context?.cefrTarget,
          readingContext: sSample.context?.readingContext,
          missionInstructions: sSample.context?.missionInstructions,
          targetWords: sSample.context?.targetWords,
          mandatoryFacts: sSample.mandatory_facts,
          prohibitedTerms: sSample.prohibited_terms,
        });

        baseResult.layer3.socraticVerdict = verdict;
        baseResult.layer3.passed = verdict.overallPassed;

        if (verdict.overallPassed) {
          baseResult.passed = true;
          // Ponderación: 20% L1 (1.0) + 30% L2 + 50% L3
          baseResult.overallScore = Number((0.2 * 1.0 + 0.3 * baseResult.overallScore + 0.5 * verdict.score).toFixed(3));
        } else {
          baseResult.passed = false;
          baseResult.failedLayer = 3;
          baseResult.overallScore = Number((verdict.score * 0.5).toFixed(3));
        }
      } else {
        const eSample = sample as WritingEvaluationSample;
        const verdict = await judge.evaluateEvaluationCandidate({
          draft1: eSample.context.draft1,
          draft2: eSample.user_input,
          candidateOutput: actualOutput,
          canonicalAssertions: eSample.canonical_assertions,
          cefrTarget: eSample.context?.cefrTarget,
          readingContext: eSample.context?.readingContext,
          missionInstructions: eSample.context?.missionInstructions,
          targetWords: eSample.context?.targetWords,
          mandatoryFacts: eSample.mandatory_facts,
          prohibitedTerms: eSample.prohibited_terms,
        });

        baseResult.layer3.evaluationVerdict = verdict;
        baseResult.layer3.passed = verdict.overallPassed;

        if (verdict.overallPassed) {
          baseResult.passed = true;
          baseResult.overallScore = Number((0.2 * 1.0 + 0.3 * baseResult.overallScore + 0.5 * verdict.score).toFixed(3));
        } else {
          baseResult.passed = false;
          baseResult.failedLayer = 3;
          baseResult.overallScore = Number((verdict.score * 0.5).toFixed(3));
        }
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
