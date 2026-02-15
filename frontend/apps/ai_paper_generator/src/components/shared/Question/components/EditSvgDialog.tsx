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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@skolist/ui";
import { Code, MousePointer2 } from "lucide-react";
import { processSvgLatex } from "../QuestionImages";
import { fastApiService } from "../../../../services/fastApiService";
import { FabricSvgEditor } from "./FabricSvgEditor";
import {
  AiInstructionBar,
  AiLoadingState,
  SvgCodeEditor,
  SvgPreview,
} from "./edit-svg";

interface EditSvgDialogProps {
  image: GeneratedImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (imageId: string, svgString: string) => Promise<void>;
  onAiUpdate?: (imageId: string, svgString: string) => void;
  isSaving?: boolean;
}

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
  const [activeTab, setActiveTab] = useState<string>("visual");

  useEffect(() => {
    if (image?.svg_string) {
      setSvgContent(image.svg_string);
      setError(null);
      setAiInstruction("");
    }
  }, [image]);

  const preview = useMemo(() => {
    if (!svgContent.trim()) return null;
    const trimmed = svgContent.trim();
    if (!trimmed.startsWith("<svg") && !trimmed.startsWith("<?xml")) {
      return { valid: false, error: "Content must be valid SVG" };
    }
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
      setSvgContent(result.svg_string);
      if (onAiUpdate) onAiUpdate(image.id, result.svg_string);
      setAiInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI editing failed");
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleCancel = () => {
    if (image?.svg_string) setSvgContent(image.svg_string);
    setError(null);
    setAiInstruction("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Fixed width dialog - same size for both tabs */}
      <DialogContent className="flex h-[85vh] w-[95vw] max-w-4xl flex-col overflow-hidden p-4 sm:h-auto sm:max-h-[85vh] sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit SVG</DialogTitle>
          <DialogDescription className="hidden sm:block">
            Edit visually, use code editor, or let AI modify the image for you.
          </DialogDescription>
        </DialogHeader>

        {/* AI Edit Section */}
        <div className="shrink-0">
          <AiInstructionBar
            instruction={aiInstruction}
            onInstructionChange={setAiInstruction}
            onSubmit={handleAiEdit}
            isLoading={isAiEditing}
          />
        </div>

        {/* Tabbed Editor - takes remaining space with overflow */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="grid w-full shrink-0 grid-cols-2">
            <TabsTrigger value="visual" className="gap-2">
              <MousePointer2 className="h-4 w-4" />
              <span className="hidden sm:inline">Visual Editor</span>
              <span className="sm:hidden">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Code Editor</span>
              <span className="sm:hidden">Code</span>
            </TabsTrigger>
          </TabsList>

          {/* Fixed height content area - same for both tabs */}
          <div className="mt-4 h-[350px] min-h-0 overflow-auto sm:h-[400px]">
            {/* Visual Editor Tab */}
            <TabsContent value="visual" className="m-0 h-full">
              {isAiEditing ? (
                <AiLoadingState />
              ) : svgContent ? (
                <FabricSvgEditor
                  svgString={svgContent}
                  onChange={setSvgContent}
                  disabled={isAiEditing || isSaving}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-md border bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    No SVG to edit
                  </span>
                </div>
              )}
            </TabsContent>

            {/* Code Editor Tab */}
            <TabsContent value="code" className="m-0 h-full">
              <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
                <SvgCodeEditor
                  value={svgContent}
                  onChange={setSvgContent}
                  disabled={isAiEditing}
                />
                <SvgPreview
                  content={
                    preview?.valid && preview.content ? preview.content : null
                  }
                  error={preview && !preview.valid ? preview.error : null}
                  isAiEditing={isAiEditing}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Error message */}
        {error && (
          <div className="shrink-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Footer - always visible at bottom */}
        <DialogFooter className="shrink-0 flex-col gap-2 pt-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving || isAiEditing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isAiEditing || !preview?.valid}
            className="w-full sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
