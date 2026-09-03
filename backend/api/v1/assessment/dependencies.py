"""Auth and resource gates for the assessment API."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client, require_supabase_user

from .db import fetch_attempt, fetch_section, fetch_test, is_assigned
from .models import STUDENT_USER_TYPE, TEACHER_USER_TYPES, AssessmentActor


def _auth_user_id(user: Any) -> str:
    user_id = getattr(user, "id", None)
    if isinstance(user, dict):
        user_id = user_id or user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found",
        )
    return str(user_id)


def parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt


def is_within_window(test: dict, now: datetime | None = None) -> bool:
    now = now or datetime.now(UTC)
    starts_at = parse_datetime(test.get("starts_at"))
    ends_at = parse_datetime(test.get("ends_at"))
    if starts_at and now < starts_at:
        return False
    if ends_at and now > ends_at:
        return False
    return True


def can_student_attempt(test: dict) -> bool:
    return test.get("status") == "published" and is_within_window(test)


def teacher_can_access_test(actor: AssessmentActor, test: dict) -> bool:
    if actor.is_platform_admin:
        return True
    if test.get("created_by") == actor.id:
        return True
    return bool(actor.org_id and test.get("org_id") == actor.org_id)


def require_assessment_actor(
    user: Any = Depends(require_supabase_user),
    supabase: Client = Depends(get_supabase_client),
) -> AssessmentActor:
    user_id = _auth_user_id(user)
    response = (
        supabase.table("users")
        .select("id, email, user_type, org_id")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile not found",
        )
    row = rows[0]
    return AssessmentActor(
        id=str(row["id"]),
        email=row.get("email"),
        user_type=row.get("user_type") or "",
        org_id=str(row["org_id"]) if row.get("org_id") else None,
    )


def require_teacher(actor: AssessmentActor = Depends(require_assessment_actor)) -> AssessmentActor:
    if not actor.is_teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required",
        )
    return actor


def require_student(actor: AssessmentActor = Depends(require_assessment_actor)) -> AssessmentActor:
    if not actor.is_student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return actor


def require_test_for_teacher(
    test_id: UUID,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    test = fetch_test(supabase, test_id)
    if not teacher_can_access_test(actor, test):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access this test",
        )
    return test


def require_section_for_teacher(
    section_id: UUID,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    section = fetch_section(supabase, section_id)
    test = fetch_test(supabase, section["test_id"])
    if not teacher_can_access_test(actor, test):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access this section",
        )
    section["_test"] = test
    return section


def require_assigned_test(
    test_id: UUID,
    actor: AssessmentActor = Depends(require_student),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    test = fetch_test(supabase, test_id)
    if not is_assigned(supabase, test_id, actor.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to this test",
        )
    return test


def require_attempt_owner(
    attempt_id: UUID,
    actor: AssessmentActor = Depends(require_student),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    attempt = fetch_attempt(supabase, attempt_id)
    if attempt.get("student_id") != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed to access this attempt",
        )
    return attempt


# Re-export constants used by routes
__all__ = [
    "STUDENT_USER_TYPE",
    "TEACHER_USER_TYPES",
    "can_student_attempt",
    "is_within_window",
    "parse_datetime",
    "require_assessment_actor",
    "require_assigned_test",
    "require_attempt_owner",
    "require_section_for_teacher",
    "require_student",
    "require_teacher",
    "require_test_for_teacher",
    "teacher_can_access_test",
]
