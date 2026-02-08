import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Undo2, Loader2 } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface UndoButtonProps extends ActionButtonProps {
  canUndo: boolean;
  isUndoing: boolean;
  onUndo: () => void;
}

export function UndoButton({
  mode,
  canUndo,
  isUndoing,
  onUndo,
}: UndoButtonProps) {
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
                : `h-8 w-8 ${canUndo ? "text-muted-foreground hover:text-primary" : "cursor-not-allowed text-muted-foreground/50"}`
            }
            disabled={!canUndo || isUndoing}
            onClick={(e) => handleMenuClick(e, mode, onUndo)}
            type="button"
          >
            {isUndoing ? (
              <Loader2 className={`${iconSizeClass} animate-spin`} />
            ) : (
              <Undo2
                className={`${iconSizeClass} ${!canUndo ? "opacity-50" : ""}`}
              />
            )}
            {mode === "menu" && <span>Undo</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
