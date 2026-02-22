import { Label, Button, Textarea } from "@skolist/ui";
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
      <Label htmlFor="generation-prompt">Custom Instructions (Optional)</Label>
      <div className="relative">
        <Textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className={cn(
            "min-h-[110px] resize-none pr-8",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Clear instructions"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {value.length > 0 && (
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-1 rounded pointer-events-none">
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
