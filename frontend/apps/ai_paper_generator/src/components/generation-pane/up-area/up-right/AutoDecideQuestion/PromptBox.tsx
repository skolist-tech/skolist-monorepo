import { Label, Button, Textarea } from "@skolist/ui";
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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="generation-prompt">Custom Instructions (Optional)</Label>
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            aria-label="Clear instructions"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
      <div className="relative">
        <Textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className="min-h-[110px] resize-none"
        />
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/80 px-1 text-[10px] text-muted-foreground">
          {value.length} {value.length === 1 ? "character" : "characters"}
        </div>
      </div>
      <div className="flex justify-center md:justify-end">
        <Button
          size="default"
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className="active:scale-95 h-10 gap-2 px-8 text-base transition-all md:h-9 md:px-4 md:text-sm"
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
