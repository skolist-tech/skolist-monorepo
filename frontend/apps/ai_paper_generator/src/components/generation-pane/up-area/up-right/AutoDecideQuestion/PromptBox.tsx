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
            "flex min-h-[110px] w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 transition-colors hover:border-primary/50",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "resize-none disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        {value && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-7 w-7 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={() => onChange("")}
            aria-label="Clear prompt"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {value.length > 0 && (
          <div className="absolute bottom-2 right-2 pointer-events-none rounded bg-background/80 px-1 text-[10px] text-muted-foreground border border-border/50">
            {value.length} {value.length === 1 ? "character" : "characters"}
          </div>
        )}
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
