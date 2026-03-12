-- Fetch attempt questions through SECURITY DEFINER to keep gen_questions RLS strict
CREATE OR REPLACE FUNCTION "public"."get_test_attempt_questions"(
    p_attempt_id uuid
)
RETURNS TABLE (
    id uuid,
    question_text text,
    explanation text,
    marks smallint,
    question_type text,
    hardness_level text,
    option1 text,
    option2 text,
    option3 text,
    option4 text,
    position_in_draft smallint,
    qgen_draft_section_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_type text;
    v_user_org_id uuid;
    v_attempt record;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT u.user_type, u.org_id
    INTO v_user_type, v_user_org_id
    FROM users u
    WHERE u.id = v_user_id;

    IF v_user_type IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT
        ta.id,
        ta.student_id,
        ot.org_id,
        ot.qgen_draft_id
    INTO v_attempt
    FROM test_attempts ta
    JOIN online_tests ot ON ot.id = ta.online_test_id
    WHERE ta.id = p_attempt_id;

    IF v_attempt IS NULL THEN
        RAISE EXCEPTION 'Test attempt not found';
    END IF;

    IF v_user_type = 'student' THEN
        IF v_attempt.student_id <> v_user_id THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    ELSIF v_user_type IN ('teacher', 'admin', 'principal') THEN
        IF v_user_org_id IS NULL OR v_user_org_id <> v_attempt.org_id THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    ELSE
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        gq.id,
        gq.question_text,
        gq.explanation,
        gq.marks,
        gq.question_type::text,
        gq.hardness_level::text,
        gq.option1,
        gq.option2,
        gq.option3,
        gq.option4,
        gq.position_in_draft,
        gq.qgen_draft_section_id
    FROM qgen_drafts qd
    JOIN gen_questions gq ON gq.activity_id = qd.activity_id
    WHERE qd.id = v_attempt.qgen_draft_id
      AND gq.is_in_draft = true
    ORDER BY gq.position_in_draft ASC;
END;
$$;

ALTER FUNCTION "public"."get_test_attempt_questions"(uuid) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_test_attempt_questions"(uuid)
    IS 'Returns test questions for an attempt after validating student ownership/org access. Uses SECURITY DEFINER to avoid exposing gen_questions directly to students.';

GRANT EXECUTE ON FUNCTION "public"."get_test_attempt_questions"(uuid) TO "authenticated";
