import { cn } from "@skolist/utils";
import type { StudentQuestion, StudentResponse } from "@/types/assessment";

export function QuestionPalette({
  questions,
  currentQuestionId,
  responses,
  onSelect,
}: {
  questions: StudentQuestion[];
  currentQuestionId: string | null;
  responses: Record<string, StudentResponse>;
  onSelect: (questionId: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((question, index) => {
        const answered = Boolean(responses[question.id]);
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(question.id)}
            className={cn(
              "h-9 rounded-md border text-sm",
              currentQuestionId === question.id &&
                "border-primary bg-primary text-primary-foreground",
              answered && currentQuestionId !== question.id && "bg-muted"
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
