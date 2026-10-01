import { describe, it, expect } from 'vitest';
import {
  findSnippetMatches,
  sliceTextWithHighlights,
  getParagraphRanges,
} from '../TextSnippetMatcher';

describe('TextSnippetMatcher', () => {
  describe('Single-letter & Pronoun "i" matching (User Bug Scenario)', () => {
    const draftText = `This is an introductory paragraph. I think this writing exercise is very interesting.

Yesterday i decided to visit the local library. It was raining and i forgot my umbrella.

Finally, today i am feeling much better and I will finish the task.`;

    it('matches ONLY standalone lowercase "i" and NEVER letters inside words like "This", "is", "writing"', () => {
      const matches = findSnippetMatches(draftText, {
        snippet: 'i',
      });

      // Matches should only be the 3 lowercase 'i' pronouns
      expect(matches.length).toBe(3);
      matches.forEach((m) => {
        expect(m.text).toBe('i');
        // Ensure the matched character is preceded and followed by non-word characters
        const charBefore = m.start > 0 ? draftText[m.start - 1] : ' ';
        const charAfter = m.end < draftText.length ? draftText[m.end] : ' ';
        expect(/\w/.test(charBefore)).toBe(false);
        expect(/\w/.test(charAfter)).toBe(false);
      });
    });

    it('does NOT match correct uppercase "I" when searching for error "i"', () => {
      const text = 'I believe that i am ready, because I prepared well.';
      const matches = findSnippetMatches(text, {
        snippet: 'i',
      });

      expect(matches.length).toBe(1);
      expect(matches[0].text).toBe('i');
      expect(matches[0].start).toBe(text.indexOf(' i ') + 1);
    });

    it('restricts matches to the specific paragraph indicated by paragraphIndex', () => {
      // Paragraph 2 has two lowercase 'i's: "Yesterday i decided..." and "...and i forgot..."
      const matchesP2 = findSnippetMatches(draftText, {
        snippet: 'i',
        paragraphIndex: 2,
      });

      expect(matchesP2.length).toBe(2);

      // Verify offsets fall within paragraph 2
      const paragraphs = getParagraphRanges(draftText);
      const p2 = paragraphs[1];
      matchesP2.forEach((m) => {
        expect(m.start).toBeGreaterThanOrEqual(p2.start);
        expect(m.end).toBeLessThanOrEqual(p2.end);
      });

      // Paragraph 3 has one lowercase 'i'
      const matchesP3 = findSnippetMatches(draftText, {
        snippet: 'i',
        paragraphIndex: 3,
      });
      expect(matchesP3.length).toBe(1);
    });

    it('restricts matches using sentenceContext when provided', () => {
      const matches = findSnippetMatches(draftText, {
        snippet: 'i',
        sentenceContext: 'It was raining and i forgot my umbrella.',
      });

      expect(matches.length).toBe(1);
      expect(matches[0].text).toBe('i');
      expect(draftText.slice(matches[0].start - 4, matches[0].end + 7)).toBe('and i forgot');
    });
  });

  describe('Prepositions and Short Common Words', () => {
    it('matches preposition "to" without false positives on words like "Today", "button", "into"', () => {
      const text = 'Today I decided to press the button to go into town.';
      const matches = findSnippetMatches(text, {
        snippet: 'to',
      });

      // Only the two standalone "to"s
      expect(matches.length).toBe(2);
      matches.forEach((m) => {
        expect(m.text.toLowerCase()).toBe('to');
      });
    });

    it('matches phrases with prepositions like "depend of"', () => {
      const text = 'It will depend of the weather conditions tomorrow.';
      const matches = findSnippetMatches(text, {
        snippet: 'depend of',
      });

      expect(matches.length).toBe(1);
      expect(matches[0].text).toBe('depend of');
    });
  });

  describe('Ellipses and Incomplete Snippets', () => {
    it('matches "have ... years" in "I have 25 years old"', () => {
      const text = 'Currently I have 25 years old and I study English.';
      const matches = findSnippetMatches(text, {
        snippet: 'have ... years',
      });

      expect(matches.length).toBe(1);
      expect(matches[0].text).toBe('have 25 years');
    });
  });

  describe('sliceTextWithHighlights', () => {
    it('slices text into non-overlapping highlighted and normal segments', () => {
      const text = 'Hello i world';
      const matches = [{ start: 6, end: 7, text: 'i' }];

      const segments = sliceTextWithHighlights(text, matches);
      expect(segments).toEqual([
        { text: 'Hello ', isHighlighted: false, key: 'seg-0' },
        { text: 'i', isHighlighted: true, key: 'seg-1', range: matches[0] },
        { text: ' world', isHighlighted: false, key: 'seg-2' },
      ]);
    });

    it('preserves newline and whitespace structure completely', () => {
      const text = "Line 1\n\nLine 2 with i here.\nLine 3";
      const matches = findSnippetMatches(text, { snippet: 'i' });
      const segments = sliceTextWithHighlights(text, matches);

      const reconstructed = segments.map((s) => s.text).join('');
      expect(reconstructed).toBe(text);
    });
  });
});
