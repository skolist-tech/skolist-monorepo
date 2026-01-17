/**
 * Down Area - Display generated questions
 */

import { useState } from "react";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@skolist/ui";
import { Filter } from "lucide-react";
import { useQuestionsContext } from "../../../context/QuestionsContext";
import { GeneratedQuestionCard } from "../../shared/Question/GeneratedQuestionCard";
import { fastApiService } from "../../../services/fastApiService";
import type { HardnessLevel } from "@skolist/db";
import { GenerateMoreButton } from "./GenerateMoreButton";
import { DraftProgress } from "../../shared/DraftProgress";
import { formatQuestionType } from "../../../utils/formatters";

interface DownAreaProps {
  hardnessLevels: Record<HardnessLevel, number>;
}

export function DownArea({ hardnessLevels }: DownAreaProps) {
  const {
    questions,
    isLoading,
    moveQuestionToDraft,
    moveQuestionsToDraft,
    saveQuestion,
    deleteQuestion,
    refetchQuestions,
  } = useQuestionsContext();

  // Filter questions not in draft
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [filterDifficulties, setFilterDifficulties] = useState<Set<string>>(
    new Set()
  );

  // Get unique question types
  const uniqueTypes = Array.from(
    new Set(questions.map((q) => q.question_type))
  );

  const visibleQuestions = questions.filter((q) => {
    if (q.is_in_draft) return false;

    // WITHIN filter type -> OR operations
    const typeMatch =
      filterTypes.size === 0 || filterTypes.has(q.question_type);

    // WITHIN filter type -> OR operations
    const diffMatch =
      filterDifficulties.size === 0 || filterDifficulties.has(q.hardness_level);

    // ACROSS filter type -> AND operations
    return typeMatch && diffMatch;
  });

  const toggleFilterType = (type: string) => {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleFilterDifficulty = (diff: string) => {
    setFilterDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(diff)) {
        next.delete(diff);
      } else {
        next.add(diff);
      }
      return next;
    });
  };

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
      await moveQuestionsToDraft(idsToMove);
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
        <div
          id="generated-questions-header"
          className="grid grid-cols-3 items-center border-b bg-card px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={(checked) => handleSelectAll(checked === true)}
              aria-label="Select all questions"
            />
            <h3 className="text-lg font-medium text-muted-foreground">
              Generated Questions ({visibleQuestions.length})
            </h3>
          </div>

          <div className="flex justify-center">
            <DraftProgress />
          </div>

          <div className="flex items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                  {(filterTypes.size > 0 || filterDifficulties.size > 0) && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {filterTypes.size + filterDifficulties.size}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Question Type</DropdownMenuLabel>
                {uniqueTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleFilterType(type);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={filterTypes.has(type)}
                        className="pointer-events-none"
                      />
                      <span className="capitalize">
                        {formatQuestionType(type)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                {["easy", "medium", "hard"].map((diff) => (
                  <DropdownMenuItem
                    key={diff}
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleFilterDifficulty(diff);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={filterDifficulties.has(diff)}
                        className="pointer-events-none"
                      />
                      <span className="capitalize">{diff}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
                {(filterTypes.size > 0 || filterDifficulties.size > 0) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setFilterTypes(new Set());
                        setFilterDifficulties(new Set());
                      }}
                      className="justify-center font-medium text-destructive focus:text-destructive"
                    >
                      Clear Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <GenerateMoreButton hardnessLevels={hardnessLevels} />

            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              size="sm"
              onClick={handleBulkMoveToDraft}
              disabled={selectedIds.size === 0 || isBulkMoving}
            >
              Move To Draft {selectedIds.size > 0 && `(${selectedIds.size})`} →
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
              onRegenerate={async (prompt, files) => {
                try {
                  await fastApiService.regenerateQuestionWithPrompt(
                    question.id,
                    prompt,
                    files
                  );
                  await refetchQuestions();
                } catch (error) {
                  console.error("Failed to regenerate question:", error);
                }
              }}
              isSelected={selectedIds.has(question.id)}
              onSelect={(selected) => handleToggleSelect(question.id, selected)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
