import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface MoveButtonProps extends ActionButtonProps {
  isInDraft: boolean;
  hasOnRemoveFromDraft: boolean;
  slideDirection: "left" | "right" | null;
  onMoveToDraft: () => void;
  onRemoveFromDraftClick: () => void;
}

export function MoveButton({
  mode,
  isInDraft,
  hasOnRemoveFromDraft,
  slideDirection,
  onMoveToDraft,
  onRemoveFromDraftClick,
}: MoveButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  if (isInDraft && hasOnRemoveFromDraft) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={mode === "menu" ? "default" : "icon"}
              variant="ghost"
              className={mode === "menu" ? btnClass : undefined}
              onClick={(e) => handleMenuClick(e, mode, onRemoveFromDraftClick)}
              disabled={slideDirection !== null}
              type="button"
            >
              <ArrowLeft
                className={`${iconSizeClass} text-red-500 hover:text-red-700 ${slideDirection ? "opacity-50" : ""}`}
              />
              {mode === "menu" && <span>Remove from Draft</span>}
            </Button>
          </TooltipTrigger>
          {mode === "icon" && (
            <TooltipContent>
              <p>Remove from Draft</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  } else if (!isInDraft) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={mode === "menu" ? "default" : "icon"}
              variant="ghost"
              className={mode === "menu" ? btnClass : undefined}
              onClick={(e) => handleMenuClick(e, mode, onMoveToDraft)}
              disabled={slideDirection !== null}
              type="button"
            >
              <ArrowRight
                className={`${iconSizeClass} text-orange-500 hover:text-orange-700 ${slideDirection ? "opacity-50" : ""}`}
                strokeWidth={3}
              />
              {mode === "menu" && <span>Move to Draft</span>}
            </Button>
          </TooltipTrigger>
          {mode === "icon" && (
            <TooltipContent>
              <p>Move to Draft</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }
  return null;
}
