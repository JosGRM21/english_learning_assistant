/**
 * Utilidades de Capa 2 para cálculo de métricas de solapamiento léxico (ROUGE / n-gramas)
 * y distancia de edición de Levenshtein normalizada.
 * Latencia: 10-50 ms | Coste: $0.00
 */

export interface NGramScores {
  precision: number;
  recall: number;
  f1: number;
}

export class LexicalOverlapCalculator {
  /**
   * Tokeniza un texto en palabras en minúsculas ignorando puntuación simple.
   */
  public static tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Extrae n-gramas contiguos de un array de tokens.
   */
  public static getNGrams(tokens: string[], n: number): Map<string, number> {
    const counts = new Map<string, number>();
    if (tokens.length < n) return counts;

    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      counts.set(gram, (counts.get(gram) || 0) + 1);
    }
    return counts;
  }

  /**
   * Calcula precisión, recall y F1 de solapamiento de n-gramas (ROUGE-N).
   */
  public static computeRougeN(candidate: string, reference: string, n = 1): NGramScores {
    const candTokens = this.tokenize(candidate);
    const refTokens = this.tokenize(reference);

    if (candTokens.length === 0 || refTokens.length === 0) {
      const bothEmpty = candTokens.length === 0 && refTokens.length === 0;
      return {
        precision: bothEmpty ? 1.0 : 0.0,
        recall: bothEmpty ? 1.0 : 0.0,
        f1: bothEmpty ? 1.0 : 0.0,
      };
    }

    const candGrams = this.getNGrams(candTokens, n);
    const refGrams = this.getNGrams(refTokens, n);

    let overlap = 0;
    for (const [gram, refCount] of refGrams.entries()) {
      const candCount = candGrams.get(gram) || 0;
      overlap += Math.min(refCount, candCount);
    }

    const totalCandGrams = Math.max(candTokens.length - n + 1, 1);
    const totalRefGrams = Math.max(refTokens.length - n + 1, 1);

    const precision = overlap / totalCandGrams;
    const recall = overlap / totalRefGrams;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { precision, recall, f1 };
  }

  /**
   * Calcula la subsecuencia común más larga (LCS) para ROUGE-L.
   */
  public static computeLcs(a: string[], b: string[]): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Calcula ROUGE-L basado en subsecuencia común más larga.
   */
  public static computeRougeL(candidate: string, reference: string): NGramScores {
    const candTokens = this.tokenize(candidate);
    const refTokens = this.tokenize(reference);

    if (candTokens.length === 0 || refTokens.length === 0) {
      const bothEmpty = candTokens.length === 0 && refTokens.length === 0;
      return {
        precision: bothEmpty ? 1.0 : 0.0,
        recall: bothEmpty ? 1.0 : 0.0,
        f1: bothEmpty ? 1.0 : 0.0,
      };
    }

    const lcs = this.computeLcs(candTokens, refTokens);
    const precision = lcs / candTokens.length;
    const recall = lcs / refTokens.length;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return { precision, recall, f1 };
  }

  /**
   * Calcula la distancia de edición de Levenshtein entre dos cadenas.
   */
  public static levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // eliminación
          dp[i][j - 1] + 1, // inserción
          dp[i - 1][j - 1] + cost, // sustitución
        );
      }
    }
    return dp[m][n];
  }

  /**
   * Similitud de Levenshtein normalizada en rango [0, 1].
   * 1.0 = cadenas idénticas, 0.0 = discrepancia total.
   */
  public static normalizedLevenshteinSimilarity(s1: string, s2: string): number {
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    const dist = this.levenshteinDistance(s1, s2);
    return 1.0 - dist / maxLen;
  }
}
