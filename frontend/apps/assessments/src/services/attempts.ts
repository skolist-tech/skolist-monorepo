import type {
  AttemptPaper,
  AttemptSummary,
  StudentResponse,
} from "@/types/assessment";
import { apiFetch } from "./api";

export function listAssignedTests() {
  return apiFetch<{ tests: import("@/types/assessment").TestSummary[] }>(
    "/assigned-tests"
  );
}

export function startAttempt(testId: string) {
  return apiFetch<AttemptSummary>(`/tests/${testId}/attempts`, {
    method: "POST",
  });
}

export function getAttempt(attemptId: string) {
  return apiFetch<{ attempt: AttemptSummary; responses: StudentResponse[] }>(
    `/attempts/${attemptId}`
  );
}

export function getAttemptPaper(attemptId: string) {
  return apiFetch<AttemptPaper>(`/attempts/${attemptId}/paper`);
}

export function saveResponse(
  attemptId: string,
  questionId: string,
  payload: Partial<StudentResponse>
) {
  return apiFetch<StudentResponse>(
    `/attempts/${attemptId}/responses/${questionId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export function submitAttempt(attemptId: string) {
  return apiFetch<AttemptPaper>(`/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}

export function getAttemptResult(attemptId: string) {
  return apiFetch<AttemptPaper>(`/attempts/${attemptId}/result`);
}
