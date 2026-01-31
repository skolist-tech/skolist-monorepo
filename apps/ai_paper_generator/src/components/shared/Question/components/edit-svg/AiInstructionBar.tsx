import { Input, Button } from "@skolist/ui";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface AiInstructionBarProps {
  /** Current instruction text */
  instruction: string;
  /** Callback when instruction changes */
  onInstructionChange: (instruction: string) => void;
  /** Callback to submit the instruction */
  onSubmit: () => void;
  /** Whether AI is currently processing */
  isLoading: boolean;
}

/**
 * AI instruction input bar with gradient styling
 * Allows users to describe SVG edits in natural language
 */
export function AiInstructionBar({
  instruction,
  onInstructionChange,
  onSubmit,
  isLoading,
}: AiInstructionBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && instruction.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-2 sm:p-3">
      <Sparkles className="h-4 w-4 shrink-0 text-purple-500 sm:h-5 sm:w-5" />
      <Input
        placeholder="Describe changes... (e.g., 'Move label left')"
        value={instruction}
        onChange={(e) => onInstructionChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="flex-1 border-0 bg-transparent text-sm focus-visible:ring-0"
      />
      <Button
        size="sm"
        onClick={onSubmit}
        disabled={isLoading || !instruction.trim()}
        className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 p-0 text-white hover:from-purple-600 hover:to-blue-600 sm:h-auto sm:w-auto sm:px-3"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
