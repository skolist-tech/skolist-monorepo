import { Button, Textarea } from "@skolist/ui";
// import { cn } from "@skolist/utils";
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
  const maxLength = 1000;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className="min-h-[110px] resize-none pr-20"
        />
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-2">
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear instructions"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <span className="rounded bg-background/80 px-1 text-[10px] text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <Button
          size="default"
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="h-10 gap-2 px-8 text-base md:h-9 md:px-4 md:text-sm"
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
