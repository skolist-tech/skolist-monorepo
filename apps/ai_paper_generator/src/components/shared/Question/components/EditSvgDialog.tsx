import { useState, useEffect, useMemo } from "react";
import type { GeneratedImage } from "@skolist/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Textarea,
  Label,
} from "@skolist/ui";
import { processSvgLatex } from "../QuestionImages";

interface EditSvgDialogProps {
  /** The image being edited (null when dialog is closed) */
  image: GeneratedImage | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when SVG is saved */
  onSave: (imageId: string, svgString: string) => Promise<void>;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Dialog for editing SVG string of an image.
 * Shows a preview of the SVG alongside a text area for editing.
 */
export function EditSvgDialog({
  image,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: EditSvgDialogProps) {
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize content when image changes
  useEffect(() => {
    if (image?.svg_string) {
      setSvgContent(image.svg_string);
      setError(null);
    }
  }, [image]);

  // Validate and generate preview
  const preview = useMemo(() => {
    if (!svgContent.trim()) {
      return null;
    }

    // Basic validation - check if it looks like SVG
    const trimmed = svgContent.trim();
    if (!trimmed.startsWith("<svg") && !trimmed.startsWith("<?xml")) {
      return { valid: false, error: "Content must be valid SVG" };
    }

    // Process LaTeX in the SVG for preview
    const processedSvg = processSvgLatex(svgContent);
    return { valid: true, content: processedSvg };
  }, [svgContent]);

  const handleSave = async () => {
    if (!image || !preview?.valid) return;

    setError(null);
    try {
      await onSave(image.id, svgContent);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SVG");
    }
  };

  const handleCancel = () => {
    // Reset to original content
    if (image?.svg_string) {
      setSvgContent(image.svg_string);
    }
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Edit SVG</DialogTitle>
          <DialogDescription>
            Edit the SVG code below. Changes will be saved to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-hidden py-4">
          {/* Editor */}
          <div className="flex min-h-0 flex-col gap-2">
            <Label htmlFor="svg-editor">SVG Code</Label>
            <Textarea
              id="svg-editor"
              value={svgContent}
              onChange={(e) => setSvgContent(e.target.value)}
              className="min-h-[300px] flex-1 resize-none font-mono text-sm"
              placeholder="Enter SVG code..."
            />
          </div>

          {/* Preview */}
          <div className="flex min-h-0 flex-col gap-2">
            <Label>Preview</Label>
            <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-md border bg-muted/30 p-4">
              {preview?.valid && preview.content ? (
                <div
                  className="max-h-full max-w-full [&>svg]:h-auto [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: preview.content }}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {preview?.error || "Enter valid SVG to see preview"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !preview?.valid}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
