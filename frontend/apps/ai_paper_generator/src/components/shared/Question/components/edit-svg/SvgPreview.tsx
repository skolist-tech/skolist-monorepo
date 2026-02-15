import { Label } from "@skolist/ui";
import { AiLoadingOverlay } from "./AiLoadingOverlay";

interface SvgPreviewProps {
  /** Processed SVG content (with LaTeX rendered) */
  content: string | null;
  /** Error message if SVG is invalid */
  error?: string | null;
  /** Whether AI is currently editing */
  isAiEditing?: boolean;
}

/**
 * SVG preview panel with loading overlay support
 */
export function SvgPreview({
  content,
  error,
  isAiEditing = false,
}: SvgPreviewProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <Label>Preview</Label>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-md border bg-muted/30 p-2 sm:p-4">
        {isAiEditing && <AiLoadingOverlay />}
        {content ? (
          <div
            className="max-h-full max-w-full [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:max-w-full"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <span className="text-center text-xs text-muted-foreground sm:text-sm">
            {error || "Enter valid SVG to see preview"}
          </span>
        )}
      </div>
    </div>
  );
}
