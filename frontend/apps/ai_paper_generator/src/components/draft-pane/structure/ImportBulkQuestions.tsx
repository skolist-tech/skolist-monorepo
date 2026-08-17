import { useState, useRef } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Textarea,
  Label,
  useToast,
} from "@skolist/ui";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useActivityContext } from "../../../context/ActivityContext";
import { useDraftContext } from "../../../context/DraftContext";
import { useQuestionsContext } from "../../../context/QuestionsContext";
import { fastApiService } from "../../../services/fastApiService";

export function ImportBulkQuestions() {
  const { toast } = useToast();
  const { currentActivity } = useActivityContext();
  const { draft, refetchSections } = useDraftContext();
  const { refetchQuestions } = useQuestionsContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sectionName, setSectionName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image (PNG, JPEG, GIF, WebP) or PDF",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setPrompt("");
    setSectionName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !currentActivity?.id || !draft?.id) {
      toast({
        title: "Missing data",
        description: "Please select a file and ensure you have an active draft",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await fastApiService.extractQuestions(
        selectedFile,
        currentActivity.id,
        draft.id,
        prompt || undefined,
        sectionName || undefined
      );

      if (result.questions_extracted > 0) {
        toast({
          title: "Questions imported",
          description: `Successfully extracted ${result.questions_extracted} question(s) into "${result.section_name}"`,
        });

        // Reload sections and questions from the DB so the draft updates
        // even if the realtime socket does not deliver the new rows.
        await Promise.all([refetchSections(), refetchQuestions()]);

        handleClose();
      } else {
        toast({
          title: "No questions found",
          description:
            "No questions could be extracted from the file. Try a different file or add more context in the prompt.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to import questions:", error);
      toast({
        title: "Import failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to extract questions from file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs md:px-3"
        >
          <Upload className="mr-1 h-3 w-3" />
          <span className="hidden sm:inline">Import</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Questions from File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload Image or PDF</Label>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="max-w-[200px] truncate">
                    {selectedFile.name}
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image or PDF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Section Name */}
          <div className="space-y-2">
            <Label htmlFor="section-name">Section Name (optional)</Label>
            <input
              id="section-name"
              type="text"
              placeholder="Extracted Questions"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="extraction-prompt">
              Additional Instructions (optional)
            </Label>
            <Textarea
              id="extraction-prompt"
              placeholder="E.g., Focus on math questions only, or extract questions from page 2..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              "Extract Questions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
