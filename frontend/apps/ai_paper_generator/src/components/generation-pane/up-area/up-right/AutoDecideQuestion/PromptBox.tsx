// import { Label, Button } from "@skolist/ui";
import { Button } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { Sparkles, Loader2, X } from "lucide-react";

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

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
      {/* <Label htmlFor="generation-prompt">Custom Instructions (Optional)</Label> */}
      <div className="relative group">
        <textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className={cn(
            "flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "resize-none disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors hover:border-accent-foreground/30"
          )}
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Clear instructions"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Character Counter */}
        {charCount > 0 && (
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-1 rounded pointer-events-none select-none">
            {charCount} {charCount === 1 ? "character" : "characters"}
          </div>
        )}
      </div>

      <div className="flex justify-center md:justify-end">
        <Button
          size="default"
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className={cn(
            "h-10 gap-2 px-8 text-base md:h-9 md:px-4 md:text-sm",
            "transition-transform active:scale-95"
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
