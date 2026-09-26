import type {
  Actor,
  Assignee,
  AttemptSummary,
  OrgStudent,
  StudentResponse,
  AttemptReviewSummary,
  BlueprintSummary,
  GroupAssignee,
  StudentGroup,
  TeacherQuestion,
  TeacherTestDetail,
  TestSummary,
} from "@/types/assessment";
import { apiFetch } from "./api";

export function getMe() {
  return apiFetch<Actor>("/me");
}

export function listTeacherTests() {
  return apiFetch<{ tests: TestSummary[] }>("/tests");
}

export function getTeacherTest(testId: string) {
  return apiFetch<TeacherTestDetail>(`/tests/${testId}`);
}

export function listBlueprints() {
  return apiFetch<{ blueprints: BlueprintSummary[] }>("/blueprints");
}

export function cloneBlueprint(blueprintId: string) {
  return apiFetch<TestSummary>(`/blueprints/${blueprintId}/clone`, {
    method: "POST",
  });
}

export function listOrgGroups() {
  return apiFetch<{ groups: StudentGroup[] }>("/groups");
}

export function addGroupAssignee(testId: string, groupId: string) {
  return apiFetch<GroupAssignee>(`/tests/${testId}/group-assignees`, {
    method: "POST",
    body: JSON.stringify({ group_id: groupId }),
  });
}

export function removeGroupAssignee(testId: string, groupId: string) {
  return apiFetch<void>(`/tests/${testId}/group-assignees/${groupId}`, {
    method: "DELETE",
  });
}

export function createTest(payload: {
  name: string;
  description?: string;
  exam_type: string;
  duration_minutes: number;
}) {
  return apiFetch<TestSummary>("/tests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTest(testId: string, payload: Record<string, unknown>) {
  return apiFetch<TestSummary>(`/tests/${testId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTest(testId: string) {
  return apiFetch<void>(`/tests/${testId}`, {
    method: "DELETE",
  });
}

export function createSection(
  testId: string,
  payload: { name: string; position: number }
) {
  return apiFetch<{ id: string; name: string }>(`/tests/${testId}/sections`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createQuestion(
  sectionId: string,
  payload: Partial<TeacherQuestion> & {
    question_text: string;
    position: number;
    marks: number;
  }
) {
  return apiFetch<TeacherQuestion>(`/sections/${sectionId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuestion(
  questionId: string,
  payload: Partial<TeacherQuestion>
) {
  return apiFetch<TeacherQuestion>(`/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type ImageSlot =
  | "stem"
  | "option1"
  | "option2"
  | "option3"
  | "option4"
  | "explanation";

export function uploadQuestionImage(
  questionId: string,
  slot: ImageSlot,
  file: File
) {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<TeacherQuestion>(`/questions/${questionId}/images/${slot}`, {
    method: "POST",
    body,
  });
}

export function removeQuestionImage(questionId: string, slot: ImageSlot) {
  return apiFetch<TeacherQuestion>(`/questions/${questionId}/images/${slot}`, {
    method: "DELETE",
  });
}

export function listOrgStudents(q?: string) {
  const search = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return apiFetch<OrgStudent[]>(`/students${search}`);
}

export function listAssignees(testId: string) {
  return apiFetch<{ assignees: Assignee[] }>(`/tests/${testId}/assignees`);
}

export function addAssignee(testId: string, userId: string) {
  return apiFetch<Assignee>(`/tests/${testId}/assignees`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function removeAssignee(testId: string, userId: string) {
  return apiFetch<void>(`/tests/${testId}/assignees/${userId}`, {
    method: "DELETE",
  });
}

export function listTestAttempts(testId: string) {
  return apiFetch<{ attempts: AttemptSummary[] }>(`/tests/${testId}/attempts`);
}

export function getTeacherAttempt(testId: string, attemptId: string) {
  return apiFetch<{
    attempt: AttemptSummary;
    responses: StudentResponse[];
    test: TeacherTestDetail;
    summary: AttemptReviewSummary;
  }>(`/tests/${testId}/attempts/${attemptId}`);
}
