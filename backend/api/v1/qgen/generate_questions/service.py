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


async def insert_questions_to_supabase(
    questions: list[dict[str, Any]],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
) -> int:
    """Consolidated batch insertion for all generated questions and related entities."""
    if not questions:
        return 0

    gen_questions_payloads = []
    gen_question_versions_payloads = []
    gen_images_payloads = []
    gen_questions_concepts_maps_payloads = []

    logger.info(f"Preparing batch insertion for {len(questions)} questions")

    for item in questions:
        question_data = item["question"]
        concept_ids = item["concept_ids"]

        # Pre-calculate ID for linking related entities
        question_id = str(uuid.uuid4())
        question_data["id"] = question_id

        # Ensure required fields are present
        if "activity_id" not in question_data or not question_data["activity_id"]:
            question_data["activity_id"] = str(ctx.activity_id)

        if question_data.get("marks") is None:
            question_data["marks"] = ctx.default_marks or 1

        # Extract SVGs before inserting question
        svg_list = question_data.pop("svgs", None)

        # Set created_at with offset to preserve insertion order
        offset = ctx.timestamp_offset_ms
        ctx.timestamp_offset_ms += 1
        question_created_at = ctx.base_timestamp - timedelta(milliseconds=offset)
        question_data["created_at"] = question_created_at.isoformat()

        # Map columns to match_the_following_columns
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

        try:
            # Validate with GenQuestionsInsert
            gen_question_insert = GenQuestionsInsert(**question_data)
            question_payload = gen_question_insert.model_dump(mode="json", exclude_none=True)
            gen_questions_payloads.append(question_payload)

            # Prepare version payload (v0)
            version_data = extract_version_data(question_payload)
            version_data.update(
                {
                    "gen_question_id": question_id,
                    "version_index": 0,
                    "is_active": True,
                    "is_deleted": False,
                }
            )
            gen_question_versions_payloads.append(version_data)

            # Prepare SVG payloads
            if svg_list:
                for position, svg_item in enumerate(svg_list, start=1):
                    svg_string = svg_item.get("svg") if isinstance(svg_item, dict) else svg_item.svg
                    if svg_string:
                        gen_image = GenImagesInsert(
                            gen_question_id=question_id,
                            svg_string=svg_string,
                            position=position,
                        )
                        gen_images_payloads.append(gen_image.model_dump(mode="json", exclude_none=True))

            # Prepare concept mapping payloads
            for concept_id in concept_ids:
                gen_questions_concepts_maps_payloads.append(
                    {
                        "gen_question_id": question_id,
                        "concept_id": str(concept_id),
                    }
                )

        except Exception as e:
            logger.error(f"Failed to prepare payload for question: {e}")
            continue

    if not gen_questions_payloads:
        return 0

    # Execute batch inserts
    try:
        # 1. Insert gen_questions
        await supabase_client.table("gen_questions").insert(gen_questions_payloads).execute()

        # 2. Insert gen_question_versions (parallelize secondary tables)
        secondary_tasks = [
            supabase_client.table("gen_question_versions").insert(gen_question_versions_payloads).execute()
        ]

        if gen_images_payloads:
            secondary_tasks.append(supabase_client.table("gen_images").insert(gen_images_payloads).execute())

        if gen_questions_concepts_maps_payloads:
            # Deduplicate mappings to avoid unique constraint violations
            seen_mappings = set()
            unique_mappings = []
            for m in gen_questions_concepts_maps_payloads:
                mapping_key = (m["gen_question_id"], m["concept_id"])
                if mapping_key not in seen_mappings:
                    seen_mappings.add(mapping_key)
                    unique_mappings.append(m)
            secondary_tasks.append(
                supabase_client.table("gen_questions_concepts_maps").insert(unique_mappings).execute()
            )

        await asyncio.gather(*secondary_tasks, return_exceptions=True)

        return len(gen_questions_payloads)

    except Exception as e:
        logger.error(f"Failed to execute consolidated batch insertion: {e}")
        return 0


async def process_all_batches(
    batches: list[Batch],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
    max_retries: int = 3,
) -> dict[str, any]:
    # Parallelize generation across all batches
    tasks = [try_retry_batch(batch, batch_idx + 1, ctx, max_retries) for batch_idx, batch in enumerate(batches)]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_questions = []
    successful_batches = 0
    failed_batches = 0

    for res in results:
        if isinstance(res, Exception):
            failed_batches += 1
            logger.error(f"Batch generation task failed: {res}")
        else:
            successful_batches += 1
            all_questions.extend(res)

    # Perform consolidated batch insertion
    questions_inserted = await insert_questions_to_supabase(all_questions, ctx, supabase_client)

    return {
        "successful": successful_batches,
        "failed": failed_batches,
        "total": len(batches),
        "questions_inserted": questions_inserted,
    }
