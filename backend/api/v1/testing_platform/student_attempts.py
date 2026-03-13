"""Student attempts routes for testing platform."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from ..auth import get_supabase_client, require_supabase_user
from .utils import get_request_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/student")
def get_student_attempts(
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    _: Any = Depends(require_supabase_user),
) -> dict:
    """Return all attempts for the authenticated student with test metadata."""
    student_id = get_request_user_id(request)

    try:
        attempts_res = (
            supabase.table("test_attempts")
            .select(
                "id,online_test_id,attempt_number,status,started_at,submitted_at,total_marks_obtained,total_marks_possible,grading_status"
            )
            .eq("student_id", student_id)
            .order("started_at", desc=True)
            .execute()
        )
        attempts = attempts_res.data or []

        test_ids = list(
            {a.get("online_test_id") for a in attempts if a.get("online_test_id")}
        )

        tests_map: dict[str, dict[str, Any]] = {}
        if test_ids:
            tests_res = (
                supabase.table("online_tests")
                .select("id,title,qgen_draft_id")
                .in_("id", test_ids)
                .execute()
            )
            tests = tests_res.data or []

            draft_ids = list(
                {t.get("qgen_draft_id") for t in tests if t.get("qgen_draft_id")}
            )
            draft_title_map: dict[str, str] = {}
            if draft_ids:
                drafts_res = (
                    supabase.table("qgen_drafts")
                    .select("id,paper_title")
                    .in_("id", draft_ids)
                    .execute()
                )
                for draft_row in drafts_res.data or []:
                    draft_title_map[draft_row["id"]] = draft_row.get("paper_title")

            for test_row in tests:
                tests_map[test_row["id"]] = {
                    "id": test_row["id"],
                    "title": test_row.get("title")
                    or draft_title_map.get(test_row.get("qgen_draft_id"), "Untitled Test"),
                }

        data = []
        for attempt in attempts:
            test_meta = tests_map.get(
                attempt.get("online_test_id"),
                {"id": attempt.get("online_test_id"), "title": "Untitled Test"},
            )
            data.append(
                {
                    "id": attempt.get("id"),
                    "online_test_id": attempt.get("online_test_id"),
                    "attempt_number": attempt.get("attempt_number"),
                    "status": attempt.get("status"),
                    "started_at": attempt.get("started_at"),
                    "submitted_at": attempt.get("submitted_at"),
                    "total_marks_obtained": attempt.get("total_marks_obtained"),
                    "total_marks_possible": attempt.get("total_marks_possible"),
                    "grading_status": attempt.get("grading_status"),
                    "test": test_meta,
                }
            )

        return {"attempts": data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed fetching student attempts")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch student attempts",
        ) from exc


@router.get("/student/{attempt_id}")
def get_student_attempt_detail(
    attempt_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    _: Any = Depends(require_supabase_user),
) -> dict:
    """Return one student attempt with test, questions, and answers (non-RPC)."""
    student_id = get_request_user_id(request)

    try:
        attempt_res = (
            supabase.table("test_attempts")
            .select(
                "id,online_test_id,student_id,attempt_number,status,started_at,submitted_at,total_marks_obtained,total_marks_possible,grading_status"
            )
            .eq("id", attempt_id)
            .eq("student_id", student_id)
            .single()
            .execute()
        )
        attempt = attempt_res.data
        if not attempt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attempt not found",
            )

        test_res = (
            supabase.table("online_tests")
            .select("id,title,qgen_draft_id")
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

        draft_res = (
            supabase.table("qgen_drafts")
            .select("id,activity_id,paper_title")
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
                "id,question_text,marks,question_type,option1,option2,option3,option4,position_in_draft,qgen_draft_section_id"
            )
            .eq("activity_id", draft["activity_id"])
            .eq("is_in_draft", True)
            .order("position_in_draft")
            .execute()
        )

        answers_res = (
            supabase.table("test_answers")
            .select(
                "id,test_attempt_id,gen_question_id,question_position,selected_mcq_option,selected_msq_options,text_answer,numerical_answer,match_answer,is_correct,marks_obtained,answered_at"
            )
            .eq("test_attempt_id", attempt_id)
            .order("question_position")
            .execute()
        )

        questions = questions_res.data or []

        question_ids = [q.get("id") for q in questions if q.get("id")]
        question_concepts_map: dict[str, list[str]] = {}

        if question_ids:
            mappings_res = (
                supabase.table("gen_questions_concepts_maps")
                .select("gen_question_id,concept_id")
                .in_("gen_question_id", question_ids)
                .execute()
            )
            mappings = mappings_res.data or []

            concept_ids = list({m.get("concept_id") for m in mappings if m.get("concept_id")})

            concept_name_map: dict[str, str] = {}
            if concept_ids:
                concepts_res = (
                    supabase.table("concepts")
                    .select("id,name")
                    .in_("id", concept_ids)
                    .execute()
                )
                for concept in concepts_res.data or []:
                    concept_name_map[concept["id"]] = concept.get("name") or ""

            for mapping in mappings:
                qid = mapping.get("gen_question_id")
                cid = mapping.get("concept_id")
                if not qid or not cid:
                    continue

                concept_name = concept_name_map.get(cid)
                if not concept_name:
                    continue

                if qid not in question_concepts_map:
                    question_concepts_map[qid] = []

                if concept_name not in question_concepts_map[qid]:
                    question_concepts_map[qid].append(concept_name)

        normalized_questions = []
        for question in questions:
            q_type = (question.get("question_type") or "").lower()
            if "msq" in q_type:
                normalized = "multiple_choice_multiple"
            elif "mcq" in q_type or "true_false" in q_type:
                normalized = "multiple_choice_single"
            else:
                normalized = "text_input"

            normalized_questions.append(
                {
                    **question,
                    "type": normalized,
                    "options": [
                        question.get("option1"),
                        question.get("option2"),
                        question.get("option3"),
                        question.get("option4"),
                    ],
                    "concept_names": question_concepts_map.get(question.get("id"), []),
                }
            )

        return {
            "attempt": attempt,
            "test": {
                "id": test["id"],
                "title": test.get("title") or draft.get("paper_title") or "Untitled Test",
            },
            "questions": normalized_questions,
            "answers": answers_res.data or [],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed fetching student attempt detail")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch attempt detail",
        ) from exc
