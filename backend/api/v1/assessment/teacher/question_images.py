"""Upload and remove stem / option images on a question."""

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from supabase import Client

from api.v1.auth import get_supabase_client

from ..common.question_images import (
    QUESTION_IMAGES_BUCKET,
    delete_stored_image,
    sign_question_images,
    storage_ref,
)
from ..db import as_str, assessment_table, fetch_question, fetch_test
from ..dependencies import require_teacher, teacher_can_access_test
from ..models import AssessmentActor

router = APIRouter()

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
}
SLOT_COLUMNS = {
    "stem": ("image_url", "svg_image_code"),
    "option1": ("option1_image_url", "option1_svg_image_code"),
    "option2": ("option2_image_url", "option2_svg_image_code"),
    "option3": ("option3_image_url", "option3_svg_image_code"),
    "option4": ("option4_image_url", "option4_svg_image_code"),
    "explanation": ("explanation_image_url", "explanation_svg_image_code"),
}


def _slot_columns(slot: str) -> tuple[str, str]:
    columns = SLOT_COLUMNS.get(slot)
    if not columns:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image slot")
    return columns


def _question_for_teacher(supabase: Client, actor: AssessmentActor, question_id: UUID) -> dict:
    question = fetch_question(supabase, question_id)
    test = fetch_test(supabase, question["test_id"])
    if not teacher_can_access_test(actor, test, supabase):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this question")
    return question


def _update_question(supabase: Client, question: dict, payload: dict) -> dict:
    response = assessment_table(supabase, "questions").update(payload).eq("id", question["id"]).execute()
    rows = response.data or []
    row = rows[0] if rows else {**question, **payload}
    return sign_question_images(supabase, [row])[0]


@router.post("/questions/{question_id}/images/{slot}")
async def upload_question_image(
    question_id: UUID,
    slot: str,
    file: UploadFile = File(...),
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    url_column, svg_column = _slot_columns(slot)
    question = _question_for_teacher(supabase, actor, question_id)
    content_type = (file.content_type or "").lower()
    extension = ALLOWED_TYPES.get(content_type)
    if not extension:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload a PNG, JPEG, WebP, or SVG image")
    content = await file.read()
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be 2 MB or smaller")

    object_path = f"{question['test_id']}/{as_str(question_id)}/{slot}-{uuid4().hex}.{extension}"
    supabase.storage.from_(QUESTION_IMAGES_BUCKET).upload(
        object_path, content, file_options={"content-type": content_type}
    )
    previous = question.get(url_column)
    updated = _update_question(supabase, question, {url_column: storage_ref(object_path), svg_column: None})
    delete_stored_image(supabase, previous)
    return updated


@router.delete("/questions/{question_id}/images/{slot}")
def remove_question_image(
    question_id: UUID,
    slot: str,
    actor: AssessmentActor = Depends(require_teacher),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    url_column, svg_column = _slot_columns(slot)
    question = _question_for_teacher(supabase, actor, question_id)
    updated = _update_question(supabase, question, {url_column: None, svg_column: None})
    delete_stored_image(supabase, question.get(url_column))
    return updated
