import { useState } from "react";
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
import { ImagePlus, Send } from "lucide-react";
import type { GeneratedQuestion } from "@skolist/db";

interface RegenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (prompt: string, image?: File) => void;
  questionText: NonNullable<GeneratedQuestion["question_text"]>;
}

export function RegenerateModal({
  open,
  onOpenChange,
  onRegenerate,
  questionText,
}: RegenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    onRegenerate(prompt, image || undefined);
    setPrompt("");
    setImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Regenerate Question</DialogTitle>
          <DialogDescription>
            Provide instructions on how you want to modify this question
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Question */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Current Question
            </Label>
            <p className="mt-1 rounded-md bg-muted p-3 text-sm">
              {questionText}
            </p>
          </div>

          {/* Prompt Input */}
          <div>
            <Label htmlFor="prompt">Instructions</Label>
            <Textarea
              id="prompt"
              placeholder="E.g., Make it easier, add more context, focus on concept X..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-1.5"
            />
          </div>

          {/* Image Attachment */}
          <div>
            <Label htmlFor="image" className="cursor-pointer">
              <div className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ImagePlus className="h-4 w-4" />
                <span>Attach Figure (optional)</span>
              </div>
            </Label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {image && (
              <p className="mt-2 text-xs text-muted-foreground">
                Selected: {image.name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!prompt.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
