import { useMemo } from "react";
import type { GeneratedImage } from "@skolist/db";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@skolist/ui";
import katex from "katex";

/**
 * Processes an SVG string to render LaTeX expressions inside <text> elements.
 * Replaces text elements containing $...$ or $$...$$ with foreignObject elements
 * that contain rendered KaTeX HTML.
 */
export function processSvgLatex(svgString: string): string {
  if (!svgString) return svgString;

  // Parse the SVG string into a DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");

  // Check for parsing errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.warn("SVG parsing error, returning original string");
    return svgString;
  }

  const svgElement = doc.documentElement;
  const textElements = svgElement.querySelectorAll("text");

  textElements.forEach((textEl) => {
    const content = textEl.textContent || "";

    // Check if content contains LaTeX ($...$ or $$...$$)
    if (!content.includes("$")) return;

    // Get the position and styling attributes
    const x = textEl.getAttribute("x") || "0";
    const y = textEl.getAttribute("y") || "0";
    const fontSize = textEl.getAttribute("font-size") || "0.1";
    const textAnchor = textEl.getAttribute("text-anchor") || "start";

    // Render LaTeX content
    let renderedContent = content;

    // Handle display math ($$...$$) first
    renderedContent = renderedContent.replace(
      /\$\$([^$]+)\$\$/g,
      (_, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            trust: true,
          });
        } catch {
          return `$$${latex}$$`;
        }
      }
    );

    // Handle inline math ($...$)
    renderedContent = renderedContent.replace(
      /(?<!\$)\$(?!\$)([^$]+)\$(?!\$)/g,
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

    // Only replace if LaTeX was found and rendered
    if (renderedContent !== content) {
      // Create a foreignObject to embed HTML in SVG
      const foreignObject = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject"
      );

      // Calculate position offset based on text-anchor
      // The foreignObject needs width/height - use compact values
      const numericFontSize = parseFloat(fontSize);
      const width = numericFontSize * 8; // Compact width for math content
      const height = numericFontSize * 1.8; // Height for the content

      let xOffset = parseFloat(x);
      if (textAnchor === "middle") {
        xOffset -= width / 2;
      } else if (textAnchor === "end") {
        xOffset -= width;
      }

      foreignObject.setAttribute("x", xOffset.toString());
      foreignObject.setAttribute(
        "y",
        (parseFloat(y) - numericFontSize * 1.2).toString()
      );
      foreignObject.setAttribute("width", width.toString());
      foreignObject.setAttribute("height", height.toString());
      // Ensure foreignObject doesn't clip or have background
      foreignObject.setAttribute(
        "style",
        "overflow: visible; pointer-events: none;"
      );

      // Create the HTML div inside foreignObject
      const div = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      div.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      div.setAttribute(
        "style",
        `font-size: ${numericFontSize}px; display: flex; align-items: center; justify-content: ${
          textAnchor === "middle"
            ? "center"
            : textAnchor === "end"
              ? "flex-end"
              : "flex-start"
        }; height: 100%; color: black; background: none;`
      );
      div.innerHTML = renderedContent;

      foreignObject.appendChild(div);

      // Replace the text element with foreignObject
      textEl.parentNode?.replaceChild(foreignObject, textEl);
    }
  });

  // Serialize back to string
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
}

interface QuestionImagesProps {
  images: GeneratedImage[];
  /** Optional className for the container */
  className?: string;
  onDelete?: (id: string) => void;
  /** Optional callback for editing an SVG image */
  onEdit?: (image: GeneratedImage) => void;
  /** Optional max height class (default: max-h-32) */
  maxHeightClass?: string;
}

/**
 * Renders images associated with a question.
 * - If svg_string is present, renders inline SVG with LaTeX support
 * - Otherwise, if img_url is present, renders an img tag
 * - Skips images that have neither
 */
export function QuestionImages({
  images,
  className = "",
  onDelete,
  onEdit,
  maxHeightClass = "max-h-32",
}: QuestionImagesProps) {
  // Process all SVG strings to render LaTeX
  const processedImages = useMemo(() => {
    return images.map((image) => ({
      ...image,
      processedSvg: image.svg_string ? processSvgLatex(image.svg_string) : null,
    }));
  }, [images]);

  if (!processedImages || processedImages.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {processedImages.map((image) => {
        // Priority: processedSvg (from svg_string) first, then img_url
        const content = image.processedSvg ? (
          <div
            className="question-image-svg max-w-full overflow-hidden"
            // Render processed SVG with LaTeX as HTML
            dangerouslySetInnerHTML={{ __html: image.processedSvg }}
          />
        ) : image.img_url ? (
          <img
            src={image.img_url}
            alt={`Question image ${image.position ?? image.id}`}
            className={`question-image ${maxHeightClass} max-w-full rounded-md object-contain`}
            loading="lazy"
          />
        ) : null;

        if (!content) return null;

        return (
          <div key={image.id} className="group/image relative">
            {content}
            {/* Edit button - only for SVG images (not img_url) */}
            {onEdit && image.svg_string && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute -left-2 -top-2 h-6 w-6 opacity-0 shadow-sm transition-opacity group-hover/image:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(image);
                }}
                title="Edit SVG"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute -right-2 -top-2 h-6 w-6 opacity-0 shadow-sm transition-opacity group-hover/image:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(image.id);
                }}
                title="Delete Image"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
