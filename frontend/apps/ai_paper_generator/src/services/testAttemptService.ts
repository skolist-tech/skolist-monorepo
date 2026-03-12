/**
 * Test Attempt Service
 * Handles Supabase operations for taking online tests
 */

import { getSupabaseClient } from "@skolist/auth";

export interface TestAttemptDetails extends TestAttempt {
  student: {
    name: string;
    email?: string;
    phone_num?: string;
    avatar_url?: string;
  };
}

export interface TestAttempt {
  id: string;
  online_test_id: string;
  student_id: string;
  attempt_number: number;
  status: "in_progress" | "submitted" | "timed_out" | "graded";
  started_at: string;
  submitted_at?: string;
  total_marks_obtained?: number;
  total_marks_possible?: number;
  grading_status: "pending" | "partial" | "complete";
  created_at: string;
  updated_at: string;
}

export interface TestAnswer {
  id: string;
  test_attempt_id: string;
  gen_question_id: string;
  question_position: number;
  selected_mcq_option?: number;
  selected_msq_options?: boolean[];
  text_answer?: string;
  numerical_answer?: number;
  match_answer?: Record<string, any>;
  is_correct?: boolean;
  marks_obtained?: number;
  answered_at?: string;
}

export interface TestQuestion {
  id: string;
  question_text: string;
  answer_text: string;
  explanation?: string;
  marks: number;
  question_type: string;
  // UI-friendly aliases used by test interface
  type?: string;
  options?: string[];
  section?: string;
  hardness_level: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  correct_mcq_option?: number;
  position_in_draft: number;
  qgen_draft_section_id?: string;
}

export interface OnlineTest {
  id: string;
  title: string;
  description?: string;
  paper_title?: string;
  paper_subtitle?: string;
  institute_name?: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  maximum_marks?: number;
  negative_marking: boolean;
  negative_marks_per_question?: number;
  status: "draft" | "active" | "closed";
  max_attempts: number;
  show_results_immediately: boolean;
  sections?: { name: string; question_count: number }[];
}

/**
 * Get test by share code
 */
export async function getTestByShareCode(
  shareCode: string
): Promise<OnlineTest> {
  const client = getSupabaseClient();

  const { data, error } = await client.rpc("get_online_test_by_share_code", {
    p_share_code: shareCode.toUpperCase(),
  });

  if (error) {
    console.error("Failed to fetch test by share code:", error);
    throw new Error(error.message || "Test not found");
  }

  if (!data) {
    throw new Error("Test not found");
  }

  return data;
}

/**
 * Get all attempts for a specific test (Teacher view)
 */
export async function getTestAttemptsByTestId(
  testId: string
): Promise<TestAttemptDetails[]> {
  const client = getSupabaseClient();

  // Fetch attempts with user details
  // Note: 'users' table is in public schema or auth.users?
  // Usually public.users is used for profile info.
  // Assuming public.users foreign key exists or we can join.

  // Checking typical setup: test_attempts.student_id -> users.id

  const { data, error } = await client
    .from("test_attempts")
    .select(
      `
      *,
      student:student_id (
        name,
        email,
        phone_num,
        avatar_url
      )
    `
    )
    .eq("online_test_id", testId)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch test attempts:", error);
    throw error;
  }

  return data as any as TestAttemptDetails[];
}

