import { useRef } from "react";
import { formatQuestionType } from "../../../utils/formatters";
import {
  Button,
  Badge,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useToast,
} from "@skolist/ui";
import {
  ChevronUp,
  ChevronDown,
  Info,
  GripVertical,
  Lightbulb,
  Dumbbell,
} from "lucide-react";
import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";
import { updateQuestion } from "../../../services/questionService";
import { fastApiService } from "../../../services/fastApiService";
import type { HardnessLevel } from "@skolist/db";
import { QuestionMarks } from "./QuestionMarks";
import { QuestionTags } from "./QuestionTags";
import { QuestionText } from "./QuestionText";
import { QuestionOptions } from "./QuestionOptions";
import { QuestionMatchTheFollowing } from "./QuestionMatchTheFollowing";
import { QuestionImages } from "./QuestionImages";
import { ExplanationToggle } from "./ExplanationToggle";
import { AnswerToggle } from "./AnswerToggle";
import { ConfirmDialog } from "../ConfirmDialog";

// Hooks
import { useQuestionCardState } from "./hooks/useQuestionCardState";
import { useQuestionAnimations } from "./hooks/useQuestionAnimations";

// Components
import { QuestionCardEditForm } from "./components/QuestionCardEditForm";
import { QuestionCardActions } from "./components/QuestionCardActions";
import { RegeneratePopover } from "./components/RegeneratePopover";
import {
  DisintegrationOverlay,
  AutoCorrectOverlay,
  RegenerateOverlay,
  ChatPromptOverlay,
  CameraCaptureOverlay,
} from "./components/QuestionAnimationOverlays";
import { EditSvgDialog } from "./components/EditSvgDialog";
import { CameraCaptureDialog } from "./components/CameraCaptureDialog";

