import { useMemo, type CSSProperties } from "react";
import katex from "katex";

type LatexRendererProps = {
  content: string;
  className?: string;
  style?: CSSProperties;
};

/** Renders text with inline ($...$) and display ($$...$$) KaTeX. */
export function LatexRenderer({
  content,
  className = "",
  style,
}: LatexRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content) return "";

    let result = content;

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
      style={{ whiteSpace: "pre-wrap", ...style }}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
