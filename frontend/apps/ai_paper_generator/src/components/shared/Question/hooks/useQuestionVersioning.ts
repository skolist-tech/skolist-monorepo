import { useState, useEffect, useCallback } from "react";
import { useToast } from "@skolist/ui";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";
import {
  getVersionState,
  undoQuestionVersion,
  redoQuestionVersion,
} from "../../../../services/versionService";

interface UseQuestionVersioningProps {
  question: GeneratedQuestionWithConcepts;
  onUpdate?: (updatedQuestion: GeneratedQuestionWithConcepts) => void;
}

export function useQuestionVersioning({
  question,
  onUpdate,
}: UseQuestionVersioningProps) {
  const { toast } = useToast();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);

  // Fetch version state on mount and when question changes
  useEffect(() => {
    const fetchVersionState = async () => {
      try {
        const state = await getVersionState(question.id);
        setCanUndo(state.canUndo);
        setCanRedo(state.canRedo);
      } catch {
        setCanUndo(false);
        setCanRedo(false);
      }
    };
    fetchVersionState();
  }, [question.id, question.updated_at]);

  const refreshVersionState = useCallback(async () => {
    try {
      const newState = await getVersionState(question.id);
      setCanUndo(newState.canUndo);
      setCanRedo(newState.canRedo);
    } catch {
      // Ignore errors in version state refresh
    }
  }, [question.id]);

  const handleUndo = useCallback(async () => {
    try {
      setIsUndoing(true);
      const updated = await undoQuestionVersion(question.id);
      if (updated && onUpdate) {
        onUpdate({ ...question, ...updated });
      }
      const newState = await getVersionState(question.id);
      setCanUndo(newState.canUndo);
      setCanRedo(newState.canRedo);
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
  }, [question, onUpdate, toast]);

  const handleRedo = useCallback(async () => {
    try {
      setIsRedoing(true);
      const updated = await redoQuestionVersion(question.id);
      if (updated && onUpdate) {
        onUpdate({ ...question, ...updated });
      }
      const newState = await getVersionState(question.id);
      setCanUndo(newState.canUndo);
      setCanRedo(newState.canRedo);
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
  }, [question, onUpdate, toast]);

  return {
    canUndo,
    canRedo,
    isUndoing,
    isRedoing,
    refreshVersionState,
    handleUndo,
    handleRedo,
  };
}
