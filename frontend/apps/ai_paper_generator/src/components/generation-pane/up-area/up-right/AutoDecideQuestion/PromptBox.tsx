import { Button, Textarea, Label } from "@skolist/ui";
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
  const handleClear = () => onChange("");

  return (
    <div className="space-y-2">
      <Label htmlFor="generation-prompt" className="text-sm font-medium">
        Custom Instructions (Optional)
      </Label>
      <div className="relative group">
        <Textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          maxLength={MAX_CHARS}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need."
          className={cn(
            "min-h-[110px] resize-none pr-10 pb-8 transition-all duration-200",
            "focus-visible:ring-primary/20"
          )}
        />

        {/* Clear Button - Visible on touch by default, hover on desktop */}
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className={cn(
              "absolute right-2 top-2 h-7 w-7 transition-opacity",
              "opacity-100 md:opacity-0 md:group-hover:opacity-100"
            )}
            aria-label="Clear instructions"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}

        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded pointer-events-none border border-transparent group-focus-within:border-input">
          {value.length} / {MAX_CHARS}
        </div>
      </div>

      <div className="flex justify-center md:justify-end pt-1">
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
