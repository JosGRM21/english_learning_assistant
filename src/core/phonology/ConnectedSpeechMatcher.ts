import { ConnectedSpeechAnalysis, PhoneticBoundary } from '../types/phonology';

export class ConnectedSpeechMatcher {
  private readonly vowels = new Set(['a', 'e', 'i', 'o', 'u']);

  // Words that end in front close vowels (/iː/, /ɪ/, /eɪ/, /aɪ/, /ɔɪ/)
  private readonly jGlideWords = new Set([
    'i', 'we', 'see', 'be', 'me', 'he', 'she', 'they', 'my', 'by', 'the',
    'say', 'day', 'pay', 'stay', 'try', 'why', 'buy', 'enjoy', 'boy', 'toy',
  ]);

  // Words that end in back rounded vowels (/uː/, /oʊ/, /aʊ/)
  private readonly wGlideWords = new Set([
    'go', 'do', 'to', 'you', 'so', 'no', 'two', 'who', 'how', 'now', 'too',
    'through', 'into', 'onto', 'show', 'know', 'grow', 'slow',
  ]);

  // Words ending in plosive clusters susceptible to elision before consonants
  private readonly elisionClusterWords = new Set([
    'next', 'last', 'best', 'first', 'just', 'must', 'fast', 'past', 'most',
    'almost', 'east', 'west', 'hold', 'cold', 'old', 'told', 'hard', 'stand',
  ]);

  // Common weak form words
  private readonly weakFormWords: Record<string, { ipaWeak: string; desc: string }> = {
    to: { ipaWeak: 'tə', desc: 'Reducción de /tuː/ a la forma débil neutra /tə/.' },
    for: { ipaWeak: 'fər', desc: 'Reducción de /fɔːr/ a /fər/ con vocal neutra Schwa.' },
    from: { ipaWeak: 'frəm', desc: 'Reducción de /frɑːm/ a /frəm/.' },
    at: { ipaWeak: 'ət', desc: 'Reducción de /æt/ a /ət/.' },
    and: { ipaWeak: 'ənd', desc: 'Reducción de /ænd/ a /ən/ o /ənd/.' },
    can: { ipaWeak: 'kən', desc: 'Reducción del modal a /kən/ en oraciones afirmativas.' },
    was: { ipaWeak: 'wəz', desc: 'Reducción del auxiliar a /wəz/.' },
  };

