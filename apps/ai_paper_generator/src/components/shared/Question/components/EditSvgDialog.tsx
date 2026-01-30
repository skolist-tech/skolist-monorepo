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
  Input,
} from "@skolist/ui";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { processSvgLatex } from "../QuestionImages";
import { fastApiService } from "../../../../services/fastApiService";

interface EditSvgDialogProps {
  /** The image being edited (null when dialog is closed) */
  image: GeneratedImage | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when SVG is saved (manual save) */
  onSave: (imageId: string, svgString: string) => Promise<void>;
  /** Callback when SVG is updated via AI (to update local state) */
  onAiUpdate?: (imageId: string, svgString: string) => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Dialog for editing SVG string of an image.
 * Features:
 * - Direct code editing with live preview
 * - AI-powered natural language editing
 */
export function EditSvgDialog({
  image,
  open,
  onOpenChange,
  onSave,
  onAiUpdate,
  isSaving = false,
}: EditSvgDialogProps) {
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isAiEditing, setIsAiEditing] = useState(false);

  // Initialize content when image changes
  useEffect(() => {
    if (image?.svg_string) {
      setSvgContent(image.svg_string);
      setError(null);
      setAiInstruction("");
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

  const handleAiEdit = async () => {
    if (!image || !aiInstruction.trim()) return;

    setError(null);
    setIsAiEditing(true);

    try {
      const result = await fastApiService.editSvg(image.id, aiInstruction);

      // Update local content with the AI-edited SVG
      setSvgContent(result.svg_string);

      // Notify parent about the update (for optimistic UI updates)
      if (onAiUpdate) {
        onAiUpdate(image.id, result.svg_string);
      }

      // Clear the instruction
      setAiInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI editing failed");
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleCancel = () => {
    // Reset to original content
    if (image?.svg_string) {
      setSvgContent(image.svg_string);
    }
    setError(null);
    setAiInstruction("");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && aiInstruction.trim()) {
      e.preventDefault();
      handleAiEdit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Edit SVG</DialogTitle>
          <DialogDescription>
            Edit directly or use AI to modify the SVG with natural language.
          </DialogDescription>
        </DialogHeader>

        {/* AI Edit Section */}
        <div className="flex items-center gap-2 rounded-lg border bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-3">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <Input
            placeholder="Describe what you want to change... (e.g., 'Move the label to the left', 'Change theta to 60°')"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAiEditing}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0"
          />
          <Button
            size="sm"
            onClick={handleAiEdit}
            disabled={isAiEditing || !aiInstruction.trim()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
          >
            {isAiEditing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

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
              disabled={isAiEditing}
            />
          </div>

          {/* Preview */}
          <div className="flex min-h-0 flex-col gap-2">
            <Label>Preview</Label>
            <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-md border bg-muted/30 p-4">
              {isAiEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    <span className="text-sm text-muted-foreground">
                      AI is editing...
                    </span>
                  </div>
                </div>
              )}
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
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving || isAiEditing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isAiEditing || !preview?.valid}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
