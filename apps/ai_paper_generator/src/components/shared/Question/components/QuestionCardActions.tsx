import { Button, Popover, PopoverContent, PopoverTrigger } from "@skolist/ui";
import { MoreVertical } from "lucide-react";
import { CARD_ACTIONS_CONFIG, type ActionId } from "../card-actions-config";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import {
  UndoButton,
  RedoButton,
  AutoCorrectButton,
  AttachmentButton,
  RegenerateButton,
  RegenerateWithPromptButton,
  CameraCaptureButton,
  EditButton,
  MoveButton,
  DeleteButton,
} from "./actions";

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
    switch (actionId) {
      case "undo":
        return (
          <UndoButton
            mode={mode}
            canUndo={canUndo}
            isUndoing={isUndoing}
            onUndo={onUndo}
          />
        );
      case "redo":
        return (
          <RedoButton
            mode={mode}
            canRedo={canRedo}
            isRedoing={isRedoing}
            onRedo={onRedo}
          />
        );
      case "auto_correct":
        return (
          <AutoCorrectButton
            mode={mode}
            isAutoCorrecting={isAutoCorrecting}
            onAutoCorrect={onAutoCorrect}
            btnRef={autoCorrectBtnRef}
          />
        );
      case "attachment":
        return (
          <AttachmentButton
            mode={mode}
            isUploading={isUploading}
            onAttachClick={onAttachClick}
          />
        );
      case "regenerate":
        return (
          <RegenerateButton
            mode={mode}
            isRegenerating={isRegenerating}
            onRegenerateClick={onRegenerateClick}
            btnRef={regenerateBtnRef}
          />
        );
      case "regenerate_with_prompt":
        return (
          <RegenerateWithPromptButton
            mode={mode}
            isChatPromptAnimating={isChatPromptAnimating}
            onRegenerateWithPromptClick={onRegenerateWithPromptClick}
            hasOnRegenerate={!!onRegenerate}
          />
        );
      case "camera_capture":
        return (
          <CameraCaptureButton
            mode={mode}
            isChatPromptAnimating={isChatPromptAnimating}
            isCameraCapturing={isCameraCapturing}
            onCameraClick={onCameraClick}
            hasOnRegenerate={!!onRegenerate}
            btnRef={cameraBtnRef}
          />
        );
      case "edit":
        return <EditButton mode={mode} onEditClick={onEditClick} />;
      case "move":
        return (
          <MoveButton
            mode={mode}
            isInDraft={question.is_in_draft}
            hasOnRemoveFromDraft={!!onRemoveFromDraft}
            slideDirection={slideDirection}
            onMoveToDraft={onMoveToDraft}
            onRemoveFromDraftClick={onRemoveFromDraftClick}
          />
        );
      case "delete":
        return (
          <DeleteButton
            mode={mode}
            hasOnDelete={!!onDelete}
            onDeleteClick={onDeleteClick}
          />
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
    <>
      {/* Main Actions Container - Top Right */}
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
    </>
  );
}
