import { useState, useEffect, useMemo } from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@skolist/ui";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { QUESTION_TYPE } from "@skolist/db";
import { type QgenDraftSection } from "@skolist/db";
import { useDraftContext } from "../../context/DraftContext";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { usePrevious } from "../../hooks/usePrevious";
import { type GeneratedQuestionWithConcepts } from "../../services/questionService";
import { SortableQuestion } from "./SortableQuestion";

interface SortableSectionProps {
  section: QgenDraftSection;
  sections: QgenDraftSection[];
  onDelete: (id: string) => void;
  index: number;
  totalSections: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SortableSection({
  section,
  sections,
  onDelete,
  index,
  totalSections,
  onMoveUp,
  onMoveDown,
}: SortableSectionProps) {
  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDisintegrating, setIsDisintegrating] = useState(false);

  // Pre-generate random particle data for disintegration animation
  const particleData = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        size: Math.random() * 8 + 3,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 0.8 + Math.random() * 0.8,
        delay: Math.random() * 0.6,
        xOffset: (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 80),
        yOffset: -(80 + Math.random() * 150),
        rotation: Math.random() * 360,
      })),
    []
  );

  const handleDeleteWithAnimation = async () => {
    setIsDeleteModalOpen(false);
    setIsDisintegrating(true);
    // Wait for disintegration animation to complete
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onDelete(section.id);
  };

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

  const { questions, addCustomQuestion, saveQuestion } = useQuestionsContext();

  // Filter questions belonging to this section
  const sectionQuestions = questions
    .filter((q) => q.is_in_draft && q.qgen_draft_section_id === section.id)
    .sort((a, b) => (a.position_in_draft || 0) - (b.position_in_draft || 0));

  const prevQuestions = usePrevious(sectionQuestions);

  useEffect(() => {
    if (!prevQuestions) return;

    if (sectionQuestions.length > prevQuestions.length) {
      // Find the added question
      const addedQuestion = sectionQuestions.find(
        (q) => !prevQuestions.find((pq) => pq.id === q.id)
      );

      if (addedQuestion) {
        // Wait a tick for DOM update
        setTimeout(() => {
          const element = document.getElementById(
            `question-node-${addedQuestion.id}`
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Add a temporary highlight effect class if desired
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
  }, [sectionQuestions, prevQuestions]);

  const moveQuestion = async (
    currentIndex: number,
    direction: "up" | "down"
  ) => {
    // 1. Determine local target index
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // 2. Intra-section Move (Swap)
    if (targetIndex >= 0 && targetIndex < sectionQuestions.length) {
      const currentQ = sectionQuestions[currentIndex];
      const targetQ = sectionQuestions[targetIndex];

      if (!currentQ || !targetQ) return;

      const currentPos = currentQ.position_in_draft;
      const targetPos = targetQ.position_in_draft;

      try {
        await saveQuestion({
          ...currentQ,
          position_in_draft: targetPos,
        } as unknown as GeneratedQuestionWithConcepts);

        await saveQuestion({
          ...targetQ,
          position_in_draft: currentPos,
        } as unknown as GeneratedQuestionWithConcepts);
      } catch (error) {
        console.error("Failed to swap questions", error);
      }
      return;
    }

    // 3. Inter-section Move (Change Section ID only)
    if (direction === "up" && targetIndex < 0) {
      // Move to previous section
      if (index === 0) return; // Top of first section
      const prevSection = sections[index - 1];
      if (!prevSection) return;

      const currentQ = sectionQuestions[currentIndex];
      if (!currentQ) return;

      try {
        await saveQuestion({
          ...currentQ,
          qgen_draft_section_id: prevSection.id,
        } as unknown as GeneratedQuestionWithConcepts);
      } catch (error) {
        console.error("Failed to move question to previous section", error);
      }
    } else if (direction === "down" && targetIndex >= sectionQuestions.length) {
      // Move to next section
      if (index === totalSections - 1) return; // Bottom of last section
      const nextSection = sections[index + 1];
      if (!nextSection) return;

      const currentQ = sectionQuestions[currentIndex];
      if (!currentQ) return;

      try {
        await saveQuestion({
          ...currentQ,
          qgen_draft_section_id: nextSection.id,
        } as unknown as GeneratedQuestionWithConcepts);
      } catch (error) {
        console.error("Failed to move question to next section", error);
      }
    }
  };

  const { editSection } = useDraftContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.section_name || "");

  // Update editValue when section name changes from outside
  useEffect(() => {
    setEditValue(section.section_name || "");
  }, [section.section_name]);

  const handleSave = async () => {
    const currentName = section.section_name || "";
    if (editValue.trim() && editValue !== currentName) {
      await editSection(section.id, { section_name: editValue });
    } else {
      setEditValue(currentName); // Reset if empty or unchanged
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(section.section_name || "");
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing) {
      // Focus logic could go here if using a ref, but autoFocus usually works
    }
  }, [isEditing]);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        animation: isDisintegrating
          ? "sectionDisintegrate 1.5s ease-out forwards"
          : undefined,
      }}
      className={`relative mb-4 rounded-lg border bg-card text-card-foreground shadow-sm ${isDisintegrating ? "pointer-events-none" : ""}`}
      id={`section-node-${section.id}`}
    >
      {/* Disintegration Animation Styles */}
      <style>{`
        @keyframes sectionDisintegrate {
          0% {
            opacity: 1;
            filter: blur(0px);
            transform: scale(1);
          }
          30% {
            opacity: 0.8;
            filter: blur(1px);
            transform: scale(1.02);
          }
          100% {
            opacity: 0;
            filter: blur(8px);
            transform: scale(0.95) translateY(-20px);
          }
        }
      `}</style>

      {/* Disintegration Particle Animation Overlay */}
      {isDisintegrating && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-visible rounded-lg">
          {particleData.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={
                {
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  backgroundColor: `hsl(${Math.random() * 30 + 10}, 10%, ${50 + Math.random() * 30}%)`,
                  opacity: 0,
                  "--x-offset": `${particle.xOffset}px`,
                  "--y-offset": `${particle.yOffset}px`,
                  "--rotation": `${particle.rotation}deg`,
                  animation: `sectionParticle-${i % 4} ${particle.duration}s ease-out ${particle.delay}s forwards`,
                } as React.CSSProperties
              }
            />
          ))}
          <style>{`
            @keyframes sectionParticle-0 {
              0% {
                opacity: 0.9;
                transform: translate(0, 0) scale(1) rotate(0deg);
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0.2) rotate(180deg);
              }
            }
            @keyframes sectionParticle-1 {
              0% {
                opacity: 0.85;
                transform: translate(0, 0) scale(1) rotate(0deg);
              }
              50% {
                opacity: 0.5;
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0.1) rotate(-180deg);
              }
            }
            @keyframes sectionParticle-2 {
              0% {
                opacity: 0.9;
                transform: translate(0, 0) scale(1);
              }
              30% {
                opacity: 0.7;
                transform: translate(calc(var(--x-offset) * 0.3), calc(var(--y-offset) * 0.2)) scale(0.8);
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0);
              }
            }
            @keyframes sectionParticle-3 {
              0% {
                opacity: 0.8;
                transform: translate(0, 0) scale(1) rotate(0deg);
              }
              60% {
                opacity: 0.4;
              }
              100% {
                opacity: 0;
                transform: translate(var(--x-offset), var(--y-offset)) scale(0.15) rotate(270deg);
              }
            }
          `}</style>
        </div>
      )}

      <div className="flex items-center gap-2 border-b bg-muted/30 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move touch-none rounded p-1 hover:bg-muted"
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

        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-8 flex-1"
          />
        ) : (
          <div className="flex flex-1 items-center gap-2">
            <span className="text-sm font-semibold">
              {section.section_name}{" "}
              <span className="text-muted-foreground">
                ({sectionQuestions.length})
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="mr-1 h-8 w-8 border p-0"
        >
          {isSectionExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Delete Section"
        description={`Are you sure you want to delete "${section.section_name || "this section"}"? All questions in this section will be moved to draft or deleted.`}
        onConfirm={handleDeleteWithAnimation}
        variant="destructive"
        confirmLabel="Delete"
      />
      {isSectionExpanded && (
        <>
          <div className="min-h-[50px] space-y-3 p-3">
            {sectionQuestions.length === 0 ? (
              <div className="rounded border border-dashed py-4 text-center text-xs text-muted-foreground">
                No questions in this section
              </div>
            ) : (
              <SortableContext
                items={sectionQuestions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                {sectionQuestions.map((q, idx) => (
                  <SortableQuestion
                    key={q.id}
                    question={q}
                    index={idx}
                    onMoveUp={() => moveQuestion(idx, "up")}
                    onMoveDown={() => moveQuestion(idx, "down")}
                  />
                ))}
              </SortableContext>
            )}
          </div>
          <div className="border-t p-3 hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-dashed text-muted-foreground hover:text-primary"
                  onPointerDown={(e) => e.stopPropagation()}
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
        </>
      )}
    </div>
  );
}
