/**
 * Down Area - Display generated questions
 */

import { useState } from "react";
import { Button } from "@skolist/ui";
// import { ArrowLeft } from "lucide-react"; // Removed unused
import { useQuestionsContext } from "../../../context";
import {
  /* QuestionText, QuestionTags, QuestionMarks removed as they are internal to GeneratedQuestionCard now */
  GeneratedQuestionCard,
} from "../../shared/Question";

export function DownArea() {
  const {
    questions,
    isLoading,
    moveQuestionToDraft,
    saveQuestion,
    deleteQuestion,
  } = useQuestionsContext();

  // Filter questions not in draft
  const visibleQuestions = questions.filter((q) => !q.is_in_draft);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkMoving, setIsBulkMoving] = useState(false);

  const handleToggleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkMoveToDraft = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsBulkMoving(true);
      const idsToMove = Array.from(selectedIds);
      await Promise.all(idsToMove.map((id) => moveQuestionToDraft(id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to bulk move questions:", error);
    } finally {
      setIsBulkMoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-muted-foreground">
        Loading questions...
      </div>
    );
  }

  if (visibleQuestions.length === 0) {
    return (
      <div className="border-t p-6 text-center text-muted-foreground">
        <p>No generated questions yet.</p>
        <p className="text-sm">Generate some questions to see them here.</p>
      </div>
    );
  }

  return (
    <div className="border-t bg-muted/20 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-muted-foreground">
            Generated Questions ({visibleQuestions.length})
          </h3>
          {visibleQuestions.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleBulkMoveToDraft}
              disabled={selectedIds.size === 0 || isBulkMoving}
            >
              Move To Draft →
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {visibleQuestions.map((question) => (
            <GeneratedQuestionCard
              key={question.id}
              question={question}
              onMoveToDraft={moveQuestionToDraft}
              onUpdate={(updated) => saveQuestion(updated)}
              onDelete={deleteQuestion}
              isSelected={selectedIds.has(question.id)}
              onSelect={(selected) => handleToggleSelect(question.id, selected)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
