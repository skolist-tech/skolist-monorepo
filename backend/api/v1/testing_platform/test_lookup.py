"""Test lookup and question retrieval routes for testing platform."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from supabase import Client

from ..auth import get_supabase_client, require_supabase_user
from .utils import get_request_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/share-code/{share_code}")
def get_online_test_by_share_code_backend(
    share_code: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    _: Any = Depends(require_supabase_user),
) -> dict:
    """Return online test metadata by share code with org-based access checks."""
    user_id = get_request_user_id(request)

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

        test_res = (
            supabase.table("online_tests")
            .select(
                "id,title,status,max_attempts,show_results_immediately,org_id,qgen_draft_id"
            )
            .eq("share_code", share_code.upper())
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
            if not user_org_id or user_org_id != test.get("org_id"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this test",
                )
            if test.get("status") != "active":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This test is not currently available",
                )

        draft_res = (
            supabase.table("qgen_drafts")
            .select("id,activity_id,paper_title,paper_subtitle,institute_name,maximum_marks,paper_duration")
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

        duration_minutes = 60
        paper_duration = draft.get("paper_duration")
        if paper_duration:
            if isinstance(paper_duration, str):
                try:
                    parts = paper_duration.split(":")
                    hours = int(parts[0]) if len(parts) > 0 else 0
                    minutes = int(parts[1]) if len(parts) > 1 else 0
                    duration_minutes = (hours * 60) + minutes
                except Exception:
                    duration_minutes = 60
            else:
                duration_minutes = int(getattr(paper_duration, "hour", 0)) * 60 + int(
                    getattr(paper_duration, "minute", 0)
                )

        total_questions_res = (
            supabase.table("gen_questions")
            .select("id", count="exact")
            .eq("activity_id", draft["activity_id"])
            .eq("is_in_draft", True)
            .execute()
        )

        total_questions = total_questions_res.count or 0

        return {
            "id": test["id"],
            "title": test.get("title") or draft.get("paper_title") or "Untitled Test",
            "paper_title": draft.get("paper_title"),
            "paper_subtitle": draft.get("paper_subtitle"),
            "institute_name": draft.get("institute_name"),
            "duration_minutes": duration_minutes,
            "total_questions": total_questions,
            "total_marks": draft.get("maximum_marks"),
            "maximum_marks": draft.get("maximum_marks"),
            "status": test.get("status"),
            "max_attempts": test.get("max_attempts"),
            "show_results_immediately": test.get("show_results_immediately"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed fetching online test by share code")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch test by share code",
        ) from exc


@router.get("/{attempt_id}/questions")
def get_attempt_questions_backend(
    attempt_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    _: Any = Depends(require_supabase_user),
) -> dict:
    """Return attempt questions for authorized student/teacher users (backend-mediated)."""
    user_id = get_request_user_id(request)

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
            .select("id,student_id,online_test_id")
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

        test_res = (
            supabase.table("online_tests")
            .select("id,org_id,qgen_draft_id")
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
                "id,question_text,explanation,marks,question_type,hardness_level,option1,option2,option3,option4,position_in_draft,qgen_draft_section_id"
            )
            .eq("activity_id", draft["activity_id"])
            .eq("is_in_draft", True)
            .order("position_in_draft")
            .execute()
        )

        return {"questions": questions_res.data or []}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed fetching attempt questions")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch attempt questions",
        ) from exc
