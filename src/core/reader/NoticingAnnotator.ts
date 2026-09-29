import { VocabItem } from '../types/vocab';
import { AnnotatedToken, SentenceSegment, OneClickCardPayload } from '../types/reader';

export class NoticingAnnotator {
  private vocabLookup = new Map<string, VocabItem>();

  constructor(activeVocab: VocabItem[] = []) {
    this.setVocab(activeVocab);
  }

  public setVocab(vocab: VocabItem[]): void {
    this.vocabLookup.clear();
    for (const item of vocab) {
      this.vocabLookup.set(item.word.toLowerCase(), item);
    }
  }

  /**
   * Splits text into sentence segments and tokenizes words with noticing annotations.
   */
  public annotateText(rawText: string): SentenceSegment[] {
    const rawSentences = rawText
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const segments: SentenceSegment[] = [];

    for (const sentence of rawSentences) {
      // Split tokens preserving words and punctuation
      const tokenMatches = Array.from(sentence.matchAll(/([a-zA-Z0-9'-]+)|([^\s\w]+)/g));

      const tokens: AnnotatedToken[] = tokenMatches.map((m) => {
        const text = m[0];
        const isWord = /[a-zA-Z0-9]/.test(text);

        if (!isWord) {
          return {
            originalText: text,
            cleanWord: '',
            isPunctuation: true,
            isTargetVocab: false,
          };
        }

        const clean = text.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
        const matchingVocab = this.vocabLookup.get(clean);

        if (matchingVocab) {
          return {
            originalText: text,
            cleanWord: clean,
            isPunctuation: false,
            isTargetVocab: true,
            vocabId: matchingVocab.id,
            ipa: matchingVocab.ipaGeneralAmerican,
            translationEs: matchingVocab.translationEs,
          };
        }

        return {
          originalText: text,
          cleanWord: clean,
          isPunctuation: false,
          isTargetVocab: false,
        };
      });

      segments.push({
        sentenceEn: sentence,
        tokens,
      });
    }

    return segments;
  }

  /**
   * Prepares a 1-Click Flashcard payload from an annotated token and its context sentence.
   */
  public buildOneClickCardPayload(
    token: AnnotatedToken,
    sentenceEn: string,
    fallbackIpa = '',
    fallbackTranslation = '',
  ): OneClickCardPayload {
    const matchingVocab = this.vocabLookup.get(token.cleanWord);

    return {
      word: token.originalText,
      cleanWord: token.cleanWord,
      sentenceEn,
      sentenceEs: `Contexto extraído del artículo: "${sentenceEn}"`,
      cefrLevel: matchingVocab?.cefrLevel ?? 'B1',
      ipa: matchingVocab?.ipaGeneralAmerican ?? fallbackIpa,
      translationEs: matchingVocab?.translationEs ?? fallbackTranslation,
    };
  }
}
