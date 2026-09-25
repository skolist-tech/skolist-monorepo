"""Assign and deassign organisation student groups on a test."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from ..db import assessment_table, fetch_all, fetch_one, list_group_assignees_for_test, list_org_groups
from ..dependencies import require_teacher, require_test_for_teacher
from ..models import AssessmentActor, GroupAssigneeCreate

router = APIRouter()


@router.get("/groups")
def list_groups(
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    return {"groups": list_org_groups(supabase, actor.org_id)}


@router.get("/tests/{test_id}/group-assignees")
def list_group_assignees(
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    return {"group_assignees": list_group_assignees_for_test(supabase, test["id"])}


@router.post("/tests/{test_id}/group-assignees", status_code=status.HTTP_201_CREATED)
def add_group_assignee(
    body: GroupAssigneeCreate,
    test: dict = Depends(require_test_for_teacher),
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    group = fetch_one(
        assessment_table(supabase, "student_groups").select("*").eq("id", str(body.group_id)),
        "Group not found",
    )
    if actor.org_id and str(group.get("org_id")) != actor.org_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Group is outside your organisation")
    existing = fetch_all(
        assessment_table(supabase, "test_group_assignees")
        .select("id")
        .eq("test_id", test["id"])
        .eq("group_id", str(body.group_id))
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Group is already assigned")
    response = (
        assessment_table(supabase, "test_group_assignees")
        .insert({"test_id": test["id"], "group_id": str(body.group_id)})
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to assign group")
    return {**rows[0], "name": group.get("name")}


@router.delete("/tests/{test_id}/group-assignees/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_group_assignee(
    group_id: UUID,
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> None:
    assessment_table(supabase, "test_group_assignees").delete().eq("test_id", test["id"]).eq(
        "group_id", str(group_id)
    ).execute()
