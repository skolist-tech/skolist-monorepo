import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface RegenerateButtonProps extends ActionButtonProps {
  isRegenerating: boolean;
  onRegenerateClick: () => void;
  btnRef?: React.RefObject<HTMLButtonElement>;
}

export function RegenerateButton({
  mode,
  isRegenerating,
  onRegenerateClick,
  btnRef,
}: RegenerateButtonProps) {
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
            onClick={(e) => handleMenuClick(e, mode, onRegenerateClick)}
            disabled={isRegenerating}
            type="button"
          >
            {isRegenerating ? (
              <Loader2 className={`${iconSizeClass} animate-spin`} />
            ) : (
              <RefreshCw
                className={`${iconSizeClass} text-muted-foreground hover:text-primary`}
              />
            )}
            {mode === "menu" && (
              <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
            )}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Regenerate Question</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
