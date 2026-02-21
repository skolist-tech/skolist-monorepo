import { Label, Button } from "@skolist/ui";
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
  return (
    <div className="space-y-2">
      <Label
        htmlFor="generation-prompt"
        className="text-xs font-medium text-muted-foreground"
      >
        Custom Instructions (Optional)
      </Label>
      <div className="group/prompt relative">
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
            "text-sm ring-offset-background placeholder:text-muted-foreground transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "resize-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-primary/50"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground md:opacity-0 md:group-hover/prompt:opacity-100"
            aria-label="Clear prompt"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/80 px-1 text-[10px] text-muted-foreground opacity-40 transition-opacity group-focus-within/prompt:opacity-100">
          {value.length} {value.length === 1 ? "character" : "characters"}
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
