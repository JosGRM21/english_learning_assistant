import { VocabItem } from '../../../types/vocab';

export type CoverageBand = 'OPTIMAL' | 'ASSISTED' | 'OVERLOAD';

export interface CoverageAnalysisResult {
  totalWords: number;
  properNounsCount: number;
  effectiveWords: number;
  knownWordsCount: number;
  unknownWordsCount: number;
  coverageRatio: number; // 0.0 to 1.0 (e.g. 0.965 = 96.5%)
  coveragePercentage: number; // 0.0 to 100.0%
  band: CoverageBand;
  bandColor: 'green' | 'yellow' | 'red';
  pedagogicalAdviceEs: string;
  unknownTokens: {
    word: string;
    cleanWord: string;
    occurrences: number;
  }[];
}

// 300 Common High-Frequency function words, basic core words and high-utility nouns
const CORE_HIGH_FREQUENCY_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'am', 'are', 'was', 'were', 'been', 'being', 'had', 'has', 'did',
  'does', 'done', 'doing', 'said', 'went', 'gone', 'made', 'took', 'taken', 'came',
  'house', 'home', 'room', 'car', 'city', 'country', 'place', 'water', 'food',
  'friend', 'school', 'hand', 'life', 'world', 'night', 'morning', 'child',
  'children', 'family', 'problem', 'man', 'men', 'woman', 'women', 'thing',
  'big', 'small', 'long', 'great', 'little', 'old', 'young', 'right', 'left',
  'high', 'different', 'same', 'next', 'early', 'last', 'start', 'end', 'open',
  'close', 'read', 'write', 'learn', 'study', 'help', 'feel', 'try', 'leave',
  'call', 'keep', 'let', 'begin', 'seem', 'talk', 'turn', 'show', 'hear', 'play',
  'run', 'move', 'live', 'believe', 'bring', 'happen', 'must', 'write', 'provide',
  'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn',
  'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak',
]);

// Deterministic synonym dictionary for offline text simplification towards 95%+ coverage
const SIMPLIFICATION_DICTIONARY: Record<string, string> = {
  meticulous: 'careful',
  perplexed: 'confused',
  scrutinize: 'examine',
  ubiquitous: 'everywhere',
  arduous: 'difficult',
  commence: 'start',
  terminate: 'end',
  utilize: 'use',
  demonstrate: 'show',
  subsequently: 'then',
  nevertheless: 'however',
  diminutive: 'small',
  mammoth: 'huge',
  abruptly: 'suddenly',
  astonishing: 'surprising',
  comprehend: 'understand',
  apprehensive: 'worried',
  formidable: 'strong',
  reluctant: 'unwilling',
  inquire: 'ask',
  strenuous: 'hard',
  proficient: 'skilled',
  deliberate: 'intentional',
  lucid: 'clear',
  exhilarating: 'exciting',
};

