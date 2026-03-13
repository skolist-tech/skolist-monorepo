-- ============================================================================
-- ONLINE TEST PLATFORM MIGRATION
-- Creates tables for online test functionality from qgen drafts
-- ============================================================================

-- ==========================
-- 1. CREATE ENUMS
-- ==========================

CREATE TYPE "public"."online_test_status_enum" AS ENUM (
    'draft',
    'active',
    'closed'
);

ALTER TYPE "public"."online_test_status_enum" OWNER TO "postgres";

COMMENT ON TYPE "public"."online_test_status_enum" IS 'Status of an online test: draft (not yet published), active (students can attempt), closed (no more attempts allowed)';


CREATE TYPE "public"."test_attempt_status_enum" AS ENUM (
    'in_progress',
    'submitted',
    'timed_out',
    'graded'
);

ALTER TYPE "public"."test_attempt_status_enum" OWNER TO "postgres";

COMMENT ON TYPE "public"."test_attempt_status_enum" IS 'Status of a test attempt: in_progress, submitted, timed_out (auto-submitted), graded';


-- ==========================
-- 2. CREATE HELPER FUNCTIONS
-- ==========================

-- Function to generate a random alphanumeric share code
CREATE OR REPLACE FUNCTION "public"."generate_share_code"(length integer DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excluded O, 0, I, 1 for readability
    result text := '';
    i integer;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

ALTER FUNCTION "public"."generate_share_code"(integer) OWNER TO "postgres";


-- Function to auto-generate unique share code on insert
CREATE OR REPLACE FUNCTION "public"."set_online_test_share_code"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    new_code text;
    code_exists boolean;
BEGIN
    -- Only generate if share_code is not provided
    IF NEW.share_code IS NULL THEN
        LOOP
            new_code := generate_share_code(8);
            SELECT EXISTS(SELECT 1 FROM online_tests WHERE share_code = new_code) INTO code_exists;
            EXIT WHEN NOT code_exists;
        END LOOP;
        NEW.share_code := new_code;
    END IF;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."set_online_test_share_code"() OWNER TO "postgres";


-- ==========================
-- 3. CREATE TABLES
-- ==========================

-- Table: online_tests
-- Represents an online test created from a qgen draft
CREATE TABLE IF NOT EXISTS "public"."online_tests" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "qgen_draft_id" uuid NOT NULL,
    "org_id" uuid NOT NULL,
    "created_by" uuid NOT NULL,
    "share_code" text NOT NULL,
    "title" text,
    "status" "public"."online_test_status_enum" DEFAULT 'draft'::online_test_status_enum NOT NULL,
    "duration_minutes" smallint,
    "max_attempts" smallint DEFAULT 1,
    "show_results_immediately" boolean DEFAULT false NOT NULL,
    "shuffle_questions" boolean DEFAULT false NOT NULL,
    "negative_marks_config" jsonb,
    "msq_partial_credit" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT "online_tests_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "online_tests_share_code_key" UNIQUE ("share_code"),
    CONSTRAINT "online_tests_qgen_draft_id_key" UNIQUE ("qgen_draft_id"),
    CONSTRAINT "online_tests_duration_minutes_check" CHECK (duration_minutes > 0),
    CONSTRAINT "online_tests_max_attempts_check" CHECK (max_attempts >= 1),
    CONSTRAINT "online_tests_dates_check" CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

ALTER TABLE "public"."online_tests" OWNER TO "postgres";

COMMENT ON TABLE "public"."online_tests" IS 'Online tests created from qgen drafts for students to attempt';
COMMENT ON COLUMN "public"."online_tests"."qgen_draft_id" IS 'Reference to the source draft (live link, not snapshot)';
COMMENT ON COLUMN "public"."online_tests"."org_id" IS 'Organization ID - only students in this org can attempt';
COMMENT ON COLUMN "public"."online_tests"."share_code" IS 'Short alphanumeric code for shareable URL';
COMMENT ON COLUMN "public"."online_tests"."negative_marks_config" IS 'Per question type negative marks, e.g., {"mcq4": 0.25, "true_or_false": 0.5}';
COMMENT ON COLUMN "public"."online_tests"."msq_partial_credit" IS 'Allow partial marks for MSQ (proportional to correct options selected)';


-- Table: test_attempts
-- Represents each student's attempt at a test
CREATE TABLE IF NOT EXISTS "public"."test_attempts" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "online_test_id" uuid NOT NULL,
    "student_id" uuid NOT NULL,
    "attempt_number" smallint DEFAULT 1 NOT NULL,
    "status" "public"."test_attempt_status_enum" DEFAULT 'in_progress'::test_attempt_status_enum NOT NULL,
    "started_at" timestamp with time zone DEFAULT now() NOT NULL,
    "submitted_at" timestamp with time zone,
    "total_marks_obtained" decimal(8, 2),
    "total_marks_possible" decimal(8, 2),
    "grading_status" text DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_attempts_unique_attempt" UNIQUE ("online_test_id", "student_id", "attempt_number"),
    CONSTRAINT "test_attempts_attempt_number_check" CHECK (attempt_number >= 1),
    CONSTRAINT "test_attempts_grading_status_check" CHECK (grading_status = ANY (ARRAY['pending'::text, 'partial'::text, 'complete'::text]))
);

