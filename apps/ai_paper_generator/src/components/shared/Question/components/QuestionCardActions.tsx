import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import {
  Undo2,
  Redo2,
  Sparkles,
  Paperclip,
  Loader2,
  RefreshCw,
  MessageSquare,
  Camera,
  Edit2,
  ArrowLeft,
  ArrowRight,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { CARD_ACTIONS_CONFIG, type ActionId } from "../card-actions-config";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface QuestionCardActionsProps {
  question: GeneratedQuestionWithConcepts;
  onRemoveFromDraft?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (prompt: string, files: File[]) => void;

  // State from hooks
  isAutoCorrecting: boolean;
  isUploading: boolean;
  isRegenerating: boolean;
  isChatPromptAnimating: boolean;
  isCameraCapturing: boolean;
  slideDirection: "left" | "right" | null;

  // Undo/Redo state
  canUndo: boolean;
  canRedo: boolean;
  isUndoing: boolean;
  isRedoing: boolean;

  // Handlers
  onAutoCorrect: () => void;
  onAttachClick: () => void;
  onRegenerateClick: () => void;
  onRegenerateWithPromptClick: (e: React.MouseEvent) => void;
  onCameraClick: () => void;
  onEditClick: () => void;
  onMoveToDraft: () => void;
  onRemoveFromDraftClick: () => void;
  onDeleteClick: () => void;
  onUndo: () => void;
  onRedo: () => void;

  // Refs for animations
  autoCorrectBtnRef: React.RefObject<HTMLButtonElement>;
  regenerateBtnRef: React.RefObject<HTMLButtonElement>;
  cameraBtnRef: React.RefObject<HTMLButtonElement>;
}

export function QuestionCardActions({
  question,
  onRemoveFromDraft,
  onDelete,
  onRegenerate,

  isAutoCorrecting,
  isUploading,
  isRegenerating,
  isChatPromptAnimating,
  isCameraCapturing,
  slideDirection,

  canUndo,
  canRedo,
  isUndoing,
  isRedoing,

  onAutoCorrect,
  onAttachClick,
  onRegenerateClick,
  onRegenerateWithPromptClick,
  onCameraClick,
  onEditClick,
  onMoveToDraft,
  onRemoveFromDraftClick,
  onDeleteClick,
  onUndo,
  onRedo,

  autoCorrectBtnRef,
  regenerateBtnRef,
  cameraBtnRef,
}: QuestionCardActionsProps) {
  const ActionButton = ({
    actionId,
    mode,
  }: {
    actionId: ActionId;
    mode: "icon" | "menu";
  }) => {
    const btnClass =
      mode === "menu"
        ? "flex w-full cursor-pointer items-center justify-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
        : "";
    const iconSizeClass = mode === "menu" ? "h-4 w-4" : "h-4 w-4";

    switch (actionId) {
      case "undo":
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
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onUndo();
                  }}
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
      case "redo":
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
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onRedo();
                  }}
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
      case "auto_correct":
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={mode === "icon" ? autoCorrectBtnRef : undefined}
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onAutoCorrect();
                  }}
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
      case "attachment":
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onAttachClick();
                  }}
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
      case "regenerate":
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={mode === "icon" ? regenerateBtnRef : undefined}
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onRegenerateClick();
                  }}
                  disabled={isRegenerating}
                  type="button"
                >
                  <RefreshCw
                    className={`${iconSizeClass} text-muted-foreground hover:text-primary ${isRegenerating ? "opacity-50" : ""}`}
                  />
                  {mode === "menu" && <span>Regenerate</span>}
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
      case "regenerate_with_prompt":
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  disabled={!onRegenerate || isChatPromptAnimating}
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
      case "camera_capture":
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={mode === "icon" ? cameraBtnRef : undefined}
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  disabled={
                    !onRegenerate || isChatPromptAnimating || isCameraCapturing
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
      case "edit":
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onEditClick();
                  }}
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
      case "move":
        if (question.is_in_draft && onRemoveFromDraft) {
          return (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={mode === "menu" ? "default" : "icon"}
                    variant="ghost"
                    className={mode === "menu" ? btnClass : undefined}
                    onClick={(e) => {
                      if (mode === "menu") e.stopPropagation();
                      onRemoveFromDraftClick();
                    }}
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
        } else if (!question.is_in_draft) {
          return (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size={mode === "menu" ? "default" : "icon"}
                    variant="ghost"
                    className={mode === "menu" ? btnClass : undefined}
                    onClick={(e) => {
                      if (mode === "menu") e.stopPropagation();
                      onMoveToDraft();
                    }}
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
      case "delete":
        if (!onDelete) return null;
        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size={mode === "menu" ? "default" : "icon"}
                  variant="ghost"
                  className={mode === "menu" ? btnClass : undefined}
                  onClick={(e) => {
                    if (mode === "menu") e.stopPropagation();
                    onDeleteClick();
                  }}
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
      default:
        return null;
    }
  };

  const desktopActions = [...CARD_ACTIONS_CONFIG]
    .filter((a) => a.desktop.visible)
    .sort((a, b) => a.desktop.order - b.desktop.order);

  const mobileCardActions = [...CARD_ACTIONS_CONFIG]
    .filter((a) => a.mobile.visible && a.mobile.location === "card")
    .sort((a, b) => a.mobile.order - b.mobile.order);

  const mobileMenuActions = [...CARD_ACTIONS_CONFIG]
    .filter((a) => a.mobile.visible && a.mobile.location === "menu")
    .sort((a, b) => a.mobile.order - b.mobile.order);

  return (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-background/80 p-1 backdrop-blur-sm">
      {/* DESKTOP VIEW */}
      <div className="hidden items-center md:flex">
        {desktopActions.map((action) => (
          <ActionButton key={action.id} actionId={action.id} mode="icon" />
        ))}
      </div>

      {/* MOBILE VIEW */}
      <div className="flex items-center md:hidden">
        {/* Mobile Card Actions */}
        {mobileCardActions.map((action) => (
          <ActionButton key={action.id} actionId={action.id} mode="icon" />
        ))}

        {/* Mobile Menu Actions */}
        {mobileMenuActions.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 bg-background p-2"
              align="end"
              container={document.getElementById("layout-portal-root")}
            >
              <div className="flex flex-col gap-1">
                {mobileMenuActions.map((action) => (
                  <ActionButton
                    key={action.id}
                    actionId={action.id}
                    mode="menu"
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