interface GeneratedQuestionCardProps {
  question: GeneratedQuestionWithConcepts;
  onMoveToDraft: (id: string) => void;
  onRemoveFromDraft?: (id: string) => void;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
  onDelete?: (id: string) => Promise<void>;
  onDirectRegenerate?: () => void;
  onRegenerate?: (
    prompt: string,
    files: File[],
    isCameraCapture?: boolean
  ) => void;
  index?: number; // Kept for reference if needed, but won't be displayed as rank
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  showReorder?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  isAnimating?: boolean; // External trigger for slide animation (used for bulk moves)
  isDeleting?: boolean; // External trigger for delete animation (used for bulk deletes)
  onAutoCorrect?: (questionId: string) => Promise<void>; // Optional override for auto-correct (useful for Storybook)
  onRegenerateWithPrompt?: (
    questionId: string,
    prompt: string,
    files: File[],
    isCameraCapture?: boolean
  ) => Promise<void>; // Optional override for regenerate with prompt (useful for Storybook)
  dragHandleProps?: Record<string, any>;
  isReadOnly?: boolean;
}

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
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  // -- Hooks --
  const state = useQuestionCardState({ question, onUpdate });
  const anims = useQuestionAnimations({
    question,
    isAnimatingProp: isAnimating,
    isDeletingProp: isDeleting,
  });

  // -- Handlers (Logic bridging hooks and props) --

  const handleMarksUpdate = async (newMarks: number) => {
    try {
      await updateQuestion(question.id, { marks: newMarks });
      if (onUpdate) {
        onUpdate({ ...question, marks: newMarks });
      }
      toast({
        title: "Marks Updated",
        description: `Marks updated to ${newMarks}.`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Failed to update marks:", error);
      toast({
        title: "Error",
        description: "Failed to update marks.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleHardnessUpdate = async (newHardness: HardnessLevel) => {
    try {
      await updateQuestion(question.id, { hardness_level: newHardness });
      if (onUpdate) {
        onUpdate({ ...question, hardness_level: newHardness });
      }
      toast({
        title: "Difficulty Updated",
        description: `Difficulty updated to ${newHardness}.`,
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Failed to update hardness:", error);
      toast({
        title: "Error",
        description: "Failed to update difficulty level.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteWithAnimation = async () => {
    state.setIsDeleteModalOpen(false);
    anims.setIsDisintegrating(true);
    // Wait for disintegration animation to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (onDelete) {
      await onDelete(question.id);
    }
  };

  const handleAutoCorrect = async () => {
    // 1. Calculate animation origin
    if (cardRef.current && anims.autoCorrectBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = anims.autoCorrectBtnRef.current.getBoundingClientRect();
      anims.setSparkleOrigin({
        top: btnRect.top - cardRect.top + 6,
        right: cardRect.right - btnRect.right + 6,
      });
    }

    try {
      // 2. Start Animation
      anims.setIsAutoCorrecting(true);
      anims.setIsReturning(false);

      // 3. Tiny yield to let the browser paint the "start" of the animation
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 4. API Call
      if (onAutoCorrect) {
        await onAutoCorrect(question.id);
      } else {
        await fastApiService.autoCorrectQuestion(question.id);
      }

      // 6. Finish Animation
      anims.setIsReturning(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to auto-correct question", error);
      alert("Failed to auto-correct question");
    } finally {
      anims.setIsAutoCorrecting(false);
      anims.setIsReturning(false);
    }
  };

  const handleDirectRegenerate = async () => {
    // Calculate the position of the button relative to the card before starting animation
    if (cardRef.current && anims.regenerateBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = anims.regenerateBtnRef.current.getBoundingClientRect();

      const relativeTop = btnRect.top - cardRect.top + 6;
      const relativeRight = cardRect.right - btnRect.right + 6;

      anims.setRegenerateOrigin({ top: relativeTop, right: relativeRight });
    }

    try {
      anims.setIsRegenerating(true);
      anims.setIsRegenerateReturning(false);

      // Call the regenerate API or use the optional override
      if (onDirectRegenerate) {
        await Promise.resolve(onDirectRegenerate());
      } else {
        await fastApiService.regenerateQuestion(question.id);
      }

      // Trigger return animation
      anims.setIsRegenerateReturning(true);
      // Wait for return animation to complete before hiding
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to regenerate question", error);
      alert("Failed to regenerate question");
    } finally {
      anims.setIsRegenerating(false);
      anims.setIsRegenerateReturning(false);
    }
  };

  const handleRegenerateSubmit = async () => {
    if (
      onRegenerate &&
      (state.prompt.trim() || state.attachedFiles.length > 0)
    ) {
      // Close the popover first
      state.setIsRegenerateOpen(false);

      try {
        // Store current question text to detect when it changes
        anims.questionTextAtAnimationStart.current = question.question_text;
        anims.setIsChatPromptAnimating(true);

        // If there's an override for regenerate with prompt (Storybook), call it
        if (onRegenerateWithPrompt) {
          await onRegenerateWithPrompt(
            question.id,
            state.prompt,
            state.attachedFiles
          );
          // For Storybook, wait 1 second then stop animation manually since question won't change
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          // Call the actual regenerate function and await its completion
          // This ensures the animation stops properly on both success and failure
          await onRegenerate(state.prompt, state.attachedFiles);
          // Give a brief moment for the question data to update via refetch
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("Failed during regenerate with prompt", error);
      } finally {
        // Always stop the animation and clear state, regardless of success or failure
        anims.setIsChatPromptAnimating(false);
        state.setPrompt("");
        state.setAttachedFiles([]);
        anims.questionTextAtAnimationStart.current = null;
      }
    }
  };

  const handleMoveToDraft = async () => {
    anims.setSlideDirection("right");
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
    onMoveToDraft(question.id);

    // Show success toast
    toast({
      title: "Moved to Draft",
      description: "1 question moved to draft successfully.",
      className: "bg-green-500 text-white border-green-600",
    });
  };

  const handleRemoveFromDraft = async () => {
    if (!onRemoveFromDraft) return;
    anims.setSlideDirection("left");
    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, 400));
    onRemoveFromDraft(question.id);
  };

  // Camera capture handler - sends photo to regenerate with prompt endpoint
  const handleCameraCapture = async (file: File, customPrompt?: string) => {
    // Default prompt if none provided
    const defaultPrompt = `I've captured an image as a reference. Please analyze this image and regenerate the question based on its content. If it contains a diagram, figure, or mathematical expression, incorporate it appropriately. If it shows text or a problem, use that as context to improve or modify the current question.`;
    const cameraPrompt = customPrompt || defaultPrompt;

    // Calculate animation origin from camera button
    if (cardRef.current && anims.cameraBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = anims.cameraBtnRef.current.getBoundingClientRect();
      anims.setCameraOrigin({
        top: btnRect.top - cardRect.top + 6,
        right: cardRect.right - btnRect.right + 6,
      });
    }

    try {
      // Start camera animation
      anims.setIsCameraCapturing(true);
      anims.setIsCameraReturning(false);

      // Tiny yield to let the browser paint the "start" of the animation
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (onRegenerateWithPrompt) {
        await onRegenerateWithPrompt(question.id, cameraPrompt, [file], true);
      } else if (onRegenerate) {
        await onRegenerate(cameraPrompt, [file], true);
      } else {
        // Fallback to fastApiService directly
        await fastApiService.regenerateQuestionWithPrompt(
          question.id,
          cameraPrompt,
          [file],
          true
        );
      }

      // Trigger return animation
      anims.setIsCameraReturning(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast({
        title: "Photo Processed",
        description: "Question regenerated based on the captured image.",
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Failed to process captured image:", error);
      toast({
        title: "Error",
        description: "Failed to process the captured image.",
        variant: "destructive",
      });
    } finally {
      anims.setIsCameraCapturing(false);
      anims.setIsCameraReturning(false);
    }
  };

  const isMcqOrMsq = ["mcq4", "msq4"].includes(question.question_type);

  // -- Render --

  // Always render hidden inputs so refs stay valid
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

  // Hidden File Inputs for Main View (Uploads)
  // We render these via the Action wrapper logic or hooks logic, but the refs need to be available.
  // Actually, the refs are in the hook. We can just use them.

  return (
    <div
      ref={cardRef}
      className={`group relative min-h-[140px] rounded-lg border bg-background p-4 shadow-sm transition-all hover:shadow-md ${
        isSelected ? "border-primary ring-2 ring-primary" : ""
      } ${anims.slideDirection ? "pointer-events-none" : ""} ${anims.isDisintegrating ? "pointer-events-none" : ""}`}
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
      {/* Read Only Overlay / Pointer Events Control */}
      {isReadOnly && <div className="absolute inset-0 z-50 bg-transparent" />}

      {/* Slide Animation Styles */}
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
      `}</style>

      {/* Hidden Inputs (Hoisted) */}
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

      {/* --- Selection --- */}
      {onSelect && (
        <div className="absolute left-3 top-3.5 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            aria-label="Select question"
          />
        </div>
      )}

      {/* --- Actions --- */}
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
          onAutoCorrect={handleAutoCorrect}
          onAttachClick={() => state.fileInputRef.current?.click()}
          onRegenerateClick={handleDirectRegenerate}
          onRegenerateWithPromptClick={() => state.setIsRegenerateOpen(true)}
          onCameraClick={() => state.cameraInputRef.current?.click()}
          onEditClick={() => state.setIsEditing(true)}
          onMoveToDraft={handleMoveToDraft}
          onRemoveFromDraftClick={handleRemoveFromDraft}
          onDeleteClick={() => state.setIsDeleteModalOpen(true)}
          autoCorrectBtnRef={anims.autoCorrectBtnRef}
          regenerateBtnRef={anims.regenerateBtnRef}
          cameraBtnRef={anims.cameraBtnRef}
        />
      )}

      {/* --- Dialogs --- */}
      <ConfirmDialog
        open={state.isDeleteModalOpen}
        onOpenChange={state.setIsDeleteModalOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        onConfirm={handleDeleteWithAnimation}
        variant="destructive"
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={state.isDeleteImageModalOpen}
        onOpenChange={state.setIsDeleteImageModalOpen}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        onConfirm={state.confirmDeleteImage}
        variant="destructive"
        confirmLabel="Delete"
      />

      <EditSvgDialog
        image={state.imageToEdit}
        open={state.isEditSvgOpen}
        onOpenChange={state.setIsEditSvgOpen}
        onSave={state.handleSaveSvg}
        onAiUpdate={state.handleAiSvgUpdate}
        isSaving={state.isSavingSvg}
      />

      <CameraCaptureDialog
        open={state.isCameraOpen}
        onOpenChange={(open) => {
          state.setIsCameraOpen(open);
          if (!open) state.setSelectedCameraFile(null);
        }}
        initialFile={state.selectedCameraFile}
        onCapture={handleCameraCapture}
      />

      {/* --- Popover --- */}
      <RegeneratePopover
        isOpen={state.isRegenerateOpen}
        onOpenChange={state.setIsRegenerateOpen}
        prompt={state.prompt}
        setPrompt={state.setPrompt}
        attachedFiles={state.attachedFiles}
        isAttaching={state.isAttaching}
        onRemoveAttachment={state.handleRemoveAttachment}
        onRegenerateSubmit={handleRegenerateSubmit}
        onAttachmentClick={() => state.attachmentInputRef.current?.click()}
      />

      {/* --- Card Content --- */}
      <div className={`mb-2 space-y-3 pr-16 ${onSelect ? "pl-6" : ""}`}>
        {/* Meta info (Type, Marks, Hardness) */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {question.is_solved_example && (
            <div className="hidden items-center gap-2 md:flex">
              <Badge
                variant="secondary"
                className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100"
              >
                <Lightbulb className="h-3 w-3" />
                Solved Example
              </Badge>
              <span>•</span>
            </div>
          )}
          {question.is_exercise_question && ( // Use is_exercise_question based on DB schema
            <div className="hidden items-center gap-2 md:flex">
              <Badge
                variant="secondary"
                className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100"
              >
                <Dumbbell className="h-3 w-3" />
                Exercise
              </Badge>
              <span>•</span>
            </div>
          )}
          <Badge variant="outline" className="capitalize">
            {question.question_type === "match_the_following" ? (
              <>
                <span className="inline md:hidden">Match</span>
                <span className="hidden md:inline">
                  {formatQuestionType(question.question_type)}
                </span>
              </>
            ) : (
              formatQuestionType(question.question_type)
            )}
          </Badge>
          <span>•</span>
          <QuestionMarks
            marks={question.marks}
            editable={!isReadOnly}
            onUpdate={handleMarksUpdate}
          />
          <span>•</span>
          <QuestionTags
            hardness={question.hardness_level}
            concepts={[]}
            editable={!isReadOnly}
            onHardnessUpdate={handleHardnessUpdate}
          />
        </div>

        {/* Reorder Buttons */}
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

        {/* Question Text */}
        <div className="flex gap-2 font-medium">
          {question.is_in_draft &&
            typeof question.position_in_draft === "number" && (
              <span className="font-semibold">
                {question.position_in_draft}.
              </span>
            )}
          <div className="flex-1">
            <QuestionText text={question.question_text || ""} />
          </div>
        </div>

        {/* Question Images */}
        {state.editedQuestion.images &&
          state.editedQuestion.images.length > 0 && (
            <QuestionImages
              images={state.editedQuestion.images}
              className="my-3"
              onDelete={state.handleDeleteImage}
              onEdit={state.handleEditSvg}
            />
          )}

        {/* Options / Answer */}
        {isMcqOrMsq ? (
          <QuestionOptions question={question} showCorrect={true} />
        ) : question.question_type === "match_the_following" ? (
          <QuestionMatchTheFollowing question={question} />
        ) : (
          question.answer_text && <AnswerToggle answer={question.answer_text} />
        )}

        {/* Explanation - Read More Style */}
        {question.explanation && (
          <ExplanationToggle explanation={question.explanation} />
        )}
      </div>

      <div className="absolute bottom-2 right-2 z-10 flex flex-col items-end gap-1">
        {dragHandleProps && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 cursor-grab touch-none text-muted-foreground hover:text-primary active:cursor-grabbing"
                  {...dragHandleProps}
                >
                  <GripVertical className="!h-6 !w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Drag to Reorder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="flex items-center gap-2">
          {question.is_solved_example && (
            <Badge
              variant="secondary"
              className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 md:hidden"
            >
              <Lightbulb className="h-3 w-3" />
              Solved Example
            </Badge>
          )}
          {question.is_exercise_question && (
            <Badge
              variant="secondary"
              className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100 md:hidden"
            >
              <Dumbbell className="h-3 w-3" />
              Exercise
            </Badge>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <div>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-primary"
                      >
                        <Info className="!h-6 !w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>View Concepts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <h4 className="mb-2 text-sm font-medium leading-none">
                Related Concepts
              </h4>
              <div className="flex flex-wrap gap-1">
                {question.concepts && question.concepts.length > 0 ? (
                  question.concepts.map((concept) => (
                    <Badge
                      key={concept.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {concept.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No concepts linked
                  </span>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
