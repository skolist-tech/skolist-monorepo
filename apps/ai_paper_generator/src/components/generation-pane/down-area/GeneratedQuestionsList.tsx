import { fastApiService } from "../../../services/fastApiService";
import { GeneratedQuestionCard } from "../../shared/Question/GeneratedQuestionCard";
import { LoadingQuestionCard } from "../../shared/Question/LoadingQuestionCard";
import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";

interface GeneratedQuestionsListProps {
  newQuestions: GeneratedQuestionWithConcepts[];
  oldQuestions: GeneratedQuestionWithConcepts[];
  isGenerating: boolean;
  selectedIds: Set<string>;
  animatingIds: Set<string>;
  deletingIds: Set<string>;
  onMoveToDraft: (ids: string[]) => Promise<void>;
  onSaveQuestion: (question: GeneratedQuestionWithConcepts) => Promise<void>;
  onDeleteQuestion: (id: string) => Promise<void>;
  onRefetchQuestions: () => Promise<void>;
  onToggleSelect: (id: string, selected: boolean) => void;
}

export function GeneratedQuestionsList({
  newQuestions,
  oldQuestions,
  isGenerating,
  selectedIds,
  animatingIds,
  deletingIds,
  onMoveToDraft,
  onSaveQuestion,
  onDeleteQuestion,
  onRefetchQuestions,
  onToggleSelect,
}: GeneratedQuestionsListProps) {
  // Helper to standardise regeneration handler
  const handleRegenerate = async (
    id: string,
    prompt: string,
    files?: File[],
    isCameraCapture?: boolean
  ) => {
    try {
      await fastApiService.regenerateQuestionWithPrompt(
        id,
        prompt,
        files,
        isCameraCapture
      );
      await onRefetchQuestions();
    } catch (error) {
      console.error("Failed to regenerate question:", error);
    }
  };

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      {/* New questions (received during current generation) */}
      {newQuestions.map((question) => (
        <GeneratedQuestionCard
          key={question.id}
          question={question}
          onMoveToDraft={() => onMoveToDraft([question.id])}
          onUpdate={(updated) => onSaveQuestion(updated)}
          onDelete={onDeleteQuestion}
          onRegenerate={(prompt, files, isCameraCapture) =>
            handleRegenerate(question.id, prompt, files, isCameraCapture)
          }
          isSelected={selectedIds.has(question.id)}
          onSelect={(selected) => onToggleSelect(question.id, selected)}
          isAnimating={animatingIds.has(question.id)}
          isDeleting={deletingIds.has(question.id)}
        />
      ))}

      {/* Loading Card - between new and old questions */}
      {isGenerating && <LoadingQuestionCard />}

      {/* Old questions (existed before generation started) */}
      {oldQuestions.map((question) => (
        <GeneratedQuestionCard
          key={question.id}
          question={question}
          onMoveToDraft={() => onMoveToDraft([question.id])}
          onUpdate={(updated) => onSaveQuestion(updated)}
          onDelete={onDeleteQuestion}
          onRegenerate={(prompt, files) =>
            handleRegenerate(question.id, prompt, files)
          }
          isSelected={selectedIds.has(question.id)}
          onSelect={(selected) => onToggleSelect(question.id, selected)}
          isAnimating={animatingIds.has(question.id)}
          isDeleting={deletingIds.has(question.id)}
        />
      ))}
    </div>
  );
}
