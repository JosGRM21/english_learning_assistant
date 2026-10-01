export interface MatchRange {
  start: number;
  end: number;
  text: string;
}

export interface SnippetMatchOptions {
  snippet: string;
  paragraphIndex?: number; // 1-indexed paragraph
  sentenceContext?: string; // full sentence or clause containing the snippet
  caseSensitive?: boolean;
  requireWordBoundary?: boolean;
}

export interface HighlightedSegment {
  text: string;
  isHighlighted: boolean;
  key: string;
  range?: MatchRange;
}

export interface ParagraphRange {
  index: number; // 1-indexed
  start: number;
  end: number;
  text: string;
}

/**
 * Splits text into paragraphs and returns their 1-indexed positions and boundaries.
 */
export function getParagraphRanges(fullText: string): ParagraphRange[] {
  if (!fullText) return [];

  // Match paragraphs separated by blank lines (\n\s*\n) or single newlines
  const paragraphs: ParagraphRange[] = [];
  const lines = fullText.split(/(\r?\n\s*\r?\n|\r?\n)/);

  let currentOffset = 0;
  let paraIndex = 1;
  let currentBuffer = '';
  let paraStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const chunk = lines[i];
    const isDelimiter = /^\r?\n/.test(chunk);

    if (isDelimiter) {
      if (currentBuffer.trim().length > 0) {
        paragraphs.push({
          index: paraIndex++,
          start: paraStart,
          end: paraStart + currentBuffer.length,
          text: currentBuffer,
        });
        currentBuffer = '';
      }
      currentOffset += chunk.length;
      paraStart = currentOffset;
    } else {
      currentBuffer += chunk;
      currentOffset += chunk.length;
    }
  }

  if (currentBuffer.trim().length > 0) {
    paragraphs.push({
      index: paraIndex,
      start: paraStart,
      end: paraStart + currentBuffer.length,
      text: currentBuffer,
    });
  }

  // Fallback: If no paragraphs formed but text exists
  if (paragraphs.length === 0 && fullText.trim().length > 0) {
    paragraphs.push({
      index: 1,
      start: 0,
      end: fullText.length,
      text: fullText,
    });
  }

  return paragraphs;
}

/**
 * Escapes regex special characters, with optional support for ellipses as wildcards.
 */
