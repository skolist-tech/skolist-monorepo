import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { Camera } from "lucide-react";
import { type ActionButtonProps, getButtonClasses } from "./types";

interface CameraCaptureButtonProps extends ActionButtonProps {
  isChatPromptAnimating: boolean;
  isCameraCapturing: boolean;
  onCameraClick: () => void;
  hasOnRegenerate: boolean;
  btnRef?: React.RefObject<HTMLButtonElement>;
}

export function CameraCaptureButton({
  mode,
  isChatPromptAnimating,
  isCameraCapturing,
  onCameraClick,
  hasOnRegenerate,
  btnRef,
}: CameraCaptureButtonProps) {
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
            disabled={
              !hasOnRegenerate || isChatPromptAnimating || isCameraCapturing
            }
            onClick={(e) => {
              e.stopPropagation();
              onCameraClick();
            }}
            type="button"
          >
            <Camera
              className={`${iconSizeClass} text-muted-foreground hover:text-primary ${isChatPromptAnimating || isCameraCapturing ? "opacity-50" : ""}`}
            />
            {mode === "menu" && <span>Capture Photo</span>}
          </Button>
        </TooltipTrigger>
        {mode === "icon" && (
          <TooltipContent>
            <p>Capture Photo</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
