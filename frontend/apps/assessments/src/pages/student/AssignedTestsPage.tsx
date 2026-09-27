import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TestCard } from "@/components/student/TestCard";
import { useAssignedTests } from "@/hooks/useAssignedTests";
import { isAuthSessionError } from "@/services/api";
import { startAttempt } from "@/services/attempts";

export function AssignedTestsPage() {
  const { tests, pastTests, error, loading } = useAssignedTests();
  const navigate = useNavigate();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const openAttempts = (testId: string) =>
    navigate(`/student/tests/${testId}/attempts`);

  const startNewAttempt = (testId: string) => {
    setStartingId(testId);
    setStartError(null);
    startAttempt(testId)
      .then((attempt) => navigate(`/student/attempts/${attempt.id}`))
      .catch((err: Error) => {
        if (!isAuthSessionError(err)) setStartError(err.message);
      })
      .finally(() => setStartingId(null));
  };

  if (loading || isAuthSessionError(error)) {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assigned tests</h1>
        <p className="text-muted-foreground">
          Published papers assigned to you.
        </p>
      </div>
      {startError ? <p className="text-destructive">{startError}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            starting={startingId === test.id}
            onViewAttempts={openAttempts}
            onStartAttempt={startNewAttempt}
          />
        ))}
      </div>
      {pastTests.length ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past tests</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                starting={startingId === test.id}
                onViewAttempts={openAttempts}
                onStartAttempt={startNewAttempt}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
