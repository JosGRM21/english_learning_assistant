export interface SilentLetterAnnotation {
  original: string;
  silentIndices: number[];
  category: string;
  phoneticNote: string;
}

export const SILENT_LETTER_PATTERNS: Array<{
  category: string;
  regex: RegExp;
  getSilentIndices: (match: RegExpExecArray) => number[];
  note: string;
}> = [
  // Silent K before N (know, knife, knee, knight, knock)
  {
    category: 'SILENT_K',
    regex: /\b(k)(n[aeiouy])/gi,
    getSilentIndices: (m) => [m.index],
    note: 'La "k" es muda antes de "n" al inicio de sílaba.',
  },
  // Silent W before R (write, wrong, wrist)
  {
    category: 'SILENT_W',
    regex: /\b(w)(r)/gi,
    getSilentIndices: (m) => [m.index],
    note: 'La "w" es muda antes de "r".',
  },
  // Silent B after M or before T (debt, doubt, subtle, comb, thumb, climb)
  {
    category: 'SILENT_B',
    regex: /(m)(b)\b|([aeiou])(b)(t)/gi,
    getSilentIndices: (m) => {
      // either 'mb' (b is at index+1) or 'bt' (b is at index+1)
      return [m.index + (m[1] ? 1 : 1)];
    },
    note: 'La "b" es muda tras "m" al final de palabra o antes de "t".',
  },
  // Silent L in common words (walk, talk, half, calm, salmon, could, would, should)
  {
    category: 'SILENT_L',
    regex: /\b(ca|ha|wa|ta|cou|wou|shou)(l)(k|f|m|d)\b/gi,
    getSilentIndices: (m) => [m.index + m[1].length],
    note: 'La "l" es muda en combinaciones históricas como -alk, -alf, -alm, y auxiliares modales.',
  },
  // Silent T in -sten, -stle (listen, castle, fasten, whistle, Christmas)
  {
    category: 'SILENT_T',
    regex: /(lis|cas|fas|whis|chris)(t)(en|le|mas)/gi,
    getSilentIndices: (m) => [m.index + m[1].length],
    note: 'La "t" es muda en sufijos como -sten y -stle.',
  },
  // Silent G in sign, foreign, align
  {
    category: 'SILENT_G',
    regex: /(si|forei|ali|desi)(g)(n)/gi,
    getSilentIndices: (m) => [m.index + m[1].length],
    note: 'La "g" es muda antes de "n" en terminaciones -ign.',
  },
  // Silent P before S/N (psychology, pneumonia, receipt, cupboard)
  {
    category: 'SILENT_P',
    regex: /\b(p)(sych|neumo)|(recei|cup)(p)(t|board)/gi,
    getSilentIndices: (m) => {
      if (m[1]) return [m.index];
      return [m.index + (m[3] ? m[3].length : 0)];
    },
    note: 'La "p" inicial es muda antes de "s" o "n" en cultismos griegos, y en vocablos como receipt.',
  },
  // Silent H (hour, honest, honor, ghost, rhythm)
  {
    category: 'SILENT_H',
    regex: /\b(h)(our|onest|onor)|(g)(h)(ost)|(r)(h)(ythm)/gi,
    getSilentIndices: (m) => {
      if (m[1]) return [m.index];
      if (m[4]) return [m.index + 1];
      if (m[6]) return [m.index + 1];
      return [m.index];
    },
    note: 'La "h" no se aspira en palabras de origen romance (hour, honest) ni en grupos consonánticos como gh- o rh-.',
  },
];

export class SilentLettersMuter {
  public static analyzeWord(word: string): SilentLetterAnnotation | null {
    const silentIndicesSet = new Set<number>();
    let matchedCategory = '';
    let matchedNote = '';

    for (const pattern of SILENT_LETTER_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(word)) !== null) {
        const indices = pattern.getSilentIndices(match);
        indices.forEach((i) => silentIndicesSet.add(i));
        matchedCategory = pattern.category;
        matchedNote = pattern.note;
      }
    }

    if (silentIndicesSet.size === 0) return null;

    return {
      original: word,
      silentIndices: Array.from(silentIndicesSet).sort((a, b) => a - b),
      category: matchedCategory,
      phoneticNote: matchedNote,
    };
  }

  public static renderHtmlMuted(word: string): string {
    const analysis = this.analyzeWord(word);
    if (!analysis) return word;

    const chars = word.split('');
    return chars
      .map((char, index) => {
        if (analysis.silentIndices.includes(index)) {
          return `<span class="silent-letter text-muted-foreground/40 line-through select-none" title="Silent letter: ${char}">${char}</span>`;
        }
        return char;
      })
      .join('');
  }
}
