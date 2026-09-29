import React, { useMemo } from 'react';
import katex from 'katex';

export interface MathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

interface TextSegment {
  type: 'text' | 'math';
  content: string;
  displayMode: boolean;
}

/**
 * Parses a string containing LaTeX delimiters ($...$ for inline, $$...$$ for block)
 * and renders formatted math with KaTeX.
 */
export function MathText({ text, className = '', inline = false }: MathTextProps) {
  const segments = useMemo<TextSegment[]>(() => {
    if (!text) return [];

    const result: TextSegment[] = [];
    // Match $$block$$ or $inline$
    const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          displayMode: false,
        });
      }

      const isBlock = match[1] !== undefined;
      const formula = isBlock ? match[1] : match[2];

      result.push({
        type: 'math',
        content: formula.trim(),
        displayMode: isBlock,
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex),
        displayMode: false,
      });
    }

    return result;
  }, [text]);

  const Component = inline ? 'span' : 'span';

  return (
    <Component className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
        }

        try {
          const html = katex.renderToString(seg.content, {
            throwOnError: false,
            displayMode: seg.displayMode,
          });

          return (
            <span
              key={idx}
              className={`inline-math ${seg.displayMode ? 'block my-2 text-center' : 'inline-block mx-0.5'}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={idx} className="font-mono text-xs">{`$${seg.content}$`}</span>;
        }
      })}
    </Component>
  );
}

export default MathText;
