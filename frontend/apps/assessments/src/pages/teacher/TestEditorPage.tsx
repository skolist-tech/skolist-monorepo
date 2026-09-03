import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Input } from "@skolist/ui";
import { AssigneeManager } from "@/components/teacher/AssigneeManager";
import { SectionList } from "@/components/teacher/SectionList";
import {
  addAssignee,
  createQuestion,
  createSection,
  getTeacherTest,
  listTestAttempts,
  removeAssignee,
  updateTest,
} from "@/services/tests";
import type { AttemptSummary, TeacherTestDetail } from "@/types/assessment";

export function TestEditorPage() {
  const { testId } = useParams();
  const [test, setTest] = useState<TeacherTestDetail | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("Physics");

  async function reload() {
    if (!testId) return;
    const [detail, attemptList] = await Promise.all([
      getTeacherTest(testId),
      listTestAttempts(testId),
    ]);
    setTest(detail);
    setAttempts(attemptList.attempts);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [testId]);

  if (!test) {
    return <p className="text-muted-foreground">{error || "Loading…"}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{test.name}</h1>
          <p className="text-muted-foreground">
            {test.exam_type} · {test.status} · {test.duration_minutes} min
          </p>
        </div>
        {test.status === "draft" ? (
          <Button
            onClick={() =>
              updateTest(test.id, { status: "published" })
                .then(reload)
                .catch((err: Error) => setError(err.message))
            }
          >
            Publish
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() =>
              updateTest(test.id, { status: "closed" })
                .then(reload)
                .catch((err: Error) => setError(err.message))
            }
          >
            Close
          </Button>
        )}
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Sections</h2>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            createSection(test.id, {
              name: sectionName,
              position: test.sections.length + 1,
            })
              .then(reload)
              .catch((err: Error) => setError(err.message));
          }}
        >
          <Input
            value={sectionName}
            onChange={(event) => setSectionName(event.target.value)}
          />
          <Button type="submit">Add section</Button>
        </form>
        <SectionList
          sections={test.sections}
          onAddQuestion={(sectionId) => {
            createQuestion(sectionId, {
              question_text: "New question",
              question_type: "mcq",
              position:
                (test.sections.find((s) => s.id === sectionId)?.questions
                  .length || 0) + 1,
              marks: 4,
              negative_marks: 1,
              option1: "A",
              option2: "B",
              option3: "C",
              option4: "D",
              correct_mcq_option: 1,
            })
              .then(reload)
              .catch((err: Error) => setError(err.message));
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Assignees</h2>
        <AssigneeManager
          assignees={test.assignees}
          onAdd={(userId) => addAssignee(test.id, userId).then(() => reload())}
          onRemove={(userId) =>
            removeAssignee(test.id, userId).then(() => reload())
          }
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Attempts</h2>
        <ul className="space-y-2">
          {attempts.map((attempt) => (
            <li
              key={attempt.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="text-sm">
                {attempt.student_id} · {attempt.status}
              </span>
              <Link
                className="text-sm text-primary"
                to={`/teacher/tests/${test.id}/attempts/${attempt.id}`}
              >
                Review
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
