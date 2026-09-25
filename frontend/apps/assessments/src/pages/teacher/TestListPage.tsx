import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@skolist/ui";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TeacherTestCard } from "@/components/teacher/TeacherTestCard";
import { deleteTest, listTeacherTests } from "@/services/tests";
import type { TestSummary } from "@/types/assessment";

export function TestListPage() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TestSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listTeacherTests()
      .then((data) => setTests(data.tests))
      .catch((err: Error) => setError(err.message));
  }, []);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteTest(pendingDelete.id);
      setTests((current) =>
        current.filter((test) => test.id !== pendingDelete.id)
      );
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete test");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tests</h1>
        <p className="text-muted-foreground">Papers you are allowed to open.</p>
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/teacher/tests/new">Create test</Link>
            </Button>
          </CardContent>
        </Card>
        {tests.map((test) => (
          <TeacherTestCard
            key={test.id}
            test={test}
            onDelete={setPendingDelete}
          />
        ))}
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
        title="Delete this paper?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed.`
            : ""
        }
        confirmLabel="Delete"
        confirming={deleting}
        variant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
