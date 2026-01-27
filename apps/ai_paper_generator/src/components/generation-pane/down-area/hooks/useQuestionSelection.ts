import { useState } from "react";
import { useToast } from "@skolist/ui";
import { useSmartDraftActions } from "../../../../hooks/useSmartDraftActions";
import type { GeneratedQuestionWithConcepts } from "../../../../services/questionService";

interface UseQuestionSelectionProps {
  visibleQuestions: GeneratedQuestionWithConcepts[];
}

export function useQuestionSelection({
  visibleQuestions,
}: UseQuestionSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMoving, setIsBulkMoving] = useState(false);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { handleSmartMoveToDraft } = useSmartDraftActions();

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

      // Mark all questions as animating
      setAnimatingIds(new Set(idsToMove));

      // Wait for animation to complete
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

  return {
    selectedIds,
    isBulkMoving,
    animatingIds,
    isAllSelected,
    handleToggleSelect,
    handleSelectAll,
    handleBulkMoveToDraft,
  };
}
