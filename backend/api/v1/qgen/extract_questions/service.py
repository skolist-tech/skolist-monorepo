"""
Service layer for extracting questions from files.
"""

import logging

from fastapi import UploadFile
from supabase import AsyncClient

from ..llm import get_async_client, get_model, to_media_block, to_text_block

from api.v1.qgen.models import QUESTION_TYPE_TO_ENUM, ExtractedQuestionsList
from api.v1.qgen.prompts import extract_questions_prompt
from supabase_dir import (
    GenImagesInsert,
    GenQuestionsInsert,
    PublicHardnessLevelEnumEnum,
    QgenDraftSectionsInsert,
)

logger = logging.getLogger(__name__)


class ExtractionProcessingError(Exception):
    """Raised when extraction processing fails."""

    pass


class ExtractionValidationError(Exception):
    """Raised when extracted questions fail validation."""

    pass


async def process_uploaded_file(file: UploadFile) -> dict:
    """
    Process an uploaded file and return a provider-agnostic content block.

    Args:
        file: The uploaded file (image or PDF)

    Returns:
        Content block dict compatible with LiteLLM messages
    """
    if not file.filename or not file.size or file.size == 0:
        raise ExtractionValidationError("Empty or invalid file uploaded")

    content = await file.read()
    content_type = file.content_type or "application/octet-stream"

    allowed_types = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "application/pdf",
    ]

    if content_type not in allowed_types:
        if file.filename.lower().endswith(".pdf"):
            content_type = "application/pdf"
        else:
            raise ExtractionValidationError(
                f"Unsupported file type: {content_type}. Allowed: images (png, jpeg, gif, webp) and PDF"
            )

    await file.seek(0)
    return to_media_block(content, content_type, file.filename)


