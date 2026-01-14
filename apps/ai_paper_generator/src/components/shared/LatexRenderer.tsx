import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * Renders text with LaTeX expressions.
 * Supports both inline ($...$) and display ($$...$$) math.
 */
export function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return "";

    // Process the content to render LaTeX
    let result = content;

    // First, handle display math ($$...$$)
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
      try {
        return katex.renderToString(latex.trim(), {
          displayMode: true,
          throwOnError: false,
          trust: true,
        });
      } catch {
        return `$$${latex}$$`;
      }
    });

    // Then, handle inline math ($...$)
    // Use negative lookbehind/lookahead to avoid matching escaped dollars or display math
    result = result.replace(
      /(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g,
      (_, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            trust: true,
          });
        } catch {
          return `$${latex}$`;
        }
      }
    );

    return result;
  }, [content]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

/**
 * Renders HTML content that may contain LaTeX expressions.
 * This is useful for rich text that already has HTML tags.
 */
export function LatexHtmlRenderer({
  content,
  className = "",
}: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return "";

    let result = content;

    // First, handle display math ($$...$$)
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
      try {
        return katex.renderToString(latex.trim(), {
          displayMode: true,
          throwOnError: false,
          trust: true,
        });
      } catch {
        return `$$${latex}$$`;
      }
    });

    // Then, handle inline math ($...$)
    result = result.replace(
      /(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g,
      (_, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            trust: true,
          });
        } catch {
          return `$${latex}$`;
        }
      }
    );

    return result;
  }, [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
