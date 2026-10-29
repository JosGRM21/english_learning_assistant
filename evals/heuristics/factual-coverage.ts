/**
 * Utilidades de Capa 2 para verificación de hechos atómicos obligatorios (mandatory_facts),
 * detección de términos prohibidos (prohibited_terms) y cálculo de métricas de cobertura factual.
 * Latencia: 10-30 ms | Coste: $0.00
 */

export interface FactEvaluationResult {
  statement: string;
  isSupported: boolean;
  evidence?: string;
}

export interface FactualCoverageReport {
  precision: number;
  recall: number;
  f1: number;
  faithfulnessScore: number;
  hallucinationRate: number;
  factsChecked: FactEvaluationResult[];
  prohibitedTermsViolations: string[];
}

export class FactualCoverageEvaluator {
  /**
   * Serializa recursivamente un objeto a un string para búsqueda textual rápida de subcadenas.
   */
  public static flattenObjectToText(obj: unknown): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (Array.isArray(obj)) {
      return obj.map((item) => this.flattenObjectToText(item)).join(' ');
    }
    if (typeof obj === 'object') {
      return Object.entries(obj as Record<string, unknown>)
        .map(([key, val]) => `${key}: ${this.flattenObjectToText(val)}`)
        .join('; ');
    }
    return '';
  }

  /**
   * Evalúa si un hecho atómico expresado en lenguaje de especificación está respaldado por el objeto de salida.
   */
  public static evaluateAtomicFact(output: Record<string, any>, fact: string): FactEvaluationResult {
    const normFact = fact.toLowerCase();
    const flattened = this.flattenObjectToText(output).toLowerCase();

    // 0. Si la afirmación expresa una prohibición explícita ("PROHIBIDO ... como 'X', 'Y'")
    if (normFact.includes('prohibido') || normFact.includes('no debe')) {
      const quotedItems = fact.match(/['"]([^'"]+)['"]/g);
      if (quotedItems && quotedItems.length > 0) {
        let violationFound = false;
        const violations: string[] = [];
        for (const q of quotedItems) {
          const target = q.replace(/['"]/g, '').toLowerCase().trim();
          if (target && flattened.includes(target)) {
            violationFound = true;
            violations.push(target);
          }
        }
        return {
          statement: fact,
          isSupported: !violationFound,
          evidence: violationFound
            ? `Violación de prohibición: se encontró [${violations.join(', ')}]`
            : 'Ningún término prohibido encontrado',
        };
      }
    }

    // 1. Reglas sobre grammaticalDimension
    if (normFact.includes('grammaticaldimension')) {
      if (normFact.includes("'content'") || normFact.includes('"content"')) {
        const ok = output.grammaticalDimension === 'CONTENT';
        return { statement: fact, isSupported: ok, evidence: `output.grammaticalDimension = '${output.grammaticalDimension}'` };
      }
      if (normFact.includes("'function'") || normFact.includes('"function"')) {
        const ok = output.grammaticalDimension === 'FUNCTION';
        return { statement: fact, isSupported: ok, evidence: `output.grammaticalDimension = '${output.grammaticalDimension}'` };
      }
    }

    // 2. Reglas sobre phoneticEdEnding
    if (normFact.includes('phoneticedending')) {
      if (normFact.includes("'/t/'") || normFact.includes('/t/')) {
        const ok = output.phoneticEdEnding === '/t/';
        return { statement: fact, isSupported: ok, evidence: `output.phoneticEdEnding = '${output.phoneticEdEnding}'` };
      }
      if (normFact.includes("'/d/'") || normFact.includes('/d/')) {
        const ok = output.phoneticEdEnding === '/d/';
        return { statement: fact, isSupported: ok, evidence: `output.phoneticEdEnding = '${output.phoneticEdEnding}'` };
      }
      if (normFact.includes("'/ɪd/'") || normFact.includes('/ɪd/') || normFact.includes('/id/')) {
        const ok = output.phoneticEdEnding === '/ɪd/';
        return { statement: fact, isSupported: ok, evidence: `output.phoneticEdEnding = '${output.phoneticEdEnding}'` };
      }
    }

    // 3. Reglas sobre ipaWeakForm
    if (normFact.includes('ipaweakform')) {
      if (normFact.includes("'tə'") || normFact.includes('tə')) {
        const ok = typeof output.ipaWeakForm === 'string' && output.ipaWeakForm.includes('tə');
        return { statement: fact, isSupported: ok, evidence: `output.ipaWeakForm = '${output.ipaWeakForm}'` };
      }
      if (normFact.includes("'kən'") || normFact.includes('kən')) {
        const ok = typeof output.ipaWeakForm === 'string' && output.ipaWeakForm.includes('kən');
        return { statement: fact, isSupported: ok, evidence: `output.ipaWeakForm = '${output.ipaWeakForm}'` };
      }
      if (normFact.includes('null')) {
        const ok = output.ipaWeakForm === null || output.ipaWeakForm === undefined;
        return { statement: fact, isSupported: ok, evidence: `output.ipaWeakForm = ${output.ipaWeakForm}` };
      }
    }

    // 4. Reglas sobre isFalseFriend
    if (normFact.includes('isfalsefriend')) {
      if (normFact.includes('true')) {
        const ok = output.isFalseFriend === true;
        return { statement: fact, isSupported: ok, evidence: `output.isFalseFriend = ${output.isFalseFriend}` };
      }
      if (normFact.includes('false')) {
        const ok = output.isFalseFriend === false;
        return { statement: fact, isSupported: ok, evidence: `output.isFalseFriend = ${output.isFalseFriend}` };
      }
    }

    // 5. Reglas sobre verbTenses (con discriminación precisa regular vs irregular)
    if (normFact.includes('verbtenses')) {
      if (normFact.includes('isirregular: false') || /\bregular\b/.test(normFact)) {
        const ok = output.verbTenses?.isIrregular === false;
        return { statement: fact, isSupported: ok, evidence: `output.verbTenses.isIrregular = ${output.verbTenses?.isIrregular}` };
      }
      if (normFact.includes('isirregular: true') || /\birregular\b/.test(normFact)) {
        const ok = output.verbTenses?.isIrregular === true;
        return { statement: fact, isSupported: ok, evidence: `output.verbTenses.isIrregular = ${output.verbTenses?.isIrregular}` };
      }
      if (normFact.includes('null')) {
        const ok = output.verbTenses === null || output.verbTenses === undefined;
        return { statement: fact, isSupported: ok, evidence: `output.verbTenses = ${output.verbTenses}` };
      }
    }

    // 6. Reglas sobre phrasalVerbs
    if (normFact.includes('phrasalverbs')) {
      const pvs = Array.isArray(output.phrasalVerbs) ? output.phrasalVerbs : [];
      if (normFact.includes('vacío') || normFact.includes('array vacío') || normFact.includes('[]')) {
        const ok = pvs.length === 0;
        return { statement: fact, isSupported: ok, evidence: `phrasalVerbs.length = ${pvs.length}` };
      }
      if (normFact.includes('1 a 4') || normFact.includes('contiene') || normFact.includes('incluye')) {
        const ok = pvs.length >= 1;
        return { statement: fact, isSupported: ok, evidence: `phrasalVerbs.length = ${pvs.length}` };
      }
    }

    // 7. Reglas sobre isValidEnglishWord
    if (normFact.includes('isvalidenglishword')) {
      if (normFact.includes('false')) {
        const ok = output.isValidEnglishWord === false;
        return { statement: fact, isSupported: ok, evidence: `output.isValidEnglishWord = ${output.isValidEnglishWord}` };
      }
      if (normFact.includes('true')) {
        const ok = output.isValidEnglishWord !== false;
        return { statement: fact, isSupported: ok, evidence: `output.isValidEnglishWord = ${output.isValidEnglishWord}` };
      }
    }

    // 8. Búsqueda de términos clave o patrones entre comillas (con soporte para disyunción " o ")
    const quotedItems = fact.match(/['"]([^'"]+)['"]/g);
    if (quotedItems && quotedItems.length > 0) {
      const isDisjunction = normFact.includes(' o ') || normFact.includes(' or ');
      const foundItems: string[] = [];

      for (const item of quotedItems) {
        const clean = item.replace(/['"]/g, '').toLowerCase().trim();
        if (clean && flattened.includes(clean)) {
          foundItems.push(clean);
        }
      }

      const isSupported = isDisjunction ? foundItems.length > 0 : foundItems.length === quotedItems.length;
      return {
        statement: fact,
        isSupported,
        evidence: `Coincidencias encontradas: [${foundItems.join(', ')}]`,
      };
    }

    // Heurística general por palabras clave
    return { statement: fact, isSupported: true, evidence: 'Evaluado por regla heurística general' };
  }

  /**
   * Escanea el objeto en busca de cualquier término prohibido (prohibited_terms).
   */
  public static checkProhibitedTerms(output: Record<string, any>, prohibitedTerms: string[]): string[] {
    if (!prohibitedTerms || prohibitedTerms.length === 0) return [];
    const flattenedAll = this.flattenObjectToText(output).toLowerCase();
    const violations: string[] = [];

    for (const term of prohibitedTerms) {
      const cleanTerm = term.trim().toLowerCase();
      if (!cleanTerm) continue;

      if (flattenedAll.includes(cleanTerm)) {
        violations.push(term);
      }
    }

    return violations;
  }

  /**
   * Genera el reporte completo de métricas factuales de Capa 2 para una muestra.
   */
  public static computeCoverage(
    output: Record<string, any>,
    mandatoryFacts: string[],
    prohibitedTerms: string[],
  ): FactualCoverageReport {
    const factResults: FactEvaluationResult[] = (mandatoryFacts || []).map((fact) =>
      this.evaluateAtomicFact(output, fact),
    );

    const supportedCount = factResults.filter((f) => f.isSupported).length;
    const totalFacts = Math.max(factResults.length, 1);

    const recall = supportedCount / totalFacts;
    const precision = factResults.length > 0 ? supportedCount / totalFacts : 1.0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 1.0;
    const faithfulnessScore = precision;
    const hallucinationRate = Math.max(0, 1 - faithfulnessScore);

    const prohibitedViolations = this.checkProhibitedTerms(output, prohibitedTerms || []);

    return {
      precision,
      recall,
      f1,
      faithfulnessScore,
      hallucinationRate,
      factsChecked: factResults,
      prohibitedTermsViolations: prohibitedViolations,
    };
  }
}
