import { useRef } from "react";
import {
  Button,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";

// Hooks
import { useQuestionCardState } from "./hooks/useQuestionCardState";
import { useQuestionAnimations } from "./hooks/useQuestionAnimations";
import { useQuestionVersioning } from "./hooks/useQuestionVersioning";
import { useQuestionHandlers } from "./hooks/useQuestionHandlers";

// Components
import { QuestionCardEditForm } from "./components/QuestionCardEditForm";
import { QuestionCardActions } from "./components/QuestionCardActions";
import { MobileBottomActions } from "./components/actions";
import { QuestionCardContent } from "./components/QuestionCardContent";
import { QuestionCardBottomBar } from "./components/QuestionCardBottomBar";
import { QuestionCardDialogs } from "./components/QuestionCardDialogs";
import {
  DisintegrationOverlay,
  AutoCorrectOverlay,
  RegenerateOverlay,
  ChatPromptOverlay,
  CameraCaptureOverlay,
} from "./components/QuestionAnimationOverlays";

// ============================================================================
// PROPS
// ============================================================================

interface GeneratedQuestionCardProps {
  question: GeneratedQuestionWithConcepts;
  onMoveToDraft: (id: string) => void;
  onRemoveFromDraft?: (id: string) => void;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
  onDelete?: (id: string) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDirectRegenerate?: () => void | Promise<void>;
  onRegenerate?: (
    prompt: string,
    files: File[],
    isCameraCapture?: boolean
  ) => Promise<void>;
  showReorder?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  isAnimating?: boolean;
  isDeleting?: boolean;
  onAutoCorrect?: (questionId: string) => Promise<void>;
  onRegenerateWithPrompt?: (
    questionId: string,
    prompt: string,
    files: File[],
    isCameraCapture?: boolean
  ) => Promise<void>;
  dragHandleProps?: Record<string, any>;
  isReadOnly?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GeneratedQuestionCard({
  question,
  onMoveToDraft,
  onRemoveFromDraft,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDirectRegenerate,
  onRegenerate,
  showReorder = false,
  isSelected = false,
  onSelect,
  isAnimating = false,
  isDeleting = false,
  onAutoCorrect,
  onRegenerateWithPrompt,
  dragHandleProps,
  isReadOnly = false,
}: GeneratedQuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // -- Hooks --
  const versioning = useQuestionVersioning({ question, onUpdate });

  const state = useQuestionCardState({
    question,
    onUpdate,
    onVersionCreated: versioning.refreshVersionState,
  });

  const anims = useQuestionAnimations({
    question,
    isAnimatingProp: isAnimating,
    isDeletingProp: isDeleting,
  });

  const handlers = useQuestionHandlers({
    question,
    cardRef,
    state,
    anims,
    refreshVersionState: versioning.refreshVersionState,
    onUpdate,
    onDelete,
    onMoveToDraft,
    onRemoveFromDraft,
    onDirectRegenerate,
    onRegenerate,
    onAutoCorrect,
    onRegenerateWithPrompt,
  });

  // -- Hidden Inputs (refs must stay mounted) --
  const HiddenInputs = (
    <>
      <input
        type="file"
        ref={state.fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={state.handleImageUpload}
      />
      <input
        type="file"
        multiple
        ref={state.attachmentInputRef}
        className="hidden"
        onChange={state.handleAttachmentSelect}
      />
      <input
        type="file"
        ref={state.cameraInputRef}
        className="hidden"
        // accept="image/*"
        onChange={state.handleCameraFileSelect}
      />
    </>
  );

  // -- Edit Mode --
  if (state.isEditing) {
    return (
      <>
        {HiddenInputs}
        <QuestionCardEditForm
          question={question}
          editedQuestion={state.editedQuestion}
          onUpdateField={state.updateField}
          onSave={state.handleSave}
          onCancel={state.handleCancel}
          isUploading={state.isUploading}
          onUploadClick={() => state.fileInputRef.current?.click()}
        />
      </>
    );
  }

  // -- Main View --
  return (
    <div
      ref={cardRef}
      className={`group relative min-h-[140px] rounded-lg border bg-background p-4 shadow-sm transition-all ${
        !isReadOnly && !anims.slideDirection && !anims.isDisintegrating
          ? "hover:-translate-y-1 hover:shadow-md active:scale-[0.99]"
          : ""
      } ${isSelected ? "border-primary ring-2 ring-primary" : ""} ${
        anims.slideDirection ? "pointer-events-none" : ""
      } ${anims.isDisintegrating ? "pointer-events-none" : ""}`}
      style={{
        animation:
          anims.slideDirection === "right"
            ? "slideOutRight 0.4s ease-in forwards"
            : anims.slideDirection === "left"
              ? "slideOutLeft 0.4s ease-in forwards"
              : anims.isDisintegrating
                ? "disintegrate 1.5s ease-out forwards"
                : "none",
      }}
    >
      {/* Read Only Overlay */}
      {isReadOnly && <div className="absolute inset-0 z-50 bg-transparent" />}

      {/* Animation Keyframes */}
      <style>{`
        @keyframes slideOutRight {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        @keyframes slideOutLeft {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes disintegrate {
          0% { opacity: 1; filter: blur(0px); transform: scale(1); }
          30% { opacity: 0.8; filter: blur(1px); transform: scale(1.02); }
          100% { opacity: 0; filter: blur(8px); transform: scale(0.95) translateY(-20px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {HiddenInputs}

      {/* --- Overlays --- */}
      {anims.isDisintegrating && (
        <DisintegrationOverlay particleData={anims.particleData} />
      )}
      {anims.isAutoCorrecting && (
        <AutoCorrectOverlay
          isReturning={anims.isReturning}
          sparkleOrigin={anims.sparkleOrigin}
        />
      )}
      {anims.isRegenerating && (
        <RegenerateOverlay
          isRegenerateReturning={anims.isRegenerateReturning}
          regenerateOrigin={anims.regenerateOrigin}
        />
      )}
      {anims.isChatPromptAnimating && <ChatPromptOverlay />}
      {anims.isCameraCapturing && (
        <CameraCaptureOverlay
          isReturning={anims.isCameraReturning}
          cameraOrigin={anims.cameraOrigin}
        />
      )}

      {/* --- Selection Checkbox --- */}
      {onSelect && (
        <div
          className={`absolute left-3 top-3.5 z-10 transition-opacity duration-200 ${
            !isSelected
              ? "md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
              : "opacity-100"
          }`}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            aria-label="Select question"
          />
        </div>
      )}

      {/* --- Actions Bar --- */}
      {!isReadOnly && (
        <QuestionCardActions
          question={question}
          onRemoveFromDraft={onRemoveFromDraft}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          isAutoCorrecting={anims.isAutoCorrecting}
          isUploading={state.isUploading}
          isRegenerating={anims.isRegenerating}
          isChatPromptAnimating={anims.isChatPromptAnimating}
          isCameraCapturing={anims.isCameraCapturing}
          slideDirection={anims.slideDirection}
          canUndo={versioning.canUndo}
          canRedo={versioning.canRedo}
          isUndoing={versioning.isUndoing}
          isRedoing={versioning.isRedoing}
          onAutoCorrect={handlers.handleAutoCorrect}
          onAttachClick={() => state.fileInputRef.current?.click()}
          onRegenerateClick={handlers.handleDirectRegenerate}
          onRegenerateWithPromptClick={() => state.setIsRegenerateOpen(true)}
          onCameraClick={() => state.cameraInputRef.current?.click()}
          onEditClick={() => state.setIsEditing(true)}
          onMoveToDraft={handlers.handleMoveToDraft}
          onRemoveFromDraftClick={handlers.handleRemoveFromDraft}
          onDeleteClick={() => state.setIsDeleteModalOpen(true)}
          onUndo={versioning.handleUndo}
          onRedo={versioning.handleRedo}
          autoCorrectBtnRef={anims.autoCorrectBtnRef}
          regenerateBtnRef={anims.regenerateBtnRef}
          cameraBtnRef={anims.cameraBtnRef}
        />
      )}

      {/* --- Dialogs & Popovers --- */}
      <QuestionCardDialogs
        question={question}
        state={state}
        onDeleteConfirm={handlers.handleDeleteWithAnimation}
        onRegenerateSubmit={handlers.handleRegenerateSubmit}
        onCameraCapture={handlers.handleCameraCapture}
      />

      {/* --- Card Content --- */}
      <QuestionCardContent
        question={question}
        state={state}
        isReadOnly={isReadOnly}
        onSelect={onSelect}
        onMarksUpdate={handlers.handleMarksUpdate}
        onHardnessUpdate={handlers.handleHardnessUpdate}
      />

      {/* --- Mobile Bottom Actions (Undo/Redo) - In document flow --- */}
      {!isReadOnly && (
        <MobileBottomActions
          canUndo={versioning.canUndo}
          canRedo={versioning.canRedo}
          isUndoing={versioning.isUndoing}
          isRedoing={versioning.isRedoing}
          onUndo={versioning.handleUndo}
          onRedo={versioning.handleRedo}
        />
      )}

      {/* --- Reorder Buttons --- */}
      {showReorder && (
        <div className="absolute -right-3 top-1/2 z-50 flex -translate-y-1/2 transform flex-col gap-1">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp?.();
                  }}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Move Up</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown?.();
                  }}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Move Down</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* --- Bottom Bar (drag handle, badges, info) --- */}
      <QuestionCardBottomBar
        question={question}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
}
