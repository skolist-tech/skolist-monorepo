import asyncio
import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from google import genai
from supabase import AsyncClient

from supabase_dir import (
    GenImagesInsert,
    GenQuestionsInsert,
    PublicHardnessLevelEnumEnum,
)

from ..models import (
    QUESTION_TYPE_TO_ENUM,
)
from ..prompts import generate_questions_with_concepts_prompt
from ..version_service import extract_version_data
from .batchification import Batch
from .models import QUESTION_TYPE_TO_SCHEMA_WITH_CONCEPTS
from .utils.fetch_questions import QuestionRequestType, fetch_questions_from_bank

logger = logging.getLogger(__name__)


@dataclass
class BatchProcessingContext:
    """Holds all contextual data needed for processing batches."""

    gemini_client: genai.Client
    supabase_client: AsyncClient
    concepts_dict: dict[str, str]  # concept_name -> description
    concepts_name_to_id: dict[str, str]  # concept_name -> concept_id
    old_questions: list[dict]  # historical questions for reference
    activity_id: uuid.UUID
    default_marks: int = 1
    # Timestamp tracking for ordered question insertion
    base_timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    timestamp_offset_ms: int = 0  # Counter for ordering questions


class BatchGenerationError(Exception):
    """Raised when batch generation fails after all retries."""

    pass


class BatchValidationError(Exception):
    """Raised when generated questions fail validation."""

    pass


def _log_prefix(batch_idx: int = None, retry_idx: int = None) -> str:
    parts = []
    if batch_idx is not None:
        parts.append(f"BATCH:{batch_idx}")
    if retry_idx is not None:
        parts.append(f"RETRY:{retry_idx}")
    return f"{' '.join(parts)} | " if parts else ""


async def process_batch_generation(
    batch: Batch,
    ctx: BatchProcessingContext,
    batch_idx: int = None,
    retry_idx: int = None,
) -> dict:
    prefix = _log_prefix(batch_idx, retry_idx)

    # Get schema for this question type (using the new schemas with concepts)
    question_schema = QUESTION_TYPE_TO_SCHEMA_WITH_CONCEPTS.get(batch.question_type)

    if not question_schema:
        raise BatchGenerationError(f"Unknown question type: {batch.question_type}")

    unique_concepts = list(dict.fromkeys(batch.concepts))
    logger.debug(f"{prefix}Processing batch with custom instructions: {batch.custom_instruction}")

    prompt = generate_questions_with_concepts_prompt(
        concepts=unique_concepts,
        concepts_descriptions=ctx.concepts_dict,
        old_questions_on_concepts=ctx.old_questions,
        n=batch.n_questions,
        question_type=batch.question_type,
        difficulty=batch.difficulty,
        instructions=batch.custom_instruction,
    )

    response = await ctx.gemini_client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": question_schema,
        },
    )

    return {
        "response": response,
        "batch": batch,
    }


