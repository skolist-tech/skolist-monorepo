import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAttemptResult } from "@/services/attempts";
import type { AttemptPaper } from "@/types/assessment";

export function ResultPage() {
  const { attemptId } = useParams();
  const [paper, setPaper] = useState<AttemptPaper | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    getAttemptResult(attemptId)
      .then(setPaper)
      .catch((err: Error) => setError(err.message));
  }, [attemptId]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!paper) return <p className="text-muted-foreground">Loading result…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{paper.test.name}</h1>
        <p className="text-muted-foreground">
          Score {paper.attempt.total_marks_obtained ?? "—"} /{" "}
          {paper.attempt.total_marks_possible ?? "—"}
        </p>
      </div>
      {paper.sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="text-xl font-semibold">{section.name}</h2>
          {section.questions.map((question) => {
            const response = paper.responses.find(
              (row) => row.question_id === question.id
            );
            return (
              <div key={question.id} className="rounded-md border p-3">
                <p>{question.question_text}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Marks: {response?.marks_obtained ?? "—"} ·{" "}
                  {response?.is_correct ? "Correct" : "Incorrect / unanswered"}
                </p>
                {question.explanation ? (
                  <p className="mt-2 text-sm">
                    Explanation: {question.explanation}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
