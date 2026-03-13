"""Grading routes for testing platform."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from ..auth import get_supabase_client, require_supabase_user
from .utils import get_request_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


def _normalize_true_false_value(value: Any) -> bool | None:
    """Normalize loose true/false text values to bool."""
    if value is None:
        return None

    text = str(value).strip().lower()
    if text in {"true", "t", "1", "yes", "y"}:
        return True
    if text in {"false", "f", "0", "no", "n"}:
        return False
    return None


@router.post("/{attempt_id}/grade")
def grade_attempt_backend(
    attempt_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    _: Any = Depends(require_supabase_user),
) -> dict:
    """Grade test attempt in backend Python (no frontend RPC dependency)."""
    user_id = get_request_user_id(request)

    def _msq_flags(answer_row: dict[str, Any]) -> list[bool]:
        raw = answer_row.get("selected_msq_options") or []
        values = [bool(raw[i]) if i < len(raw) else False for i in range(4)]
        return values

    def _correct_msq_flags(question_row: dict[str, Any]) -> list[bool]:
        return [
            bool(question_row.get("msq_option1_answer") or False),
            bool(question_row.get("msq_option2_answer") or False),
            bool(question_row.get("msq_option3_answer") or False),
            bool(question_row.get("msq_option4_answer") or False),
        ]

    def _grade_objective(
        question_row: dict[str, Any],
        answer_row: dict[str, Any] | None,
        msq_partial_credit: bool,
    ) -> tuple[float, bool | None]:
        q_type = str(question_row.get("question_type") or "").lower()
        marks = float(question_row.get("marks") or 0)

        if q_type == "mcq4":
            selected = answer_row.get("selected_mcq_option") if answer_row else None
            correct = question_row.get("correct_mcq_option")
            is_correct = selected is not None and selected == correct
            return (marks if is_correct else 0.0, bool(is_correct))

        if q_type in ("true_false", "true_or_false"):
            # Source of truth for True/False correctness is answer_text.
            correct_bool = _normalize_true_false_value(question_row.get("answer_text"))

            if correct_bool is None:
                return (0.0, False)

            selected_index = answer_row.get("selected_mcq_option") if answer_row else None
            # True/False selection is represented by selected_mcq_option index.
            selected_bool: bool | None = True if selected_index == 1 else False if selected_index == 2 else None

            is_correct = selected_bool is not None and selected_bool == correct_bool
            return (marks if is_correct else 0.0, bool(is_correct))

        if q_type == "msq4":
            selected_flags = _msq_flags(answer_row or {})
            correct_flags = _correct_msq_flags(question_row)
            is_exact = selected_flags == correct_flags

            if is_exact:
                return (marks, True)

            if not msq_partial_credit:
                return (0.0, False)

            total_correct = sum(1 for flag in correct_flags if flag)
            if total_correct == 0:
                return (0.0, False)

            correct_selected = sum(
                1 for idx in range(4) if selected_flags[idx] and correct_flags[idx]
            )
            incorrect_selected = sum(
                1 for idx in range(4) if selected_flags[idx] and not correct_flags[idx]
            )

            fraction = max(0.0, (correct_selected - incorrect_selected) / total_correct)
            partial = round(marks * fraction, 2)
            return (partial, False)

        if q_type == "match_the_following":
            selected = answer_row.get("match_answer") if answer_row else None
            correct = question_row.get("match_the_following_columns")
            is_correct = selected is not None and correct is not None and selected == correct
            return (marks if is_correct else 0.0, bool(is_correct))

        # Non-objective questions are currently auto-graded as 0 marks with unknown correctness.
        return (0.0, None)

    try:
        user_res = (
            supabase.table("users")
            .select("id,user_type,org_id")
            .eq("id", user_id)
            .single()
            .execute()
        )
        user_row = user_res.data
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User not found",
            )

        attempt_res = (
            supabase.table("test_attempts")
            .select("id,student_id,status,online_test_id")
            .eq("id", attempt_id)
            .single()
            .execute()
        )
        attempt = attempt_res.data
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test attempt not found",
            )

        attempt_status = str(attempt.get("status") or "")
        if attempt_status not in ("submitted", "timed_out"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only submitted or timed-out attempts can be graded",
            )

        test_res = (
            supabase.table("online_tests")
            .select("id,org_id,qgen_draft_id,msq_partial_credit")
            .eq("id", attempt["online_test_id"])
            .single()
            .execute()
        )
        test = test_res.data
        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found",
            )

        user_type = user_row.get("user_type")
        user_org_id = user_row.get("org_id")
        if user_type == "student":
            if attempt.get("student_id") != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        elif user_type in ("teacher", "admin", "principal"):
            if not user_org_id or user_org_id != test.get("org_id"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )

        draft_res = (
            supabase.table("qgen_drafts")
            .select("id,activity_id")
            .eq("id", test["qgen_draft_id"])
            .single()
            .execute()
        )
        draft = draft_res.data
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Draft not found",
            )

        questions_res = (
            supabase.table("gen_questions")
            .select(
                "id,marks,question_type,answer_text,correct_mcq_option,msq_option1_answer,msq_option2_answer,msq_option3_answer,msq_option4_answer,match_the_following_columns"
            )
            .eq("activity_id", draft["activity_id"])
            .eq("is_in_draft", True)
            .execute()
        )
        questions = questions_res.data or []
        questions_by_id = {q["id"]: q for q in questions if q.get("id")}

        answers_res = (
            supabase.table("test_answers")
            .select("id,gen_question_id,selected_mcq_option,selected_msq_options,match_answer")
            .eq("test_attempt_id", attempt_id)
            .execute()
        )
        answers = answers_res.data or []
        answers_by_question = {a.get("gen_question_id"): a for a in answers if a.get("gen_question_id")}

        msq_partial_credit = bool(test.get("msq_partial_credit", True))

        for answer in answers:
            qid = answer.get("gen_question_id")
            if not qid:
                continue
            question = questions_by_id.get(qid)
            if not question:
                continue

            marks_obtained, is_correct = _grade_objective(
                question,
                answer,
                msq_partial_credit,
            )

            (
                supabase.table("test_answers")
                .update(
                    {
                        "marks_obtained": marks_obtained,
                        "is_correct": is_correct,
                        "is_auto_graded": True,
                    }
                )
                .eq("id", answer["id"])
                .execute()
            )

        objective_types = {
            "mcq4",
            "true_false",
            "true_or_false",
            "msq4",
            "match_the_following",
        }
        total_possible = sum(float(q.get("marks") or 0) for q in questions)

        total_obtained = 0.0
        for question in questions:
            q_type = str(question.get("question_type") or "").lower()
            if q_type not in objective_types:
                continue

            answer = answers_by_question.get(question.get("id"))
            if not answer:
                continue

            marks_obtained, _ = _grade_objective(
                question,
                answer,
                msq_partial_credit,
            )
            total_obtained += marks_obtained

        rounded_obtained = round(total_obtained, 2)
        rounded_possible = round(total_possible, 2)

        next_status = "graded"

        (
            supabase.table("test_attempts")
            .update(
                {
                    "total_marks_obtained": rounded_obtained,
                    "total_marks_possible": rounded_possible,
                    "grading_status": "complete",
                    "status": next_status,
                }
            )
            .eq("id", attempt_id)
            .execute()
        )

        return {
            "result": {
                "attempt_id": attempt_id,
                "total_marks_obtained": rounded_obtained,
                "total_marks_possible": rounded_possible,
                "grading_status": "complete",
            }
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed grading attempt")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to grade attempt",
        ) from exc
