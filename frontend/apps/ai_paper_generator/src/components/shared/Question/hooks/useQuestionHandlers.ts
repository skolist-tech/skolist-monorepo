import { useCallback, type RefObject } from "react";
import { useToast } from "@skolist/ui";
import type { HardnessLevel } from "@skolist/db";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import { updateQuestion } from "../../../../services/questionService";
import { fastApiService } from "../../../../services/fastApiService";
import { createNewVersionOnUpdate } from "../../../../services/versionService";
import type { useQuestionCardState } from "./useQuestionCardState";
import type { useQuestionAnimations } from "./useQuestionAnimations";

interface UseQuestionHandlersProps {
  question: GeneratedQuestionWithConcepts;
  cardRef: RefObject<HTMLDivElement | null>;
  state: ReturnType<typeof useQuestionCardState>;
  anims: ReturnType<typeof useQuestionAnimations>;
  refreshVersionState: () => Promise<void>;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
  onDelete?: (id: string) => Promise<void>;
  onMoveToDraft: (id: string) => void;
  onRemoveFromDraft?: (id: string) => void;
  onDirectRegenerate?: () => void | Promise<void>;
  onRegenerate?: (
    prompt: string,
    files: File[],
    isCameraCapture?: boolean
  ) => Promise<void>;
  onAutoCorrect?: (questionId: string) => Promise<void>;
  onRegenerateWithPrompt?: (
    questionId: string,
    prompt: string,
    files: File[],
    isCameraCapture?: boolean
  ) => Promise<void>;
}