  /**
   * Analyzes an English sentence to identify connected speech phenomena.
   */
  public analyze(sentence: string): ConnectedSpeechAnalysis {
    const clean = sentence.trim();
    if (!clean) {
      return { originalSentence: '', ipaConnected: '', boundaries: [] };
    }

    // Tokenize into words while tracking character boundaries
    const wordMatches = Array.from(clean.matchAll(/\b[a-zA-Z']+\b/g));
    const tokens = wordMatches.map((m) => ({
      text: m[0],
      lower: m[0].toLowerCase(),
      index: m.index ?? 0,
      length: m[0].length,
    }));

    const boundaries: PhoneticBoundary[] = [];

    // Analyze adjacent word boundaries
    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i];
      const next = tokens[i + 1];

      const curLastChar = current.lower[current.lower.length - 1];
      const nextFirstChar = next.lower[0];
      const isNextVowel = this.vowels.has(nextFirstChar);
      const isCurrentConsonant = !this.vowels.has(curLastChar);

      const span: [number, number] = [current.index, next.index + next.length];

      // 1. Coalescent Assimilation (/t/ or /d/ + 'you' / 'your')
      if (
        (current.lower.endsWith('t') || current.lower.endsWith('d')) &&
        (next.lower === 'you' || next.lower === 'your')
      ) {
        const isD = current.lower.endsWith('d');
        boundaries.push({
          word1: current.text,
          word2: next.text,
          boundaryType: 'ASSIMILATION_COALESCENT',
          ruleName: 'Asimilación Coalescente (Yod Coalescence)',
          descriptionEs: isD
            ? `La /d/ final de "${current.text}" se fusiona con la /j/ de "${next.text}" produciendo la africada /dʒ/.`
            : `La /t/ final de "${current.text}" se fusiona con la /j/ de "${next.text}" produciendo la africada /tʃ/.`,
          ipaTransformed: isD ? `[${current.text.slice(0, -1)}·dʒuː]` : `[${current.text.slice(0, -1)}·tʃuː]`,
          span,
        });
        continue;
      }

      // 2. Alveolar Plosive Elision (/t/ or /d/ dropped before a consonant)
      if (this.elisionClusterWords.has(current.lower) && !isNextVowel) {
        boundaries.push({
          word1: current.text,
          word2: next.text,
          boundaryType: 'ELISION_T_D',
          ruleName: 'Elisión de Oclusiva Alveolar (/t, d/)',
          descriptionEs: `La consonante final de "${current.text}" se elide (se omite) por estar entre consonantes.`,
          ipaTransformed: `[${current.text.slice(0, -1)} ${next.text}]`,
          span,
        });
        continue;
      }

      // 3. Intrusive /j/ Glide Linking (after front vowels + before vowel)
      if (this.jGlideWords.has(current.lower) && isNextVowel) {
        boundaries.push({
          word1: current.text,
          word2: next.text,
          boundaryType: 'LINKING_VV_J',
          ruleName: 'Enlace con Deslizamiento Intrusivo /j/',
          descriptionEs: `Se inserta de forma natural el sonido semivocálico /j/ entre "${current.text}" y "${next.text}".`,
          ipaTransformed: `[${current.text}‿ʲ${next.text}]`,
          span,
        });
        continue;
      }

      // 4. Intrusive /w/ Glide Linking (after rounded back vowels + before vowel)
      if (this.wGlideWords.has(current.lower) && isNextVowel) {
        boundaries.push({
          word1: current.text,
          word2: next.text,
          boundaryType: 'LINKING_VV_W',
          ruleName: 'Enlace con Deslizamiento Intrusivo /w/',
          descriptionEs: `Se inserta de forma natural el sonido labiovelar /w/ entre "${current.text}" y "${next.text}".`,
          ipaTransformed: `[${current.text}‿ʷ${next.text}]`,
          span,
        });
        continue;
      }

      // 5. Consonant-to-Vowel Linking (Linking CV)
      if (isCurrentConsonant && isNextVowel) {
        boundaries.push({
          word1: current.text,
          word2: next.text,
          boundaryType: 'LINKING_CV',
          ruleName: 'Catenación Consonante-Vocal (Linking C-V)',
          descriptionEs: `La consonante final "${curLastChar}" de "${current.text}" salta silábicamente hacia "${next.text}".`,
          ipaTransformed: `[${current.text.slice(0, -1)}·${curLastChar}${next.text}]`,
          span,
        });
      }
    }

    // Check for Weak Forms in the tokens
    for (const token of tokens) {
      const weak = this.weakFormWords[token.lower];
      if (weak) {
        boundaries.push({
          word1: token.text,
          word2: '',
          boundaryType: 'WEAK_FORM',
          ruleName: 'Forma Débil (Weak Form con Schwa /ə/)',
          descriptionEs: weak.desc,
          ipaTransformed: `/${weak.ipaWeak}/`,
          span: [token.index, token.index + token.length],
        });
      }
    }

    // Build connected speech string representation
    let ipaConnected = clean;
    for (const b of boundaries) {
      if (b.boundaryType === 'LINKING_CV' || b.boundaryType === 'LINKING_VV_J' || b.boundaryType === 'LINKING_VV_W') {
        const pair = `${b.word1} ${b.word2}`;
        ipaConnected = ipaConnected.replace(pair, `${b.word1}‿${b.word2}`);
      }
    }

    return {
      originalSentence: clean,
      ipaConnected,
      boundaries,
    };
  }
}
