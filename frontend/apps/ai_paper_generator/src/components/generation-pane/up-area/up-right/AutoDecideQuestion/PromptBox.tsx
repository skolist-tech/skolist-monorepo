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
      <div className="relative">
        <textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={1000}
          placeholder="(Optional) Add any special requirements for the questions like:
• Examples: NCERT-style wording, numercial/subjective questions only, include tricky ones.
• Feel free to specify any constraints you need.
"
          className={cn(
            "flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "resize-none disabled:cursor-not-allowed disabled:opacity-50 pr-20"
          )}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2 pointer-events-none">
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="pointer-events-auto rounded-full p-1 hover:bg-muted text-muted-foreground transition-colors"
              title="Clear text"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <span className="text-[10px] text-muted-foreground bg-background/80 px-1 rounded tabular-nums">
            {value.length}/1000
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
