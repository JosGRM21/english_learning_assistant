export type BottomUpStep = 1 | 2 | 3;

export interface ConnectedSpeechMarker {
  type: 'LINKING' | 'ELISION' | 'SCHWA_WEAK';
  colorCode: 'blue' | 'red' | 'green';
  labelEs: string;
  startIndex: number;
  endIndex: number;
  wordA: string;
  wordB?: string;
  explanationEs: string;
}

export interface BottomUpWordToken {
  originalWord: string;
  cleanWord: string;
  isContentWord: boolean; // Tonic word (noun, main verb, adjective, etc.)
  isMaskedInStep2: boolean;
  phenomenon?: ConnectedSpeechMarker;
}

export interface BottomUpSentenceState {
  rawSentence: string;
  step: BottomUpStep;
  stepName: string;
  tokens: BottomUpWordToken[];
  renderedDisplay: string;
  phenomena: ConnectedSpeechMarker[];
}

const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'into', 'through', 'over', 'after', 'he', 'him',
  'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'we',
  'us', 'our', 'you', 'your', 'i', 'me', 'my', 'and', 'but', 'or',
  'so', 'if', 'that', 'this', 'these', 'those', 'is', 'am', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'than', 'then',
]);

const VOWEL_SOUNDS = new Set(['a', 'e', 'i', 'o', 'u']);

export class BottomUpListeningEngine {
  /**
   * Generates decoding representations for John Field's 3-step bottom-up pipeline.
   */
  public generateSentenceState(
    sentence: string,
    step: BottomUpStep,
  ): BottomUpSentenceState {
    const rawTokens = sentence.split(/\s+/).filter(Boolean);
    const phenomena = this.detectConnectedSpeechPhenomena(sentence);

    const tokens: BottomUpWordToken[] = rawTokens.map((raw, idx) => {
      const clean = raw.replace(/[^\w]/g, '').toLowerCase();
      const isFunction = FUNCTION_WORDS.has(clean);
      const isContentWord = !isFunction && clean.length > 0;

      // Find if this token has any connected speech marker
      const phenomenon = phenomena.find(
        (p) => p.startIndex === idx || p.endIndex === idx,
      );

      return {
        originalWord: raw,
        cleanWord: clean,
        isContentWord,
        isMaskedInStep2: isFunction,
        phenomenon,
      };
    });

    let renderedDisplay = '';
    let stepName = '';

    switch (step) {
      case 1:
        stepName = 'Paso 1: Audio Ciego (Sin Soporte Ortográfico)';
        renderedDisplay = '••••••••••••••••••••••••••••••••••••••••';
        break;
      case 2:
        stepName = 'Paso 2: Esqueleto Tónico (Solo Palabras de Contenido)';
        renderedDisplay = tokens
          .map((t) => {
            const punctMatch = t.originalWord.match(/[.,!?;:]+$/);
            const punct = punctMatch ? punctMatch[0] : '';
            if (t.isMaskedInStep2) {
              return '___' + punct;
            }
            return t.originalWord;
          })
          .join(' ');
        break;
      case 3:
        stepName = 'Paso 3: Texto Conectado Completo (Ruta Léxica Directa)';
        renderedDisplay = sentence;
        break;
    }

    return {
      rawSentence: sentence,
      step,
      stepName,
      tokens,
      renderedDisplay,
      phenomena,
    };
  }

  /**
   * Scans sentence for phonetic liaison/linking, elision, and weak schwa reductions.
   */
  public detectConnectedSpeechPhenomena(sentence: string): ConnectedSpeechMarker[] {
    const markers: ConnectedSpeechMarker[] = [];
    const words = sentence.split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const currentWordClean = words[i].replace(/[^\w]/g, '').toLowerCase();
      const nextWordClean = words[i + 1]?.replace(/[^\w]/g, '').toLowerCase();

      // 1. Schwa weak form reduction (Verde)
      if (['to', 'for', 'can', 'of', 'at', 'that'].includes(currentWordClean)) {
        markers.push({
          type: 'SCHWA_WEAK',
          colorCode: 'green',
          labelEs: 'Forma Débil con Schwa (/ə/)',
          startIndex: i,
          endIndex: i,
          wordA: currentWordClean,
          explanationEs: `La vocal de "${words[i]}" se reduce al sonido neutro Schwa (/ə/) en habla fluida conectada.`,
        });
      }

      if (!nextWordClean) continue;

      const lastCharCurrent = currentWordClean.slice(-1);
      const firstCharNext = nextWordClean.charAt(0);

      // 2. Linking / Liaison (Azul): Consonant to Vowel
      const isConsonantLast = !VOWEL_SOUNDS.has(lastCharCurrent);
      const isVowelFirst = VOWEL_SOUNDS.has(firstCharNext);

      if (isConsonantLast && isVowelFirst && lastCharCurrent !== 'r') {
        markers.push({
          type: 'LINKING',
          colorCode: 'blue',
          labelEs: 'Enlace Consonante-Vocal (Linking)',
          startIndex: i,
          endIndex: i + 1,
          wordA: currentWordClean,
          wordB: nextWordClean,
          explanationEs: `La consonante final de "${words[i]}" se enlaza directamente con la vocal de "${words[i + 1]}", sonando como una sola palabra.`,
        });
      }

      // 3. Elision / Deletion (Rojo): /t/ or /d/ elided before another consonant
      if (
        (lastCharCurrent === 't' || lastCharCurrent === 'd') &&
        !VOWEL_SOUNDS.has(firstCharNext)
      ) {
        markers.push({
          type: 'ELISION',
          colorCode: 'red',
          labelEs: 'Elisión de Consonante (/t, d/)',
          startIndex: i,
          endIndex: i + 1,
          wordA: currentWordClean,
          wordB: nextWordClean,
          explanationEs: `La oclusiva final "${lastCharCurrent}" de "${words[i]}" suele elidirse o desaparecer ante la consonante de "${words[i + 1]}".`,
        });
      }
    }

    return markers;
  }
}

export const bottomUpListeningEngine = new BottomUpListeningEngine();