async def process_batch_generation_and_validate(
    batch: Batch,
    ctx: BatchProcessingContext,
    batch_idx: int = None,
    retry_idx: int = None,
) -> list[dict[str, Any]]:
    # Intercept for bank fetching types
    if batch.question_type == "solved_examples":
        res = await fetch_questions_from_bank(
            ctx.supabase_client,
            batch.concepts,
            ctx.concepts_name_to_id,
            batch.n_questions,
            batch.difficulty,
            QuestionRequestType.SOLVED_EXAMPLE,
        )
        logger.info(f"Found Number of solved_examples fetched for insertion : {len(res)}")
        return res
    elif batch.question_type == "exercise_questions":
        res = await fetch_questions_from_bank(
            ctx.supabase_client,
            batch.concepts,
            ctx.concepts_name_to_id,
            batch.n_questions,
            batch.difficulty,
            QuestionRequestType.EXERCISE_QUESTION,
        )
        logger.info(f"Found Number of exercise_questions fetched for insertion : {len(res)}")
        return res

    generation_result = await process_batch_generation(batch, ctx, batch_idx, retry_idx)
    response = generation_result["response"]

    question_schema = QUESTION_TYPE_TO_SCHEMA_WITH_CONCEPTS.get(batch.question_type)
    question_type_enum = QUESTION_TYPE_TO_ENUM.get(batch.question_type)
    # The question model is the first argument of the List in the 'questions' annotation
    question_model = question_schema.__annotations__.get("questions").__args__[0]

    difficulty_mapping = {
        "easy": PublicHardnessLevelEnumEnum.EASY,
        "medium": PublicHardnessLevelEnumEnum.MEDIUM,
        "hard": PublicHardnessLevelEnumEnum.HARD,
    }
    hardness_level = difficulty_mapping.get(batch.difficulty, PublicHardnessLevelEnumEnum.MEDIUM)

    try:
        questions_list = response.parsed.questions
    except Exception:
        raw_text = response.text
        raw_data = json.loads(raw_text)
        questions_list = raw_data.get("questions", [])

    validated_questions = []

    for _idx, q in enumerate(questions_list):
        try:
            if hasattr(q, "model_dump"):
                question_data = q.model_dump()
            else:
                validated_q = question_model.model_validate(q)
                question_data = validated_q.model_dump()

            if not question_data.get("question_text"):
                continue

            # Extract granular concepts returned by Gemini for THIS question
            question_concepts = question_data.pop("concepts", [])
            concept_ids = list(
                dict.fromkeys(
                    [
                        ctx.concepts_name_to_id.get(concept)
                        for concept in question_concepts
                        if ctx.concepts_name_to_id.get(concept)
                    ]
                )
            )

            # Fallback to batch concepts if Gemini didn't return any valid ones
            if not concept_ids:
                concept_ids = list(
                    dict.fromkeys(
                        [
                            ctx.concepts_name_to_id.get(concept)
                            for concept in batch.concepts
                            if ctx.concepts_name_to_id.get(concept)
                        ]
                    )
                )

            gen_question_dict = {
                **question_data,
                "activity_id": str(ctx.activity_id),
                "question_type": question_type_enum,
                "hardness_level": hardness_level,
                "marks": ctx.default_marks,
            }

            validated_questions.append(
                {
                    "question": gen_question_dict,
                    "concept_ids": concept_ids,
                }
            )

        except Exception as e:
            logger.warning(f"Question validation failed: {e}")
            continue

    if not validated_questions:
        raise BatchValidationError(f"No valid questions generated for batch: {batch.question_type}")

    return validated_questions


async def try_retry_batch(
    batch: Batch,
    batch_idx: int,
    ctx: BatchProcessingContext,
    max_retries: int = 3,
) -> list[dict[str, Any]]:
    last_exception = None
    for attempt in range(max_retries):
        retry_idx = attempt + 1
        try:
            return await process_batch_generation_and_validate(batch, ctx, batch_idx, retry_idx)
        except Exception as e:
            last_exception = e
            if attempt >= max_retries - 1:
                logger.error(f"All retry attempts exhausted for batch {batch_idx}: {e}")

    raise BatchGenerationError(f"Batch generation failed after {max_retries} retries") from last_exception


async def generate_batch_questions(
    batch: Batch,
    batch_idx: int,
    ctx: BatchProcessingContext,
    max_retries: int = 3,
) -> list[dict[str, Any]]:
    """Generates and validates questions for a batch without inserting into DB."""
    questions = await try_retry_batch(batch, batch_idx, ctx, max_retries)
    prepared_questions = []

    for item in questions:
        question_data = item["question"]
        concept_ids = item["concept_ids"]

        # Ensure required fields are present
        if "activity_id" not in question_data or not question_data["activity_id"]:
            question_data["activity_id"] = str(ctx.activity_id)

        if question_data.get("marks") is None:
            question_data["marks"] = ctx.default_marks or 1

        # Extract SVGs
        svg_list = question_data.pop("svgs", None)

        # Map columns for match_the_following
        if "columns" in question_data:
            cols = question_data.pop("columns")
            if isinstance(cols, list):
                dict_cols = {}
                for col in cols:
                    if isinstance(col, dict):
                        dict_cols[col["name"]] = col["items"]
                    else:
                        dict_cols[col.name] = col.items
                question_data["match_the_following_columns"] = dict_cols
            else:
                question_data["match_the_following_columns"] = cols

        # Pre-calculate question ID for deterministic linking
        question_id = str(uuid.uuid4())
        question_data["id"] = question_id

        prepared_questions.append(
            {
                "question_data": question_data,
                "concept_ids": concept_ids,
                "svg_list": svg_list,
            }
        )

    return prepared_questions


