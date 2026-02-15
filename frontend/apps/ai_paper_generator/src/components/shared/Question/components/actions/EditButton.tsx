import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Edit2 } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface EditButtonProps extends ActionButtonProps {
  onEditClick: () => void;
}

export function EditButton({ mode, onEditClick }: EditButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={mode === "menu" ? "default" : "icon"}
            variant="ghost"
            className={mode === "menu" ? btnClass : undefined}
            onClick={(e) => handleMenuClick(e, mode, onEditClick)}
            type="button"
          >
            <Edit2
              className={`${iconSizeClass} text-muted-foreground hover:text-primary`}
            />
            {mode === "menu" && <span>Edit Question</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Edit Question</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
