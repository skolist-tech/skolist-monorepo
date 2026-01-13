/**
 * Down Area - Display generated questions
 */

import { useState } from "react";
import {
  Button,
  Card,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@skolist/ui";
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

  return (
    <div className="sticky top-0 z-10 flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-6 py-4">
          <h3 className="text-lg font-medium text-muted-foreground">
            Generated Questions ({visibleQuestions.length})
          </h3>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="flex cursor-help items-center gap-2 px-3 py-1.5 text-sm font-medium">
                    <span className="text-muted-foreground">
                      Draft Progress:
                    </span>
                    <span>
                      {questions.filter((q) => q.is_in_draft).length} /{" "}
                      {questions.length} in Draft
                    </span>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="mb-2 text-xs font-semibold">
                      Breakdown by Question Type
                    </p>
                    {Object.values(
                      questions.reduce(
                        (acc, q) => {
                          const type = q.question_type;
                          if (!acc[type]) {
                            acc[type] = { type, draft: 0, total: 0 };
                          }
                          acc[type].total++;
                          if (q.is_in_draft) {
                            acc[type].draft++;
                          }
                          return acc;
                        },
                        {} as Record<
                          string,
                          { type: string; draft: number; total: number }
                        >
                      )
                    ).map((stat) => (
                      <div
                        key={stat.type}
                        className="flex justify-between gap-4 text-xs"
                      >
                        <span className="capitalize">
                          {stat.type.replace(/_/g, " ")}:
                        </span>
                        <span>
                          {stat.draft} / {stat.total}
                        </span>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="default"
              size="sm"
              onClick={handleBulkMoveToDraft}
              disabled={selectedIds.size === 0 || isBulkMoving}
            >
              Move To Draft →
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
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
