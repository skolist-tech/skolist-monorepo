import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BackLink } from "@/components/layout/BackLink";
import { LatexRenderer } from "@/components/shared/LatexRenderer";
import { QuestionFigure } from "@/components/shared/QuestionFigure";
import { isAnswerable } from "@/lib/ntaPalette";
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

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink to="/student/tests" />
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  if (!paper)
    return (
      <div className="space-y-4">
        <BackLink to="/student/tests" />
        <p className="text-muted-foreground">Loading result…</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackLink to="/student/tests" />
        <div>
          <h1 className="text-3xl font-bold">{paper.test.name}</h1>
          <p className="text-muted-foreground">
            Score {paper.attempt.total_marks_obtained ?? "—"} /{" "}
            {paper.attempt.total_marks_possible ?? "—"}
          </p>
        </div>
      </div>
      {paper.sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <h2 className="text-xl font-semibold">{section.name}</h2>
          {section.questions.filter(isAnswerable).map((question) => {
            const response = paper.responses.find(
              (row) => row.question_id === question.id
            );
            return (
              <div
                key={question.id}
                className="space-y-2 rounded-md border p-3"
              >
                <div className="text-base">
                  <LatexRenderer content={question.question_text} />
                </div>
                <QuestionFigure
                  svgCode={question.svg_image_code}
                  imageUrl={question.image_url}
                  alt=""
                  className="max-h-48 object-contain [&>svg]:max-h-48 [&>svg]:w-auto"
                />
                <p className="text-sm text-muted-foreground">
                  Marks: {response?.marks_obtained ?? "—"} ·{" "}
                  {response?.is_correct ? "Correct" : "Incorrect / unanswered"}
                </p>
                {question.explanation ? (
                  <div className="text-sm">
                    <span className="font-medium">Explanation: </span>
                    <LatexRenderer content={question.explanation} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
