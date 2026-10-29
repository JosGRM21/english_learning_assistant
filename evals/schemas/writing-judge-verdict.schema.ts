import { z } from 'zod';
import {
  WritingSocraticAssertions,
  WritingEvaluationAssertions,
} from './writing-golden-dataset.schema';

/**
 * Criterios atómicos booleanos formalizados para la Fase 1: Pistas Socráticas (W1 a W6).
 */
export const WritingSocraticCriterionIdSchema = z.enum([
  'W1_SOCRATIC_SCAFFOLDING_PURITY',
  'W2_ERROR_DIAGNOSIS_FIDELITY',
  'W3_L1_TRANSFER_ACCURACY',
  'W4_PEDAGOGICAL_TONE',
  'W5_ZPD_CALIBRATION',
  'W6_CONCISENESS_NO_GREETINGS',
]);

export type WritingSocraticCriterionId = z.infer<typeof WritingSocraticCriterionIdSchema>;

/**
 * Criterios atómicos booleanos formalizados para la Fase 2: Evaluación Final y Doble Recast (W7 a W11).
 */
export const WritingEvaluationCriterionIdSchema = z.enum([
  'W7_CLEAN_STRUCTURAL_FIDELITY',
  'W8_NATIVE_RECAST_NATURALNESS',
  'W9_NOTICING_THE_GAP_EFFICACY',
  'W10_CEFR_AND_RUBRIC_COHERENCE',
  'W11_UPTAKE_AUTHENTICITY',
]);

export type WritingEvaluationCriterionId = z.infer<typeof WritingEvaluationCriterionIdSchema>;

/**
 * Evaluación individual de un criterio atómico socrático.
 */
export const WritingCriterionEvaluationSchema = z.object({
  criterionId: z.string().describe('Identificador unívoco del criterio evaluado'),
  criterionName: z.string().describe('Nombre descriptivo del criterio'),
  evidenceExtracted: z.string().describe('Cita textual extraída del JSON generado que sustenta el juicio'),
  passed: z.boolean().describe('True si cumple plenamente el estándar; False ante cualquier defecto'),
  critique: z.string().describe('Justificación técnica concisa del razonamiento evaluativo'),
});

export type WritingCriterionEvaluation = z.infer<typeof WritingCriterionEvaluationSchema>;

/**
 * Veredicto estructurado del Juez LLM para Fase 1 (Socrática).
 */
export const WritingSocraticJudgeVerdictSchema = z.object({
  chainOfThought: z.string().describe(
    'Análisis global y razonamiento paso a paso escéptico previo al dictamen de cada criterio socrático',
  ),
  criteriaEvaluations: z
    .array(WritingCriterionEvaluationSchema)
    .min(6)
    .max(6)
    .describe('Vector exhaustivo de los 6 criterios atómicos evaluados (W1 a W6)'),
  overallPassed: z.boolean().describe(
    'True ÚNICAMENTE si todos los criterios atómicos pasaron con éxito (passed = true)',
  ),
  score: z.number().min(0).max(1).describe('Puntuación normalizada de 0.0 a 1.0 (criterios aprobados / 6)'),
  criticalFailures: z.array(z.string()).describe('Lista de identificadores de criterios reprobados'),
  actionableFeedback: z.string().describe('Recomendación pedagógica y técnica concreta para corregir los fallos'),
});

export type WritingSocraticJudgeVerdict = z.infer<typeof WritingSocraticJudgeVerdictSchema>;

/**
 * Veredicto estructurado del Juez LLM para Fase 2 (Evaluación, Doble Reformulación y Noticing the Gap).
 */
export const WritingEvaluationJudgeVerdictSchema = z.object({
  chainOfThought: z.string().describe(
    'Análisis global y razonamiento paso a paso escéptico previo al dictamen de cada criterio de evaluación y doble recast',
  ),
  criteriaEvaluations: z
    .array(WritingCriterionEvaluationSchema)
    .min(5)
    .max(5)
    .describe('Vector exhaustivo de los 5 criterios atómicos evaluados (W7 a W11)'),
  overallPassed: z.boolean().describe(
    'True ÚNICAMENTE si todos los criterios atómicos pasaron con éxito (passed = true)',
  ),
  score: z.number().min(0).max(1).describe('Puntuación normalizada de 0.0 a 1.0 (criterios aprobados / 5)'),
  criticalFailures: z.array(z.string()).describe('Lista de identificadores de criterios reprobados'),
  actionableFeedback: z.string().describe('Recomendación pedagógica y técnica concreta para optimizar el modelo'),
});

export type WritingEvaluationJudgeVerdict = z.infer<typeof WritingEvaluationJudgeVerdictSchema>;

/**
 * Entrada provista al Juez LLM para auditar la Fase 1.
 */
export interface WritingSocraticJudgeInput {
  userInput: string;
  candidateOutput: unknown;
  canonicalAssertions: WritingSocraticAssertions;
  cefrTarget?: string;
  readingContext?: string;
  missionInstructions?: string;
  targetWords?: string[];
  mandatoryFacts?: string[];
  prohibitedTerms?: string[];
}

/**
 * Entrada provista al Juez LLM para auditar la Fase 2.
 */
export interface WritingEvaluationJudgeInput {
  draft1: string;
  draft2: string;
  candidateOutput: unknown;
  canonicalAssertions: WritingEvaluationAssertions;
  cefrTarget?: string;
  readingContext?: string;
  missionInstructions?: string;
  targetWords?: string[];
  mandatoryFacts?: string[];
  prohibitedTerms?: string[];
}
