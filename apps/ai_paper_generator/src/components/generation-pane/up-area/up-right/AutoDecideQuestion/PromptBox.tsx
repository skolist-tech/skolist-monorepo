import { Label, Button } from "@skolist/ui";
import { cn } from "@skolist/utils";
import { Sparkles, Loader2 } from "lucide-react";

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
        <textarea
          id="generation-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: &ldquo;Make 80% Objective and 20% Subjective&rdquo;"
          className={cn(
            "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 pb-10 pr-28",
            "text-sm ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "resize-none disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <div className="absolute bottom-3 right-3">
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={disabled || isGenerating}
            className="h-8 gap-2 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Generate Questions
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
