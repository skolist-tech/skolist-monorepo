"""Student assigned-test listing."""

from fastapi import APIRouter, Depends
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import assessment_table, fetch_all, is_assigned, list_attempts_for_test
from .dependencies import require_student
from .models import AssessmentActor

router = APIRouter()


@router.get("/assigned-tests")
def list_assigned_tests(
    actor: AssessmentActor = Depends(require_student),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    assignments = fetch_all(
        assessment_table(supabase, "test_assignees").select("test_id").eq("user_id", actor.id)
    )
    test_ids = [row["test_id"] for row in assignments]
    if not test_ids:
        return {"tests": []}

    tests = fetch_all(assessment_table(supabase, "tests").select("*").in_("id", test_ids).order("created_at"))
    visible = [
        test
        for test in tests
        if test.get("status") == "published" and is_assigned(supabase, test["id"], actor.id)
    ]

    payload = []
    for test in visible:
        attempts = [
            attempt for attempt in list_attempts_for_test(supabase, test["id"]) if attempt.get("student_id") == actor.id
        ]
        latest = attempts[-1] if attempts else None
        payload.append({**test, "latest_attempt": latest})
    return {"tests": payload}
