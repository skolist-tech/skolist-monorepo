--IDEMPOTENT
-- Blueprint catalog, explicit teacher access, student groups, and review flags.

ALTER TABLE assessment.tests
    ADD COLUMN IF NOT EXISTS source_blueprint_id uuid,
    ADD COLUMN IF NOT EXISTS students_can_review_attempts boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS students_can_see_answers boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN assessment.tests.source_blueprint_id IS 'Blueprint this paper was cloned from, when created from the catalog';
COMMENT ON COLUMN assessment.tests.students_can_review_attempts IS 'When true, assigned students can open closed or ended papers and their attempts';
COMMENT ON COLUMN assessment.tests.students_can_see_answers IS 'When true, students see answer keys and correct/wrong on submitted attempts';

CREATE TABLE IF NOT EXISTS assessment.test_blueprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    exam_type text NOT NULL DEFAULT 'jee_main',
    duration_minutes smallint NOT NULL,
    total_marks numeric(8, 2),
    default_correct_marks numeric(6, 2) NOT NULL DEFAULT 4,
    default_negative_marks numeric(6, 2) NOT NULL DEFAULT 1,
    kind text NOT NULL DEFAULT 'full_syllabus',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT test_blueprints_duration_check CHECK (duration_minutes > 0),
    CONSTRAINT test_blueprints_kind_check CHECK (kind IN ('full_syllabus', 'chapter_wise')),
    CONSTRAINT test_blueprints_exam_type_check CHECK (exam_type IN ('jee_main', 'jee_advanced', 'neet', 'other'))
);

COMMENT ON TABLE assessment.test_blueprints IS 'Platform catalog of papers teachers can clone. Not owned by an organisation.';

DROP TRIGGER IF EXISTS trg_test_blueprints_set_updated_at ON assessment.test_blueprints;
CREATE TRIGGER trg_test_blueprints_set_updated_at
    BEFORE UPDATE ON assessment.test_blueprints
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();

CREATE TABLE IF NOT EXISTS assessment.blueprint_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id uuid NOT NULL REFERENCES assessment.test_blueprints(id) ON DELETE CASCADE,
    name text NOT NULL,
    subject text,
    position smallint NOT NULL DEFAULT 1,
    correct_marks numeric(6, 2),
    negative_marks numeric(6, 2),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blueprint_sections_position_check CHECK (position >= 1),
    CONSTRAINT blueprint_sections_blueprint_position_key UNIQUE (blueprint_id, position)
);

DROP TRIGGER IF EXISTS trg_blueprint_sections_set_updated_at ON assessment.blueprint_sections;
CREATE TRIGGER trg_blueprint_sections_set_updated_at
    BEFORE UPDATE ON assessment.blueprint_sections
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();

CREATE TABLE IF NOT EXISTS assessment.blueprint_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id uuid NOT NULL REFERENCES assessment.test_blueprints(id) ON DELETE CASCADE,
    section_id uuid NOT NULL REFERENCES assessment.blueprint_sections(id) ON DELETE CASCADE,
    position smallint NOT NULL,
    question_text text NOT NULL,
    question_type text NOT NULL DEFAULT 'mcq',
    hardness_level text NOT NULL DEFAULT 'easy',
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
    answer text,
    explanation text,
    image_url text,
    option1_image_url text,
    option2_image_url text,
    option3_image_url text,
    option4_image_url text,
    svg_image_code text,
    option1_svg_image_code text,
    option2_svg_image_code text,
    option3_svg_image_code text,
    option4_svg_image_code text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT blueprint_questions_position_check CHECK (position >= 1),
    CONSTRAINT blueprint_questions_section_position_key UNIQUE (section_id, position),
    CONSTRAINT blueprint_questions_type_check CHECK (question_type IN ('mcq', 'msq', 'numerical', 'integer')),
    CONSTRAINT blueprint_questions_hardness_check CHECK (hardness_level IN ('easy', 'medium', 'hard'))
);

DROP TRIGGER IF EXISTS trg_blueprint_questions_set_updated_at ON assessment.blueprint_questions;
CREATE TRIGGER trg_blueprint_questions_set_updated_at
    BEFORE UPDATE ON assessment.blueprint_questions
    FOR EACH ROW
    EXECUTE FUNCTION assessment.set_updated_at();

CREATE TABLE IF NOT EXISTS assessment.test_teacher_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT test_teacher_access_test_teacher_key UNIQUE (test_id, teacher_id)
);

COMMENT ON TABLE assessment.test_teacher_access IS 'Teachers allowed to see and edit a test. Same-org membership is not enough.';

CREATE INDEX IF NOT EXISTS idx_assessment_test_teacher_access_teacher
    ON assessment.test_teacher_access (teacher_id);

CREATE TABLE IF NOT EXISTS assessment.student_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT student_groups_org_name_key UNIQUE (org_id, name)
);

COMMENT ON TABLE assessment.student_groups IS 'Organisation student groups. Membership is managed outside the assessment app.';

CREATE TABLE IF NOT EXISTS assessment.student_group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES assessment.student_groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT student_group_members_group_user_key UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_student_group_members_user
    ON assessment.student_group_members (user_id);

CREATE TABLE IF NOT EXISTS assessment.test_group_assignees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES assessment.student_groups(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT test_group_assignees_test_group_key UNIQUE (test_id, group_id)
);

COMMENT ON TABLE assessment.test_group_assignees IS 'Groups assigned to a test. Removing the link does not remove individual test_assignees rows.';

CREATE INDEX IF NOT EXISTS idx_assessment_test_group_assignees_test
    ON assessment.test_group_assignees (test_id);

ALTER TABLE assessment.test_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.blueprint_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.blueprint_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.test_teacher_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.student_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment.test_group_assignees ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE assessment.test_blueprints TO anon, authenticated, service_role;
GRANT ALL ON TABLE assessment.blueprint_sections TO anon, authenticated, service_role;
GRANT ALL ON TABLE assessment.blueprint_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE assessment.test_teacher_access TO anon, authenticated, service_role;
GRANT ALL ON TABLE assessment.student_groups TO anon, authenticated, service_role;
GRANT ALL ON TABLE assessment.student_group_members TO anon, authenticated, service_role;
GRANT ALL ON TABLE assessment.test_group_assignees TO anon, authenticated, service_role;

INSERT INTO assessment.test_teacher_access (test_id, teacher_id)
SELECT id, created_by
FROM assessment.tests
WHERE created_by IS NOT NULL
ON CONFLICT (test_id, teacher_id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'tests_source_blueprint_id_fkey'
    ) THEN
        ALTER TABLE assessment.tests
            ADD CONSTRAINT tests_source_blueprint_id_fkey
            FOREIGN KEY (source_blueprint_id)
            REFERENCES assessment.test_blueprints(id)
            ON DELETE SET NULL;
    END IF;
END $$;
