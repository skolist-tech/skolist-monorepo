import { getSupabaseClient } from "@skolist/auth";

const API_URL = import.meta.env.VITE_FASTAPI_URL;

export interface StudentAttemptRow {
  id: string;
  online_test_id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  submitted_at?: string;
  total_marks_obtained?: number;
  total_marks_possible?: number;
  grading_status: string;
  test: {
    id: string;
    title: string;
  };
}

export interface StudentAttemptDetailResponse {
  attempt: {
    id: string;
    online_test_id: string;
    attempt_number: number;
    status: string;
    started_at: string;
    submitted_at?: string;
    total_marks_obtained?: number;
    total_marks_possible?: number;
    grading_status: string;
  };
  test: {
    id: string;
    title: string;
  };
  questions: Array<{
    id: string;
    question_text: string;
    marks: number;
    question_type: string;
    type: string;
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    options?: Array<string | null | undefined>;
    position_in_draft?: number;
    concept_names?: string[];
  }>;
  answers: Array<{
    id: string;
    test_attempt_id: string;
    gen_question_id: string;
    question_position: number;
    selected_mcq_option?: number;
    selected_msq_options?: boolean[];
    text_answer?: string;
    numerical_answer?: number;
    match_answer?: Record<string, unknown>;
    is_correct?: boolean;
    marks_obtained?: number;
    answered_at?: string;
  }>;
}

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession();

  const token = session?.access_token;
  if (!token) throw new Error("User not authenticated");
  return token;
}

export const studentAttemptApiService = {
  async getMyAttempts(): Promise<StudentAttemptRow[]> {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/api/v1/test-attempts/student`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch your attempts");
    }

    const data = await response.json();
    return data.attempts || [];
  },

  async getMyAttemptDetail(
    attemptId: string
  ): Promise<StudentAttemptDetailResponse> {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_URL}/api/v1/test-attempts/student/${attemptId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch attempt detail");
    }

    return response.json();
  },
};
