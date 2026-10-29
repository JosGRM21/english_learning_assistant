/**
 * Módulo de Heurísticas Estadísticas y Aceptación por Muestreo (Statistical Acceptance Sampling).
 * Implementado conforme a las directivas del Módulo 09 del Vault: Calidad Probabilística, LLM Evals y QA Semántico.
 * 
 * Proporciona:
 * 1. Cálculo de tamaño muestral óptimo con corrección por población finita (FPC).
 * 2. Muestreo estratificado proporcional para representatividad multivariada.
 * 3. Intervalo de Confianza de Wilson (Wilson Score Interval) para proporciones de éxito discretas.
 * 4. Veredicto probabilístico de aceptación de lotes / corpus (SLA Industrial).
 */

export interface WilsonIntervalResult {
  sampleSize: number;
  successCount: number;
  observedProportion: number; // \hat{p} entre 0.0 y 1.0
  confidenceLevel: number; // ej. 0.95 (95%)
  zScore: number; // ej. 1.960
  lowerBound: number; // Límite inferior del IC
  upperBound: number; // Límite superior del IC
  marginOfError: number; // Margen de error efectivo
}

export interface StratificationOptions {
  /**
   * Garantizar una cuota mínima de elementos por estrato no vacío (defecto: 1 si targetSampleSize >= número de estratos).
   * Evita puntos ciegos en subpoblaciones críticas (ej. palabras funcionales, verbos polisémicos).
   */
  minPerStrata?: number;
  /** Semilla pseudoaleatoria para reproducibilidad en pruebas */
  randomSeed?: number;
}

export interface StratumMetric {
  stratumKey: string;
  populationCount: number;
  populationProportion: number;
  sampledCount: number;
  sampledProportion: number;
}

export interface StratifiedSamplingResult<T> {
  sampledItems: T[];
  strataMetrics: StratumMetric[];
  totalPopulation: number;
  sampleSize: number;
}

export type BatchAcceptanceVerdict = 'APPROVED' | 'QUARANTINE' | 'REJECTED';

export interface AcceptanceDecision {
  verdict: BatchAcceptanceVerdict;
  slaThreshold: number; // Umbral exigido (ej. 0.95)
  stats: WilsonIntervalResult;
  rationale: string;
}

export class StatisticalSampling {
  /**
   * Obtiene el valor z de dos colas para niveles de confianza estándar.
   */
  public static getZScore(confidenceLevel: number): number {
    if (confidenceLevel >= 0.99) return 2.576;
    if (confidenceLevel >= 0.98) return 2.326;
    if (confidenceLevel >= 0.95) return 1.960;
    if (confidenceLevel >= 0.90) return 1.645;
    if (confidenceLevel >= 0.80) return 1.282;
    return 1.960; // Por defecto 95%
  }

  /**
   * Calcula el tamaño muestral óptimo utilizando la fórmula de Cochran
   * con Corrección por Población Finita (Finite Population Correction - FPC).
   * 
   * @param populationSize Tamaño total de la población de palabras generadas (N)
   * @param marginOfError Margen de error tolerado (epsilon, defecto: 0.05 = 5%)
   * @param confidenceLevel Nivel de confianza deseado (defecto: 0.95 = 95%)
   * @param estimatedProportion Proporción estimada previa (p, defecto conservador: 0.5)
   */
  public static calculateOptimalSampleSize(
    populationSize: number,
    marginOfError = 0.05,
    confidenceLevel = 0.95,
    estimatedProportion = 0.5,
  ): number {
    if (populationSize <= 1) return Math.max(1, populationSize);

    const z = this.getZScore(confidenceLevel);
    const p = Math.max(0.01, Math.min(0.99, estimatedProportion));
    const e = Math.max(0.01, marginOfError);

    // Tamaño muestral no corregido (población infinita)
    const n0 = (z * z * p * (1 - p)) / (e * e);

    // Corrección por población finita
    const nAdjusted = n0 / (1 + (n0 - 1) / populationSize);

    return Math.min(populationSize, Math.max(1, Math.ceil(nAdjusted)));
  }

