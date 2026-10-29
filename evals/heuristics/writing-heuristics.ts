import { LexicalOverlapCalculator } from './lexical-overlap';
import { SuccessfulRepairItem, TargetWordFeedback } from '../../src/infrastructure/ai/schemas';

export interface VoicePreservationReport {
  cleanStructuralSimilarity: number; // 0.0 a 1.0 frente al borrador original
  nativeRecastSimilarity: number; // 0.0 a 1.0 frente al borrador original
  voicePreserved: boolean; // True si cleanStructural respeta el léxico y sintaxis del alumno
  hierarchyRespected: boolean; // True si cleanStructural se parece más al draft que nativeRecast
  warnings: string[];
}

export interface LearnerUptakeReport {
  totalClaimedRepairs: number;
  verifiedRepairs: number;
  phantomRepairs: Array<{
    originalSnippet: string;
    correctedSnippet: string;
    reason: string;
  }>;
  uptakeFaithfulnessScore: number; // 0.0 a 1.0
  passed: boolean;
}

export interface TaxonomyCoverageReport {
  expectedCount: number;
  detectedCount: number;
  matchedExpected: string[];
  missedExpected: string[];
  forbiddenViolations: string[];
  recall: number; // 0.0 a 1.0
  precision: number; // 0.0 a 1.0
  f1: number;
  passed: boolean;
}

export class WritingHeuristicsEvaluator {
  /**
   * Evalúa la preservación de la voz del estudiante en la Doble Reformulación (RF-WRT-07).
   * La versión 'clean_structural' debe mantener estrictamente el léxico y sintaxis del usuario,
   * reparando solo la gramática mecánica. La versión 'native_recast' debe ser estilísticamente más distante.
   */
  public static computeVoicePreservationRatio(
    originalDraft: string,
    cleanStructural: string,
    nativeRecast: string,
    minSimilarity = 0.70,
  ): VoicePreservationReport {
    const warnings: string[] = [];
    const cleanDraft = originalDraft.trim().toLowerCase();
    const cleanStruct = cleanStructural.trim().toLowerCase();
    const cleanRecast = nativeRecast.trim().toLowerCase();

    const cleanSim = LexicalOverlapCalculator.normalizedLevenshteinSimilarity(cleanDraft, cleanStruct);
    const recastSim = LexicalOverlapCalculator.normalizedLevenshteinSimilarity(cleanDraft, cleanRecast);

    const voicePreserved = cleanSim >= minSimilarity;
    if (!voicePreserved) {
      warnings.push(
        `Preservación de voz deficiente en 'clean_structural_version': similitud con borrador original = ${(cleanSim * 100).toFixed(1)}% (mínimo esperado: ${(minSimilarity * 100).toFixed(0)}%)`,
      );
    }

    // La versión clean debe estar más próxima al texto original que la versión nativa pulida
    // Permitimos una tolerancia marginal de 0.02
    const hierarchyRespected = cleanSim >= recastSim - 0.02;
    if (!hierarchyRespected) {
      warnings.push(
        `Inversión jerárquica en Doble Reformulación: 'clean_structural_version' (${(cleanSim * 100).toFixed(1)}%) es menos fiel al borrador que 'native_recast_version' (${(recastSim * 100).toFixed(1)}%)`,
      );
    }

    return {
      cleanStructuralSimilarity: Number(cleanSim.toFixed(3)),
      nativeRecastSimilarity: Number(recastSim.toFixed(3)),
      voicePreserved,
      hierarchyRespected,
      warnings,
    };
  }

