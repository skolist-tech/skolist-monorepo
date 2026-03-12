/**
 * Test Attempt Service
 * Handles Supabase operations for taking online tests
 */

import { getSupabaseClient } from "@skolist/auth";

export interface TestAttemptDetails extends TestAttempt {
  student: {
    name?: string | null;
    email?: string | null;
    phone_num?: string | null;
    avatar_url?: string | null;
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
  selected_mcq_option?: number | null;
  selected_msq_options?: boolean[] | null;
  text_answer?: string | null;
  numerical_answer?: number | null;
  match_answer?: Record<string, any> | null;
  is_correct?: boolean | null;
  marks_obtained?: number | null;
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
 * Save/update an answer for a question (High Level)
 * - Automatically handles mapping string/array answers to correct DB columns (selected_mcq_option, text_answer, etc.)
 */
export async function saveSingleStudentAnswer(
  attemptId: string,
  question: TestQuestion,
  answerValue: string | string[]
): Promise<void> {
  const client = getSupabaseClient();
  const questionId = question.id;
  const questionPosition = question.position_in_draft || 0;

  // Ensure we have options list for mapping indices
  const optionsList =
    question.options ||
    [
      question.option1,
      question.option2,
      question.option3,
      question.option4,
    ].filter((opt): opt is string => typeof opt === "string");

  const baseAnswer = {
    test_attempt_id: attemptId,
    gen_question_id: questionId,
    question_position: questionPosition,
    answered_at: new Date().toISOString(),
  };

  let payload: Partial<TestAnswer> = {};

  if (Array.isArray(answerValue)) {
    // MSQ Case
    const booleanOptions = [false, false, false, false];
    answerValue.forEach((val) => {
      const idx = optionsList.indexOf(val);
      if (idx !== -1 && idx < 4) {
        booleanOptions[idx] = true;
      }
    });
    payload = {
      ...baseAnswer,
      selected_msq_options: booleanOptions,
      selected_mcq_option: null,
      text_answer: null,
    };
  } else {
    // Single Answer Case
    const isMcq =
      question.type === "multiple_choice_single" ||
      question.question_type?.toLowerCase().includes("mcq") ||
      question.question_type?.toLowerCase().includes("true_false");

    if (isMcq) {
      const idx = optionsList.indexOf(answerValue);
      payload = {
        ...baseAnswer,
        selected_mcq_option: idx !== -1 ? idx + 1 : null,
        text_answer: null,
        selected_msq_options: null,
      };
    } else {
      payload = {
        ...baseAnswer,
        text_answer: answerValue,
        selected_mcq_option: null,
        selected_msq_options: null,
      };
    }
  }

  const { error } = await client.from("test_answers").upsert(payload, {
    onConflict: "test_attempt_id,gen_question_id",
  });

  if (error) {
    console.error("Failed to save test answer:", error);
    throw new Error(error.message || "Failed to save answer");
  }
}

/**
 * Save/update an answer for a question (Low Level - Raw Payload)
 */
export async function saveTestAnswer(
  attemptId: string,
  questionId: string,
  questionPosition: number,
  answerData: Partial<TestAnswer>
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client.from("test_answers").upsert(
    {
      test_attempt_id: attemptId,
      gen_question_id: questionId,
      question_position: questionPosition,
      ...answerData,
      answered_at: new Date().toISOString(),
    },
    {
      onConflict: "test_attempt_id,gen_question_id",
    }
  );

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
  answers: Record<string, string | string[]>,
  questions: TestQuestion[]
): Promise<void> {
  const client = getSupabaseClient();

  // 1. Map questions to get proper structure for saving answers
  const answersToSave = Object.entries(answers)
    .map(([questionId, answerValue]) => {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return null;

      // Ensure we have options list for mapping indices
      const optionsList =
        question.options ||
        [
          question.option1,
          question.option2,
          question.option3,
          question.option4,
        ].filter((opt): opt is string => typeof opt === "string");

      // Common fields
      const baseAnswer = {
        test_attempt_id: attemptId,
        gen_question_id: questionId,
        question_position: question.position_in_draft || 0, // Fallback if position missing
        answered_at: new Date().toISOString(),
      };

      // Determine answer type to save based on stored data type and question type
      if (Array.isArray(answerValue)) {
        // MSQ Case: answerValue is string[] (selected options)
        const booleanOptions = [false, false, false, false];
        answerValue.forEach((val) => {
          const idx = optionsList.indexOf(val);
          if (idx !== -1 && idx < 4) {
            booleanOptions[idx] = true;
          }
        });

        return {
          ...baseAnswer,
          selected_msq_options: booleanOptions,
          // Clear others just in case
          selected_mcq_option: null,
          text_answer: null,
        };
      } else {
        // Single Answer Case: string
        const isMcq =
          question.type === "multiple_choice_single" ||
          question.question_type?.toLowerCase().includes("mcq") ||
          question.question_type?.toLowerCase().includes("true_false");

        if (isMcq) {
          const idx = optionsList.indexOf(answerValue);
          return {
            ...baseAnswer,
            selected_mcq_option: idx !== -1 ? idx + 1 : null, // 1-based index
            text_answer: null,
            selected_msq_options: null,
          };
        } else {
          // Text/Numeric/Match
          return {
            ...baseAnswer,
            text_answer: answerValue,
            selected_mcq_option: null,
            selected_msq_options: null,
          };
        }
      }
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  if (answersToSave.length === 0) return;

  // 2. Perform upsert
  for (const answer of answersToSave) {
    const { error } = await client.from("test_answers").upsert(answer, {
      onConflict: "test_attempt_id,gen_question_id",
    });

    if (error) {
      console.error("Failed to save test answer:", error);
      // Depending on requirements, we can throw or continue
      // throw new Error(error.message || "Failed to save answers");
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

  const { error: gradingError } = await client.rpc("grade_test_attempt", {
    p_attempt_id: attemptId,
  });

  if (gradingError) {
    console.error("Test submitted but auto-grading failed:", gradingError);
    throw new Error(
      gradingError.message || "Test submitted but auto-grading failed"
    );
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
  saveSingleStudentAnswer,
  saveTestAnswers,
  saveTestAnswer,
  getTestAnswers,
  submitTestAttempt,
  getUserTestAttempts,
};
