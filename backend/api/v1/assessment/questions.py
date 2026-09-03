"""Teacher question CRUD."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import as_str, assessment_table, fetch_question, fetch_test
from .dependencies import require_section_for_teacher, require_teacher, teacher_can_access_test
from .models import HARDNESS_LEVELS, QUESTION_TYPES, AssessmentActor, QuestionCreate, QuestionUpdate, dump_unset

router = APIRouter()


def _validate_question_fields(payload: dict, *, partial: bool = False) -> None:
    qtype = payload.get("question_type")
    if qtype is not None and qtype not in QUESTION_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question_type")
    hardness = payload.get("hardness_level")
    if hardness is not None and hardness not in HARDNESS_LEVELS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid hardness_level")
    if partial:
        return
    marks = float(payload.get("marks") or 0)
    if marks == 0:
        return
    if qtype == "mcq" and payload.get("correct_mcq_option") is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MCQ requires correct_mcq_option")
    if qtype == "numerical" and payload.get("numerical_answer") is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Numerical question requires numerical_answer",
        )
    if qtype == "integer" and payload.get("integer_answer") is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Integer question requires integer_answer")


@router.post("/sections/{section_id}/questions", status_code=status.HTTP_201_CREATED)
def create_question(
    body: QuestionCreate,
    section: dict = Depends(require_section_for_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    payload = dump_unset(body)
    _validate_question_fields(payload, partial=False)
    payload["section_id"] = section["id"]
    payload["test_id"] = section["test_id"]
    if payload.get("parent_question_id"):
        payload["parent_question_id"] = as_str(payload["parent_question_id"])
    response = assessment_table(supabase, "questions").insert(payload).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create question")
    return rows[0]


@router.patch("/questions/{question_id}")
def update_question(
    question_id: UUID,
    body: QuestionUpdate,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    question = fetch_question(supabase, question_id)
    test = fetch_test(supabase, question["test_id"])
    if not teacher_can_access_test(actor, test):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this question")
    payload = dump_unset(body)
    _validate_question_fields({**question, **payload}, partial=True)
    if payload.get("parent_question_id"):
        payload["parent_question_id"] = as_str(payload["parent_question_id"])
    if not payload:
        return question
    response = assessment_table(supabase, "questions").update(payload).eq("id", as_str(question_id)).execute()
    rows = response.data or []
    return rows[0] if rows else {**question, **payload}


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: UUID,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> None:
    question = fetch_question(supabase, question_id)
    test = fetch_test(supabase, question["test_id"])
    if not teacher_can_access_test(actor, test):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this question")
    assessment_table(supabase, "questions").delete().eq("id", as_str(question_id)).execute()
