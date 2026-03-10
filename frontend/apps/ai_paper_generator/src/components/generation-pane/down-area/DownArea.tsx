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
import { Filter, Trash2 } from "lucide-react";
import { useQuestionsContext } from "../../../context/QuestionsContext";
import type { HardnessLevel } from "@skolist/db";
import { GenerateMoreButton } from "./GenerateMoreButton";
import { DraftProgress } from "../../shared/DraftProgress";
import { formatQuestionType } from "../../../utils/formatters";
import { useSmartDraftActions } from "../../../hooks/useSmartDraftActions";
import { useQuestionFilters } from "./hooks/useQuestionFilters";
import { useQuestionSelection } from "./hooks/useQuestionSelection";
import { GeneratedQuestionsList } from "./GeneratedQuestionsList";
import { VersionStateProvider } from "../../../context/VersionStateContext";
import { ConfirmDialog } from "../../shared/ConfirmDialog";

interface DownAreaProps {
  hardnessLevels: Record<HardnessLevel, number>;
  isGenerating?: boolean;
}

export function DownArea({
  hardnessLevels,
  isGenerating = false,
}: DownAreaProps) {
  const {
    questions,
    isLoading,
    saveQuestion,
    deleteQuestion,
    refetchQuestions,
  } = useQuestionsContext();

  const { handleSmartMoveToDraft } = useSmartDraftActions();

  // -- Filters Hook --
  const {
    filterTypes,
    filterDifficulties,
    visibleQuestions,
    uniqueTypes,
    toggleFilterType,
    toggleFilterDifficulty,
    setFilterTypes,
    setFilterDifficulties,
  } = useQuestionFilters({ questions });

  // -- Selection Hook --
  const {
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
  } = useQuestionSelection({ visibleQuestions });

  // Questions are already sorted by created_at descending from the query
  // The divider will be inserted based on is_new attribute in GeneratedQuestionsList

  if (isLoading && questions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-muted-foreground">
        Loading questions...
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 flex h-[98%] flex-col p-4 md:p-6">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Header */}
        <div
          id="generated-questions-header"
          className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 md:px-6 md:py-4"
        >
          {/* Left: Select All + Title */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isAllSelected}
              // Cast to boolean to satisfy stricter Checkbox types if needed
              onCheckedChange={(checked) => handleSelectAll(checked === true)}
              aria-label="Select all questions"
            />
            <h3 className="text-base font-medium text-muted-foreground md:text-lg">
              Generated Questions ({visibleQuestions.length})
            </h3>
          </div>

          {/* Center: Draft Progress - hidden on very small screens */}
          <div className="hidden sm:flex sm:flex-1 sm:justify-center">
            <DraftProgress />
          </div>

          {/* Right: Filter and action buttons */}
          <div className="flex flex-wrap items-center gap-2">
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
              variant="destructive"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={
                selectedIds.size === 0 || isBulkDeleting || isBulkMoving
              }
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
              {selectedIds.size > 0 && ` (${selectedIds.size})`}
            </Button>

            <Button
              className="bg-orange-500 text-white hover:bg-orange-600"
              size="sm"
              onClick={handleBulkMoveToDraft}
              disabled={
                selectedIds.size === 0 || isBulkMoving || isBulkDeleting
              }
            >
              <span className="hidden sm:inline">Move To Draft</span>
              <span className="sm:hidden">Draft</span>
              {selectedIds.size > 0 && ` (${selectedIds.size})`} →
            </Button>
          </div>
        </div>

        {/* Mobile Draft Progress - shown only on small screens */}
        <div className="flex justify-center border-b bg-card px-4 py-2 sm:hidden">
          <DraftProgress />
        </div>

        {/* Scrollable Content - Wrapped with VersionStateProvider for batched version fetching */}
        <VersionStateProvider>
          <GeneratedQuestionsList
            questions={visibleQuestions}
            isGenerating={isGenerating}
            selectedIds={selectedIds}
            animatingIds={animatingIds}
            deletingIds={deletingIds}
            onMoveToDraft={(ids) => handleSmartMoveToDraft(ids)}
            onSaveQuestion={saveQuestion}
            onDeleteQuestion={deleteQuestion}
            onRefetchQuestions={refetchQuestions}
            onToggleSelect={handleToggleSelect}
          />
        </VersionStateProvider>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete Questions"
        description={`Are you sure you want to delete ${selectedIds.size} question${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
        onConfirm={handleBulkDeleteConfirm}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
