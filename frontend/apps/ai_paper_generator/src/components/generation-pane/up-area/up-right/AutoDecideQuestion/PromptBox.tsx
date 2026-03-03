import { Button, Textarea } from "@skolist/ui";
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
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className="min-h-[110px] resize-none pr-20"
          maxLength={maxLength}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full p-1 transition-colors hover:bg-muted"
              title="Clear text"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          <span className="pointer-events-none rounded bg-background/80 px-1 text-[10px] text-muted-foreground tabular-nums">
            {value.length}/{maxLength}
          </span>
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
