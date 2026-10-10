import { ErrorPracticeDrill } from '@/infrastructure/ai/schemas';

/**
 * Generates common English morphological inflections for a word or phrasal chunk
 * to ensure flexible matching in learner writing (e.g., 'depend on' matches 'depends on', 'depended on').
 */
export function extractTargetWordTokens(word: string): string[] {
  const clean = word.trim().toLowerCase();
  if (!clean) return [];

  const tokens = new Set<string>();
  tokens.add(clean);

  // If multi-word chunk (e.g. 'depend on', 'look forward to', 'agree with')
  if (clean.includes(' ')) {
    const parts = clean.split(/\s+/);
    const mainVerb = parts[0];
    const rest = parts.slice(1).join(' ');

    const verbInflections = getSingleWordInflections(mainVerb);
    for (const v of verbInflections) {
      tokens.add(`${v} ${rest}`);
    }
    return Array.from(tokens);
  }

  // Single word inflections
  const singleInflections = getSingleWordInflections(clean);
  for (const inf of singleInflections) {
    tokens.add(inf);
  }

  return Array.from(tokens);
}

function getSingleWordInflections(base: string): string[] {
  const forms = new Set<string>();
  forms.add(base);

  // Suffixes: -s, -es
  if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    forms.add(base.slice(0, -1) + 'ies'); // try -> tries
    forms.add(base.slice(0, -1) + 'ied'); // try -> tried
  } else if (base.endsWith('s') || base.endsWith('sh') || base.endsWith('ch') || base.endsWith('x') || base.endsWith('z')) {
    forms.add(base + 'es'); // miss -> misses, watch -> watches
  } else {
    forms.add(base + 's'); // walk -> walks, book -> books
  }

  // Past: -ed, -d
  if (base.endsWith('e')) {
    forms.add(base + 'd'); // live -> lived
  } else if (!base.endsWith('y')) {
    forms.add(base + 'ed'); // walk -> walked
  }

  // Gerund: -ing
  if (base.endsWith('e') && !base.endsWith('ee')) {
    forms.add(base.slice(0, -1) + 'ing'); // write -> writing
  } else {
    forms.add(base + 'ing'); // walk -> walking
  }

  return Array.from(forms);
}

/**
 * Checks whether a target vocabulary word or any of its inflections
 * is present in the learner's draft text using regex word boundaries.
 */
export function isTargetWordUsedInText(targetWord: string, text: string): boolean {
  if (!targetWord.trim() || !text.trim()) return false;

  const inflections = extractTargetWordTokens(targetWord);
  const normalizedText = text.toLowerCase();

  for (const token of inflections) {
    // Escape regex characters
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(normalizedText)) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a deterministic high-quality positive practice drill (RF-ERR-02) as a fallback
 * if the AI model fails to supply an explicit drill object for a correction.
 * Strictly eliminates multiple choice options with the learner's mistake (zero negative priming).
 */
export function synthesizeErrorDrillFallback(correction: {
  error_span: string;
  native_reformulation: string;
  explanation_es: string;
  sentence_context?: string;
}): ErrorPracticeDrill {
  const target = correction.native_reformulation.trim();
  const mistake = correction.error_span.trim();

  let clozeSentence = `We need to ensure that we [ ___ ] in this situation.`;
  if (correction.sentence_context && correction.sentence_context.includes(mistake)) {
    clozeSentence = correction.sentence_context.replace(
      new RegExp(mistake.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      '[ ___ ]',
    );
  }

  return {
    format: 'CONTEXTUAL_CLOZE',
    cloze_sentence: clozeSentence,
    expected_token: target,
    hint_es: `Escribe la forma nativa en inglés: "${target.slice(0, Math.min(2, target.length))}..."`,
    explanation_es: correction.explanation_es,
    transfer_prompt_es: `Escribe una oración propia empleando "${target}".`,
  };
}

/**
 * Checks which target vocabulary terms were used productively in the learner's text (RF-VOC-10).
 */
export function checkProductiveVocabUsage(
  vocabWords: string[],
  text: string,
): { usedWords: string[]; missingWords: string[] } {
  const usedWords: string[] = [];
  const missingWords: string[] = [];

  for (const word of vocabWords) {
    if (isTargetWordUsedInText(word, text)) {
      usedWords.push(word);
    } else {
      missingWords.push(word);
    }
  }

  return { usedWords, missingWords };
}