ALTER TABLE "public"."test_attempts" OWNER TO "postgres";

COMMENT ON TABLE "public"."test_attempts" IS 'Individual test attempts by students';
COMMENT ON COLUMN "public"."test_attempts"."attempt_number" IS '1 for first attempt, 2 for second, etc.';
COMMENT ON COLUMN "public"."test_attempts"."grading_status" IS 'pending (not graded), partial (some questions graded), complete (all graded)';


-- Table: test_answers
-- Stores individual question answers for each attempt
CREATE TABLE IF NOT EXISTS "public"."test_answers" (
    "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    "test_attempt_id" uuid NOT NULL,
    "gen_question_id" uuid NOT NULL,
    "question_position" smallint NOT NULL,
    "selected_mcq_option" smallint,
    "selected_msq_options" boolean[],
    "text_answer" text,
    "numerical_answer" decimal(15, 6),
    "match_answer" jsonb,
    "is_correct" boolean,
    "marks_obtained" decimal(6, 2),
    "ai_grading_feedback" text,
    "is_auto_graded" boolean DEFAULT false NOT NULL,
    "answered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    
    CONSTRAINT "test_answers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "test_answers_unique_question" UNIQUE ("test_attempt_id", "gen_question_id"),
    CONSTRAINT "test_answers_selected_mcq_option_check" CHECK (selected_mcq_option IS NULL OR selected_mcq_option BETWEEN 1 AND 4),
    CONSTRAINT "test_answers_question_position_check" CHECK (question_position >= 1)
);

ALTER TABLE "public"."test_answers" OWNER TO "postgres";

COMMENT ON TABLE "public"."test_answers" IS 'Individual question answers within a test attempt';
COMMENT ON COLUMN "public"."test_answers"."question_position" IS 'Position of question as shown to student';
COMMENT ON COLUMN "public"."test_answers"."selected_msq_options" IS 'Array of 4 booleans for MSQ selection';
COMMENT ON COLUMN "public"."test_answers"."ai_grading_feedback" IS 'AI-generated explanation for text answer grading';


-- ==========================
-- 4. ADD FOREIGN KEYS
-- ==========================

ALTER TABLE "public"."online_tests"
    ADD CONSTRAINT "online_tests_qgen_draft_id_fkey" 
    FOREIGN KEY ("qgen_draft_id") REFERENCES "public"."qgen_drafts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."online_tests"
    ADD CONSTRAINT "online_tests_org_id_fkey" 
    FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;

