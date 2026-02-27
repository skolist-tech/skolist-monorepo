import { Button, Label, Textarea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { Sparkles, Loader2, X } from "lucide-react";

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

const MAX_CHARS = 1000;

export function PromptBox({
  value,
  onChange,
  onGenerate,
  isGenerating = false,
  disabled = false,
}: PromptBoxProps) {
  const charCount = value.length;

  return (
    <div className="space-y-2">
      <Label htmlFor="generation-prompt">Custom Instructions (Optional)</Label>
      <div className="relative group">
        <Textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          maxLength={MAX_CHARS}
          className={cn(
            "min-h-[110px] resize-none pr-10 pb-8 transition-all duration-200",
            "focus-visible:ring-primary/20"
          )}
          disabled={disabled || isGenerating}
        />

        {value && !disabled && !isGenerating && (
          <div className="absolute right-2 top-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-7 w-7 rounded-full transition-opacity md:opacity-0 md:group-hover:opacity-100 hover:bg-muted"
                    onClick={() => onChange("")}
                    aria-label="Clear instructions"
                  >
                    <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Clear all</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div
          className={cn(
            "absolute bottom-2 right-2 text-[10px] bg-background/80 px-1 rounded pointer-events-none select-none transition-colors",
            charCount >= MAX_CHARS ? "text-destructive font-medium" : "text-muted-foreground"
          )}
        >
          {charCount} / {MAX_CHARS}
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <Button
          size="default"
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className={cn(
            "h-10 gap-2 px-8 text-base md:h-9 md:px-4 md:text-sm",
            "active:scale-95 transition-transform"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Questions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
