import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Paperclip, Loader2 } from "lucide-react";
import {
  type ActionButtonProps,
  getButtonClasses,
  handleMenuClick,
} from "./types";

interface AttachmentButtonProps extends ActionButtonProps {
  isUploading: boolean;
  onAttachClick: () => void;
}

export function AttachmentButton({
  mode,
  isUploading,
  onAttachClick,
}: AttachmentButtonProps) {
  const { btnClass, iconSizeClass } = getButtonClasses(mode);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={mode === "menu" ? "default" : "icon"}
            variant="ghost"
            className={mode === "menu" ? btnClass : undefined}
            onClick={(e) => handleMenuClick(e, mode, onAttachClick)}
            disabled={isUploading}
            type="button"
          >
            {isUploading ? (
              <Loader2
                className={`${iconSizeClass} animate-spin text-muted-foreground`}
              />
            ) : (
              <Paperclip
                className={`${iconSizeClass} text-muted-foreground hover:text-primary`}
              />
            )}
            {mode === "menu" && <span>Attach Figure</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Attach Figure</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