  /**
   * Calcula el Intervalo de Confianza de Wilson (Wilson Score Interval)
   * para una proporción observada sobre una muestra binomial.
   * 
   * Recomendado en el Módulo 09 frente a la aproximación normal de Wald,
   * especialmente cuando la tasa de éxito es cercana al 100% (p >= 0.90) o n es moderado.
   * 
   * @param successCount Cantidad de casos aprobados (X)
   * @param totalCount Tamaño total de la muestra evaluada (n)
   * @param confidenceLevel Nivel de confianza (defecto: 0.95)
   */
  public static calculateWilsonScoreInterval(
    successCount: number,
    totalCount: number,
    confidenceLevel = 0.95,
  ): WilsonIntervalResult {
    if (totalCount <= 0) {
      throw new Error('totalCount debe ser estrictamente mayor a 0 para calcular el intervalo de Wilson.');
    }

    const n = totalCount;
    const x = Math.max(0, Math.min(n, successCount));
    const p = x / n;
    const z = this.getZScore(confidenceLevel);
    const zSq = z * z;

    // Centro ajustado del intervalo de Wilson (\tilde{p})
    const denom = 1 + zSq / n;
    const center = (p + zSq / (2 * n)) / denom;

    // Dispersión / Margen de error de Wilson
    const sqrtTerm = Math.sqrt((p * (1 - p)) / n + zSq / (4 * n * n));
    const margin = (z / denom) * sqrtTerm;

    const lowerBound = Math.max(0, center - margin);
    const upperBound = Math.min(1, center + margin);

    return {
      sampleSize: n,
      successCount: x,
      observedProportion: p,
      confidenceLevel,
      zScore: z,
      lowerBound,
      upperBound,
      marginOfError: margin,
    };
  }

  /**
   * Extrae la clave de estratificación multivariada para una ficha de vocabulario.
   * Modos de fallo identificados en LLMs para SLA pedagógico:
   * 1. Dimensión Gramatical: FUNCTION vs CONTENT (crucial para formas débiles schwa)
   * 2. Categoría Gramatical (PoS): VERB, NOUN, ADJECTIVE, ADVERB, PREPOSITION, PRONOUN, CONJUNCTION, DETERMINER, OTHER
   * 3. Nivel de Polisemia: MONOSEMIC (1), MODERATE (2), HIGH_POLYSEMY (>= 3)
   * 4. Rasgo Morfológico / Fonético Crítico: ED_PAST (verbos regulares en pasado), WEAK_FORM (funcionales), STANDARD
   */
  public static extractVocabStratum(item: any): string {
    if (!item) return 'CONTENT:OTHER:MONOSEMIC:STANDARD';

    // 1. Dimensión Gramatical
    const dim = item.grammaticalDimension === 'FUNCTION' ? 'FUNCTION' : 'CONTENT';

    // 2. Part of Speech principal
    let rawPos = String(item.partOfSpeech || item.senses?.[0]?.partOfSpeech || 'OTHER').toUpperCase().trim();
    if (!['VERB', 'NOUN', 'ADJECTIVE', 'ADVERB', 'PREPOSITION', 'PRONOUN', 'CONJUNCTION', 'DETERMINER'].includes(rawPos)) {
      rawPos = 'OTHER';
    }

    // 3. Nivel de polisemia
    let senseCount = 1;
    if (Array.isArray(item.senses) && item.senses.length > 0) {
      senseCount = item.senses.length;
    } else if (item.definitionEn) {
      senseCount = 1;
    }
    const polyTier = senseCount >= 3 ? 'HIGH_POLYSEMY' : senseCount === 2 ? 'MODERATE' : 'MONOSEMIC';

    // 4. Morfología y rasgos fonéticos
    const wordStr = String(item.word || '').toLowerCase();
    const hasEdEnding = item.phoneticEdEnding || item.senses?.some((s: any) => s.phoneticEdEnding);
    const isEdPast = rawPos === 'VERB' && (hasEdEnding || wordStr.endsWith('ed'));

    let morph = 'STANDARD';
    if (isEdPast) {
      morph = 'ED_PAST';
    } else if (dim === 'FUNCTION') {
      morph = 'WEAK_FORM';
    }

    return `${dim}:${rawPos}:${polyTier}:${morph}`;
  }

