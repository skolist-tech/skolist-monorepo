import { useNavigate } from "react-router-dom";
import { TestCard } from "@/components/student/TestCard";
import { useAssignedTests } from "@/hooks/useAssignedTests";
import { startAttempt } from "@/services/attempts";

export function AssignedTestsPage() {
  const { tests, error, loading } = useAssignedTests();
  const navigate = useNavigate();

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assigned tests</h1>
        <p className="text-muted-foreground">
          Published papers assigned to you.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            onStart={async (testId) => {
              const attempt = await startAttempt(testId);
              navigate(`/student/attempts/${attempt.id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
