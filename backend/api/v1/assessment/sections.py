"""Teacher section CRUD."""

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import assessment_table
from .dependencies import require_section_for_teacher, require_test_for_teacher
from .models import SectionCreate, SectionUpdate, dump_unset

router = APIRouter()


@router.post("/tests/{test_id}/sections", status_code=status.HTTP_201_CREATED)
def create_section(
    body: SectionCreate,
    test: dict = Depends(require_test_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    payload = dump_unset(body)
    if payload.get("subject") not in (None, "other"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid subject")
    payload["test_id"] = test["id"]
    response = assessment_table(supabase, "sections").insert(payload).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create section")
    return rows[0]


@router.patch("/sections/{section_id}")
def update_section(
    body: SectionUpdate,
    section: dict = Depends(require_section_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    payload = dump_unset(body)
    if payload.get("subject") not in (None, "other") and "subject" in payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid subject")
    if not payload:
        return {k: v for k, v in section.items() if k != "_test"}
    response = assessment_table(supabase, "sections").update(payload).eq("id", section["id"]).execute()
    rows = response.data or []
    return rows[0] if rows else {**section, **payload}


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section: dict = Depends(require_section_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> None:
    assessment_table(supabase, "sections").delete().eq("id", section["id"]).execute()
