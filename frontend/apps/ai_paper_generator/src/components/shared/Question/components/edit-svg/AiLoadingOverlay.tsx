import { Loader2 } from "lucide-react";

interface AiLoadingOverlayProps {
  /** Message to display during loading */
  message?: string;
}

/**
 * Loading overlay shown when AI is processing
 */
export function AiLoadingOverlay({
  message = "AI is editing...",
}: AiLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500 sm:h-8 sm:w-8" />
        <span className="text-xs text-muted-foreground sm:text-sm">
          {message}
        </span>
      </div>
    </div>
  );
}

/**
 * Centered loading state (not absolute positioned)
 */
export function AiLoadingState({
  message = "AI is editing...",
}: AiLoadingOverlayProps) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border bg-muted/30">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500 sm:h-8 sm:w-8" />
        <span className="text-xs text-muted-foreground sm:text-sm">
          {message}
        </span>
      </div>
    </div>
  );
}
