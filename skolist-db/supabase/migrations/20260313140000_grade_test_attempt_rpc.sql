-- Auto-grade a submitted/timed-out test attempt.
-- Objective grading implemented for:
--   - mcq4 / true_or_false
--   - msq4 (with optional partial credit)
--   - match_the_following
-- Subjective and other types are currently assigned 0 marks.

CREATE OR REPLACE FUNCTION "public"."grade_test_attempt"(
  p_attempt_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_type text;
  v_user_org_id uuid;
  v_attempt record;
  v_total_obtained numeric(8,2);
  v_total_possible numeric(8,2);
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
    ta.status,
    ta.online_test_id,
    ot.org_id,
    ot.qgen_draft_id,
    COALESCE(ot.msq_partial_credit, true) AS msq_partial_credit
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

  UPDATE test_answers ta
  SET
    marks_obtained = gs.marks_obtained,
    is_correct = gs.is_correct,
    is_auto_graded = true,
    updated_at = now()
  FROM (
    SELECT
      ta_inner.id AS answer_id,
      CASE
        WHEN gq.question_type IN ('mcq4'::question_type_enum, 'true_or_false'::question_type_enum) THEN
          CASE
            WHEN ta_inner.selected_mcq_option IS NOT NULL
              AND ta_inner.selected_mcq_option = gq.correct_mcq_option
            THEN gq.marks::numeric
            ELSE 0::numeric
          END
        WHEN gq.question_type = 'msq4'::question_type_enum THEN
          CASE
            WHEN COALESCE(ta_inner.selected_msq_options, ARRAY[false,false,false,false]) = ARRAY[
              COALESCE(gq.msq_option1_answer, false),
              COALESCE(gq.msq_option2_answer, false),
              COALESCE(gq.msq_option3_answer, false),
              COALESCE(gq.msq_option4_answer, false)
            ] THEN gq.marks::numeric
            WHEN v_attempt.msq_partial_credit THEN
              ROUND(
                gq.marks::numeric * GREATEST(
                  0::numeric,
                  (
                    (
                      SELECT COUNT(*)
                      FROM generate_series(1,4) i
                      WHERE COALESCE(ta_inner.selected_msq_options[i], false)
                        AND COALESCE((ARRAY[
                          COALESCE(gq.msq_option1_answer, false),
                          COALESCE(gq.msq_option2_answer, false),
                          COALESCE(gq.msq_option3_answer, false),
                          COALESCE(gq.msq_option4_answer, false)
                        ])[i], false)
                    ) - (
                      SELECT COUNT(*)
                      FROM generate_series(1,4) i
                      WHERE COALESCE(ta_inner.selected_msq_options[i], false)
                        AND NOT COALESCE((ARRAY[
                          COALESCE(gq.msq_option1_answer, false),
                          COALESCE(gq.msq_option2_answer, false),
                          COALESCE(gq.msq_option3_answer, false),
                          COALESCE(gq.msq_option4_answer, false)
                        ])[i], false)
                    )
                  )::numeric / NULLIF(
                    (
                      SELECT COUNT(*)
                      FROM generate_series(1,4) i
                      WHERE COALESCE((ARRAY[
                        COALESCE(gq.msq_option1_answer, false),
                        COALESCE(gq.msq_option2_answer, false),
                        COALESCE(gq.msq_option3_answer, false),
                        COALESCE(gq.msq_option4_answer, false)
                      ])[i], false)
                    ),
                    0
                  )
                ),
                2
              )
            ELSE 0::numeric
          END
        WHEN gq.question_type = 'match_the_following'::question_type_enum THEN
          CASE
            WHEN ta_inner.match_answer IS NOT NULL
              AND gq.match_the_following_columns IS NOT NULL
              AND ta_inner.match_answer = gq.match_the_following_columns
            THEN gq.marks::numeric
            ELSE 0::numeric
          END
        ELSE
          0::numeric
      END AS marks_obtained,
      CASE
        WHEN gq.question_type IN ('mcq4'::question_type_enum, 'true_or_false'::question_type_enum) THEN
          (ta_inner.selected_mcq_option IS NOT NULL AND ta_inner.selected_mcq_option = gq.correct_mcq_option)
        WHEN gq.question_type = 'msq4'::question_type_enum THEN
          (COALESCE(ta_inner.selected_msq_options, ARRAY[false,false,false,false]) = ARRAY[
            COALESCE(gq.msq_option1_answer, false),
            COALESCE(gq.msq_option2_answer, false),
            COALESCE(gq.msq_option3_answer, false),
            COALESCE(gq.msq_option4_answer, false)
          ])
        WHEN gq.question_type = 'match_the_following'::question_type_enum THEN
          (ta_inner.match_answer IS NOT NULL
            AND gq.match_the_following_columns IS NOT NULL
            AND ta_inner.match_answer = gq.match_the_following_columns)
        ELSE
          NULL
      END AS is_correct
    FROM test_answers ta_inner
    JOIN gen_questions gq ON gq.id = ta_inner.gen_question_id
    WHERE ta_inner.test_attempt_id = p_attempt_id
  ) gs
  WHERE ta.id = gs.answer_id;

  SELECT
    COALESCE(SUM(
      CASE
        WHEN gq.question_type IN (
          'mcq4'::question_type_enum,
          'true_or_false'::question_type_enum,
          'msq4'::question_type_enum,
          'match_the_following'::question_type_enum
        )
        THEN COALESCE(ans.marks_obtained, 0)
        ELSE 0
      END
    ), 0)::numeric(8,2),
    COALESCE(SUM(gq.marks), 0)::numeric(8,2)
  INTO v_total_obtained, v_total_possible
  FROM qgen_drafts qd
  JOIN gen_questions gq ON gq.activity_id = qd.activity_id
  LEFT JOIN test_answers ans
    ON ans.test_attempt_id = p_attempt_id
   AND ans.gen_question_id = gq.id
  WHERE qd.id = v_attempt.qgen_draft_id
    AND gq.is_in_draft = true;

  UPDATE test_attempts
  SET
    total_marks_obtained = v_total_obtained,
    total_marks_possible = v_total_possible,
    grading_status = 'complete',
    status = CASE WHEN status IN ('submitted', 'timed_out') THEN 'graded'::test_attempt_status_enum ELSE status END,
    updated_at = now()
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', p_attempt_id,
    'total_marks_obtained', v_total_obtained,
    'total_marks_possible', v_total_possible,
    'grading_status', 'complete'
  );
END;
$$;

ALTER FUNCTION "public"."grade_test_attempt"(uuid) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."grade_test_attempt"(uuid)
  IS 'Auto-grades objective questions (mcq4/msq4/match_the_following/true_or_false) for an attempt and sets non-objective marks to 0.';

GRANT EXECUTE ON FUNCTION "public"."grade_test_attempt"(uuid) TO authenticated;
