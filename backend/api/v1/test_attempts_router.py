"""Student test attempts endpoints (backend-mediated, non-RPC)."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from .auth import get_supabase_client, require_supabase_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test-attempts", tags=["test_attempts"])


@router.get("/student")
def get_student_attempts(
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    _: Any = Depends(require_supabase_user),
) -> dict:
    """Return all attempts for the authenticated student with test metadata."""
    user = getattr(request.state, "supabase_user", None)
    student_id = getattr(user, "id", None)
    if isinstance(user, dict):
        student_id = student_id or user.get("id")

    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

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

        test_ids = list({a.get("online_test_id") for a in attempts if a.get("online_test_id")})

        tests_map: dict[str, dict[str, Any]] = {}
        if test_ids:
            tests_res = (
                supabase.table("online_tests")
                .select("id,title,qgen_draft_id")
                .in_("id", test_ids)
                .execute()
            )
            tests = tests_res.data or []

            draft_ids = list({t.get("qgen_draft_id") for t in tests if t.get("qgen_draft_id")})
            draft_title_map: dict[str, str] = {}
            if draft_ids:
                drafts_res = (
                    supabase.table("qgen_drafts")
                    .select("id,paper_title")
                    .in_("id", draft_ids)
                    .execute()
                )
                for d in drafts_res.data or []:
                    draft_title_map[d["id"]] = d.get("paper_title")

            for t in tests:
                tests_map[t["id"]] = {
                    "id": t["id"],
                    "title": t.get("title") or draft_title_map.get(t.get("qgen_draft_id"), "Untitled Test"),
                }

        data = []
        for a in attempts:
            test_meta = tests_map.get(a.get("online_test_id"), {"id": a.get("online_test_id"), "title": "Untitled Test"})
            data.append(
                {
                    "id": a.get("id"),
                    "online_test_id": a.get("online_test_id"),
                    "attempt_number": a.get("attempt_number"),
                    "status": a.get("status"),
                    "started_at": a.get("started_at"),
                    "submitted_at": a.get("submitted_at"),
                    "total_marks_obtained": a.get("total_marks_obtained"),
                    "total_marks_possible": a.get("total_marks_possible"),
                    "grading_status": a.get("grading_status"),
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
    user = getattr(request.state, "supabase_user", None)
    student_id = getattr(user, "id", None)
    if isinstance(user, dict):
        student_id = student_id or user.get("id")

    if not student_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

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

            concept_ids = list(
                {
                    m.get("concept_id")
                    for m in mappings
                    if m.get("concept_id")
                }
            )

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
        for q in questions:
            q_type = (q.get("question_type") or "").lower()
            if "msq" in q_type:
                normalized = "multiple_choice_multiple"
            elif "mcq" in q_type or "true_false" in q_type:
                normalized = "multiple_choice_single"
            else:
                normalized = "text_input"

            normalized_questions.append(
                {
                    **q,
                    "type": normalized,
                    "options": [q.get("option1"), q.get("option2"), q.get("option3"), q.get("option4")],
                    "concept_names": question_concepts_map.get(q.get("id"), []),
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
