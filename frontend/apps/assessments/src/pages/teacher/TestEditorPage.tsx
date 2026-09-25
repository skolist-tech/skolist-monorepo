import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Input, Label } from "@skolist/ui";
import { BackLink } from "@/components/layout/BackLink";
import { AssigneeManager } from "@/components/teacher/AssigneeManager";
import {
  addAssignee,
  addGroupAssignee,
  listOrgGroups,
  listTestAttempts,
  getTeacherTest,
  removeAssignee,
  removeGroupAssignee,
  updateTest,
} from "@/services/tests";
import type {
  AttemptSummary,
  StudentGroup,
  TeacherTestDetail,
} from "@/types/assessment";

type Tab = "paper" | "students" | "attempts";

export function TestEditorPage() {
  const { testId } = useParams();
  const [test, setTest] = useState<TeacherTestDetail | null>(null);
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("paper");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("180");
  const [reviewAttempts, setReviewAttempts] = useState(false);
  const [seeAnswers, setSeeAnswers] = useState(false);

  async function reload() {
    if (!testId) return;
    const [detail, attemptList, groupList] = await Promise.all([
      getTeacherTest(testId),
      listTestAttempts(testId),
      listOrgGroups(),
    ]);
    setTest(detail);
    setAttempts(attemptList.attempts);
    setGroups(groupList.groups);
    setName(detail.name);
    setDuration(String(detail.duration_minutes));
    setReviewAttempts(Boolean(detail.students_can_review_attempts));
    setSeeAnswers(Boolean(detail.students_can_see_answers));
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [testId]);

  if (!test) {
    return (
      <div className="space-y-4">
        <BackLink to="/teacher/tests" />
        <p className="text-muted-foreground">{error || "Loading…"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <BackLink to="/teacher/tests" />
          <div>
            <h1 className="text-3xl font-bold">{test.name}</h1>
            <p className="text-muted-foreground">
              {test.exam_type} · {test.status} · {test.duration_minutes} min
            </p>
          </div>
        </div>
        {test.status === "draft" ? (
          <Button
            type="button"
            onClick={() =>
              updateTest(test.id, { status: "published" })
                .then(reload)
                .catch((err: Error) => setError(err.message))
            }
          >
            Publish
          </Button>
        ) : null}
        {test.status === "published" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              updateTest(test.id, { status: "closed" })
                .then(reload)
                .catch((err: Error) => setError(err.message))
            }
          >
            Close paper
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={tab === "paper" ? "default" : "outline"}
          onClick={() => setTab("paper")}
        >
          Question paper
        </Button>
        <Button
          type="button"
          variant={tab === "students" ? "default" : "outline"}
          onClick={() => setTab("students")}
        >
          Students
        </Button>
        <Button
          type="button"
          variant={tab === "attempts" ? "default" : "outline"}
          onClick={() => setTab("attempts")}
        >
          Attempts
        </Button>
      </div>

      {tab === "paper" ? (
        <section className="space-y-6">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              updateTest(test.id, {
                name,
                duration_minutes: Number(duration),
                students_can_review_attempts: reviewAttempts,
                students_can_see_answers: seeAnswers,
              })
                .then(reload)
                .catch((err: Error) => setError(err.message));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="test-name">Test name</Label>
              <Input
                id="test-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={reviewAttempts}
                onChange={(event) => setReviewAttempts(event.target.checked)}
              />
              Students can review past attempts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={seeAnswers}
                onChange={(event) => setSeeAnswers(event.target.checked)}
              />
              Students can see correct answers
            </label>
            <Button type="submit">Save paper</Button>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              {test.sections.length} section(s) ·{" "}
              {test.sections.reduce((n, s) => n + s.questions.length, 0)}{" "}
              question(s). Open the paper to see it the way students do and edit
              questions, options, and images.
            </p>
            <Button asChild>
              <Link to={`/teacher/tests/${test.id}/paper`}>
                Open question paper
              </Link>
            </Button>
          </div>
        </section>
      ) : null}

      {tab === "students" ? (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Students</h2>
          <AssigneeManager
            assignees={test.assignees}
            onAdd={(userId) =>
              addAssignee(test.id, userId).then(() => reload())
            }
            onRemove={(userId) =>
              removeAssignee(test.id, userId).then(() => reload())
            }
          />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Student groups</h3>
            <ul className="space-y-2">
              {(test.group_assignees ?? []).map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span>{group.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      removeGroupAssignee(test.id, group.group_id).then(() =>
                        reload()
                      )
                    }
                  >
                    Deassign group
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {groups
                .filter(
                  (group) =>
                    !(test.group_assignees ?? []).some(
                      (row) => row.group_id === group.id
                    )
                )
                .map((group) => (
                  <Button
                    key={group.id}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addGroupAssignee(test.id, group.id).then(() => reload())
                    }
                  >
                    Assign {group.name}
                  </Button>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === "attempts" ? (
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
      ) : null}
    </div>
  );
}
