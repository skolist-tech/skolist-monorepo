import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@skolist/ui";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TeacherTestCard } from "@/components/teacher/TeacherTestCard";
import { TestForm } from "@/components/teacher/TestForm";
import { createTest, deleteTest, listTeacherTests } from "@/services/tests";
import type { TestSummary } from "@/types/assessment";

export function TestListPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
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
