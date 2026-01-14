import type { GeneratedImage } from "@skolist/db";

interface QuestionImagesProps {
  images: GeneratedImage[];
  /** Optional className for the container */
  className?: string;
}

/**
 * Renders images associated with a question.
 * - If svg_string is present, renders inline SVG
 * - Otherwise, if img_url is present, renders an img tag
 * - Skips images that have neither
 */
export function QuestionImages({ images, className = "" }: QuestionImagesProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {images.map((image) => {
        // Priority: svg_string first, then img_url
        if (image.svg_string) {
          return (
            <div
              key={image.id}
              className="question-image-svg max-w-full overflow-hidden"
              // Render SVG string directly as HTML
              dangerouslySetInnerHTML={{ __html: image.svg_string }}
            />
          );
        }

        if (image.img_url) {
          return (
            <img
              key={image.id}
              src={image.img_url}
              alt={`Question image ${image.position ?? image.id}`}
              className="question-image max-h-48 max-w-full rounded-md object-contain"
              loading="lazy"
            />
          );
        }

        // Skip if neither svg_string nor img_url is present
        return null;
      })}
    </div>
  );
}