export function useQuestionHandlers({
  question,
  cardRef,
  state,
  anims,
  refreshVersionState,
  onUpdate,
  onDelete,
  onMoveToDraft,
  onRemoveFromDraft,
  onDirectRegenerate,
  onRegenerate,
  onAutoCorrect,
  onRegenerateWithPrompt,
}: UseQuestionHandlersProps) {
  const { toast } = useToast();

  const handleMarksUpdate = useCallback(
    async (newMarks: number) => {
      try {
        await createNewVersionOnUpdate(question.id, { marks: newMarks });
        await updateQuestion(question.id, { marks: newMarks });
        if (onUpdate) {
          onUpdate({ ...question, marks: newMarks });
        }
        await refreshVersionState();
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
    },
    [question, onUpdate, refreshVersionState, toast]
  );

  const handleHardnessUpdate = useCallback(
    async (newHardness: HardnessLevel) => {
      try {
        await createNewVersionOnUpdate(question.id, {
          hardness_level: newHardness,
        });
        await updateQuestion(question.id, { hardness_level: newHardness });
        if (onUpdate) {
          onUpdate({ ...question, hardness_level: newHardness });
        }
        await refreshVersionState();
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
    },
    [question, onUpdate, refreshVersionState, toast]
  );

  const handleDeleteWithAnimation = useCallback(async () => {
    state.setIsDeleteModalOpen(false);
    anims.setIsDisintegrating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (onDelete) {
      await onDelete(question.id);
    }
  }, [question.id, state, anims, onDelete]);

  const handleAutoCorrect = useCallback(async () => {
    if (cardRef.current && anims.autoCorrectBtnRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const btnRect = anims.autoCorrectBtnRef.current.getBoundingClientRect();
      anims.setSparkleOrigin({
        top: btnRect.top - cardRect.top + 6,
        right: cardRect.right - btnRect.right + 6,
      });
    }

    try {
      anims.setIsAutoCorrecting(true);
      anims.setIsReturning(false);
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (onAutoCorrect) {
        await onAutoCorrect(question.id);
      } else {
        await fastApiService.autoCorrectQuestion(question.id);
      }

      await refreshVersionState();
      anims.setIsReturning(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to auto-correct question", error);
      alert("Failed to auto-correct question");
    } finally {
      anims.setIsAutoCorrecting(false);
      anims.setIsReturning(false);
    }
  }, [question.id, cardRef, anims, onAutoCorrect, refreshVersionState]);

  const handleDirectRegenerate = useCallback(async () => {
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

      if (onDirectRegenerate) {
        await Promise.resolve(onDirectRegenerate());
      } else {
        await fastApiService.regenerateQuestion(question.id);
      }

      await refreshVersionState();
      anims.setIsRegenerateReturning(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to regenerate question", error);
      alert("Failed to regenerate question");
    } finally {
      anims.setIsRegenerating(false);
      anims.setIsRegenerateReturning(false);
    }
  }, [question.id, cardRef, anims, onDirectRegenerate, refreshVersionState]);

  const handleRegenerateSubmit = useCallback(async () => {
    if (
      onRegenerate &&
      (state.prompt.trim() || state.attachedFiles.length > 0)
    ) {
      state.setIsRegenerateOpen(false);

      try {
        anims.questionTextAtAnimationStart.current = question.question_text;
        anims.setIsChatPromptAnimating(true);

        if (onRegenerateWithPrompt) {
          await onRegenerateWithPrompt(
            question.id,
            state.prompt,
            state.attachedFiles
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          await onRegenerate(state.prompt, state.attachedFiles);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        await refreshVersionState();
      } catch (error) {
        console.error("Failed during regenerate with prompt", error);
      } finally {
        anims.setIsChatPromptAnimating(false);
        state.setPrompt("");
        state.setAttachedFiles([]);
        anims.questionTextAtAnimationStart.current = null;
      }
    }
  }, [
    question,
    state,
    anims,
    onRegenerate,
    onRegenerateWithPrompt,
    refreshVersionState,
  ]);

  const handleMoveToDraft = useCallback(async () => {
    anims.setSlideDirection("right");
    await new Promise((resolve) => setTimeout(resolve, 400));
    onMoveToDraft(question.id);
    toast({
      title: "Moved to Draft",
      description: "1 question moved to draft successfully.",
      className: "bg-green-500 text-white border-green-600",
    });
  }, [question.id, anims, onMoveToDraft, toast]);

  const handleRemoveFromDraft = useCallback(async () => {
    if (!onRemoveFromDraft) return;
    anims.setSlideDirection("left");
    await new Promise((resolve) => setTimeout(resolve, 400));
    onRemoveFromDraft(question.id);
  }, [question.id, anims, onRemoveFromDraft]);

  const handleCameraCapture = useCallback(
    async (file: File, customPrompt?: string) => {
      const defaultPrompt = `I've captured an image as a reference. Please analyze this image and regenerate the question based on its content. If it contains a diagram, figure, or mathematical expression, incorporate it appropriately. If it shows text or a problem, use that as context to improve or modify the current question.`;
      const cameraPrompt = customPrompt || defaultPrompt;

      if (cardRef.current && anims.cameraBtnRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const btnRect = anims.cameraBtnRef.current.getBoundingClientRect();
        anims.setCameraOrigin({
          top: btnRect.top - cardRect.top + 6,
          right: cardRect.right - btnRect.right + 6,
        });
      }

      try {
        anims.setIsCameraCapturing(true);
        anims.setIsCameraReturning(false);
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (onRegenerateWithPrompt) {
          await onRegenerateWithPrompt(question.id, cameraPrompt, [file], true);
        } else if (onRegenerate) {
          await onRegenerate(cameraPrompt, [file], true);
        } else {
          await fastApiService.regenerateQuestionWithPrompt(
            question.id,
            cameraPrompt,
            [file],
            true
          );
        }

        await refreshVersionState();
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
    },
    [
      question.id,
      cardRef,
      anims,
      onRegenerate,
      onRegenerateWithPrompt,
      refreshVersionState,
      toast,
    ]
  );

  return {
    handleMarksUpdate,
    handleHardnessUpdate,
    handleDeleteWithAnimation,
    handleAutoCorrect,
    handleDirectRegenerate,
    handleRegenerateSubmit,
    handleMoveToDraft,
    handleRemoveFromDraft,
    handleCameraCapture,
  };
}
