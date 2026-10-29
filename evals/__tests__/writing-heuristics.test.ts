import { describe, it, expect } from 'vitest';
import { WritingHeuristicsEvaluator } from '../heuristics/writing-heuristics';

describe('WritingHeuristicsEvaluator (Capa 2: $0.00, 1-10ms)', () => {
  describe('computeVoicePreservationRatio (RF-WRT-07)', () => {
    it('aprueba cuando la versión estructural preserva el texto original con mínima intervención', () => {
      const original = 'I go to the market yesterday and buy vegetables.';
      const clean = 'I went to the market yesterday and bought vegetables.';
      const recast = 'Yesterday I headed to the local grocery market to pick up fresh produce.';

      const report = WritingHeuristicsEvaluator.computeVoicePreservationRatio(original, clean, recast, 0.70);

      expect(report.voicePreserved).toBe(true);
      expect(report.hierarchyRespected).toBe(true);
      expect(report.cleanStructuralSimilarity).toBeGreaterThan(0.80);
      expect(report.cleanStructuralSimilarity).toBeGreaterThan(report.nativeRecastSimilarity);
      expect(report.warnings).toHaveLength(0);
    });

    it('detecta borrado de voz si la versión estructural reescribe por completo el texto del usuario', () => {
      const original = 'I am thinking that this project is having many issues.';
      // El modelo sobre-corrigió reemplazando todo el estilo del usuario:
      const clean = 'In my perspective, the ongoing initiative encounters substantial complications.';
      const recast = 'I believe this venture faces significant bottlenecks.';

      const report = WritingHeuristicsEvaluator.computeVoicePreservationRatio(original, clean, recast, 0.70);

      expect(report.voicePreserved).toBe(false);
      expect(report.cleanStructuralSimilarity).toBeLessThan(0.70);
      expect(report.warnings[0]).toContain('Preservación de voz deficiente');
    });

    it('detecta inversión jerárquica si la versión estructural es menos fiel que la versión nativa', () => {
      const original = 'We make a party tomorrow.';
      const clean = 'We are organizing an elaborate social gathering tomorrow.'; // demasiado sofisticado para clean
      const recast = 'We are throwing a party tomorrow.'; // más parecido al original que clean

      const report = WritingHeuristicsEvaluator.computeVoicePreservationRatio(original, clean, recast, 0.70);

      expect(report.hierarchyRespected).toBe(false);
      expect(report.warnings.some((w) => w.includes('Inversión jerárquica'))).toBe(true);
    });
  });

  describe('verifyLearnerUptakeFaithfulness (Anti-Phantom Repairs / RF-WRT-06)', () => {
    it('aprueba cuando el estudiante efectivamente corrigió el error entre borradores', () => {
      const draft1 = 'Last night I go to sleep late.';
      const draft2 = 'Last night I went to sleep late.';
      const repairs = [
        {
          original_snippet: 'go',
          corrected_snippet: 'went',
          praise_es: 'Corregiste el pasado.',
        },
      ];

      const report = WritingHeuristicsEvaluator.verifyLearnerUptakeFaithfulness(draft1, draft2, repairs);

      expect(report.passed).toBe(true);
      expect(report.verifiedRepairs).toBe(1);
      expect(report.phantomRepairs).toHaveLength(0);
      expect(report.uptakeFaithfulnessScore).toBe(1.0);
    });

    it('detecta reparación fantasma si el error original nunca existió en el Borrador 1', () => {
      const draft1 = 'I visited my grandmother.';
      const draft2 = 'I visited my grandmother yesterday.';
      const repairs = [
        {
          original_snippet: 'visitted', // Alucinación: el usuario nunca escribió 'visitted'
          corrected_snippet: 'visited',
          praise_es: 'Buen trabajo corrigiendo la ortografía.',
        },
      ];

      const report = WritingHeuristicsEvaluator.verifyLearnerUptakeFaithfulness(draft1, draft2, repairs);

      expect(report.passed).toBe(false);
      expect(report.phantomRepairs).toHaveLength(1);
      expect(report.phantomRepairs[0].reason).toContain('no figuraba en el Borrador 1');
    });

    it('detecta reparación fantasma si el error original sigue presente en el Borrador 2', () => {
      const draft1 = 'It depend of money.';
      const draft2 = 'It still depend of money.'; // No fue reparado
      const repairs = [
        {
          original_snippet: 'depend of',
          corrected_snippet: 'depends on',
          praise_es: 'Corregiste la preposición.',
        },
      ];

      const report = WritingHeuristicsEvaluator.verifyLearnerUptakeFaithfulness(draft1, draft2, repairs);

      expect(report.passed).toBe(false);
      expect(report.phantomRepairs).toHaveLength(1);
      expect(report.phantomRepairs[0].reason).toContain('sigue presente en el Borrador 2');
    });
  });

  describe('evaluateTaxonomyCoverage', () => {
    it('calcula cobertura taxonómica y detecta violaciones de códigos prohibidos', () => {
      const detected = ['PREPOSITION', 'AGREEMENT'];
      const expected = ['PREPOSITION', 'TENSE_ASPECT'];
      const forbidden = ['SPELLING'];

      const report = WritingHeuristicsEvaluator.evaluateTaxonomyCoverage(detected, expected, forbidden);

      expect(report.matchedExpected).toEqual(['PREPOSITION']);
      expect(report.missedExpected).toEqual(['TENSE_ASPECT']);
      expect(report.forbiddenViolations).toHaveLength(0);
      expect(report.recall).toBe(0.5);
    });

    it('falla si se detecta un código taxonómico expresamente prohibido', () => {
      const detected = ['SPELLING'];
      const expected = ['PREPOSITION'];
      const forbidden = ['SPELLING'];

      const report = WritingHeuristicsEvaluator.evaluateTaxonomyCoverage(detected, expected, forbidden);

      expect(report.passed).toBe(false);
      expect(report.forbiddenViolations).toContain('SPELLING');
    });
  });

  describe('verifyTargetWordsEngagement', () => {
    it('valida que las palabras meta solicitadas se corroboren con el feedback', () => {
      const targetWords = ['discipline', 'effort'];
      const draft2 = 'Success requires great discipline and continuous effort.';
      const feedback = [
        { word: 'discipline', used: true, is_natural: true, feedback_es: 'Bien' },
        { word: 'effort', used: true, is_natural: true, feedback_es: 'Bien' },
      ];

      const report = WritingHeuristicsEvaluator.verifyTargetWordsEngagement(targetWords, draft2, feedback);

      expect(report.passed).toBe(true);
      expect(report.correctlyReportedCount).toBe(2);
    });
  });
});
