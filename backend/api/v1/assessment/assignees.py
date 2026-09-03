"""Teacher assignee management."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import as_str, assessment_table, is_assigned, list_assignees_for_test
from .dependencies import require_test_for_teacher
from .models import AssigneeCreate

router = APIRouter()


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
    user = supabase.table("users").select("id, user_type").eq("id", user_id).limit(1).execute()
    if not user.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if is_assigned(supabase, test["id"], user_id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already assigned")
    response = (
        assessment_table(supabase, "test_assignees")
        .insert({"test_id": test["id"], "user_id": user_id})
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign user")
    return rows[0]


@router.delete("/tests/{test_id}/assignees/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_assignee(
    user_id: UUID,
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> None:
    assessment_table(supabase, "test_assignees").delete().eq("test_id", test["id"]).eq(
        "user_id", as_str(user_id)
    ).execute()
