"""Teacher test CRUD and attempt review."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import (
    assessment_table,
    fetch_all,
    fetch_attempt,
    fetch_test,
    list_assignees_for_test,
    list_attempts_for_test,
    list_questions_for_test,
    list_responses_for_attempt,
    list_sections_for_test,
)
from .dependencies import require_teacher, require_test_for_teacher, teacher_can_access_test
from .models import (
    EXAM_TYPES,
    TEST_STATUSES,
    AssessmentActor,
    TestCreate,
    TestUpdate,
    dump_unset,
)

router = APIRouter()


def _validate_exam_type(value: str | None) -> None:
    if value is not None and value not in EXAM_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid exam_type")


def _validate_status(value: str | None) -> None:
    if value is not None and value not in TEST_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")


def _list_teacher_tests(supabase: Client, actor: AssessmentActor) -> list[dict]:
    table = assessment_table(supabase, "tests")
    if actor.is_platform_admin:
        return fetch_all(table.select("*").order("created_at", desc=True))

    by_creator = fetch_all(table.select("*").eq("created_by", actor.id))
    by_org: list[dict] = []
    if actor.org_id:
        by_org = fetch_all(table.select("*").eq("org_id", actor.org_id))
    merged = {row["id"]: row for row in by_creator + by_org}
    return sorted(merged.values(), key=lambda row: row.get("created_at") or "", reverse=True)


def _test_detail(supabase: Client, test: dict) -> dict:
    sections = list_sections_for_test(supabase, test["id"])
    questions = list_questions_for_test(supabase, test["id"])
    assignees = list_assignees_for_test(supabase, test["id"])
    by_section: dict[str, list] = {section["id"]: [] for section in sections}
    for question in questions:
        by_section.setdefault(question["section_id"], []).append(question)
    return {
        **test,
        "sections": [{**section, "questions": by_section.get(section["id"], [])} for section in sections],
        "assignees": assignees,
    }


@router.get("/tests")
def list_tests(
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    return {"tests": _list_teacher_tests(supabase, actor)}


@router.post("/tests", status_code=status.HTTP_201_CREATED)
def create_test(
    body: TestCreate,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    _validate_exam_type(body.exam_type)
    payload = dump_unset(body)
    payload["created_by"] = actor.id
    payload["org_id"] = actor.org_id
    payload["status"] = "draft"
    response = assessment_table(supabase, "tests").insert(payload).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create test")
    return rows[0]


@router.get("/tests/{test_id}")
def get_test(
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    return _test_detail(supabase, test)


@router.patch("/tests/{test_id}")
def update_test(
    body: TestUpdate,
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    payload = dump_unset(body)
    _validate_exam_type(payload.get("exam_type"))
    _validate_status(payload.get("status"))
    if not payload:
        return test
    response = assessment_table(supabase, "tests").update(payload).eq("id", test["id"]).execute()
    rows = response.data or []
    return rows[0] if rows else {**test, **payload}


@router.get("/tests/{test_id}/attempts")
def list_test_attempts(
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    return {"attempts": list_attempts_for_test(supabase, test["id"])}


@router.get("/tests/{test_id}/attempts/{attempt_id}")
def get_test_attempt(
    attempt_id: UUID,
    test: dict = Depends(require_test_for_teacher),
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    attempt = fetch_attempt(supabase, attempt_id)
    if attempt.get("test_id") != test["id"]:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attempt not found")
    if not teacher_can_access_test(actor, fetch_test(supabase, attempt["test_id"])):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this attempt")
    return {
        "attempt": attempt,
        "responses": list_responses_for_attempt(supabase, attempt["id"]),
        "test": _test_detail(supabase, test),
    }
