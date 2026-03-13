-- Replace get_online_test_by_share_code to derive duration/marks/questions from draft data
-- and generated draft questions instead of relying on online_tests stored fields.

CREATE OR REPLACE FUNCTION "public"."get_online_test_by_share_code"(
    p_share_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_user_org_id uuid;
    v_user_type text;
    v_test record;
    v_duration_minutes smallint;
    v_total_questions integer;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get user details
    SELECT org_id, user_type INTO v_user_org_id, v_user_type
    FROM users
    WHERE id = v_user_id;

    -- Get test and linked draft details
    SELECT
        ot.*,
        d.activity_id,
        d.paper_title,
        d.paper_subtitle,
        d.institute_name,
        d.maximum_marks,
        d.paper_duration
    INTO v_test
    FROM online_tests ot
    JOIN qgen_drafts d ON d.id = ot.qgen_draft_id
    WHERE ot.share_code = UPPER(p_share_code);

    IF v_test IS NULL THEN
        RAISE EXCEPTION 'Test not found';
    END IF;

    -- Check if user is in same org (students) or is teacher/admin/principal
    IF v_user_type = 'student' THEN
        IF v_user_org_id IS NULL OR v_user_org_id != v_test.org_id THEN
            RAISE EXCEPTION 'You do not have access to this test';
        END IF;

        IF v_test.status != 'active' THEN
            RAISE EXCEPTION 'This test is not currently available';
        END IF;
    END IF;

    -- Derive duration from draft paper_duration
    IF v_test.paper_duration IS NOT NULL THEN
        v_duration_minutes := EXTRACT(HOUR FROM v_test.paper_duration) * 60
                            + EXTRACT(MINUTE FROM v_test.paper_duration);
    ELSE
        v_duration_minutes := 60;
    END IF;

    -- Count active draft questions from draft activity
    SELECT COUNT(gq.id)
    INTO v_total_questions
    FROM gen_questions gq
    WHERE gq.activity_id = v_test.activity_id
      AND gq.is_in_draft = true;

    RETURN jsonb_build_object(
        'id', v_test.id,
        'title', v_test.title,
        'paper_title', v_test.paper_title,
        'paper_subtitle', v_test.paper_subtitle,
        'institute_name', v_test.institute_name,
        'duration_minutes', v_duration_minutes,
        'total_questions', COALESCE(v_total_questions, 0),
        'total_marks', v_test.maximum_marks,
        'maximum_marks', v_test.maximum_marks,
        'status', v_test.status,
        'max_attempts', v_test.max_attempts,
        'show_results_immediately', v_test.show_results_immediately
    );
END;
$$;

ALTER FUNCTION "public"."get_online_test_by_share_code"(text) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_online_test_by_share_code" IS
'Gets online test details by share code. Duration/marks are derived from draft data and total_questions is counted from draft gen_questions.';

GRANT EXECUTE ON FUNCTION "public"."get_online_test_by_share_code"(text) TO "authenticated";