  /**
   * Extrae una muestra estratificada representativa y genera el reporte detallado de cobertura por estrato.
   * Soporta asignación proporcional, garantía de cuota mínima por estrato (minPerStrata) y desempate por mayor residuo.
   */
  public static stratifiedSampleWithReport<T>(
    items: T[],
    targetSampleSize: number,
    stratifyKeySelector: (item: T) => string,
    options: StratificationOptions = {},
  ): StratifiedSamplingResult<T> {
    const N = items.length;
    if (targetSampleSize >= N) {
      const strataMap = new Map<string, T[]>();
      for (const item of items) {
        const key = stratifyKeySelector(item);
        const list = strataMap.get(key) ?? [];
        list.push(item);
        strataMap.set(key, list);
      }
      const strataMetrics: StratumMetric[] = Array.from(strataMap.entries()).map(([key, list]) => ({
        stratumKey: key,
        populationCount: list.length,
        populationProportion: N > 0 ? list.length / N : 0,
        sampledCount: list.length,
        sampledProportion: N > 0 ? list.length / N : 0,
      }));

      return {
        sampledItems: [...items],
        strataMetrics,
        totalPopulation: N,
        sampleSize: N,
      };
    }

    if (targetSampleSize <= 0) {
      return {
        sampledItems: [],
        strataMetrics: [],
        totalPopulation: N,
        sampleSize: 0,
      };
    }

    // 1. Agrupar por estrato
    const strata = new Map<string, T[]>();
    for (const item of items) {
      const key = stratifyKeySelector(item);
      const list = strata.get(key) ?? [];
      list.push(item);
      strata.set(key, list);
    }

    // Pseudo-random con seed o Math.random
    let seed = options.randomSeed ?? Date.now();
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // Mezclar cada estrato para selección aleatoria interna
    for (const list of strata.values()) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(pseudoRandom() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }

    const strataKeys = Array.from(strata.keys());
    const K = strataKeys.length;
    const sampledMap = new Map<string, T[]>();
    for (const key of strataKeys) {
      sampledMap.set(key, []);
    }

    // Cuota mínima deseada por estrato (si aplica y hay suficiente presupuesto)
    const minQuota = options.minPerStrata && options.minPerStrata > 0 ? options.minPerStrata : 0;
    let allocatedTotal = 0;

    // A) Si minQuota está habilitado y targetSampleSize >= K * minQuota, asegurar base
    if (minQuota > 0 && targetSampleSize >= K * minQuota) {
      for (const [key, list] of strata.entries()) {
        const take = Math.min(list.length, minQuota);
        sampledMap.get(key)!.push(...list.slice(0, take));
        allocatedTotal += take;
      }
    }

    // B) Asignar cupo proporcional para el presupuesto restante
    const budgetRemaining = targetSampleSize - allocatedTotal;
    const remainingToPick: Array<{ key: string; fraction: number; available: T[] }> = [];

    let proportionalAllocated = 0;
    for (const [key, list] of strata.entries()) {
      const alreadySampled = sampledMap.get(key)!.length;
      const available = list.slice(alreadySampled);
      const proportion = list.length / N;
      const idealCount = budgetRemaining * proportion;
      const count = Math.min(available.length, Math.floor(idealCount));
      proportionalAllocated += count;

      sampledMap.get(key)!.push(...available.slice(0, count));
      remainingToPick.push({
        key,
        fraction: idealCount - count,
        available: available.slice(count),
      });
    }

    // C) Desempate por mayor residuo (Hamilton-Hare / Largest Remainder)
    let deficit = budgetRemaining - proportionalAllocated;
    remainingToPick.sort((a, b) => b.fraction - a.fraction);

    for (const entry of remainingToPick) {
      if (deficit <= 0) break;
      if (entry.available.length > 0) {
        sampledMap.get(entry.key)!.push(entry.available.shift()!);
        deficit--;
      }
    }

    // D) Si aún queda déficit (estratos agotados), tomar de cualquier disponible
    if (deficit > 0) {
      for (const entry of remainingToPick) {
        while (entry.available.length > 0 && deficit > 0) {
          sampledMap.get(entry.key)!.push(entry.available.shift()!);
          deficit--;
        }
      }
    }

    // Ensamblar lista final y reporte
    const sampledItems: T[] = [];
    const strataMetrics: StratumMetric[] = [];

    for (const [key, list] of strata.entries()) {
      const sampledList = sampledMap.get(key) ?? [];
      sampledItems.push(...sampledList);
      strataMetrics.push({
        stratumKey: key,
        populationCount: list.length,
        populationProportion: list.length / N,
        sampledCount: sampledList.length,
        sampledProportion: targetSampleSize > 0 ? sampledList.length / targetSampleSize : 0,
      });
    }

    // Ordenar métricas por tamaño de población descendente
    strataMetrics.sort((a, b) => b.populationCount - a.populationCount);

    return {
      sampledItems,
      strataMetrics,
      totalPopulation: N,
      sampleSize: sampledItems.length,
    };
  }