  /**
   * Verifica la autenticidad de las auto-reparaciones reportadas (Learner Uptake / RF-WRT-06).
   * Compara el Borrador 1 y el Borrador 2 para sancionar "reparaciones fantasma"
   * (casos donde la IA elogia una corrección que el alumno jamás realizó o no existía en Borrador 1).
   */
  public static verifyLearnerUptakeFaithfulness(
    draft1: string,
    draft2: string,
    successfulRepairs: SuccessfulRepairItem[],
  ): LearnerUptakeReport {
    const normDraft1 = draft1.toLowerCase();
    const normDraft2 = draft2.toLowerCase();
    const phantomRepairs: Array<{ originalSnippet: string; correctedSnippet: string; reason: string }> = [];

    let verifiedCount = 0;

    for (const repair of successfulRepairs) {
      const orig = repair.original_snippet?.trim().toLowerCase() || '';
      const corr = repair.corrected_snippet?.trim().toLowerCase() || '';

      if (!orig && !corr) {
        phantomRepairs.push({
          originalSnippet: repair.original_snippet,
          correctedSnippet: repair.corrected_snippet,
          reason: 'Snippets vacíos de reparación reportada',
        });
        continue;
      }

      // Si se especificó el snippet original, debe haber existido en draft1
      if (orig && !normDraft1.includes(orig)) {
        phantomRepairs.push({
          originalSnippet: repair.original_snippet,
          correctedSnippet: repair.corrected_snippet,
          reason: `El error original '${repair.original_snippet}' no figuraba en el Borrador 1`,
        });
        continue;
      }

      // Si se especificó el snippet original, no debe persistir idéntico en draft2
      if (orig && normDraft2.includes(orig)) {
        // A menos que el texto corregido también esté presente
        if (!corr || !normDraft2.includes(corr)) {
          phantomRepairs.push({
            originalSnippet: repair.original_snippet,
            correctedSnippet: repair.corrected_snippet,
            reason: `El error original '${repair.original_snippet}' sigue presente en el Borrador 2 sin reparar`,
          });
          continue;
        }
      }

      // El snippet corregido debe estar presente en draft2
      if (corr && !normDraft2.includes(corr)) {
        phantomRepairs.push({
          originalSnippet: repair.original_snippet,
          correctedSnippet: repair.corrected_snippet,
          reason: `La corrección lograda '${repair.corrected_snippet}' no aparece en el Borrador 2`,
        });
        continue;
      }

      verifiedCount++;
    }

    const total = successfulRepairs.length;
    const score = total === 0 ? 1.0 : Number((verifiedCount / total).toFixed(3));

    return {
      totalClaimedRepairs: total,
      verifiedRepairs: verifiedCount,
      phantomRepairs,
      uptakeFaithfulnessScore: score,
      passed: phantomRepairs.length === 0,
    };
  }

  /**
   * Evalúa la cobertura taxonómica de los errores diagnosticados.
   */
  public static evaluateTaxonomyCoverage(
    detectedCodes: string[],
    expectedCodes: string[],
    forbiddenCodes: string[] = [],
  ): TaxonomyCoverageReport {
    const detectedSet = new Set(detectedCodes.map((c) => c.toUpperCase()));
    const expectedSet = new Set(expectedCodes.map((c) => c.toUpperCase()));
    const forbiddenSet = new Set(forbiddenCodes.map((c) => c.toUpperCase()));

    const matchedExpected: string[] = [];
    const missedExpected: string[] = [];
    const forbiddenViolations: string[] = [];

    for (const exp of expectedSet) {
      if (detectedSet.has(exp)) {
        matchedExpected.push(exp);
      } else {
        missedExpected.push(exp);
      }
    }

    for (const det of detectedSet) {
      if (forbiddenSet.has(det)) {
        forbiddenViolations.push(det);
      }
    }

    const recall = expectedSet.size === 0 ? 1.0 : Number((matchedExpected.length / expectedSet.size).toFixed(3));
    const precision = detectedSet.size === 0 ? 1.0 : Number((matchedExpected.length / detectedSet.size).toFixed(3));
    const f1 = precision + recall === 0 ? 0 : Number(((2 * precision * recall) / (precision + recall)).toFixed(3));

    const passed = forbiddenViolations.length === 0 && (expectedSet.size === 0 || recall >= 0.60);

    return {
      expectedCount: expectedSet.size,
      detectedCount: detectedSet.size,
      matchedExpected,
      missedExpected,
      forbiddenViolations,
      recall,
      precision,
      f1,
      passed,
    };
  }

  /**
   * Verifica la evaluación de palabras meta del mazo SRS.
   */
  public static verifyTargetWordsEngagement(
    targetWords: string[] | undefined,
    draftText: string,
    feedbackItems: TargetWordFeedback[] | undefined,
  ): { targetWordsCount: number; correctlyReportedCount: number; passed: boolean } {
    if (!targetWords || targetWords.length === 0) {
      return { targetWordsCount: 0, correctlyReportedCount: 0, passed: true };
    }

    const normDraft = draftText.toLowerCase();
    const feedbackMap = new Map((feedbackItems || []).map((f) => [f.word.toLowerCase(), f]));

    let correctCount = 0;
    for (const word of targetWords) {
      const normWord = word.trim().toLowerCase();
      const actuallyUsed = normDraft.includes(normWord);
      const reported = feedbackMap.get(normWord);

      if (reported) {
        if (reported.used === actuallyUsed) {
          correctCount++;
        }
      } else if (!actuallyUsed) {
        // Si no se usó y no fue reportado negativamente, cuenta neutro
        correctCount++;
      }
    }

    return {
      targetWordsCount: targetWords.length,
      correctlyReportedCount: correctCount,
      passed: correctCount >= targetWords.length,
    };
  }
}
