import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@skolist/ui";
import { TestForm } from "@/components/teacher/TestForm";
import { createTest, listTeacherTests } from "@/services/tests";
import type { TestSummary } from "@/types/assessment";

export function TestListPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listTeacherTests()
      .then((data) => setTests(data.tests))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tests</h1>
        <p className="text-muted-foreground">
          Create and publish assessment papers.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New draft</CardTitle>
        </CardHeader>
        <CardContent>
          <TestForm
            submitting={creating}
            onSubmit={async (payload) => {
              setCreating(true);
              setError(null);
              try {
                const created = await createTest(payload);
                navigate(`/teacher/tests/${created.id}`);
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Failed to create test"
                );
              } finally {
                setCreating(false);
              }
            }}
          />
        </CardContent>
      </Card>
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle>{test.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {test.exam_type} · {test.status}
              </p>
              <Button asChild variant="outline">
                <Link to={`/teacher/tests/${test.id}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