export class LexicalCoverageProfiler {
  /**
   * Analyzes text coverage against a user's known vocabulary catalog.
   * Uses Paul Nation's coverage formula:
   * CR = Known / (Total - ProperNouns)
   */
  public analyzeCoverage(
    text: string,
    knownVocabList: VocabItem[] = [],
  ): CoverageAnalysisResult {
    const rawTokens = text.match(/\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g) || [];
    const totalWords = rawTokens.length;

    if (totalWords === 0) {
      return {
        totalWords: 0,
        properNounsCount: 0,
        effectiveWords: 0,
        knownWordsCount: 0,
        unknownWordsCount: 0,
        coverageRatio: 1.0,
        coveragePercentage: 100.0,
        band: 'OPTIMAL',
        bandColor: 'green',
        pedagogicalAdviceEs: 'Texto vacío.',
        unknownTokens: [],
      };
    }

    // Set of known words from user vocabulary catalog (learned or reviewed)
    const knownSet = new Set<string>();
    knownVocabList.forEach((v) => {
      knownSet.add(v.word.toLowerCase().trim());
      // Common plurals / simple past inflections
      knownSet.add(`${v.word.toLowerCase().trim()}s`);
      knownSet.add(`${v.word.toLowerCase().trim()}ed`);
      knownSet.add(`${v.word.toLowerCase().trim()}ing`);
    });

    let properNounsCount = 0;
    let knownWordsCount = 0;
    const unknownFreqMap = new Map<string, number>();

    for (let i = 0; i < rawTokens.length; i++) {
      const raw = rawTokens[i];
      const lower = raw.toLowerCase();

      // Check if proper noun: starts with uppercase AND is NOT at the beginning of sentence
      const isStartOfSentence =
        i === 0 ||
        /[.!?]\s*$/.test(text.slice(0, Math.max(0, text.indexOf(raw) - 1)));

      const isProperNoun =
        !isStartOfSentence &&
        /^[A-Z][a-z]+$/.test(raw) &&
        !CORE_HIGH_FREQUENCY_WORDS.has(lower);

      if (isProperNoun) {
        properNounsCount++;
        continue;
      }

      // Check if known via core words or user catalog with inflection awareness
      const isKnown = this.isWordKnown(lower, knownSet);

      if (isKnown) {
        knownWordsCount++;
      } else {
        const count = unknownFreqMap.get(lower) || 0;
        unknownFreqMap.set(lower, count + 1);
      }
    }

    const effectiveWords = Math.max(1, totalWords - properNounsCount);
    const coverageRatio = Math.min(1.0, Math.max(0.0, knownWordsCount / effectiveWords));
    const coveragePercentage = Math.round(coverageRatio * 1000) / 10;

    // Nation & Laufer 3-band classification
    let band: CoverageBand = 'OPTIMAL';
    let bandColor: 'green' | 'yellow' | 'red' = 'green';
    let pedagogicalAdviceEs = '';

    if (coveragePercentage >= 98.0) {
      band = 'OPTIMAL';
      bandColor = 'green';
      pedagogicalAdviceEs =
        'Lectura Extensiva Óptima (≥ 98%): Permite inferir significado por contexto y desarrollar fluidez lectora sin fatiga de diccionario.';
    } else if (coveragePercentage >= 95.0) {
      band = 'ASSISTED';
      bandColor = 'yellow';
      pedagogicalAdviceEs =
        'Lectura Asistida (95% - 97.9%): Nivel ideal de desafío productivo (i+1). Se recomienda aprovechar el soporte de glosas interactivas.';
    } else {
      band = 'OVERLOAD';
      bandColor = 'red';
      pedagogicalAdviceEs =
        'Sobrecarga Léxica (< 95%): La densidad de vocabulario desconocido interrumpe la comprensión de la trama. Se aconseja simplificar el texto con IA.';
    }

    const unknownTokens = Array.from(unknownFreqMap.entries())
      .map(([word, occurrences]) => ({
        word,
        cleanWord: word,
        occurrences,
      }))
      .sort((a, b) => b.occurrences - a.occurrences);

    return {
      totalWords,
      properNounsCount,
      effectiveWords,
      knownWordsCount,
      unknownWordsCount: effectiveWords - knownWordsCount,
      coverageRatio,
      coveragePercentage,
      band,
      bandColor,
      pedagogicalAdviceEs,
      unknownTokens,
    };
  }

  private isWordKnown(lower: string, knownSet: Set<string>): boolean {
    if (CORE_HIGH_FREQUENCY_WORDS.has(lower) || knownSet.has(lower)) {
      return true;
    }
    // Simple inflection checks: -s, -ed, -ing
    if (lower.endsWith('s')) {
      const base = lower.slice(0, -1);
      if (CORE_HIGH_FREQUENCY_WORDS.has(base) || knownSet.has(base)) return true;
    }
    if (lower.endsWith('es')) {
      const base = lower.slice(0, -2);
      if (CORE_HIGH_FREQUENCY_WORDS.has(base) || knownSet.has(base)) return true;
    }
    if (lower.endsWith('ed')) {
      const base1 = lower.slice(0, -2);
      const base2 = lower.slice(0, -1);
      if (CORE_HIGH_FREQUENCY_WORDS.has(base1) || knownSet.has(base1)) return true;
      if (CORE_HIGH_FREQUENCY_WORDS.has(base2) || knownSet.has(base2)) return true;
    }
    if (lower.endsWith('ing')) {
      const base1 = lower.slice(0, -3);
      const base2 = base1 + 'e';
      if (CORE_HIGH_FREQUENCY_WORDS.has(base1) || knownSet.has(base1)) return true;
      if (CORE_HIGH_FREQUENCY_WORDS.has(base2) || knownSet.has(base2)) return true;
    }
    return false;
  }

  /**
   * Deterministic simplification of rare vocabulary towards 95%+ coverage threshold.
   */
  public simplifyText(text: string): {
    simplifiedText: string;
    replacedWordsCount: number;
    replacements: { original: string; replacement: string }[];
  } {
    let simplifiedText = text;
    let replacedWordsCount = 0;
    const replacements: { original: string; replacement: string }[] = [];

    for (const [rare, simple] of Object.entries(SIMPLIFICATION_DICTIONARY)) {
      const regex = new RegExp(`\\b${rare}\\b`, 'gi');
      if (regex.test(simplifiedText)) {
        simplifiedText = simplifiedText.replace(regex, (match) => {
          replacedWordsCount++;
          // Preserve capitalization
          const isCapitalized = /^[A-Z]/.test(match);
          const rep = isCapitalized
            ? simple.charAt(0).toUpperCase() + simple.slice(1)
            : simple;
          replacements.push({ original: match, replacement: rep });
          return rep;
        });
      }
    }

    return {
      simplifiedText,
      replacedWordsCount,
      replacements,
    };
  }
}

export const lexicalCoverageProfiler = new LexicalCoverageProfiler();
