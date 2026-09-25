"""Clone a full-syllabus blueprint into an organisation draft."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from ..common.access import question_clone_payload
from ..db import assessment_table, fetch_all, fetch_one, grant_teacher_access
from ..dependencies import require_teacher
from ..models import AssessmentActor

router = APIRouter()


@router.get("/blueprints")
def list_blueprints(
    _actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    rows = fetch_all(
        assessment_table(supabase, "test_blueprints")
        .select("id, name, description, exam_type, duration_minutes, total_marks, kind")
        .eq("kind", "full_syllabus")
        .order("name")
    )
    return {"blueprints": rows}


@router.post("/blueprints/{blueprint_id}/clone", status_code=status.HTTP_201_CREATED)
def clone_blueprint(
    blueprint_id: UUID,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    blueprint = fetch_one(
        assessment_table(supabase, "test_blueprints").select("*").eq("id", str(blueprint_id)),
        "Blueprint not found",
    )
    if blueprint.get("kind") != "full_syllabus":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only full syllabus blueprints can be cloned"
        )

    test_response = (
        assessment_table(supabase, "tests")
        .insert(
            {
                "name": blueprint["name"],
                "description": blueprint.get("description"),
                "exam_type": blueprint.get("exam_type") or "jee_main",
                "duration_minutes": blueprint["duration_minutes"],
                "total_marks": blueprint.get("total_marks"),
                "default_correct_marks": blueprint.get("default_correct_marks") or 4,
                "default_negative_marks": blueprint.get("default_negative_marks") or 1,
                "status": "draft",
                "created_by": actor.id,
                "org_id": actor.org_id,
                "source_blueprint_id": blueprint["id"],
            }
        )
        .execute()
    )
    tests = test_response.data or []
    if not tests:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create test")
    test = tests[0]
    grant_teacher_access(supabase, test["id"], actor.id)

    sections = fetch_all(
        assessment_table(supabase, "blueprint_sections")
        .select("*")
        .eq("blueprint_id", blueprint["id"])
        .order("position")
    )
    questions = fetch_all(
        assessment_table(supabase, "blueprint_questions")
        .select("*")
        .eq("blueprint_id", blueprint["id"])
        .order("position")
    )
    section_map: dict[str, str] = {}
    for section in sections:
        created = (
            assessment_table(supabase, "sections")
            .insert(
                {
                    "test_id": test["id"],
                    "name": section["name"],
                    "subject": section.get("subject"),
                    "position": section["position"],
                    "correct_marks": section.get("correct_marks"),
                    "negative_marks": section.get("negative_marks"),
                }
            )
            .execute()
        )
        rows = created.data or []
        if not rows:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to copy section")
        section_map[str(section["id"])] = rows[0]["id"]

    for question in questions:
        section_id = section_map.get(str(question["section_id"]))
        if not section_id:
            continue
        assessment_table(supabase, "questions").insert(
            question_clone_payload(question, test["id"], section_id)
        ).execute()

    return test
