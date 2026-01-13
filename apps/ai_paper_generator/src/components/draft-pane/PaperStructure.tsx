import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@skolist/ui";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { QUESTION_TYPE } from "@skolist/db";
import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { GeneratedQuestionCard } from "../shared/Question/GeneratedQuestionCard";
import type { QgenDraftSection } from "../../services/draftService";

// -- Sub-components for Sortable Items --

function SortableSection({
  section,
  onDelete,
  index,
  totalSections,
  onMoveUp,
  onMoveDown,
}: {
  section: QgenDraftSection;
  onDelete: (id: string) => void;
  index: number;
  totalSections: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: "section", section } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const {
    questions,
    moveQuestionToGeneration,
    addCustomQuestion,
    saveQuestion,
    deleteQuestion,
  } = useQuestionsContext();

  // Filter questions belonging to this section
  const sectionQuestions = questions
    .filter((q) => q.is_in_draft && q.qgen_draft_section_id === section.id)
    .sort(
      (a, b) => (a.position_in_section || 0) - (b.position_in_section || 0)
    );

  const moveQuestion = async (
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionQuestions.length) return;

    const currentQ = sectionQuestions[currentIndex];
    const targetQ = sectionQuestions[targetIndex];

    if (!currentQ || !targetQ) return;

    // Swap positions safely (A -> temp, B -> A, A(temp) -> B) to avoid unique constraint
    const currentQNewPos = targetQ.position_in_section || 0;
    const targetQNewPos = currentQ.position_in_section || 0;

    try {
      // 1. Move current to temp (large positive)
      await saveQuestion({ ...currentQ, position_in_section: 10000 });
      // 2. Move target to current's old pos
      await saveQuestion({ ...targetQ, position_in_section: targetQNewPos });
      // 3. Move current to target's old pos
      await saveQuestion({ ...currentQ, position_in_section: currentQNewPos });
    } catch (error) {
      console.error("Failed to swap questions", error);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div className="flex items-center gap-2 border-b bg-muted/30 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move rounded p-1 hover:bg-muted"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 disabled:opacity-30"
            onClick={onMoveUp}
            disabled={index === 0}
            title="Move Section Up"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 disabled:opacity-30"
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            title="Move Section Down"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
        <span className="flex-1 text-sm font-semibold">
          {section.section_name}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => onDelete(section.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-[50px] space-y-3 p-3">
        {sectionQuestions.length === 0 ? (
          <div className="rounded border border-dashed py-4 text-center text-xs text-muted-foreground">
            No questions in this section
          </div>
        ) : (
          sectionQuestions.map((q, idx) => (
            <div key={q.id} className="group relative">
              {/* Re-using prepared card */}
              <div className="w-[105%] origin-top-left scale-[0.95]">
                <GeneratedQuestionCard
                  question={q}
                  onMoveToDraft={() => {}} // Already in draft
                  onRemoveFromDraft={() => moveQuestionToGeneration(q.id)}
                  onUpdate={saveQuestion}
                  onDelete={deleteQuestion}
                  onDirectRegenerate={() =>
                    console.log("Direct regenerate draft")
                  }
                  onRegenerate={(prompt, image) =>
                    console.log("Regenerate draft with prompt", prompt, image)
                  }
                  showReorder={true}
                  onMoveUp={() => moveQuestion(idx, "up")}
                  onMoveDown={() => moveQuestion(idx, "down")}
                />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed text-muted-foreground hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Add custom question
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            {[
              { label: "Short Answer", value: QUESTION_TYPE.SHORT_ANSWER },
              { label: "Long Answer", value: QUESTION_TYPE.LONG_ANSWER },
              { label: "MCQ", value: QUESTION_TYPE.MCQ4 },
              { label: "MSQ", value: QUESTION_TYPE.MSQ4 },
              { label: "True/False", value: QUESTION_TYPE.TRUE_OR_FALSE },
              {
                label: "Fill in the Blanks",
                value: QUESTION_TYPE.FILL_IN_THE_BLANKS,
              },
            ].map((type) => (
              <DropdownMenuItem
                key={type.value}
                onClick={() => addCustomQuestion(section.id, type.value)}
              >
                {type.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function PaperStructure() {
  const {
    draft,
    sections,
    isLoading,
    updateDraftSettings,
    addSection,
    removeSection,
    moveSection,
  } = useDraftContext();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  if (isLoading || !draft) {
    return <div className="p-4 text-center">Loading draft structure...</div>;
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      moveSection(active.id as string, over.id as string);
    }
    setActiveId(null);
  };

  const moveSectionByIndex = (
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const currentSection = sections[currentIndex];
    const targetSection = sections[targetIndex];

    if (currentSection && targetSection) {
      moveSection(currentSection.id, targetSection.id);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Header / Draft Settings */}
      <div className="space-y-4 border-b p-4">
        <h2 className="text-lg font-semibold">Paper Structure</h2>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Institute Name</Label>
            <Input
              value={draft.institute_name || ""}
              onChange={(e) =>
                updateDraftSettings({ institute_name: e.target.value })
              }
              placeholder="Ex. My School"
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Paper Title</Label>
            <Input
              value={draft.paper_title || ""}
              onChange={(e) =>
                updateDraftSettings({ paper_title: e.target.value })
              }
              placeholder="Ex. Mid-Term Examination"
              className="h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Time (mins)</Label>
              <Input
                value={draft.paper_duration || ""}
                onChange={(e) =>
                  updateDraftSettings({ paper_duration: e.target.value })
                }
                placeholder="60 mins"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Marks</Label>
              <Input
                type="number"
                value={draft.maximum_marks || ""}
                onChange={(e) =>
                  updateDraftSettings({
                    maximum_marks: parseInt(e.target.value),
                  })
                }
                placeholder="100"
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-auto bg-muted/10 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Sections
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addSection()}
            className="h-7 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Section
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section, index) => (
              <SortableSection
                key={section.id}
                section={section}
                onDelete={removeSection}
                index={index}
                totalSections={sections.length}
                onMoveUp={() => moveSectionByIndex(index, "up")}
                onMoveDown={() => moveSectionByIndex(index, "down")}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="rounded border bg-background p-4 opacity-80 shadow">
                Dragging Section...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