class ExtractQuestionsService:
    """Service for extracting questions from files using LLM."""

    @staticmethod
    async def process_extraction(
        file_block: dict,
        custom_prompt: str | None = None,
        retry_idx: int = None,
    ) -> ExtractedQuestionsList:
        """
        Process file and extract questions using the configured LLM.

        Args:
            file_block: File as a provider-agnostic content block
            custom_prompt: Optional user instructions
            retry_idx: Retry attempt number for logging

        Returns:
            ExtractedQuestionsList with parsed questions
        """
        prompt_text = extract_questions_prompt(custom_prompt)
        content_blocks = [file_block, to_text_block(prompt_text)]

        client = get_async_client()
        try:
            return await client.chat.completions.create(
                model=get_model(),
                messages=[{"role": "user", "content": content_blocks}],
                response_model=ExtractedQuestionsList,
            )
        except Exception as e:
            raise ExtractionValidationError(f"Failed to parse LLM response: {e}") from e

    @staticmethod
    async def create_draft_section(
        supabase_client: AsyncClient,
        qgen_draft_id: str,
        section_name: str | None = None,
    ) -> dict:
        """Create an empty draft section so the frontend can show it immediately."""
        existing_sections = (
            await supabase_client.table("qgen_draft_sections")
            .select("position_in_draft")
            .eq("qgen_draft_id", qgen_draft_id)
            .order("position_in_draft", desc=True)
            .limit(1)
            .execute()
        )

        max_position = 0
        if existing_sections.data:
            max_position = existing_sections.data[0].get("position_in_draft", 0) or 0

        final_section_name = section_name or "Extracted Questions"
        new_section = QgenDraftSectionsInsert(
            qgen_draft_id=qgen_draft_id,
            section_name=final_section_name,
            position_in_draft=max_position + 1,
        )

        section_result = (
            await supabase_client.table("qgen_draft_sections")
            .insert(new_section.model_dump(mode="json", exclude_none=True))
            .execute()
        )

        if not section_result.data:
            raise ExtractionProcessingError("Failed to create draft section")

        section_id = section_result.data[0]["id"]
        logger.info(f"Created new section: {section_id} with name: {final_section_name}")
        return {"section_id": section_id, "section_name": final_section_name}

    @staticmethod
    async def create_request_status(
        supabase_client: AsyncClient,
        user_id: str,
        request_type: str,
        draft_id: str | None,
        section_id: str | None,
    ) -> dict:
        job_result = (
            await supabase_client.table("request_statuses")
            .insert(
                {
                    "user_id": user_id,
                    "request_type": request_type,
                    "draft_id": draft_id,
                    "section_id": section_id,
                    "status": "processing",
                }
            )
            .execute()
        )

        if not job_result.data:
            raise ExtractionProcessingError("Failed to create request status")

        return job_result.data[0]

    @staticmethod
    async def update_request_status(
        supabase_client: AsyncClient,
        job_id: str,
        status: str,
        error_message: str | None = None,
        questions_extracted: int | None = None,
    ) -> None:
        payload: dict = {"status": status}
        if error_message is not None:
            payload["error_message"] = error_message
        if questions_extracted is not None:
            payload["questions_extracted"] = questions_extracted

        await supabase_client.table("request_statuses").update(payload).eq("job_id", job_id).execute()

    @staticmethod
    async def get_request_status(supabase_client: AsyncClient, job_id: str) -> dict | None:
        result = await supabase_client.table("request_statuses").select("*").eq("job_id", job_id).limit(1).execute()
        if not result.data:
            return None
        return result.data[0]

    @staticmethod
    async def extract_into_section(
        file_block: dict,
        activity_id: str,
        section_id: str,
        section_name: str,
        supabase_client: AsyncClient,
        custom_prompt: str | None = None,
    ) -> dict:
        """LLM extract + insert questions into an existing section."""
        max_retries = 5
        last_exception = None
        extracted_result = None

        for attempt in range(max_retries):
            try:
                extracted_result = await ExtractQuestionsService.process_extraction(
                    file_block, custom_prompt, attempt + 1
                )
                break
            except Exception as e:
                last_exception = e
                logger.warning(f"Extraction attempt {attempt + 1} failed: {e}")

        if extracted_result is None:
            raise ExtractionProcessingError(f"Extraction failed after {max_retries} retries") from last_exception

        questions = extracted_result.questions

        if not questions:
            logger.info("No questions extracted from file")
            return {
                "section_id": section_id,
                "section_name": section_name,
                "questions_extracted": 0,
                "questions": [],
            }

        # Insert questions
        inserted_questions = []
        difficulty_mapping = {
            "easy": PublicHardnessLevelEnumEnum.EASY,
            "medium": PublicHardnessLevelEnumEnum.MEDIUM,
            "hard": PublicHardnessLevelEnumEnum.HARD,
        }

        for position, question in enumerate(questions, start=1):
            try:
                # Map question_type string to enum
                question_type_enum = QUESTION_TYPE_TO_ENUM.get(question.question_type)
                if not question_type_enum:
                    logger.warning(f"Unknown question type: {question.question_type}, skipping")
                    continue

                # Build question data
                question_data = question.model_dump(exclude_none=True)

                # Remove fields not in gen_questions table
                svg_list = question_data.pop("svgs", None)
                question_data.pop("question_type", None)  # We use the enum instead

                # Set hardness level
                hardness_str = question_data.pop("hardness_level", "medium")
                hardness_level = difficulty_mapping.get(
                    hardness_str.lower() if hardness_str else "medium",
                    PublicHardnessLevelEnumEnum.MEDIUM,
                )

                # Handle marks - pop from dict and use default if not present
                marks_value = question_data.pop("marks", 1)

                # Handle answer_text - required field, provide default if missing
                answer_text_value = question_data.pop("answer_text", "") or ""

                # Handle match the following columns
                match_the_following_columns = None
                if "columns" in question_data:
                    cols = question_data.pop("columns")
                    if isinstance(cols, list):
                        dict_cols = {}
                        for col in cols:
                            if isinstance(col, dict):
                                dict_cols[col["name"]] = col["items"]
                            else:
                                dict_cols[getattr(col, "name", "")] = getattr(col, "items", [])
                        match_the_following_columns = dict_cols
                    else:
                        match_the_following_columns = cols

                # Create insert model
                gen_question = GenQuestionsInsert(
                    **question_data,
                    activity_id=activity_id,
                    question_type=question_type_enum,
                    hardness_level=hardness_level,
                    qgen_draft_section_id=section_id,
                    position_in_section=position,
                    is_in_draft=True,
                    marks=marks_value,
                    answer_text=answer_text_value,
                    match_the_following_columns=match_the_following_columns,
                )

                # Insert question
                result = (
                    await supabase_client.table("gen_questions")
                    .insert(gen_question.model_dump(mode="json", exclude_none=True))
                    .execute()
                )

                if result.data:
                    inserted_question = result.data[0]
                    question_id = inserted_question["id"]

                    inserted_questions.append(
                        {
                            "id": question_id,
                            "question_type": question.question_type,
                        }
                    )

                    # Insert SVGs if present
                    if svg_list:
                        for svg_position, svg_item in enumerate(svg_list, start=1):
                            try:
                                svg_string = svg_item.get("svg") if isinstance(svg_item, dict) else svg_item.svg
                                if svg_string:
                                    gen_image = GenImagesInsert(
                                        gen_question_id=question_id,
                                        svg_string=svg_string,
                                        position=svg_position,
                                    )
                                    await (
                                        supabase_client.table("gen_images")
                                        .insert(gen_image.model_dump(mode="json", exclude_none=True))
                                        .execute()
                                    )
                            except Exception as svg_error:
                                logger.warning(f"Failed to insert SVG for question {question_id}: {svg_error}")

            except Exception as q_error:
                logger.warning(f"Failed to insert question at position {position}: {q_error}")
                continue

        logger.info(f"Extraction complete: {len(inserted_questions)} questions inserted into section {section_id}")

        return {
            "section_id": section_id,
            "section_name": section_name,
            "questions_extracted": len(inserted_questions),
            "questions": inserted_questions,
        }
