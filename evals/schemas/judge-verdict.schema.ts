import { z } from 'zod';
import { CanonicalAssertions } from './golden-dataset.schema';

/**
 * Identificadores formalizados de los 6 criterios atómicos para el evaluador
 * LLM-as-a-Judge de Fichas de Vocabulario (SLA).
 */
export const VocabCriterionIdSchema = z.enum([
  'C1_NATURALNESS_AND_IDIOMATICITY',
  'C2_CEFR_CALIBRATION',
  'C4_SYNTACTIC_PRECISION',
  'C5_PHONETIC_FIDELITY',
  'C6_LEXICAL_DISAMBIGUATION',
  'C7_CONCISENESS_NO_VERBOSITY',
]);

export type VocabCriterionId = z.infer<typeof VocabCriterionIdSchema>;

/**
 * Evaluación individual de un criterio atómico.
 * Exige cita textual obligatoria antes del booleano (CoT grounding).
 */
export const CriterionEvaluationSchema = z.object({
  criterionId: VocabCriterionIdSchema.describe(
    'Identificador unívoco del criterio evaluado (C1, C2, C4, C5, C6, C7)',
  ),
  criterionName: z.string().describe('Nombre descriptivo legible del criterio'),
  evidenceExtracted: z.string().describe(
    'Cita textual exacta extraída del JSON generado que sustenta la evaluación, o descripción explícita de lo omitido/esperado',
  ),
  passed: z.boolean().describe(
    'True si cumple rigurosamente el criterio sin desviaciones; False si presenta cualquier anomalía, incorrección o violación pedagógica',
  ),
  critique: z.string().describe(
    'Justificación técnica concisa del razonamiento evaluativo',
  ),
});

export type CriterionEvaluation = z.infer<typeof CriterionEvaluationSchema>;

/**
 * Contrato de salida estructurada del Juez LLM (Capa 3).
 * El campo `chainOfThought` DEBE generarse primero para condicionar autorregresivamente
 * las evaluaciones atómicas y el veredicto final.
 */
export const VocabJudgeVerdictSchema = z.object({
  chainOfThought: z.string().describe(
    'Análisis global y razonamiento paso a paso escéptico previo al dictamen de cada criterio',
  ),
  criteriaEvaluations: z
    .array(CriterionEvaluationSchema)
    .min(7)
    .max(7)
    .describe('Vector exhaustivo de los 7 criterios atómicos evaluados'),
  overallPassed: z.boolean().describe(
    'True ÚNICAMENTE si todos los criterios atómicos obligatorios han pasado con éxito (passed = true)',
  ),
  score: z
    .number()
    .min(0)
    .max(1)
    .describe('Puntuación normalizada de 0.0 a 1.0 (número de criterios aprobados / 7)'),
  criticalFailures: z
    .array(z.string())
    .describe('Lista de criterios que resultaron reprobados (passed = false)'),
  actionableFeedback: z.string().describe(
    'Recomendación técnica y pedagógica concreta para optimizar el prompt o corregir la generación',
  ),
});

export type VocabJudgeVerdict = z.infer<typeof VocabJudgeVerdictSchema>;

/**
 * Entrada provista al Juez LLM para auditar una ficha léxica generada.
 */
export interface VocabJudgeInput {
  lemma: string;
  candidateOutput: unknown;
  canonicalAssertions: CanonicalAssertions;
  mandatoryFacts?: string[];
  prohibitedTerms?: string[];
}