  /**
   * Extrae una muestra estratificada representativa de una lista de elementos
   * garantizando que cada estrato mantenga su proporción respecto a la población global.
   * 
   * @param items Colección completa de elementos
   * @param targetSampleSize Tamaño total de la muestra deseada
   * @param stratifyKeySelector Función para extraer la clave de estrato de cada elemento
   * @param randomSeedOrOptions Semilla opcional o configuración avanzada de estratificación
   */
  public static stratifiedSample<T>(
    items: T[],
    targetSampleSize: number,
    stratifyKeySelector: (item: T) => string,
    randomSeedOrOptions?: number | StratificationOptions,
  ): T[] {
    const opts: StratificationOptions =
      typeof randomSeedOrOptions === 'number'
        ? { randomSeed: randomSeedOrOptions }
        : randomSeedOrOptions ?? {};

    return this.stratifiedSampleWithReport(items, targetSampleSize, stratifyKeySelector, opts).sampledItems;
  }

  /**
   * Emite el dictamen formal de aceptación probabilística de un lote/corpus.
   * Criterio:
   * - APPROVED: El límite inferior del IC de Wilson supera o iguala el umbral SLA (IC_inferior >= slaThreshold).
   * - QUARANTINE: La proporción observada supera el umbral, pero el límite inferior queda por debajo por incertidumbre de muestra.
   * - REJECTED: La proporción observada no alcanza el umbral SLA.
   */
  public static evaluateAcceptance(
    stats: WilsonIntervalResult,
    slaThreshold = 0.95,
  ): AcceptanceDecision {
    const lowerPercent = (stats.lowerBound * 100).toFixed(1);
    const obsPercent = (stats.observedProportion * 100).toFixed(1);
    const slaPercent = (slaThreshold * 100).toFixed(1);
    const confPercent = (stats.confidenceLevel * 100).toFixed(0);

    if (stats.lowerBound >= slaThreshold) {
      return {
        verdict: 'APPROVED',
        slaThreshold,
        stats,
        rationale: `Lote APROBADO: Con un ${confPercent}% de confianza, la calidad estimada mínima del lote es ${lowerPercent}%, superando el SLA del ${slaPercent}% (Observado: ${obsPercent}%).`,
      };
    }

    if (stats.observedProportion >= slaThreshold) {
      return {
        verdict: 'QUARANTINE',
        slaThreshold,
        stats,
        rationale: `Lote EN CUARENTENA: La tasa observada (${obsPercent}%) cumple el SLA (${slaPercent}%), pero el límite inferior del IC (${lowerPercent}%) cae por debajo del umbral debido a la dispersión o tamaño muestral (n=${stats.sampleSize}). Se recomienda ampliar la muestra de auditoría o inspección manual antes de compilar a producción.`,
      };
    }

    return {
      verdict: 'REJECTED',
      slaThreshold,
      stats,
      rationale: `Lote RECHAZADO: La tasa de calidad observada (${obsPercent}%) incumple el SLA exigido (${slaPercent}%). El límite inferior proyectado es ${lowerPercent}%. El lote debe ser regenerado o corregido en prompts.`,
    };
  }
}