ALTER TABLE "public"."online_tests"
    ADD CONSTRAINT "online_tests_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_attempts"
    ADD CONSTRAINT "test_attempts_online_test_id_fkey" 
    FOREIGN KEY ("online_test_id") REFERENCES "public"."online_tests"("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_attempts"
    ADD CONSTRAINT "test_attempts_student_id_fkey" 
    FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_answers"
    ADD CONSTRAINT "test_answers_test_attempt_id_fkey" 
    FOREIGN KEY ("test_attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE CASCADE;

ALTER TABLE "public"."test_answers"
    ADD CONSTRAINT "test_answers_gen_question_id_fkey" 
    FOREIGN KEY ("gen_question_id") REFERENCES "public"."gen_questions"("id") ON DELETE CASCADE;


-- ==========================
-- 5. CREATE INDEXES
-- ==========================

CREATE INDEX "idx_online_tests_org_id" ON "public"."online_tests" ("org_id");
CREATE INDEX "idx_online_tests_status" ON "public"."online_tests" ("status");
CREATE INDEX "idx_online_tests_created_by" ON "public"."online_tests" ("created_by");

CREATE INDEX "idx_test_attempts_online_test_id" ON "public"."test_attempts" ("online_test_id");
CREATE INDEX "idx_test_attempts_student_id" ON "public"."test_attempts" ("student_id");
CREATE INDEX "idx_test_attempts_status" ON "public"."test_attempts" ("status");

CREATE INDEX "idx_test_answers_test_attempt_id" ON "public"."test_answers" ("test_attempt_id");
CREATE INDEX "idx_test_answers_gen_question_id" ON "public"."test_answers" ("gen_question_id");


-- ==========================
-- 6. CREATE TRIGGERS
-- ==========================

-- Trigger to auto-generate share code on insert
CREATE TRIGGER "trg_set_online_test_share_code"
    BEFORE INSERT ON "public"."online_tests"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_online_test_share_code"();


-- ==========================
-- 7. ENABLE ROW LEVEL SECURITY
-- ==========================

ALTER TABLE "public"."online_tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_answers" ENABLE ROW LEVEL SECURITY;


-- ==========================
-- 8. RLS POLICIES
-- ==========================

-- online_tests policies
-- Teachers can create/manage tests in their org
CREATE POLICY "Teachers can create online tests"
    ON "public"."online_tests"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type IN ('teacher', 'admin', 'principal')
            AND org_id = online_tests.org_id
        )
    );

CREATE POLICY "Teachers can update their online tests"
    ON "public"."online_tests"
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'principal')
            AND org_id = online_tests.org_id
        )
    );

CREATE POLICY "Teachers can view org tests"
    ON "public"."online_tests"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type IN ('teacher', 'admin', 'principal')
            AND org_id = online_tests.org_id
        )
    );

CREATE POLICY "Students can view active tests in their org"
    ON "public"."online_tests"
    FOR SELECT
    TO authenticated
    USING (
        status = 'active'
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND user_type = 'student'
            AND org_id = online_tests.org_id
        )
    );

-- test_attempts policies
CREATE POLICY "Students can create attempts for active tests"
    ON "public"."test_attempts"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM online_tests ot
            JOIN users u ON u.org_id = ot.org_id
            WHERE ot.id = test_attempts.online_test_id
            AND ot.status = 'active'
            AND u.id = auth.uid()
            AND u.user_type = 'student'
        )
    );

CREATE POLICY "Students can view their own attempts"
    ON "public"."test_attempts"
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

CREATE POLICY "Students can update their in-progress attempts"
    ON "public"."test_attempts"
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() AND status = 'in_progress');

CREATE POLICY "Teachers can view attempts in their org"
    ON "public"."test_attempts"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM online_tests ot
            JOIN users u ON u.org_id = ot.org_id
            WHERE ot.id = test_attempts.online_test_id
            AND u.id = auth.uid()
            AND u.user_type IN ('teacher', 'admin', 'principal')
        )
    );

CREATE POLICY "Teachers can update attempts for grading"
    ON "public"."test_attempts"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM online_tests ot
            JOIN users u ON u.org_id = ot.org_id
            WHERE ot.id = test_attempts.online_test_id
            AND u.id = auth.uid()
            AND u.user_type IN ('teacher', 'admin', 'principal')
        )
    );

-- test_answers policies
CREATE POLICY "Students can insert/update answers for their attempts"
    ON "public"."test_answers"
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM test_attempts ta
            WHERE ta.id = test_answers.test_attempt_id
            AND ta.student_id = auth.uid()
            AND ta.status = 'in_progress'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM test_attempts ta
            WHERE ta.id = test_answers.test_attempt_id
            AND ta.student_id = auth.uid()
            AND ta.status = 'in_progress'
        )
    );

CREATE POLICY "Students can view their own answers"
    ON "public"."test_answers"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM test_attempts ta
            WHERE ta.id = test_answers.test_attempt_id
            AND ta.student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view answers in their org"
    ON "public"."test_answers"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM test_attempts ta
            JOIN online_tests ot ON ot.id = ta.online_test_id
            JOIN users u ON u.org_id = ot.org_id
            WHERE ta.id = test_answers.test_attempt_id
            AND u.id = auth.uid()
            AND u.user_type IN ('teacher', 'admin', 'principal')
        )
    );

CREATE POLICY "Teachers can update answers for grading"
    ON "public"."test_answers"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM test_attempts ta
            JOIN online_tests ot ON ot.id = ta.online_test_id
            JOIN users u ON u.org_id = ot.org_id
            WHERE ta.id = test_answers.test_attempt_id
            AND u.id = auth.uid()
            AND u.user_type IN ('teacher', 'admin', 'principal')
        )
    );


