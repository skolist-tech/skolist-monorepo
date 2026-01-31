import { useState, useEffect } from "react";
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
} from "@dnd-kit/sortable";
import { Button, useToast } from "@skolist/ui";
import { Plus, ChevronUp, ChevronDown } from "lucide-react";
import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import type { GeneratedQuestionWithConcepts } from "../../services/questionService";
import { DraftProgress } from "../shared/DraftProgress";
import { PaperDetails } from "./PaperDetails";
import { usePrevious } from "../../hooks/usePrevious";
import { calculateDragUpdates } from "../../utils/questionDragLogic";
import { moveQuestionsToDraftBatch } from "../../services/questionService";
import { AddCustomQuestionGlobal } from "./structure/AddCustomQuestionGlobal";
import { SortableSection } from "./structure/SortableSection";
import { ImportBulkQuestions } from "./structure/ImportBulkQuestions";

export function PaperStructure() {
  const { toast } = useToast();
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
  const [isExpanded, setIsExpanded] = useState(true);

  const prevSections = usePrevious(sections);

  useEffect(() => {
    if (!prevSections || !sections) return;

    if (sections.length > prevSections.length) {
      // Find the added section
      const addedSection = sections.find(
        (s) => !prevSections.find((ps) => ps.id === s.id)
      );

      if (addedSection) {
        setTimeout(() => {
          const element = document.getElementById(
            `section-node-${addedSection.id}`
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-primary", "ring-offset-2");
            setTimeout(() => {
              element.classList.remove(
                "ring-2",
                "ring-primary",
                "ring-offset-2"
              );
            }, 2000);
          }
        }, 100);
      }
    }
  }, [sections, prevSections]);
  const { questions, updateQuestionLocal } = useQuestionsContext();

  if (isLoading || !draft) {
    return <div className="p-4 text-center">Loading draft structure...</div>;
  }

  /* -- Drag Handlers -- */

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Check if we are dragging a question
    if (active.data.current?.type === "question") {
      const activeQuestionId = active.id as string;
      const overId = over.id as string;

      // Identify active question
      const activeQuestion = questions.find((q) => q.id === activeQuestionId);
      if (!activeQuestion) return;

      // Find over section
      let overSectionId: string | undefined;

      // Case A: Over is a Section
      if (over.data.current?.type === "section") {
        overSectionId = overId;
      }
      // Case B: Over is another Question
      else if (over.data.current?.type === "question") {
        const overQuestion = questions.find((q) => q.id === overId);
        if (overQuestion) {
          overSectionId = overQuestion.qgen_draft_section_id || undefined;
        }
      }

      // If we found a target section and it's different from current, update it
      if (
        overSectionId &&
        overSectionId !== activeQuestion.qgen_draft_section_id
      ) {
        // Optimistically update the section ID so it "moves" to the new list
        updateQuestionLocal({
          ...activeQuestion,
          qgen_draft_section_id: overSectionId,
        });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // 1. Handle Section Reordering
    if (
      active.data.current?.type === "section" &&
      over.data.current?.type === "section"
    ) {
      if (active.id !== over.id) {
        moveSection(active.id as string, over.id as string);
      }
      return;
    }

    // 2. Handle Question Reordering
    if (active.data.current?.type === "question") {
      const activeQId = active.id as string;
      const overId = over.id as string;

      const activeQuestion = questions.find((q) => q.id === activeQId);
      if (!activeQuestion) return;

      const activeSectionId = activeQuestion.qgen_draft_section_id;
      if (!activeSectionId) return;

      let overSectionId = activeSectionId; // Default to same section

      // Determine target section
      if (over.data.current?.type === "section") {
        overSectionId = overId;
      } else if (over.data.current?.type === "question") {
        const overQuestion = questions.find((q) => q.id === overId);
        if (overQuestion && overQuestion.qgen_draft_section_id) {
          overSectionId = overQuestion.qgen_draft_section_id;
        }
      }

      // Calculate updates
      const updates = calculateDragUpdates(
        activeQId,
        overId,
        activeSectionId,
        overSectionId,
        questions,
        sections
      );

      if (updates.length > 0) {
        // Snapshot current state for rollback
        const previousStates = updates
          .map((u) => questions.find((q) => q.id === u.id))
          .filter(Boolean) as GeneratedQuestionWithConcepts[];

        // Optimistic UI Update
        updates.forEach((u) => {
          const q = questions.find((q) => q.id === u.id);
          if (q) {
            updateQuestionLocal({
              ...q,
              position_in_draft: u.position_in_draft,
              qgen_draft_section_id: u.qgen_draft_section_id,
            });
          }
        });

        // Backend Update
        try {
          await moveQuestionsToDraftBatch(updates);
        } catch (error) {
          console.error("Failed to update drag positions:", error);

          // Rollback changes
          previousStates.forEach((q) => updateQuestionLocal(q));

          toast({
            title: "Move Failed",
            description:
              "Failed to save the new question order. Changes have been reverted.",
            variant: "destructive",
          });
        }
      }
    }
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

  /* New handler for auto-closing */
  const handleAutoClose = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Header / Draft Settings */}
      <div
        className="border-b px-4 py-4"
        onWheel={(e) => {
          // If scrolling down significantly, close it
          if (e.deltaY > 0) {
            handleAutoClose();
          }
        }}
      >
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-sm font-semibold">Paper Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="h-9 w-9 border p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Paper Structure</span>
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4">
            <PaperDetails
              draft={draft}
              updateDraftSettings={updateDraftSettings}
            />
          </div>
        )}
      </div>

      {/* Sections List */}
      <div
        className="flex-1 overflow-auto bg-muted/10 px-4"
        onScroll={handleAutoClose}
      >
        <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 flex flex-col bg-white shadow-sm md:mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 md:px-4">
            <span className="text-sm font-semibold">Sections</span>
            <div className="hidden sm:block">
              <DraftProgress />
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <AddCustomQuestionGlobal sections={sections} />
              <ImportBulkQuestions />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addSection()}
                className="h-7 px-2 text-xs md:px-3"
              >
                <Plus className="mr-1 h-3 w-3" />
                <span className="sm:inline">Add Section</span>
                {/* below is commented out for the mobile view workaround */}
                {/* <span className="hidden sm:inline">Add Section</span> */}
                {/* <span className="sm:hidden">Add</span> */}
              </Button>
            </div>
          </div>
          {/* Mobile Draft Progress */}
          <div className="flex justify-center border-b px-4 py-2 sm:hidden">
            <DraftProgress />
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
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
                sections={sections}
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
