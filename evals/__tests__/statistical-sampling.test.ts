import { describe, it, expect } from 'vitest';
import { StatisticalSampling } from '../heuristics/statistical-sampling';

describe('StatisticalSampling (Módulo 09 Quality Assurance)', () => {
  describe('calculateOptimalSampleSize', () => {
    it('debe calcular tamaño de muestra finito para N=200 con 95% de confianza y 5% de error', () => {
      // Para N=200, p=0.5, e=0.05, z=1.96: n0 ~ 384, con FPC n ~ 132
      const n = StatisticalSampling.calculateOptimalSampleSize(200, 0.05, 0.95, 0.5);
      expect(n).toBeGreaterThan(120);
      expect(n).toBeLessThanOrEqual(200);
    });

    it('debe reducir el tamaño de muestra si se tolera un 10% de margen de error', () => {
      // Para N=200, e=0.10: n ~ 65
      const n = StatisticalSampling.calculateOptimalSampleSize(200, 0.10, 0.95, 0.5);
      expect(n).toBeGreaterThanOrEqual(45);
      expect(n).toBeLessThanOrEqual(75);
    });

    it('debe acotar el tamaño máximo al tamaño de la población N', () => {
      const n = StatisticalSampling.calculateOptimalSampleSize(10, 0.01, 0.99);
      expect(n).toBe(10);
    });
  });

  describe('calculateWilsonScoreInterval', () => {
    it('debe calcular correctamente el intervalo de Wilson para 100% de aciertos (30/30)', () => {
      const result = StatisticalSampling.calculateWilsonScoreInterval(30, 30, 0.95);
      expect(result.observedProportion).toBe(1.0);
      expect(result.sampleSize).toBe(30);
      expect(result.upperBound).toBe(1.0);
      // Para 30/30 al 95%, el límite inferior de Wilson es aprox 0.887 (88.7%)
      expect(result.lowerBound).toBeGreaterThan(0.85);
      expect(result.lowerBound).toBeLessThan(0.95);
    });

    it('debe calcular el intervalo para 95 aciertos de 100 (95/100)', () => {
      const result = StatisticalSampling.calculateWilsonScoreInterval(95, 100, 0.95);
      expect(result.observedProportion).toBe(0.95);
      // Para 95/100, el límite inferior es aprox 0.887 y superior 0.981
      expect(result.lowerBound).toBeGreaterThan(0.88);
      expect(result.upperBound).toBeLessThan(0.99);
    });

    it('debe lanzar error si totalCount <= 0', () => {
      expect(() => StatisticalSampling.calculateWilsonScoreInterval(0, 0)).toThrow();
    });
  });

  describe('stratifiedSample', () => {
    interface DummyItem {
      id: string;
      category: 'CONTENT' | 'FUNCTION';
    }

    it('debe mantener las proporciones relativas de los estratos en la muestra', () => {
      const items: DummyItem[] = [
        ...Array.from({ length: 80 }, (_, i) => ({ id: `c_${i}`, category: 'CONTENT' as const })),
        ...Array.from({ length: 20 }, (_, i) => ({ id: `f_${i}`, category: 'FUNCTION' as const })),
      ];

      // Muestra de 10 elementos (debería ser 8 CONTENT y 2 FUNCTION)
      const sampled = StatisticalSampling.stratifiedSample(items, 10, (item) => item.category, 42);
      expect(sampled).toHaveLength(10);

      const contentCount = sampled.filter((i) => i.category === 'CONTENT').length;
      const functionCount = sampled.filter((i) => i.category === 'FUNCTION').length;

      expect(contentCount).toBe(8);
      expect(functionCount).toBe(2);
    });

    it('debe retornar todos los elementos si sampleSize >= items.length', () => {
      const items: DummyItem[] = [
        { id: '1', category: 'CONTENT' },
        { id: '2', category: 'FUNCTION' },
      ];
      const sampled = StatisticalSampling.stratifiedSample(items, 5, (item) => item.category);
      expect(sampled).toHaveLength(2);
    });

    it('debe garantizar representación mínima por estrato con minPerStrata: 1 en estratos raros', () => {
      // 95 sustantivos y 5 funcionales
      const items: Array<{ id: string; type: string }> = [
        ...Array.from({ length: 95 }, (_, i) => ({ id: `noun_${i}`, type: 'NOUN' })),
        ...Array.from({ length: 5 }, (_, i) => ({ id: `func_${i}`, type: 'FUNCTION' })),
      ];

      // Muestra pequeña n=10: proporcionalmente FUNCTION tendría 0.5 -> con Math.floor daría 0 sin minPerStrata
      const result = StatisticalSampling.stratifiedSampleWithReport(
        items,
        10,
        (i) => i.type,
        { minPerStrata: 1, randomSeed: 123 },
      );

      expect(result.sampledItems).toHaveLength(10);
      const funcSampled = result.sampledItems.filter((i) => i.type === 'FUNCTION');
      expect(funcSampled.length).toBeGreaterThanOrEqual(1);

      const nounMetric = result.strataMetrics.find((m) => m.stratumKey === 'NOUN');
      const funcMetric = result.strataMetrics.find((m) => m.stratumKey === 'FUNCTION');
      expect(nounMetric?.populationCount).toBe(95);
      expect(funcMetric?.populationCount).toBe(5);
      expect(funcMetric?.sampledCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('extractVocabStratum (Estratificación Multivariada SLA)', () => {
    it('debe extraer correctamente la clave cuádruple para verbos polisémicos regulares en pasado', () => {
      const item = {
        word: 'played',
        grammaticalDimension: 'CONTENT',
        partOfSpeech: 'VERB',
        phoneticEdEnding: '/d/',
        senses: [{ senseId: 's1' }, { senseId: 's2' }, { senseId: 's3' }],
      };

      const key = StatisticalSampling.extractVocabStratum(item);
      expect(key).toBe('CONTENT:VERB:HIGH_POLYSEMY:ED_PAST');
    });

    it('debe clasificar palabras funcionales con rasgo WEAK_FORM', () => {
      const item = {
        word: 'at',
        grammaticalDimension: 'FUNCTION',
        partOfSpeech: 'PREPOSITION',
        senses: [{ senseId: 's1' }],
      };

      const key = StatisticalSampling.extractVocabStratum(item);
      expect(key).toBe('FUNCTION:PREPOSITION:MONOSEMIC:WEAK_FORM');
    });

    it('debe clasificar sustantivos monosémicos estándar', () => {
      const item = {
        word: 'apple',
        grammaticalDimension: 'CONTENT',
        partOfSpeech: 'NOUN',
        senses: [{ senseId: 's1' }],
      };

      const key = StatisticalSampling.extractVocabStratum(item);
      expect(key).toBe('CONTENT:NOUN:MONOSEMIC:STANDARD');
    });
  });

  describe('evaluateAcceptance', () => {
    it('debe aprobar si el límite inferior supera o iguala el SLA (95%)', () => {
      const stats = {
        sampleSize: 100,
        successCount: 100,
        observedProportion: 1.0,
        confidenceLevel: 0.95,
        zScore: 1.96,
        lowerBound: 0.963,
        upperBound: 1.0,
        marginOfError: 0.037,
      };

      const decision = StatisticalSampling.evaluateAcceptance(stats, 0.95);
      expect(decision.verdict).toBe('APPROVED');
    });

    it('debe poner en cuarentena si la proporción observada cumple pero el límite inferior cae por incertidumbre', () => {
      const stats = {
        sampleSize: 20,
        successCount: 19,
        observedProportion: 0.95,
        confidenceLevel: 0.95,
        zScore: 1.96,
        lowerBound: 0.764,
        upperBound: 0.991,
        marginOfError: 0.113,
      };

      const decision = StatisticalSampling.evaluateAcceptance(stats, 0.95);
      expect(decision.verdict).toBe('QUARANTINE');
      expect(decision.rationale).toContain('CUARENTENA');
    });

    it('debe rechazar si la proporción observada es inferior al SLA', () => {
      const stats = {
        sampleSize: 50,
        successCount: 42,
        observedProportion: 0.84,
        confidenceLevel: 0.95,
        zScore: 1.96,
        lowerBound: 0.715,
        upperBound: 0.916,
        marginOfError: 0.10,
      };

      const decision = StatisticalSampling.evaluateAcceptance(stats, 0.95);
      expect(decision.verdict).toBe('REJECTED');
    });
  });
});
