import { Badge } from "@skolist/ui";
import type { TeacherQuestion } from "@/types/assessment";

export function QuestionEditor({ question }: { question: TeacherQuestion }) {
  return (
    <div className="rounded-md bg-muted/40 p-3 text-sm">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="secondary">{question.question_type}</Badge>
        <span className="text-muted-foreground">{question.marks} marks</span>
      </div>
      <p>{question.question_text}</p>
      {question.explanation ? (
        <p className="mt-2 text-muted-foreground">
          Key: {question.explanation}
        </p>
      ) : null}
    </div>
  );
}
