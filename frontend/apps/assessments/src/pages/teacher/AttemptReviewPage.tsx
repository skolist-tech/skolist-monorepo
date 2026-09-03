import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTeacherAttempt } from "@/services/tests";
import type {
  AttemptSummary,
  StudentResponse,
  TeacherTestDetail,
} from "@/types/assessment";

export function AttemptReviewPage() {
  const { testId, attemptId } = useParams();
  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [test, setTest] = useState<TeacherTestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId || !attemptId) return;
    getTeacherAttempt(testId, attemptId)
      .then((data) => {
        setAttempt(data.attempt);
        setResponses(data.responses);
        setTest(data.test);
      })
      .catch((err: Error) => setError(err.message));
  }, [testId, attemptId]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!attempt || !test)
    return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{test.name}</h1>
        <p className="text-muted-foreground">
          Attempt {attempt.attempt_number} · {attempt.status} · score{" "}
          {attempt.total_marks_obtained ?? "—"} /{" "}
          {attempt.total_marks_possible ?? "—"}
        </p>
      </div>
      <ul className="space-y-3">
        {responses.map((response) => (
          <li
            key={response.question_id}
            className="rounded-md border p-3 text-sm"
          >
            <p>Question {response.question_id}</p>
            <p>
              MCQ {response.selected_mcq_option ?? "—"} · marks{" "}
              {response.marks_obtained ?? "—"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
