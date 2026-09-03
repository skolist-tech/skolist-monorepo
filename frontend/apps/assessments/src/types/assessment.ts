export type UserRole = "teacher" | "student" | "other";

export type Actor = {
  id: string;
  email: string | null;
  user_type: string;
  org_id: string | null;
  role: UserRole;
};

export type TestSummary = {
  id: string;
  name: string;
  description?: string | null;
  exam_type: string;
  status: string;
  duration_minutes: number;
  total_marks?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  latest_attempt?: AttemptSummary | null;
};

export type AttemptSummary = {
  id: string;
  test_id: string;
  student_id: string;
  attempt_number: number;
  status: string;
  started_at?: string | null;
  submitted_at?: string | null;
  total_marks_obtained?: number | null;
  total_marks_possible?: number | null;
};

export type StudentQuestion = {
  id: string;
  test_id: string;
  section_id: string;
  parent_question_id?: string | null;
  position: number;
  question_text: string;
  question_type: string;
  hardness_level?: string | null;
  marks: number;
  negative_marks: number;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  option4?: string | null;
  explanation?: string | null;
  answer?: string | null;
};

export type TeacherQuestion = StudentQuestion & {
  correct_mcq_option?: number | null;
  msq_option1_answer?: boolean | null;
  msq_option2_answer?: boolean | null;
  msq_option3_answer?: boolean | null;
  msq_option4_answer?: boolean | null;
  numerical_answer?: number | null;
  integer_answer?: number | null;
};

export type Section<TQuestion = StudentQuestion> = {
  id: string;
  test_id: string;
  name: string;
  position: number;
  subject?: string | null;
  questions: TQuestion[];
};

export type Assignee = {
  id: string;
  test_id: string;
  user_id: string;
  created_at?: string;
};

export type StudentResponse = {
  id?: string;
  attempt_id: string;
  question_id: string;
  selected_mcq_option?: number | null;
  selected_msq_options?: boolean[] | null;
  numerical_answer?: number | null;
  integer_answer?: number | null;
  answered_at?: string | null;
  is_correct?: boolean | null;
  marks_obtained?: number | null;
};

export type TeacherTestDetail = TestSummary & {
  sections: Section<TeacherQuestion>[];
  assignees: Assignee[];
};

export type AttemptPaper = {
  attempt: AttemptSummary;
  test: TestSummary;
  sections: Section<StudentQuestion>[];
  responses: StudentResponse[];
};
