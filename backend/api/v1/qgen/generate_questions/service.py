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
) -> list[dict[str, any]]:
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
    supabase_client: AsyncClient,
    max_retries: int = 3,
) -> list[dict[str, Any]]:
    """Generates and validates questions for a single batch."""
    questions = await try_retry_batch(batch, batch_idx, ctx, max_retries)
    processed_questions = []

    for item in questions:
        question_data = item["question"]
        concept_ids = item["concept_ids"]

        # Ensure required fields are present (especially for fetched questions)
        if "activity_id" not in question_data or not question_data["activity_id"]:
            question_data["activity_id"] = str(ctx.activity_id)

        if question_data.get("marks") is None:
            question_data["marks"] = ctx.default_marks or 1

        # Extract SVGs
        svg_list = question_data.pop("svgs", None)

        # Map columns to match_the_following_columns if present
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

        processed_questions.append(
            {
                "question_data": question_data,
                "concept_ids": concept_ids,
                "svg_list": svg_list,
            }
        )

    return processed_questions


async def insert_questions_to_supabase(
    questions: list[dict[str, Any]],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
) -> int:
    """
    Performs consolidated batch insertions for all generated questions.
    Reduces database round-trips from O(N) to O(1) per table.
    """
    if not questions:
        return 0

    gen_questions_payload = []
    gen_question_versions_payload = []
    gen_images_payload = []
    concept_maps_payload = []

    logger.info(f"Preparing batch insertion for {len(questions)} questions")

    for item in questions:
        question_data = item["question_data"]
        concept_ids = item["concept_ids"]
        svg_list = item["svg_list"]

        # Pre-calculate UUID to link related entities
        question_id = str(uuid.uuid4())
        question_data["id"] = question_id

        # Set created_at with offset to preserve insertion order
        offset = ctx.timestamp_offset_ms
        ctx.timestamp_offset_ms += 1
        question_created_at = ctx.base_timestamp - timedelta(milliseconds=offset)
        question_data["created_at"] = question_created_at.isoformat()

        # 1. Prepare GenQuestions insert
        try:
            gen_question_insert = GenQuestionsInsert(**question_data)
            gen_questions_payload.append(gen_question_insert.model_dump(mode="json", exclude_none=True))
        except Exception as e:
            logger.error(f"Validation failed for question data: {e}")
            continue

        # 2. Prepare GenQuestionVersions insert (v0)
        version_data = extract_version_data(question_data)
        version_data.update(
            {
                "gen_question_id": question_id,
                "version_index": 0,
                "is_active": True,
                "is_deleted": False,
            }
        )
        gen_question_versions_payload.append(version_data)

        # 3. Prepare GenImages insert
        if svg_list:
            for position, svg_item in enumerate(svg_list, start=1):
                try:
                    svg_string = svg_item.get("svg") if isinstance(svg_item, dict) else svg_item.svg
                    if svg_string:
                        gen_images_payload.append(
                            {
                                "gen_question_id": question_id,
                                "svg_string": svg_string,
                                "position": position,
                            }
                        )
                except Exception as svg_error:
                    logger.warning(f"Failed to prepare SVG for question {question_id}: {svg_error}")

        # 4. Prepare GenQuestionsConceptsMaps insert
        unique_concept_ids = list(dict.fromkeys(concept_ids))
        for concept_id in unique_concept_ids:
            concept_maps_payload.append(
                {
                    "gen_question_id": question_id,
                    "concept_id": str(concept_id),
                }
            )

    inserted_count = 0
    # Execute batch insertions
    if not gen_questions_payload:
        return 0

    try:
        res = await supabase_client.table("gen_questions").insert(gen_questions_payload).execute()
        inserted_count = len(res.data) if res.data else 0
    except Exception as e:
        logger.error(f"Failed to batch insert gen_questions: {e}")
        # If the main table insert fails, we can't insert dependent records
        return 0

    if gen_question_versions_payload:
        try:
            await supabase_client.table("gen_question_versions").insert(gen_question_versions_payload).execute()
        except Exception as e:
            logger.error(f"Failed to batch insert gen_question_versions: {e}")

    if gen_images_payload:
        try:
            await supabase_client.table("gen_images").insert(gen_images_payload).execute()
        except Exception as e:
            logger.error(f"Failed to batch insert gen_images: {e}")

    if concept_maps_payload:
        try:
            # Note: We use raw insert; duplicates are handled by ignoring individual failures if needed,
            # but since these are NEW questions with NEW IDs, duplicates shouldn't occur unless
            # the same concept is mapped twice for the same question, which we deduplicated.
            await supabase_client.table("gen_questions_concepts_maps").insert(concept_maps_payload).execute()
        except Exception as e:
            logger.error(f"Failed to batch insert gen_questions_concepts_maps: {e}")

    return inserted_count


async def process_all_batches(
    batches: list[Batch],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
    max_retries: int = 3,
) -> dict[str, any]:
    """
    Orchestrates the generation and insertion of questions across all batches.
    Parallelizes generation and consolidates database insertions.
    """
    # 1. Generate and validate questions for all batches in parallel
    generation_tasks = [
        generate_batch_questions(batch, batch_idx + 1, ctx, supabase_client, max_retries)
        for batch_idx, batch in enumerate(batches)
    ]

    generation_results = await asyncio.gather(*generation_tasks, return_exceptions=True)

    successful_batches = 0
    failed_batches = 0
    all_processed_questions = []

    for result in generation_results:
        if isinstance(result, Exception):
            failed_batches += 1
            logger.error(f"Batch generation failed: {result}")
        else:
            successful_batches += 1
            all_processed_questions.extend(result)

    # 2. Perform consolidated batch insertions for all successful generations
    questions_inserted = 0
    if all_processed_questions:
        questions_inserted = await insert_questions_to_supabase(all_processed_questions, ctx, supabase_client)

    return {
        "successful": successful_batches,
        "failed": failed_batches,
        "total": len(batches),
        "questions_inserted": questions_inserted,
    }
