import { useState } from "react";
import { useToast } from "@skolist/ui";
import { useSmartDraftActions } from "../../../../hooks/useSmartDraftActions";
import { useQuestionsContext } from "../../../../context/QuestionsContext";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface UseQuestionSelectionProps {
  visibleQuestions: GeneratedQuestionWithConcepts[];
}

export function useQuestionSelection({
  visibleQuestions,
}: UseQuestionSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  const { handleSmartMoveToDraft } = useSmartDraftActions();
  const { deleteQuestion } = useQuestionsContext();

  const handleToggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const isAllSelected =
    visibleQuestions.length > 0 &&
    visibleQuestions.every((q) => selectedIds.has(q.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = visibleQuestions.map((q) => q.id);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkMoveToDraft = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsBulkMoving(true);
      const idsToMove = Array.from(selectedIds);
      const count = idsToMove.length;

      // Mark all questions as animating (slide animation)
      setAnimatingIds(new Set(idsToMove));

      // Wait for slide animation to complete
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Move questions to draft
      await handleSmartMoveToDraft(idsToMove);

      // Show success toast
      toast({
        title: "Moved to Draft",
        description: `${count} question${count > 1 ? "s" : ""} moved to draft successfully.`,
        className: "bg-green-500 text-white border-green-600",
      });

      setSelectedIds(new Set());
      setAnimatingIds(new Set());
    } catch (error) {
      console.error("Failed to bulk move questions:", error);
      setAnimatingIds(new Set());
    } finally {
      setIsBulkMoving(false);
    }
  };

  // Opens the confirmation dialog
  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setIsDeleteConfirmOpen(true);
  };

  // Called when user confirms deletion in the dialog
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsBulkDeleting(true);
      const idsToDelete = Array.from(selectedIds);
      const count = idsToDelete.length;

      // Mark all questions as deleting (disintegrate animation)
      setDeletingIds(new Set(idsToDelete));

      // Wait for disintegrate animation to complete (1500ms as per the animation keyframes)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Delete questions sequentially
      for (const id of idsToDelete) {
        await deleteQuestion(id);
      }

      // Show success toast
      toast({
        title: "Deleted",
        description: `${count} question${count > 1 ? "s" : ""} deleted successfully.`,
        className: "bg-red-500 text-white border-red-600",
      });

      setSelectedIds(new Set());
      setDeletingIds(new Set());
    } catch (error) {
      console.error("Failed to bulk delete questions:", error);
      toast({
        title: "Error",
        description: "Failed to delete some questions. Please try again.",
        variant: "destructive",
      });
      setDeletingIds(new Set());
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return {
    selectedIds,
    isBulkMoving,
    isBulkDeleting,
    animatingIds,
    deletingIds,
    isAllSelected,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    handleToggleSelect,
    handleSelectAll,
    handleBulkMoveToDraft,
    handleBulkDeleteClick,
    handleBulkDeleteConfirm,
  };
}