export async function startTestAttempt(testId: string): Promise<TestAttempt> {
  const client = getSupabaseClient();

  // First, get the next attempt number for this student
  const { data: existingAttempts } = await client
    .from("test_attempts")
    .select("attempt_number")
    .eq("online_test_id", testId)
    .eq("student_id", (await client.auth.getUser()).data.user?.id)
    .order("attempt_number", { ascending: false })
    .limit(1);

  const nextAttemptNumber = existingAttempts?.length
    ? (existingAttempts[0]?.attempt_number || 0) + 1
    : 1;

  const { data, error } = await client
    .from("test_attempts")
    .insert({
      online_test_id: testId,
      student_id: (await client.auth.getUser()).data.user?.id,
      attempt_number: nextAttemptNumber,
      status: "in_progress",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to start test attempt:", error);
    throw new Error(error.message || "Failed to start test attempt");
  }

  return data;
}

/**
 * Get test questions with their positions
 */
export async function getTestQuestions(
  attemptId: string
): Promise<TestQuestion[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("get_test_attempt_questions", {
    p_attempt_id: attemptId,
  });

  if (error) {
    console.error("Failed to fetch test questions:", error);
    throw new Error(error.message || "Failed to fetch test questions");
  }

  const normalizeType = (questionType: string): string => {
    const t = (questionType || "").toLowerCase();
    if (t.includes("msq")) return "multiple_choice_multiple";
    if (t.includes("mcq") || t.includes("true_false"))
      return "multiple_choice_single";
    return "text_input";
  };

  const rows = (data || []) as TestQuestion[];

  return rows.map((q: TestQuestion) => ({
    ...q,
    type: normalizeType(q.question_type),
    options: [q.option1, q.option2, q.option3, q.option4].filter(
      (opt): opt is string => Boolean(opt)
    ),
    section: q.qgen_draft_section_id || undefined,
  }));
}

/**
 * Save/update an answer for a question
 */
export async function saveTestAnswer(
  attemptId: string,
  questionId: string,
  questionPosition: number,
  answerData: Partial<TestAnswer>
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from("test_answers")
    .upsert({
      test_attempt_id: attemptId,
      gen_question_id: questionId,
      question_position: questionPosition,
      ...answerData,
      answered_at: new Date().toISOString(),
    })
    .match({ test_attempt_id: attemptId, gen_question_id: questionId });

  if (error) {
    console.error("Failed to save test answer:", error);
    throw new Error(error.message || "Failed to save answer");
  }
}

/**
 * Save multiple answers for a test attempt
 */
export async function saveTestAnswers(
  attemptId: string,
  answers: Record<string, string | string[]>
): Promise<void> {
  const client = getSupabaseClient();

  // Convert answers object to array of test answers
  const answersToSave = Object.entries(answers).map(
    ([questionId, answer], index) => {
      const baseAnswer = {
        test_attempt_id: attemptId,
        gen_question_id: questionId,
        question_position: index + 1,
        answered_at: new Date().toISOString(),
      };

      if (Array.isArray(answer)) {
        // Multiple choice answers
        return {
          ...baseAnswer,
          selected_msq_options: answer.map(() => true), // Simplified - in real app, map to actual boolean array
        };
      } else {
        // Single choice or text answer
        return {
          ...baseAnswer,
          text_answer: answer,
        };
      }
    }
  );

  for (const answer of answersToSave) {
    const { error } = await client
      .from("test_answers")
      .upsert(answer)
      .match({
        test_attempt_id: attemptId,
        gen_question_id: answer.gen_question_id,
      });

    if (error) {
      console.error("Failed to save test answer:", error);
      throw new Error(error.message || "Failed to save answers");
    }
  }
}

/**
 * Get all answers for a test attempt
 */
export async function getTestAnswers(attemptId: string): Promise<TestAnswer[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("test_answers")
    .select("*")
    .eq("test_attempt_id", attemptId)
    .order("question_position", { ascending: true });

  if (error) {
    console.error("Failed to fetch test answers:", error);
    throw new Error(error.message || "Failed to fetch answers");
  }

  return data || [];
}

/**
 * Submit test attempt
 */
export async function submitTestAttempt(attemptId: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from("test_attempts")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  if (error) {
    console.error("Failed to submit test attempt:", error);
    throw new Error(error.message || "Failed to submit test");
  }
}

/**
 * Get user's existing attempts for a test
 */
export async function getUserTestAttempts(
  testId: string
): Promise<TestAttempt[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("test_attempts")
    .select("*")
    .eq("online_test_id", testId)
    .eq("student_id", (await client.auth.getUser()).data.user?.id)
    .order("attempt_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch user test attempts:", error);
    throw new Error(error.message || "Failed to fetch attempts");
  }

  return data || [];
}

// Service object export for easier importing
export const testAttemptService = {
  getTestByShareCode,
  startTestAttempt,
  getTestQuestions,
  saveTestAnswers,
  saveTestAnswer,
  getTestAnswers,
  submitTestAttempt,
  getUserTestAttempts,
};
