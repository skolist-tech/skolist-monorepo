import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { GeneratedQuestionCard } from "../shared/Question/GeneratedQuestionCard";
import { useQuestionsContext } from "../../context/QuestionsContext";
import { fastApiService } from "../../services/fastApiService";
import { type GeneratedQuestionWithConcepts } from "../../services/questionService";

interface SortableQuestionProps {
  question: GeneratedQuestionWithConcepts;
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SortableQuestion({
  question,
  onMoveUp,
  onMoveDown,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    data: { type: "question", question },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const {
    moveQuestionToGeneration,
    saveQuestion,
    deleteQuestion,
    refetchQuestions,
  } = useQuestionsContext();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative mb-4 ${isDragging ? "z-50" : ""}`}
      id={`question-node-${question.id}`}
    >
      <div className="w-[105%] origin-top-left scale-[0.95]">
        <GeneratedQuestionCard
          question={question}
          onMoveToDraft={() => {}} // Already in draft
          onRemoveFromDraft={() => moveQuestionToGeneration(question.id)}
          onUpdate={saveQuestion}
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
          showReorder={true}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>

      {/* Page Break Toggle */}
      <div
        className="group/pb -mt-2 mb-2 flex cursor-pointer flex-col items-center py-1"
        onClick={() =>
          saveQuestion({
            ...question,
            is_page_break_below: !question.is_page_break_below,
          })
        }
        title={
          question.is_page_break_below
            ? "Remove Page Break"
            : "Insert Page Break Here"
        }
      >
        {/* Visual Line */}
        <div
          className={`h-0.5 w-full transition-all duration-200 ${
            question.is_page_break_below
              ? "bg-black opacity-100"
              : "bg-primary/20 opacity-0 group-hover/pb:opacity-100"
          }`}
        />

        {/* Visual Badge/Label */}
        <div
          className={`mt-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            question.is_page_break_below
              ? "bg-black text-white opacity-100"
              : "bg-primary/10 text-primary opacity-0 group-hover/pb:opacity-100"
          }`}
        >
          {question.is_page_break_below ? "Page Break" : "Insert Break"}
        </div>
      </div>
    </div>
  );
}
