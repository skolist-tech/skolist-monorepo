import { Button, Label, Textarea } from "@skolist/ui";
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
      <Label htmlFor="generation-prompt">Custom Instructions (Optional)</Label>
      <div className="relative">
        <Textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={1000}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className="min-h-[110px] resize-none pr-10"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-2 p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear instructions"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {value.length > 0 && (
          <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/80 px-1 text-[10px] text-muted-foreground">
            {value.length} {value.length === 1 ? "character" : "characters"}
          </div>
        )}
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