function buildSnippetRegex(
  snippet: string,
  requireWordBoundary: boolean,
  caseSensitive: boolean,
): RegExp {
  const trimmed = snippet.trim();
  const hasEllipsis = /\.\.\.|…/.test(trimmed);

  let patternStr: string;

  if (hasEllipsis) {
    const parts = trimmed.split(/\.\.\.|…/).map((p) => p.trim()).filter(Boolean);
    const escapedParts = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    patternStr = escapedParts.join('\\s+\\S+(?:\\s+\\S+){0,4}\\s+');
  } else {
    patternStr = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Determine if word boundaries apply (if snippet starts/ends with word character)
  const startsWithWord = /^[\w']/.test(trimmed);
  const endsWithWord = /[\w']$/.test(trimmed);

  let prefix = '';
  let suffix = '';

  if (requireWordBoundary) {
    if (startsWithWord) prefix = '\\b';
    if (endsWithWord) suffix = '\\b';
  }

  const flags = caseSensitive ? 'g' : 'gi';
  return new RegExp(`${prefix}${patternStr}${suffix}`, flags);
}

/**
 * Finds all accurate match ranges for a snippet within a given text range.
 */
function searchInRange(
  haystack: string,
  offsetBase: number,
  snippet: string,
  requireWordBoundary: boolean,
  caseSensitive: boolean,
): MatchRange[] {
  const matches: MatchRange[] = [];
  if (!haystack || !snippet) return matches;

  // 1. Try with requested casing
  let regex = buildSnippetRegex(snippet, requireWordBoundary, caseSensitive);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(haystack)) !== null) {
    matches.push({
      start: offsetBase + match.index,
      end: offsetBase + match.index + match[0].length,
      text: match[0],
    });
  }

  // 2. If no matches found and we tried caseSensitive, fallback to case-insensitive
  if (matches.length === 0 && caseSensitive) {
    regex = buildSnippetRegex(snippet, requireWordBoundary, false);
    while ((match = regex.exec(haystack)) !== null) {
      matches.push({
        start: offsetBase + match.index,
        end: offsetBase + match.index + match[0].length,
        text: match[0],
      });
    }
  }

  // 3. If still no matches and requireWordBoundary was true, try without word boundaries as last resort
  if (matches.length === 0 && requireWordBoundary && snippet.length > 2) {
    regex = buildSnippetRegex(snippet, false, false);
    while ((match = regex.exec(haystack)) !== null) {
      matches.push({
        start: offsetBase + match.index,
        end: offsetBase + match.index + match[0].length,
        text: match[0],
      });
    }
  }

  return matches;
}

/**
 * Robustly finds the exact character ranges in `fullText` for a given clue or snippet.
 * Guarantees zero false positives inside unrelated words (e.g. 'i' in 'this' or 'writing').
 */
export function findSnippetMatches(
  fullText: string,
  options: SnippetMatchOptions,
): MatchRange[] {
  const { snippet, paragraphIndex, sentenceContext } = options;
  if (!fullText || !snippet || !snippet.trim()) return [];

  const trimmedSnippet = snippet.trim();

  // If snippet is a standalone letter like 'i', case sensitivity is crucial
  const isSingleLetterOrPronoun = trimmedSnippet.length === 1 || /^i$/i.test(trimmedSnippet);
  const caseSensitive =
    options.caseSensitive !== undefined
      ? options.caseSensitive
      : isSingleLetterOrPronoun
        ? true
        : false;

  const requireWordBoundary =
    options.requireWordBoundary !== undefined
      ? options.requireWordBoundary
      : /^[\w'-]+$/i.test(trimmedSnippet);

  const paragraphs = getParagraphRanges(fullText);

  // Strategy 1: Contextual Sentence Anchor within specified paragraph or text
  if (sentenceContext && sentenceContext.trim().length > 0) {
    const cleanCtx = sentenceContext.trim();
    // Locate the sentence in fullText
    const ctxIdx = fullText.toLowerCase().indexOf(cleanCtx.toLowerCase());
    if (ctxIdx !== -1) {
      const sentenceText = fullText.slice(ctxIdx, ctxIdx + cleanCtx.length);
      const sentenceMatches = searchInRange(
        sentenceText,
        ctxIdx,
        trimmedSnippet,
        requireWordBoundary,
        caseSensitive,
      );
      if (sentenceMatches.length > 0) {
        return sentenceMatches;
      }
    }
  }

  // Strategy 2: Target Paragraph Scope
  if (paragraphIndex && paragraphIndex > 0 && paragraphIndex <= paragraphs.length) {
    const targetPara = paragraphs[paragraphIndex - 1];
    const paraMatches = searchInRange(
      targetPara.text,
      targetPara.start,
      trimmedSnippet,
      requireWordBoundary,
      caseSensitive,
    );
    if (paraMatches.length > 0) {
      return paraMatches;
    }
  }

  // Strategy 3: Global Word-Boundary Search across the entire text
  const globalMatches = searchInRange(
    fullText,
    0,
    trimmedSnippet,
    requireWordBoundary,
    caseSensitive,
  );

  return globalMatches;
}

/**
 * Deconstructs text into highlighted and unhighlighted segments for safe React rendering.
 * Does not use regex split, fully preserving whitespace and line breaks.
 */
export function sliceTextWithHighlights(
  fullText: string,
  matches: MatchRange[],
): HighlightedSegment[] {
  if (!fullText) return [];
  if (!matches || matches.length === 0) {
    return [{ text: fullText, isHighlighted: false, key: 'seg-0' }];
  }

  // Sort and remove overlapping/duplicate ranges
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const nonOverlapping: MatchRange[] = [];

  for (const m of sorted) {
    if (nonOverlapping.length === 0) {
      nonOverlapping.push(m);
    } else {
      const last = nonOverlapping[nonOverlapping.length - 1];
      if (m.start >= last.end) {
        nonOverlapping.push(m);
      }
    }
  }

  const segments: HighlightedSegment[] = [];
  let currentPos = 0;
  let segKey = 0;

  for (const match of nonOverlapping) {
    if (match.start > currentPos) {
      segments.push({
        text: fullText.slice(currentPos, match.start),
        isHighlighted: false,
        key: `seg-${segKey++}`,
      });
    }

    segments.push({
      text: fullText.slice(match.start, match.end),
      isHighlighted: true,
      key: `seg-${segKey++}`,
      range: match,
    });

    currentPos = match.end;
  }

  if (currentPos < fullText.length) {
    segments.push({
      text: fullText.slice(currentPos),
      isHighlighted: false,
      key: `seg-${segKey++}`,
    });
  }

  return segments;
}
