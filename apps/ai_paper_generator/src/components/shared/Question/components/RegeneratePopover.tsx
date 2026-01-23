import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
} from "@skolist/ui";
import { Send, Paperclip, Loader2, X } from "lucide-react";

interface RegeneratePopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  attachedFiles: File[];
  isAttaching: boolean;
  onRemoveAttachment: (index: number) => void;
  onRegenerateSubmit: () => void;
  onAttachmentClick: () => void;
}

export function RegeneratePopover({
  isOpen,
  onOpenChange,
  prompt,
  setPrompt,
  attachedFiles,
  isAttaching,
  onRemoveAttachment,
  onRegenerateSubmit,
  onAttachmentClick,
}: RegeneratePopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* Invisible trigger positioned relative to card, or rely on external open control */}
        <span className="absolute right-2 top-2 h-0 w-0" />
      </PopoverTrigger>
      <PopoverContent
        className="w-96 max-w-[calc(100vw-2rem)] p-3"
        align="end"
        side="bottom"
        collisionPadding={16}
      >
        <div className="flex w-full items-start gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              placeholder="Ask AI to improve, modify, or extract this question from an image…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-16 resize-none py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onRegenerateSubmit();
                }
              }}
            />

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex max-w-[150px] items-center gap-1 rounded-full border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                      onClick={() => onRemoveAttachment(i)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onRegenerateSubmit}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 border"
              disabled={isAttaching}
              onClick={onAttachmentClick}
            >
              {isAttaching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
