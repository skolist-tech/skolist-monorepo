import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Sparkles } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface AutoCorrectButtonProps extends ActionButtonProps {
  isAutoCorrecting: boolean;
  onAutoCorrect: () => void;
  btnRef?: React.RefObject<HTMLButtonElement>;
}

export function AutoCorrectButton({
  mode,
  isAutoCorrecting,
  onAutoCorrect,
  btnRef,
}: AutoCorrectButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={mode === "icon" ? btnRef : undefined}
            size={mode === "menu" ? "default" : "icon"}
            variant="ghost"
            className={mode === "menu" ? btnClass : undefined}
            onClick={(e) => handleMenuClick(e, mode, onAutoCorrect)}
            disabled={isAutoCorrecting}
            type="button"
          >
            <Sparkles
              className={`${iconSizeClass} text-yellow-400 ${isAutoCorrecting ? "opacity-50" : ""}`}
            />
            {mode === "menu" && <span>Auto-Correct</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Auto-Correct Question</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
