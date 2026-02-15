import { fastApiService } from "../../../services/fastApiService";
import { GeneratedQuestionCard } from "../../shared/Question/GeneratedQuestionCard";
import { LoadingQuestionCard } from "../../shared/Question/LoadingQuestionCard";
import type { GeneratedQuestionWithConcepts } from "../../../services/questionService";

interface GeneratedQuestionsListProps {
  questions: GeneratedQuestionWithConcepts[];
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
  questions,
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

  // Find the index where is_new transitions from true to false
  const dividerIndex = questions.findIndex((q) => !q.is_new);
  const hasNewQuestions = questions.some((q) => q.is_new);
  const hasOldQuestions = dividerIndex !== -1;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
      {/* Loading card at top when generating and no questions exist yet */}
      {isGenerating && questions.length === 0 && <LoadingQuestionCard />}

      {questions.map((question, index) => (
        <div key={question.id}>
          {/* Loading card OR Divider - appears just above first old question */}
          {index === dividerIndex && (
            <>
              {isGenerating ? (
                <div className="mb-4">
                  <LoadingQuestionCard />
                </div>
              ) : (
                hasNewQuestions &&
                hasOldQuestions && (
                  <div className="mb-4 flex items-center gap-3 py-2">
                    <div className="h-0.5 flex-1 bg-black" />
                    <span className="text-xs font-bold text-black">
                      PREVIOUSLY GENERATED
                    </span>
                    <div className="h-0.5 flex-1 bg-black" />
                  </div>
                )
              )}
            </>
          )}
          <GeneratedQuestionCard
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
        </div>
      ))}

      {/* Loading card at bottom if generating and all questions are new (no old questions yet) */}
      {isGenerating && questions.length > 0 && !hasOldQuestions && (
        <LoadingQuestionCard />
      )}
    </div>
  );
}
