-- Students (or other users) assigned to sit a specific assessment test.

CREATE TABLE IF NOT EXISTS assessment.test_assignees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id uuid NOT NULL REFERENCES assessment.tests(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT test_assignees_test_user_key UNIQUE (test_id, user_id)
);

COMMENT ON TABLE assessment.test_assignees IS 'Users assigned to take a given assessment test';
COMMENT ON COLUMN assessment.test_assignees.test_id IS 'Assessment test this user is assigned to';
COMMENT ON COLUMN assessment.test_assignees.user_id IS 'Assigned user (typically a student)';

CREATE INDEX idx_assessment_test_assignees_test_id ON assessment.test_assignees (test_id);
CREATE INDEX idx_assessment_test_assignees_user_id ON assessment.test_assignees (user_id);

ALTER TABLE assessment.test_assignees ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE assessment.test_assignees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE assessment.test_assignees TO authenticated;
