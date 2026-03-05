import { Button, Textarea } from "@skolist/ui";
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
  const maxLength = 1000;

  return (
    <div className="space-y-2">
      {/* <Label htmlFor="generation-prompt">Custom Instructions (Optional)</Label> */}
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
          className={cn(
            "min-h-[110px] resize-none pr-20 transition-all",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />

        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-muted transition-colors"
              title="Clear input"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <div className="pointer-events-none rounded bg-background/80 px-1 text-[10px] font-medium tabular-nums text-muted-foreground">
            {value.length}/{maxLength}
          </div>
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <Button
          size="default"
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="h-10 gap-2 px-8 text-base transition-transform active:scale-95 md:h-9 md:px-4 md:text-sm"
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
