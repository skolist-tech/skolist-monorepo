import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Trash2 } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface DeleteButtonProps extends ActionButtonProps {
  hasOnDelete: boolean;
  onDeleteClick: () => void;
}

export function DeleteButton({
  mode,
  hasOnDelete,
  onDeleteClick,
}: DeleteButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  if (!hasOnDelete) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={mode === "menu" ? "default" : "icon"}
            variant="ghost"
            className={mode === "menu" ? btnClass : undefined}
            onClick={(e) => handleMenuClick(e, mode, onDeleteClick)}
            type="button"
          >
            <Trash2
              className={`${iconSizeClass} text-red-500 hover:text-red-700`}
            />
            {mode === "menu" && <span>Delete Question</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Delete Question</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
