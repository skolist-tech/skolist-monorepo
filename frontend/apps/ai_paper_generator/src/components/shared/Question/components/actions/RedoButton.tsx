import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Redo2, Loader2 } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface RedoButtonProps extends ActionButtonProps {
  canRedo: boolean;
  isRedoing: boolean;
  onRedo: () => void;
}

export function RedoButton({
  mode,
  canRedo,
  isRedoing,
  onRedo,
}: RedoButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={mode === "menu" ? "default" : "icon"}
            className={
              mode === "menu"
                ? btnClass
                : `h-8 w-8 ${canRedo ? "text-muted-foreground hover:text-primary" : "cursor-not-allowed text-muted-foreground/50"}`
            }
            disabled={!canRedo || isRedoing}
            onClick={(e) => handleMenuClick(e, mode, onRedo)}
            type="button"
          >
            {isRedoing ? (
              <Loader2 className={`${iconSizeClass} animate-spin`} />
            ) : (
              <Redo2
                className={`${iconSizeClass} ${!canRedo ? "opacity-50" : ""}`}
              />
            )}
            {mode === "menu" && <span>Redo</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
