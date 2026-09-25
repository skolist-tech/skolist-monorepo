import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@skolist/ui";
import { BackLink } from "@/components/layout/BackLink";
import { listMyAttempts, startAttempt } from "@/services/attempts";
import type { AttemptSummary, TestSummary } from "@/types/assessment";

export function StudentAttemptsPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<
    | (TestSummary & { can_start: boolean; students_can_see_answers: boolean })
    | null
  >(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    listMyAttempts(testId)
      .then((data) => {
        setTest(data.test);
        setAttempts(data.attempts);
      })
      .catch((err: Error) => setError(err.message));
  }, [testId]);

  if (!test) {
    return (
      <div className="space-y-4">
        <BackLink to="/student/tests" />
        <p className="text-muted-foreground">{error || "Loading…"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink to="/student/tests" />
      <div>
        <h1 className="text-3xl font-bold">{test.name}</h1>
        <p className="text-muted-foreground">Your attempts</p>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      {test.can_start ? (
        <Button
          type="button"
          onClick={() => {
            if (!testId) return;
            startAttempt(testId)
              .then((attempt) => navigate(`/student/attempts/${attempt.id}`))
              .catch((err: Error) => setError(err.message));
          }}
        >
          Start
        </Button>
      ) : null}
      <ul className="space-y-2">
        {attempts.map((attempt) => (
          <li
            key={attempt.id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span className="text-sm">
              Attempt {attempt.attempt_number} · {attempt.status}
            </span>
            {attempt.status !== "in_progress" ? (
              <Link
                className="text-sm text-primary"
                to={`/student/attempts/${attempt.id}/result`}
              >
                View result
              </Link>
            ) : (
              <Link
                className="text-sm text-primary"
                to={`/student/attempts/${attempt.id}`}
              >
                Continue
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
