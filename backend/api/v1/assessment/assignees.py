"""Teacher assignee management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import (
    as_str,
    assessment_table,
    enrich_assignee_row,
    is_assigned,
    list_assignees_for_test,
    list_org_students,
)
from .dependencies import require_teacher, require_test_for_teacher
from .models import AssessmentActor, AssigneeCreate, OrgStudent

router = APIRouter()


@router.get("/students", response_model=list[OrgStudent])
def list_students(
    q: str | None = Query(default=None),
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> list[dict]:
    return list_org_students(supabase, actor.org_id, q)


@router.get("/tests/{test_id}/assignees")
def list_assignees(
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    return {"assignees": list_assignees_for_test(supabase, test["id"])}


@router.post("/tests/{test_id}/assignees", status_code=status.HTTP_201_CREATED)
def add_assignee(
    body: AssigneeCreate,
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    user_id = as_str(body.user_id)
    user = supabase.table("users").select("id, user_type, name, email, avatar_url").eq("id", user_id).limit(1).execute()
    if not user.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if is_assigned(supabase, test["id"], user_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already assigned")
    response = (
        assessment_table(supabase, "test_assignees").insert({"test_id": test["id"], "user_id": user_id}).execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign user")
    return enrich_assignee_row(rows[0], user.data[0])


@router.delete("/tests/{test_id}/assignees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_assignee(
    user_id: UUID,
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> None:
    assessment_table(supabase, "test_assignees").delete().eq("test_id", test["id"]).eq(
        "user_id", as_str(user_id)
    ).execute()
