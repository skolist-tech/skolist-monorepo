import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { MessageSquare } from "lucide-react";
import { type ActionButtonProps, getButtonClasses } from "./types";

interface RegenerateWithPromptButtonProps extends ActionButtonProps {
  isChatPromptAnimating: boolean;
  onRegenerateWithPromptClick: (e: React.MouseEvent) => void;
  hasOnRegenerate: boolean;
}

export function RegenerateWithPromptButton({
  mode,
  isChatPromptAnimating,
  onRegenerateWithPromptClick,
  hasOnRegenerate,
}: RegenerateWithPromptButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={mode === "menu" ? "default" : "icon"}
            variant="ghost"
            className={mode === "menu" ? btnClass : undefined}
            disabled={!hasOnRegenerate || isChatPromptAnimating}
            onClick={(e) => {
              e.stopPropagation();
              onRegenerateWithPromptClick(e);
            }}
            type="button"
          >
            <MessageSquare
              className={`${iconSizeClass} text-muted-foreground hover:text-primary ${isChatPromptAnimating ? "opacity-50" : ""}`}
              style={{ transform: "scaleX(-1)" }}
            />
            {mode === "menu" && <span>Regenerate with Prompt</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Regenerate with Prompt</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