async def insert_questions_to_supabase(
    all_prepared_questions: list[dict[str, Any]],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
) -> int:
    """Performs consolidated batch insertions for all questions and related entities."""
    if not all_prepared_questions:
        return 0

    gen_questions_payload = []
    gen_versions_payload = []
    gen_images_payload = []
    gen_concepts_payload = []

    for item in all_prepared_questions:
        question_data = item["question_data"]
        concept_ids = item["concept_ids"]
        svg_list = item["svg_list"]
        question_id = question_data["id"]

        # Set created_at with offset to preserve insertion order
        offset = ctx.timestamp_offset_ms
        ctx.timestamp_offset_ms += 1
        question_created_at = ctx.base_timestamp - timedelta(milliseconds=offset)
        question_data["created_at"] = question_created_at.isoformat()

        try:
            # Validate with GenQuestionsInsert to ensure schema compliance
            gen_question_insert = GenQuestionsInsert(**question_data)
            gen_questions_payload.append(gen_question_insert.model_dump(mode="json", exclude_none=True))
        except Exception as e:
            logger.error(f"Validation failed for question {question_id}: {e}")
            continue

        # Prepare version v0 payload
        version_data = extract_version_data(question_data)
        version_data.update(
            {
                "gen_question_id": question_id,
                "version_index": 0,
                "is_active": True,
                "is_deleted": False,
            }
        )
        gen_versions_payload.append(version_data)

        # Prepare SVG payloads
        if svg_list:
            for position, svg_item in enumerate(svg_list, start=1):
                try:
                    svg_string = svg_item.get("svg") if isinstance(svg_item, dict) else getattr(svg_item, "svg", None)
                    if svg_string:
                        gen_image = GenImagesInsert(
                            gen_question_id=question_id,
                            svg_string=svg_string,
                            position=position,
                        )
                        gen_images_payload.append(gen_image.model_dump(mode="json", exclude_none=True))
                except Exception as svg_error:
                    logger.warning(f"Failed to prepare SVG for question {question_id}: {svg_error}")

        # Prepare concept map payloads
        # Deduplicate concept IDs to prevent unique constraint violations
        unique_concept_ids = list(dict.fromkeys(concept_ids))
        for concept_id in unique_concept_ids:
            gen_concepts_payload.append(
                {
                    "gen_question_id": question_id,
                    "concept_id": str(concept_id),
                }
            )

    inserted_count = 0
    if gen_questions_payload:
        try:
            # 1. Batch insert gen_questions
            res = await supabase_client.table("gen_questions").insert(gen_questions_payload).execute()
            inserted_count = len(res.data) if res.data else 0
            logger.info(f"Batch inserted {inserted_count} questions.")

            # 2. Batch insert versions, images, and concepts in parallel
            insert_tasks = []
            task_names = []

            if gen_versions_payload:
                insert_tasks.append(
                    supabase_client.table("gen_question_versions").insert(gen_versions_payload).execute()
                )
                task_names.append("gen_question_versions")

            if gen_images_payload:
                insert_tasks.append(supabase_client.table("gen_images").insert(gen_images_payload).execute())
                task_names.append("gen_images")

            if gen_concepts_payload:
                insert_tasks.append(
                    supabase_client.table("gen_questions_concepts_maps").insert(gen_concepts_payload).execute()
                )
                task_names.append("gen_questions_concepts_maps")

            if insert_tasks:
                responses = await asyncio.gather(*insert_tasks, return_exceptions=True)
                for i, response in enumerate(responses):
                    if isinstance(response, Exception):
                        logger.error(f"Batch insert for {task_names[i]} failed: {response}")

        except Exception as e:
            logger.error(f"Consolidated batch insertion failed: {e}")

    return inserted_count


async def process_all_batches(
    batches: list[Batch],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Orchestrates generation and batch persistence."""
    # 1. Parallelize AI generation across all batches
    tasks = [
        generate_batch_questions(batch, batch_idx + 1, ctx, max_retries) for batch_idx, batch in enumerate(batches)
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    successful_batches = 0
    failed_batches = 0
    all_prepared_questions = []

    for result in results:
        if isinstance(result, Exception):
            failed_batches += 1
            logger.error(f"Batch generation failed: {result}")
        else:
            successful_batches += 1
            all_prepared_questions.extend(result)

    # 2. Perform consolidated batch insertions for all generated questions
    questions_inserted = await insert_questions_to_supabase(all_prepared_questions, ctx, supabase_client)

    return {
        "successful": successful_batches,
        "failed": failed_batches,
        "total": len(batches),
        "questions_inserted": questions_inserted,
    }
