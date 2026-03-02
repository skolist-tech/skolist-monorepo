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
      <div className="relative group">
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
            "min-h-[110px] resize-none pr-20 transition-all focus:shadow-sm",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />

        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Clear prompt"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="pointer-events-none rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-transparent group-focus-within:border-input transition-colors">
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
