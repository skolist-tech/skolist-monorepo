--IDEMPOTENT
-- Per-student remaining attempts. Visibility stays on assignees; starting is gated here.

CREATE TABLE IF NOT EXISTS assessment.test_attempts_remaining_per_student (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    attempts_remaining integer NOT NULL DEFAULT 1,
    CONSTRAINT test_attempts_remaining_per_student_student_test_key UNIQUE (student_id, test_id),
    CONSTRAINT test_attempts_remaining_non_negative CHECK (attempts_remaining >= 0)
);

COMMENT ON TABLE assessment.test_attempts_remaining_per_student IS
    'How many new attempts a student may start on a test. Assigned separately from visibility.';
COMMENT ON COLUMN assessment.test_attempts_remaining_per_student.student_id IS
    'Student who may start attempts on this test';
COMMENT ON COLUMN assessment.test_attempts_remaining_per_student.test_id IS
    'Assessment test the remaining count applies to';
COMMENT ON COLUMN assessment.test_attempts_remaining_per_student.attempts_remaining IS
    'New attempts the student may still start. Below 1 blocks start.';

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_remaining_student
    ON assessment.test_attempts_remaining_per_student (student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_remaining_test
    ON assessment.test_attempts_remaining_per_student (test_id);

ALTER TABLE assessment.test_attempts_remaining_per_student ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE assessment.test_attempts_remaining_per_student TO anon, authenticated, service_role;

INSERT INTO assessment.test_attempts_remaining_per_student (student_id, test_id, attempts_remaining)
SELECT user_id, test_id, 1
FROM assessment.test_assignees
ON CONFLICT (student_id, test_id) DO NOTHING;

INSERT INTO assessment.test_attempts_remaining_per_student (student_id, test_id, attempts_remaining)
SELECT members.user_id, links.test_id, 1
FROM assessment.test_group_assignees AS links
JOIN assessment.student_group_members AS members ON members.group_id = links.group_id
ON CONFLICT (student_id, test_id) DO NOTHING;
