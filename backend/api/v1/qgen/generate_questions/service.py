import asyncio
import json
import logging
import random
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

import litellm
from supabase import AsyncClient

from ..llm import get_async_client, get_model

from supabase_dir import (
    GenImagesInsert,
    GenQuestionsInsert,
    PublicHardnessLevelEnumEnum,
)

from ..models import (
    QUESTION_TYPE_TO_ENUM,
)
from ..prompts import generate_questions_with_concepts_prompt
from ..version_service import create_initial_version
from .batchification import Batch
from .models import QUESTION_TYPE_TO_SCHEMA_WITH_CONCEPTS
from .utils.fetch_questions import QuestionRequestType, fetch_questions_from_bank

logger = logging.getLogger(__name__)


@dataclass
class BatchProcessingContext:
    """Holds all contextual data needed for processing batches."""

    supabase_client: AsyncClient
    concepts_dict: dict[str, str]  # concept_name -> description
    concepts_name_to_id: dict[str, str]  # concept_name -> concept_id
    old_questions: list[dict]  # historical questions for reference
    concept_maps: list[dict]  # maps bank_question_id to concept_id
    activity_id: uuid.UUID
    default_marks: int = 1
    # Timestamp tracking for ordered question insertion
    base_timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    timestamp_offset_ms: int = 0  # Counter for ordering questions
    # Token usage tracking
    total_prompt_tokens: int = 0
    total_response_tokens: int = 0
    total_tokens: int = 0
    # Per-batch metrics for reporting
    batch_metrics: list[dict] = field(default_factory=list)
    # Store original instructions
    original_instructions: str | None = None


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
    
    # Filter old_questions to only those relevant to this batch's concepts
    batch_concept_ids = set(
        ctx.concepts_name_to_id.get(concept) 
        for concept in unique_concepts 
        if ctx.concepts_name_to_id.get(concept)
    )
    
    # Get bank_question_ids that are mapped to any of the batch's concepts
    relevant_bank_question_ids = set(
        cm["bank_question_id"] 
        for cm in ctx.concept_maps 
        if cm.get("concept_id") in batch_concept_ids
    )
    
    # DEBUG: Log concept matching details
    logger.debug(
        f"{prefix}FILTER_DEBUG | batch_concept_ids={list(batch_concept_ids)[:3]}... | "
        f"concept_maps_sample={ctx.concept_maps[:2] if ctx.concept_maps else []} | "
        f"relevant_bank_question_ids_count={len(relevant_bank_question_ids)}"
    )
    
    # Filter old_questions to only include relevant ones
    filtered_old_questions = [
        q for q in ctx.old_questions 
        if q.get("id") in relevant_bank_question_ids
    ]
    
    # Apply random sampling to limit to maximum 5 questions
    max_sample_size = 5
    if len(filtered_old_questions) > max_sample_size:
        sampled_old_questions = random.sample(filtered_old_questions, max_sample_size)
        logger.info(
            f"{prefix}OLD_QUESTIONS_FILTER | total={len(ctx.old_questions)} "
            f"filtered_for_batch={len(filtered_old_questions)} "
            f"sampled={len(sampled_old_questions)} "
            f"reduction={len(ctx.old_questions) - len(sampled_old_questions)}"
        )
    else:
        sampled_old_questions = filtered_old_questions
        logger.info(
            f"{prefix}OLD_QUESTIONS_FILTER | total={len(ctx.old_questions)} "
            f"filtered_for_batch={len(filtered_old_questions)} "
            f"reduction={len(ctx.old_questions) - len(filtered_old_questions)}"
        )
    
    # Count tokens for concepts text only
    concepts_text = "\n".join([
        f"{concept}: {ctx.concepts_dict.get(concept, '')}" 
        for concept in unique_concepts
    ])
    
    # Count tokens for old_questions only
    old_questions_text = json.dumps(sampled_old_questions)
    
    try:
        concepts_token_count = litellm.token_counter(model=get_model(), text=concepts_text)
    except Exception:
        concepts_token_count = 0

    try:
        old_questions_token_count = litellm.token_counter(model=get_model(), text=old_questions_text)
    except Exception:
        old_questions_token_count = 0
    
    prompt = generate_questions_with_concepts_prompt(
        concepts=unique_concepts,
        concepts_descriptions=ctx.concepts_dict,
        old_questions_on_concepts=sampled_old_questions,
        n=batch.n_questions,
        question_type=batch.question_type,
        difficulty=batch.difficulty,
        instructions=batch.custom_instruction,
    )

    # LOG: Count actual tokens in the prompt before sending
    try:
        prompt_token_estimate = litellm.token_counter(model=get_model(), text=prompt)
        logger.info(
            f"{prefix}BATCH_INPUT | type={batch.question_type} n={batch.n_questions} "
            f"difficulty={batch.difficulty} | concepts={len(unique_concepts)} "
            f"old_questions_count={len(sampled_old_questions)} | "
            f"PROMPT_TOKENS_ESTIMATE={prompt_token_estimate}"
        )
    except Exception as token_count_error:
        logger.warning(f"{prefix}Could not count tokens: {token_count_error}")
        prompt_token_estimate = 0

    client = get_async_client()
    result, completion = await client.chat.completions.create_with_completion(
        model=get_model(),
        messages=[{"role": "user", "content": prompt}],
        response_model=question_schema,
    )

    # LOG: Extract and log token usage from response
    try:
        usage = completion.usage
        prompt_tokens = usage.prompt_tokens if usage else 0
        response_tokens = usage.completion_tokens if usage else 0
        total_tokens = usage.total_tokens if usage else 0
        
        # Update context token counters
        ctx.total_prompt_tokens += prompt_tokens
        ctx.total_response_tokens += response_tokens
        ctx.total_tokens += total_tokens
        
        logger.info(
            f"{prefix}TOKEN_USAGE | prompt_tokens={prompt_tokens} "
            f"response_tokens={response_tokens} total_tokens={total_tokens} | "
            f"cumulative_total={ctx.total_tokens}"
        )
    except Exception as token_error:
        logger.warning(f"{prefix}Could not extract token usage: {token_error}")
        prompt_tokens = 0
        response_tokens = 0
        total_tokens = 0
    
    # Store batch metrics for final report
    batch_metrics = {
        "batch_idx": batch_idx,
        "concepts_count": len(unique_concepts),
        "question_type": batch.question_type,
        "n_questions": batch.n_questions,
        "difficulty": batch.difficulty,
        "has_instructions": bool(batch.custom_instruction),
        "concepts_tokens": concepts_token_count,
        "old_questions_count": len(sampled_old_questions),
        "old_questions_tokens": old_questions_token_count,
        "output_tokens": response_tokens,
        "total_input_tokens": prompt_tokens,
    }
    ctx.batch_metrics.append(batch_metrics)

    return {
        "result": result,
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
    result = generation_result["result"]

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

    questions_list = result.questions

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


async def insert_batch_to_supabase(
    batch: Batch,
    batch_idx: int,
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
    max_retries: int = 3,
) -> int:
    questions = await try_retry_batch(batch, batch_idx, ctx, max_retries)
    inserted_count = 0
    logger.info(f"Started Inserting questions in supabase : {len(questions)}")
    for _idx, item in enumerate(questions):
        question_data = item["question"]
        concept_ids = item["concept_ids"]

        # Ensure required fields are present (especially for fetched questions)
        if "activity_id" not in question_data or not question_data["activity_id"]:
            question_data["activity_id"] = str(ctx.activity_id)

        if question_data.get("marks") is None:
            question_data["marks"] = ctx.default_marks or 1

        # Extract SVGs before inserting question (svg is not a column in gen_questions)
        svg_list = question_data.pop("svgs", None)

        # Set created_at with offset to preserve insertion order
        # Earlier inserted questions get higher timestamps (appear first in DESC order)
        offset = ctx.timestamp_offset_ms
        ctx.timestamp_offset_ms += 1
        question_created_at = ctx.base_timestamp - timedelta(milliseconds=offset)
        question_data["created_at"] = question_created_at.isoformat()

        # Map columns to match_the_following_columns if present
        if "columns" in question_data:
            cols = question_data.pop("columns")
            if isinstance(cols, list):
                # Convert list of Column objects/dicts to a single dictionary
                dict_cols = {}
                for col in cols:
                    if isinstance(col, dict):
                        dict_cols[col["name"]] = col["items"]
                    else:
                        dict_cols[col.name] = col.items
                question_data["match_the_following_columns"] = dict_cols
            else:
                question_data["match_the_following_columns"] = cols

        # Convert numeric answer_text to string for numerical/integer answer types
        # Database expects answer_text as string, but AI generates numeric types
        if "answer_text" in question_data and isinstance(question_data["answer_text"], (int, float)):
            question_data["answer_text"] = str(question_data["answer_text"])

        try:
            gen_question_insert = GenQuestionsInsert(**question_data)
        except Exception as e:
            logger.error(f"Validation failed for question data: {e}")
            logger.debug(f"Problematic payload: {question_data}")
            continue

        try:
            result = await (
                supabase_client.table("gen_questions")
                .insert(gen_question_insert.model_dump(mode="json", exclude_none=True))
                .execute()
            )
        except Exception as e:
            logger.error(f"Failed to execute insert query: {e}")
            continue

        if result.data:
            inserted_question = result.data[0]
            question_id = inserted_question["id"]
            inserted_count += 1

            # Create initial version (v0) for undo/redo functionality
            await create_initial_version(supabase_client, question_id, inserted_question)

            # Insert SVGs into gen_images table if present
            if svg_list:
                for position, svg_item in enumerate(svg_list, start=1):
                    try:
                        # svg_item can be a dict with 'svg' key or an object with svg attribute
                        svg_string = svg_item.get("svg") if isinstance(svg_item, dict) else svg_item.svg
                        if svg_string:
                            gen_image = GenImagesInsert(
                                gen_question_id=question_id,
                                svg_string=svg_string,
                                position=position,
                            )
                            await (
                                supabase_client.table("gen_images")
                                .insert(gen_image.model_dump(mode="json", exclude_none=True))
                                .execute()
                            )
                    except Exception as svg_error:
                        logger.warning(f"Failed to insert SVG for question {question_id}: {svg_error}")

            for concept_id in concept_ids:
                try:
                    # UUIDv7 support fix: Bypassing strict Pydantic UUID4 validation
                    # concept_map = GenQuestionsConceptsMapsInsert(...)
                    # We insert raw dict instead.
                    concept_map_payload = {
                        "gen_question_id": str(question_id),
                        "concept_id": str(concept_id),
                    }
                    await supabase_client.table("gen_questions_concepts_maps").insert(concept_map_payload).execute()
                except Exception as mapping_error:
                    if "duplicate key value violates unique constraint" not in str(mapping_error):
                        logger.warning(f"Failed to create mapping: {mapping_error}")

    return inserted_count


async def process_all_batches(
    batches: list[Batch],
    ctx: BatchProcessingContext,
    supabase_client: AsyncClient,
    max_retries: int = 3,
) -> dict[str, any]:
    tasks = [
        insert_batch_to_supabase(batch, batch_idx + 1, ctx, supabase_client, max_retries)
        for batch_idx, batch in enumerate(batches)
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    successful = 0
    failed = 0
    questions_inserted = 0

    for _idx, result in enumerate(results):
        if isinstance(result, Exception):
            failed += 1
        else:
            successful += 1
            questions_inserted += result if isinstance(result, int) else 0

    # LOG: Final token usage summary
    logger.info(
        f"REQUEST_COMPLETE | batches_total={len(batches)} successful={successful} "
        f"failed={failed} questions_inserted={questions_inserted} | "
        f"TOKENS: prompt={ctx.total_prompt_tokens} response={ctx.total_response_tokens} "
        f"total={ctx.total_tokens}"
    )
    
    # LOG: Detailed per-batch metrics table
    if ctx.batch_metrics:
        # Sort by batch_idx to ensure correct order
        sorted_metrics = sorted(ctx.batch_metrics, key=lambda x: x.get("batch_idx", 0))
        
        logger.info("\n" + "=" * 160)
        logger.info("PER-BATCH METRICS TABLE")
        logger.info("=" * 160)
        
        # Header
        header = (
            f"{'Batch':<7} | {'Concepts':<9} | {'Q-Type':<20} | {'#Q':<4} | "
            f"{'Difficulty':<10} | {'Instructions':<12} | {'Concept Tokens':<15} | "
            f"{'Old-Q Count':<12} | {'Old-Q Tokens':<13} | {'Output Tokens':<13} | {'Total Input':<11}"
        )
        logger.info(header)
        logger.info("-" * 160)
        
        # Rows
        for m in sorted_metrics:
            row = (
                f"{m['batch_idx']:<7} | {m['concepts_count']:<9} | {m['question_type']:<20} | {m['n_questions']:<4} | "
                f"{m['difficulty']:<10} | {'Yes' if m['has_instructions'] else 'No':<12} | {m['concepts_tokens']:<15} | "
                f"{m['old_questions_count']:<12} | {m['old_questions_tokens']:<13} | {m['output_tokens']:<13} | {m['total_input_tokens']:<11}"
            )
            logger.info(row)
        
        logger.info("=" * 160)
        
        # Log instructions if provided
        if ctx.original_instructions:
            logger.info("\nCUSTOM INSTRUCTIONS PROVIDED:")
            logger.info(f"{ctx.original_instructions}")
            logger.info("=" * 160)
        else:
            logger.info("\nCUSTOM INSTRUCTIONS: None")
            logger.info("=" * 160)

    return {
        "successful": successful,
        "failed": failed,
        "total": len(batches),
        "questions_inserted": questions_inserted,
        "token_usage": {
            "prompt_tokens": ctx.total_prompt_tokens,
            "response_tokens": ctx.total_response_tokens,
            "total_tokens": ctx.total_tokens,
        },
    }
