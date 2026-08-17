-- ============================================================================
-- ASSESSMENT API SCHEMA
-- Independent of qgen / testing-platform. Own tables for JEE / NEET papers.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS assessment;

COMMENT ON SCHEMA assessment IS 'Standalone assessment API for JEE / NEET tests. Not linked to qgen drafts or gen_questions.';

GRANT USAGE ON SCHEMA assessment TO anon, authenticated, service_role;


-- ==========================
-- ENUMS
-- ==========================

CREATE TYPE assessment.exam_type_enum AS ENUM (
    'jee_main',
    'jee_advanced',
    'neet'
);

COMMENT ON TYPE assessment.exam_type_enum IS 'Exam this paper is modeled after';

CREATE TYPE assessment.test_status_enum AS ENUM (
    'draft',
    'published',
    'closed'
);

COMMENT ON TYPE assessment.test_status_enum IS 'draft = being built, published = students can attempt, closed = no new attempts';

CREATE TYPE assessment.subject_enum AS ENUM (
    'physics',
    'chemistry',
    'mathematics',
    'biology'
);

CREATE TYPE assessment.question_type_enum AS ENUM (
    'mcq',
    'msq',
    'numerical',
    'integer'
);

COMMENT ON TYPE assessment.question_type_enum IS 'mcq = single correct (JEE Main / NEET), msq = one or more correct (JEE Advanced), numerical = decimal, integer = whole number';

CREATE TYPE assessment.hardness_level_enum AS ENUM (
    'easy',
    'medium',
    'hard'
);

CREATE TYPE assessment.attempt_status_enum AS ENUM (
    'in_progress',
    'submitted',
    'timed_out',
    'graded'
);


-- ==========================
-- HELPERS
-- ==========================

CREATE OR REPLACE FUNCTION assessment.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


-- ==========================
-- TABLES
-- ==========================

-- A paper / mock test created by a school or coaching
CREATE TABLE IF NOT EXISTS assessment.tests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    exam_type assessment.exam_type_enum NOT NULL,
    status assessment.test_status_enum NOT NULL DEFAULT 'draft',
    duration_minutes smallint NOT NULL,
    total_marks numeric(8, 2),
    default_correct_marks numeric(6, 2) NOT NULL DEFAULT 4,
    default_negative_marks numeric(6, 2) NOT NULL DEFAULT 1,
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT tests_duration_minutes_check CHECK (duration_minutes > 0),
    CONSTRAINT tests_marks_check CHECK (default_correct_marks >= 0 AND default_negative_marks >= 0),
    CONSTRAINT tests_dates_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

COMMENT ON TABLE assessment.tests IS 'JEE / NEET papers. Owns its own questions; not sourced from qgen.';
COMMENT ON COLUMN assessment.tests.default_correct_marks IS 'Default +marks for a correct answer (typically 4 for JEE Main / NEET)';
COMMENT ON COLUMN assessment.tests.default_negative_marks IS 'Default marks deducted for a wrong MCQ (typically 1 for JEE Main / NEET). 0 means no negative marking.';

CREATE TRIGGER trg_tests_set_updated_at
    BEFORE UPDATE ON assessment.tests
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();


-- Physics / Chemistry / Maths (JEE) or Physics / Chemistry / Biology (NEET)
CREATE TABLE IF NOT EXISTS assessment.sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    name text NOT NULL,
    subject assessment.subject_enum NOT NULL,
    position smallint NOT NULL DEFAULT 1,
    correct_marks numeric(6, 2),
    negative_marks numeric(6, 2),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT sections_position_check CHECK (position >= 1),
    CONSTRAINT sections_test_subject_key UNIQUE (test_id, subject),
    CONSTRAINT sections_test_position_key UNIQUE (test_id, position)
);

COMMENT ON TABLE assessment.sections IS 'Subject sections within a paper (PCM for JEE, PCB for NEET)';
COMMENT ON COLUMN assessment.sections.correct_marks IS 'Overrides test default when set';
COMMENT ON COLUMN assessment.sections.negative_marks IS 'Overrides test default when set';

CREATE TRIGGER trg_sections_set_updated_at
    BEFORE UPDATE ON assessment.sections
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();


