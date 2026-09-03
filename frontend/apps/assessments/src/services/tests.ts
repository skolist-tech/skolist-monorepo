import type {
  Assignee,
  TeacherQuestion,
  TeacherTestDetail,
  TestSummary,
} from "@/types/assessment";
import { apiFetch } from "./api";

export function getMe() {
  return apiFetch<import("@/types/assessment").Actor>("/me");
}

export function listTeacherTests() {
  return apiFetch<{ tests: TestSummary[] }>("/tests");
}

export function getTeacherTest(testId: string) {
  return apiFetch<TeacherTestDetail>(`/tests/${testId}`);
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
  return apiFetch<{ attempts: import("@/types/assessment").AttemptSummary[] }>(
    `/tests/${testId}/attempts`
  );
}

export function getTeacherAttempt(testId: string, attemptId: string) {
  return apiFetch<{
    attempt: import("@/types/assessment").AttemptSummary;
    responses: import("@/types/assessment").StudentResponse[];
    test: TeacherTestDetail;
  }>(`/tests/${testId}/attempts/${attemptId}`);
}
