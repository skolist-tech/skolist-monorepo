import type { GeneratedImage } from "@skolist/db";
import { Trash2 } from "lucide-react";
import { Button } from "@skolist/ui";

interface QuestionImagesProps {
  images: GeneratedImage[];
  /** Optional className for the container */
  className?: string;
  onDelete?: (id: string) => void;
  /** Optional max height class (default: max-h-32) */
  maxHeightClass?: string;
}

/**
 * Renders images associated with a question.
 * - If svg_string is present, renders inline SVG
 * - Otherwise, if img_url is present, renders an img tag
 * - Skips images that have neither
 */
export function QuestionImages({
  images,
  className = "",
  onDelete,
  maxHeightClass = "max-h-32",
}: QuestionImagesProps) {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {images.map((image) => {
        // Priority: svg_string first, then img_url
        const content = image.svg_string ? (
          <div
            className="question-image-svg max-w-full overflow-hidden"
            // Render SVG string directly as HTML
            dangerouslySetInnerHTML={{ __html: image.svg_string }}
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