CREATE TABLE IF NOT EXISTS assessment.questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    section_id uuid NOT NULL REFERENCES assessment.sections(id) ON DELETE CASCADE,
    parent_question_id uuid REFERENCES assessment.questions(id) ON DELETE CASCADE,
    position smallint NOT NULL,
    question_text text NOT NULL,
    question_type assessment.question_type_enum NOT NULL,
    hardness_level assessment.hardness_level_enum,
    marks numeric(6, 2) NOT NULL,
    negative_marks numeric(6, 2) NOT NULL DEFAULT 0,
    option1 text,
    option2 text,
    option3 text,
    option4 text,
    correct_mcq_option smallint,
    msq_option1_answer boolean,
    msq_option2_answer boolean,
    msq_option3_answer boolean,
    msq_option4_answer boolean,
    numerical_answer numeric(15, 6),
    integer_answer integer,
    explanation text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT questions_position_check CHECK (position >= 1),
    CONSTRAINT questions_marks_check CHECK (marks >= 0 AND negative_marks >= 0),
    CONSTRAINT questions_correct_mcq_option_check CHECK (correct_mcq_option IS NULL OR correct_mcq_option BETWEEN 1 AND 4),
    CONSTRAINT questions_section_position_key UNIQUE (section_id, position),
    CONSTRAINT questions_mcq_requires_correct_option CHECK (
        question_type <> 'mcq' OR correct_mcq_option IS NOT NULL
    ),
    CONSTRAINT questions_numerical_requires_answer CHECK (
        question_type <> 'numerical' OR numerical_answer IS NOT NULL
    ),
    CONSTRAINT questions_integer_requires_answer CHECK (
        question_type <> 'integer' OR integer_answer IS NOT NULL
    )
);

COMMENT ON TABLE assessment.questions IS 'Questions stored on the assessment paper itself';
COMMENT ON COLUMN assessment.questions.parent_question_id IS 'Optional passage / comprehension stem (JEE Advanced paragraph questions)';
COMMENT ON COLUMN assessment.questions.correct_mcq_option IS '1-4 for single-correct MCQ';
COMMENT ON COLUMN assessment.questions.numerical_answer IS 'Exact numerical key (JEE Main numerical type)';
COMMENT ON COLUMN assessment.questions.integer_answer IS 'Integer-type key (JEE Advanced integer / JEE Main integer)';

CREATE TRIGGER trg_questions_set_updated_at
    BEFORE UPDATE ON assessment.questions
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();


CREATE TABLE IF NOT EXISTS assessment.attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    attempt_number smallint NOT NULL DEFAULT 1,
    status assessment.attempt_status_enum NOT NULL DEFAULT 'in_progress',
    started_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    total_marks_obtained numeric(8, 2),
    total_marks_possible numeric(8, 2),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT attempts_attempt_number_check CHECK (attempt_number >= 1),
    CONSTRAINT attempts_unique_attempt UNIQUE (test_id, student_id, attempt_number)
);

COMMENT ON TABLE assessment.attempts IS 'A student sitting a published assessment paper';

CREATE TRIGGER trg_attempts_set_updated_at
    BEFORE UPDATE ON assessment.attempts
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();


CREATE TABLE IF NOT EXISTS assessment.answers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id uuid NOT NULL REFERENCES assessment.attempts(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES assessment.questions(id) ON DELETE CASCADE,
    selected_mcq_option smallint,
    selected_msq_options boolean[],
    numerical_answer numeric(15, 6),
    integer_answer integer,
    is_correct boolean,
    marks_obtained numeric(6, 2),
    answered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT answers_unique_question UNIQUE (attempt_id, question_id),
    CONSTRAINT answers_selected_mcq_option_check CHECK (
        selected_mcq_option IS NULL OR selected_mcq_option BETWEEN 1 AND 4
    )
);

COMMENT ON TABLE assessment.answers IS 'Per-question response within an attempt';
COMMENT ON COLUMN assessment.answers.selected_msq_options IS 'Length-4 boolean array for multi-correct selection';

CREATE TRIGGER trg_answers_set_updated_at
    BEFORE UPDATE ON assessment.answers
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();


-- ==========================
-- INDEXES
-- ==========================

CREATE INDEX idx_assessment_tests_org_id ON assessment.tests (org_id);
CREATE INDEX idx_assessment_tests_exam_type ON assessment.tests (exam_type);
CREATE INDEX idx_assessment_tests_status ON assessment.tests (status);

CREATE INDEX idx_assessment_sections_test_id ON assessment.sections (test_id);

CREATE INDEX idx_assessment_questions_test_id ON assessment.questions (test_id);
CREATE INDEX idx_assessment_questions_section_id ON assessment.questions (section_id);
CREATE INDEX idx_assessment_questions_parent_question_id ON assessment.questions (parent_question_id);

CREATE INDEX idx_assessment_attempts_test_id ON assessment.attempts (test_id);
CREATE INDEX idx_assessment_attempts_student_id ON assessment.attempts (student_id);
CREATE INDEX idx_assessment_attempts_status ON assessment.attempts (status);

CREATE INDEX idx_assessment_answers_attempt_id ON assessment.answers (attempt_id);
CREATE INDEX idx_assessment_answers_question_id ON assessment.answers (question_id);


-- ==========================
-- RLS
-- Backend uses service_role (bypasses RLS). Locked down until API policies are added.
-- ==========================

ALTER TABLE assessment.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.answers ENABLE ROW LEVEL SECURITY;


-- ==========================
-- GRANTS
-- ==========================

GRANT ALL ON ALL TABLES IN SCHEMA assessment TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA assessment TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA assessment TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA assessment TO authenticated;
