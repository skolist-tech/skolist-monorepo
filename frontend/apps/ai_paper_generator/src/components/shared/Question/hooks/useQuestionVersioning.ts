import { useState, useCallback } from "react";
import { useToast } from "@skolist/ui";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import {
  undoQuestionVersion,
  redoQuestionVersion,
} from "../../../../services/versionService";
import { useVersionStateContext } from "../../../../context/VersionStateContext";

interface UseQuestionVersioningProps {
  question: GeneratedQuestionWithConcepts;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
}

export function useQuestionVersioning({
  question,
  onUpdate,
}: UseQuestionVersioningProps) {
  const { toast } = useToast();
  const { getVersionState, refreshVersionState } = useVersionStateContext();
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);

  // Get version state from context (batched, no API calls here)
  const versionState = getVersionState(question.id);
  const canUndo = versionState.canUndo;
  const canRedo = versionState.canRedo;

  const handleUndo = useCallback(async () => {
    try {
      setIsUndoing(true);
      const updated = await undoQuestionVersion(question.id);
      if (updated && onUpdate) {
        onUpdate({ ...question, ...updated });
      }
      await refreshVersionState(question.id);
      toast({
        title: "Undo Successful",
        description: "Reverted to previous version.",
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Undo failed:", error);
      toast({
        title: "Undo Failed",
        description: "Could not revert to previous version.",
        variant: "destructive",
      });
    } finally {
      setIsUndoing(false);
    }
  }, [question, onUpdate, toast, refreshVersionState]);

  const handleRedo = useCallback(async () => {
    try {
      setIsRedoing(true);
      const updated = await redoQuestionVersion(question.id);
      if (updated && onUpdate) {
        onUpdate({ ...question, ...updated });
      }
      await refreshVersionState(question.id);
      toast({
        title: "Redo Successful",
        description: "Advanced to next version.",
        className: "bg-green-500 text-white border-green-600",
      });
    } catch (error) {
      console.error("Redo failed:", error);
      toast({
        title: "Redo Failed",
        description: "Could not advance to next version.",
        variant: "destructive",
      });
    } finally {
      setIsRedoing(false);
    }
  }, [question, onUpdate, toast, refreshVersionState]);

  return {
    canUndo,
    canRedo,
    isUndoing,
    isRedoing,
    refreshVersionState: () => refreshVersionState(question.id),
    handleUndo,
    handleRedo,
  };
}
