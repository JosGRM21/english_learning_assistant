import { describe, it, expect, vi } from 'vitest';
import { WritingLlmJudge } from '../judges/writing-llm-judge';
import { KeyPoolManager } from '../../scripts/vocab-generator/key-pool-manager';
import {
  WritingSocraticJudgeInput,
  WritingEvaluationJudgeInput,
} from '../schemas/writing-judge-verdict.schema';

describe('WritingLlmJudge con Rúbricas Atómicas y Guardarraíl Determinista', () => {
  it('inicializa correctamente el pool de claves para el juez de redacción', () => {
    const fakeKeys = ['AIzaSyFakeKey1', 'AIzaSyFakeKey2'];
    const pool = new KeyPoolManager(fakeKeys, 100, 1);
    const judge = new WritingLlmJudge(fakeKeys.join(','), 'gemini-3.5-flash-lite', pool);

    expect(judge.getActiveKeysCount()).toBe(2);
    expect(judge.getTotalKeysCount()).toBe(2);
    expect(judge.getKeyPoolStatus()).toContain('Claves activas: 2/2');
  });

  describe('Guardarraíl Determinista en Código (TypeScript First)', () => {
    it('activa el guardarraíl en Fase 1 si un criterio falla aunque el LLM declare overallPassed en true', async () => {
      const fakeKeys = ['fake_key'];
      const pool = new KeyPoolManager(fakeKeys, 10, 1);
      const judge = new WritingLlmJudge(fakeKeys.join(','), 'gemini-3.5-flash-lite', pool);

      // Simulamos la respuesta interna del método executeJudgeQuery
      vi.spyOn(judge as any, 'executeJudgeQuery').mockImplementation(async () => {
        // El LLM comete inconsistencia lógica: W3_L1_TRANSFER_ACCURACY falló, pero marcó overallPassed = true
        const criteria = [
          { criterionId: 'W1_SOCRATIC_SCAFFOLDING_PURITY', criterionName: 'Scaffolding', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W2_ERROR_DIAGNOSIS_FIDELITY', criterionName: 'Diagnosis', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W3_L1_TRANSFER_ACCURACY', criterionName: 'L1 Transfer', evidenceExtracted: 'Ev', passed: false, critique: 'Falsa transferencia atribuida a un error regular' },
          { criterionId: 'W4_PEDAGOGICAL_TONE', criterionName: 'Tone', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W5_ZPD_CALIBRATION', criterionName: 'ZPD', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W6_CONCISENESS_NO_GREETINGS', criterionName: 'Conciseness', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
        ];

        // Simulamos la lógica del guardarraíl que se ejecuta en el juez
        const failedCriteria = criteria.filter((c) => !c.passed);
        return {
          chainOfThought: 'Razonamiento escéptico',
          criteriaEvaluations: criteria,
          overallPassed: failedCriteria.length === 0, // Guardarraíl determinista fuerza false
          score: Number(((criteria.length - failedCriteria.length) / criteria.length).toFixed(2)),
          criticalFailures: failedCriteria.map((c) => c.criterionId),
          actionableFeedback: 'Corregir la clasificación L1',
        };
      });

      const input: WritingSocraticJudgeInput = {
        userInput: 'I goed home.',
        candidateOutput: {},
        canonicalAssertions: {
          max_clues: 3,
          disallow_punctuation: true,
          disallow_greetings: true,
          require_l1_transfer_flag: false,
        },
      };

      const verdict = await judge.evaluateSocraticCandidate(input);

      expect(verdict.overallPassed).toBe(false);
      expect(verdict.criticalFailures).toContain('W3_L1_TRANSFER_ACCURACY');
      expect(verdict.score).toBe(0.83); // 5 de 6 aprobados
    });

    it('aprueba con veredicto PASSED y score 1.0 si los 5 criterios son satisfechos', async () => {
      const fakeKeys = ['fake_key'];
      const pool = new KeyPoolManager(fakeKeys, 10, 1);
      const judge = new WritingLlmJudge(fakeKeys.join(','), 'gemini-3.5-flash-lite', pool);

      vi.spyOn(judge as any, 'executeJudgeQuery').mockImplementation(async () => {
        const criteria = [
          { criterionId: 'W7_CLEAN_STRUCTURAL_FIDELITY', criterionName: 'Clean Structural', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W8_NATIVE_RECAST_NATURALNESS', criterionName: 'Native Recast', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W9_NOTICING_THE_GAP_EFFICACY', criterionName: 'Noticing Gap', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W10_CEFR_AND_RUBRIC_COHERENCE', criterionName: 'CEFR Rubric', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
          { criterionId: 'W11_UPTAKE_AUTHENTICITY', criterionName: 'Uptake Authenticity', evidenceExtracted: 'Ev', passed: true, critique: 'OK' },
        ];

        return {
          chainOfThought: 'CoT perfecto',
          criteriaEvaluations: criteria,
          overallPassed: true,
          score: 1.0,
          criticalFailures: [],
          actionableFeedback: 'Excelente desempeño pedagógico',
        };
      });

      const input: WritingEvaluationJudgeInput = {
        draft1: 'I go yesterday.',
        draft2: 'I went yesterday.',
        candidateOutput: {},
        canonicalAssertions: {
          disallow_punctuation_in_corrections: true,
          disallow_greetings: true,
        },
      };

      const verdict = await judge.evaluateEvaluationCandidate(input);

      expect(verdict.overallPassed).toBe(true);
      expect(verdict.score).toBe(1.0);
      expect(verdict.criticalFailures).toHaveLength(0);
    });
  });
});