-- ==========================
-- 9. GRANT PERMISSIONS
-- ==========================

GRANT ALL ON TABLE "public"."online_tests" TO "anon";
GRANT ALL ON TABLE "public"."online_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."online_tests" TO "service_role";

GRANT ALL ON TABLE "public"."test_attempts" TO "anon";
GRANT ALL ON TABLE "public"."test_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."test_attempts" TO "service_role";

GRANT ALL ON TABLE "public"."test_answers" TO "anon";
GRANT ALL ON TABLE "public"."test_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."test_answers" TO "service_role";


-- ==========================
-- 10. RPC FUNCTIONS
-- ==========================

-- Create online test from draft
-- Returns the online test details including share_code
CREATE OR REPLACE FUNCTION "public"."create_online_test_from_draft"(
    p_draft_id uuid,
    p_max_attempts smallint DEFAULT 1,
    p_show_results_immediately boolean DEFAULT false,
    p_negative_marks_config jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_type text;
    v_org_id uuid;
    v_draft record;
    v_duration_minutes smallint;
    v_test_id uuid;
    v_share_code text;
    v_existing_test record;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user details
    SELECT user_type, org_id INTO v_user_type, v_org_id
    FROM users
    WHERE id = v_user_id;

    -- Check user type
    IF v_user_type NOT IN ('teacher', 'admin', 'principal') THEN
        RAISE EXCEPTION 'Only teachers, admins, or principals can create online tests';
    END IF;

    -- Check org
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'User must belong to an organization to create online tests';
    END IF;

    -- Get draft details
    SELECT d.*, a.user_id as activity_user_id
    INTO v_draft
    FROM qgen_drafts d
    JOIN activities a ON a.id = d.activity_id
    WHERE d.id = p_draft_id;

    IF v_draft IS NULL THEN
        RAISE EXCEPTION 'Draft not found';
    END IF;

    -- Verify the draft belongs to the user
    IF v_draft.activity_user_id != v_user_id THEN
        RAISE EXCEPTION 'You can only create online tests from your own drafts';
    END IF;

    -- Check if online test already exists for this draft
    SELECT * INTO v_existing_test
    FROM online_tests
    WHERE qgen_draft_id = p_draft_id;

    IF v_existing_test IS NOT NULL THEN
        -- Return existing test info
        RETURN jsonb_build_object(
            'id', v_existing_test.id,
            'share_code', v_existing_test.share_code,
            'status', v_existing_test.status,
            'title', v_existing_test.title,
            'created_at', v_existing_test.created_at,
            'already_exists', true
        );
    END IF;

    -- Calculate duration from paper_duration (time type to minutes)
    IF v_draft.paper_duration IS NOT NULL THEN
        v_duration_minutes := EXTRACT(HOUR FROM v_draft.paper_duration) * 60 
                            + EXTRACT(MINUTE FROM v_draft.paper_duration);
    ELSE
        v_duration_minutes := 60; -- Default 60 minutes
    END IF;

    -- Create the online test
    INSERT INTO online_tests (
        qgen_draft_id,
        org_id,
        created_by,
        title,
        duration_minutes,
        max_attempts,
        show_results_immediately,
        negative_marks_config,
        status
    )
    VALUES (
        p_draft_id,
        v_org_id,
        v_user_id,
        COALESCE(v_draft.paper_title, 'Online Test'),
        v_duration_minutes,
        p_max_attempts,
        p_show_results_immediately,
        p_negative_marks_config,
        'active'  -- Immediately active
    )
    RETURNING id, share_code INTO v_test_id, v_share_code;

    -- Return the created test info
    RETURN jsonb_build_object(
        'id', v_test_id,
        'share_code', v_share_code,
        'status', 'active',
        'title', COALESCE(v_draft.paper_title, 'Online Test'),
        'duration_minutes', v_duration_minutes,
        'created_at', now(),
        'already_exists', false
    );
END;
$$;

ALTER FUNCTION "public"."create_online_test_from_draft"(uuid, smallint, boolean, jsonb) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."create_online_test_from_draft" IS 'Creates an online test from a qgen draft. Returns the share_code for the test link.';


-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION "public"."create_online_test_from_draft"(uuid, smallint, boolean, jsonb) TO "authenticated";
