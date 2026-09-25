"""Student assigned and past test listing."""

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from ..common.access import is_past_test
from ..db import assessment_table, fetch_all, is_assigned, list_assigned_test_ids, list_attempts_for_test
from ..dependencies import can_student_attempt, require_assigned_test, require_student
from ..models import AssessmentActor

router = APIRouter()


def _with_latest(supabase: Client, actor_id: str, tests: list[dict]) -> list[dict]:
    payload = []
    for test in tests:
        attempts = [
            attempt for attempt in list_attempts_for_test(supabase, test["id"]) if attempt.get("student_id") == actor_id
        ]
        latest = attempts[-1] if attempts else None
        payload.append({**test, "latest_attempt": latest, "attempt_count": len(attempts)})
    return payload


@router.get("/assigned-tests")
def list_assigned_tests(
    actor: AssessmentActor = Depends(require_student),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    test_ids = list_assigned_test_ids(supabase, actor.id)
    if not test_ids:
        return {"tests": [], "past_tests": []}

    tests = fetch_all(assessment_table(supabase, "tests").select("*").in_("id", test_ids).order("created_at"))
    active = [test for test in tests if can_student_attempt(test) and is_assigned(supabase, test["id"], actor.id)]
    past = [
        test
        for test in tests
        if is_past_test(test)
        and test.get("students_can_review_attempts")
        and is_assigned(supabase, test["id"], actor.id)
    ]
    return {
        "tests": _with_latest(supabase, actor.id, active),
        "past_tests": _with_latest(supabase, actor.id, past),
    }


@router.get("/tests/{test_id}/my-attempts")
def list_my_attempts(
    test: dict = Depends(require_assigned_test),
    actor: AssessmentActor = Depends(require_student),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    if is_past_test(test) and not test.get("students_can_review_attempts"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Past attempts are not available")
    attempts = [
        attempt for attempt in list_attempts_for_test(supabase, test["id"]) if attempt.get("student_id") == actor.id
    ]
    return {
        "test": {
            "id": test["id"],
            "name": test["name"],
            "status": test.get("status"),
            "duration_minutes": test.get("duration_minutes"),
            "students_can_see_answers": bool(test.get("students_can_see_answers")),
            "students_can_review_attempts": bool(test.get("students_can_review_attempts")),
            "can_start": can_student_attempt(test),
        },
        "attempts": attempts,
    }
