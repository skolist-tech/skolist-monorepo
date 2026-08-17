"""
Routes for the extract_questions endpoint.
"""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from supabase import AsyncClient

from api.v1.auth import get_async_supabase_client, require_supabase_user
from api.v1.qgen.credits import check_user_has_credits, deduct_user_credits
from api.v1.qgen.extract_questions.service import (
    ExtractionProcessingError,
    ExtractionValidationError,
    ExtractQuestionsService,
    process_uploaded_file,
)

logger = logging.getLogger(__name__)

router = APIRouter()

EXTRACT_REQUEST_TYPE = "extract_questions"


async def _run_extract_job(
    file_block: dict,
    activity_id: str,
    section_id: str,
    section_name: str,
    job_id: str,
    user_id: str,
    custom_prompt: str | None,
    supabase_client: AsyncClient,
) -> None:
    try:
        result = await ExtractQuestionsService.extract_into_section(
            file_block=file_block,
            activity_id=activity_id,
            section_id=section_id,
            section_name=section_name,
            supabase_client=supabase_client,
            custom_prompt=custom_prompt,
        )
        questions_count = result.get("questions_extracted", 0)
        await ExtractQuestionsService.update_request_status(
            supabase_client,
            job_id,
            status="success",
            questions_extracted=questions_count,
        )
        credits_to_deduct = max(3, questions_count)
        await deduct_user_credits(supabase_client, user_id, credits_to_deduct)
        logger.info(
            "Extract questions completed",
            extra={
                "user_id": user_id,
                "job_id": job_id,
                "section_id": section_id,
                "questions_extracted": questions_count,
                "credits_deducted": credits_to_deduct,
            },
        )
    except Exception as exc:
        logger.exception("Extract questions job failed | job_id=%s", job_id)
        await ExtractQuestionsService.update_request_status(
            supabase_client,
            job_id,
            status="failure",
            error_message=str(exc),
        )


async def extract_questions(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Image or PDF file containing questions"),
    activity_id: str = Form(..., description="UUID of the activity"),
    qgen_draft_id: str = Form(..., description="UUID of the draft to add section to"),
    prompt: str | None = Form(None, description="Optional custom instructions for extraction"),
    section_name: str | None = Form(None, description="Optional name for the new section"),
    supabase_client: AsyncClient = Depends(get_async_supabase_client),
    user: dict = Depends(require_supabase_user),
):
    """
    Start question extraction asynchronously.

    Creates the draft section and a processing job, then returns 202.
    Extraction continues in the background; poll GET /extract_questions/status/{job_id}.
    """
    user_id = user.id

    if not await check_user_has_credits(supabase_client, user_id):
        return JSONResponse(status_code=status.HTTP_402_PAYMENT_REQUIRED, content={"error": "Insufficient credits"})

    logger.info(
        "Received extract_questions request",
        extra={
            "user_id": user_id,
            "activity_id": activity_id,
            "qgen_draft_id": qgen_draft_id,
            "file_name": file.filename,
            "section_name": section_name,
            "prompt": prompt,
        },
    )

    try:
        activity = await supabase_client.table("activities").select("id, user_id").eq("id", activity_id).execute()

        if not activity.data:
            raise HTTPException(status_code=404, detail="Activity not found")

        if activity.data[0].get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Access denied to this activity")

        draft = await supabase_client.table("qgen_drafts").select("id").eq("id", qgen_draft_id).execute()

        if not draft.data:
            raise HTTPException(status_code=404, detail="Draft not found")

        logger.info("Processing file for extraction: %s", file.filename)
        file_block = await process_uploaded_file(file)

        section = await ExtractQuestionsService.create_draft_section(
            supabase_client,
            qgen_draft_id,
            section_name,
        )
        job = await ExtractQuestionsService.create_request_status(
            supabase_client,
            user_id=user_id,
            request_type=EXTRACT_REQUEST_TYPE,
            draft_id=qgen_draft_id,
            section_id=section["section_id"],
        )

        background_tasks.add_task(
            _run_extract_job,
            file_block,
            activity_id,
            section["section_id"],
            section["section_name"],
            job["job_id"],
            user_id,
            prompt,
            supabase_client,
        )

        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "job_id": job["job_id"],
                "section_id": section["section_id"],
                "section_name": section["section_name"],
                "status": "processing",
            },
        )

    except ExtractionValidationError as e:
        logger.warning(f"Validation error in extract_questions: {e}")
        raise HTTPException(status_code=400, detail=str(e)) from e

    except ExtractionProcessingError:
        logger.exception("Error starting extract_questions")
        raise HTTPException(status_code=500, detail="Failed to start question extraction") from None

    except HTTPException:
        raise

    except Exception:
        logger.exception("Unexpected error in extract_questions")
        raise HTTPException(status_code=500, detail="Internal Server Error") from None


async def get_extract_questions_status(
    job_id: str,
    supabase_client: AsyncClient = Depends(get_async_supabase_client),
    user: dict = Depends(require_supabase_user),
):
    """Return the current status of an extract_questions job."""
    job = await ExtractQuestionsService.get_request_status(supabase_client, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("user_id") != user.id:
        raise HTTPException(status_code=403, detail="Access denied to this job")

    return {
        "job_id": job["job_id"],
        "request_type": job.get("request_type"),
        "draft_id": job.get("draft_id"),
        "section_id": job.get("section_id"),
        "status": job.get("status"),
        "error_message": job.get("error_message"),
        "questions_extracted": job.get("questions_extracted"),
    }
