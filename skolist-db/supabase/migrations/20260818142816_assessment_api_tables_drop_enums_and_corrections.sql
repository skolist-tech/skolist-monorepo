-- Convert exam_type to text and add check constraint
ALTER Table assessment.tests DROP COLUMN exam_type;
DROP TYPE assessment.exam_type_enum;
ALTER Table assessment.tests ADD COLUMN exam_type text NOT NULL DEFAULT 'jee_main';
ALTER Table assessment.tests ADD CONSTRAINT tests_exam_type_check CHECK (exam_type IN ('jee_main', 'jee_advanced', 'neet', 'other'));

-- Convert test_status to text and add check constraint
ALTER Table assessment.tests DROP COLUMN status;
DROP TYPE assessment.test_status_enum;
ALTER Table assessment.tests ADD COLUMN status text NOT NULL DEFAULT 'draft';
ALTER Table assessment.tests ADD CONSTRAINT tests_status_check CHECK (status IN ('draft', 'published', 'closed'));

-- Convert attempt_status to text and add check constraint
ALTER Table assessment.attempts DROP COLUMN status;
DROP TYPE assessment.attempt_status_enum;
ALTER Table assessment.attempts ADD COLUMN status text NOT NULL DEFAULT 'in_progress';
ALTER Table assessment.attempts ADD CONSTRAINT attempts_status_check CHECK (status IN ('in_progress', 'submitted', 'timed_out', 'graded'));

-- Convert subject to text and add check constraint
ALTER Table assessment.sections DROP COLUMN subject;
DROP TYPE assessment.subject_enum;
ALTER Table assessment.sections ADD COLUMN subject text NOT NULL DEFAULT 'other';
ALTER Table assessment.sections ADD CONSTRAINT sections_subject_check CHECK (subject IN ('other'));

-- Convert question_type to text and add check constraint
ALTER Table assessment.questions DROP COLUMN question_type;
DROP TYPE assessment.question_type_enum;
ALTER Table assessment.questions ADD COLUMN question_type text NOT NULL DEFAULT 'mcq';
ALTER Table assessment.questions ADD CONSTRAINT questions_question_type_check CHECK (question_type IN ('mcq', 'msq', 'numerical', 'integer'));

-- Convert hardness_level to text and add check constraint
ALTER Table assessment.questions DROP COLUMN hardness_level;
DROP TYPE assessment.hardness_level_enum;
ALTER Table assessment.questions ADD COLUMN hardness_level text NOT NULL DEFAULT 'easy';
ALTER Table assessment.questions ADD CONSTRAINT questions_hardness_level_check CHECK (hardness_level IN ('easy', 'medium', 'hard'));


-- Drop the constraint on a section to have specific subject, make it nullable.
-- DROP COLUMN subject above already removes this unique constraint; IF EXISTS keeps the migration idempotent.
ALTER TABLE assessment.sections DROP CONSTRAINT IF EXISTS sections_test_subject_key;
ALTER TABLE assessment.sections ALTER COLUMN subject DROP NOT NULL;
COMMENT ON COLUMN assessment.sections.subject IS NULL;


-- Add answer column to the questions table
ALTER TABLE assessment.questions ADD COLUMN answer text;
COMMENT ON COLUMN assessment.questions.answer IS 'Answer to the question';


-- Change the name of assessment.answers table to assessment.responses
ALTER TABLE assessment.answers RENAME TO responses;
COMMENT ON TABLE assessment.responses IS 'Per-question response within an attempt';

-- Expose assessment on the Data API (PostgREST).
-- PGRST106 is controlled by authenticator.pgrst.db_schemas, not GRANT alone.

GRANT USAGE ON SCHEMA assessment TO anon, authenticated, service_role, authenticator;

GRANT ALL ON ALL TABLES IN SCHEMA assessment TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA assessment TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA assessment TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA assessment
    GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA assessment
    GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA assessment
    GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, assessment';
ALTER ROLE authenticator SET pgrst.db_extra_search_path = 'public, extensions, assessment';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
