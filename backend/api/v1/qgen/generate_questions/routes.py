import asyncio
import json
import logging
import uuid
from typing import Literal

import litellm
from fastapi import Depends, status
from fastapi.responses import Response
from pydantic import BaseModel, Field, model_validator

from ..llm import get_async_client, get_model

from api.v1.auth import get_async_supabase_client, require_supabase_user

from ..credits import check_user_has_credits, deduct_user_credits
from .batchification import Batch, build_batches_end_to_end
from .service import (
    BatchProcessingContext,
    process_all_batches,
)

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION SCHEMAS
# ============================================================================


class QuestionTypeConfig(BaseModel):
    """Question Type Configuration for the request."""

    type: Literal[
        "mcq4",
        "short_answer",
        "long_answer",
        "true_false",
        "fill_in_the_blank",
        "msq4",
        "match_the_following",
        "numerical_answer",
        "integer_answer",
        "solved_examples",
        "exercise_questions",
    ]
    count: int


class DifficultyDistribution(BaseModel):
    """Difficulty Distribution Configuration."""

    easy: int = Field(..., ge=0, le=100)
    medium: int = Field(..., ge=0, le=100)
    hard: int = Field(..., ge=0, le=100)


class QuestionConfig(BaseModel):
    """Question Configuration."""

    question_types: list[QuestionTypeConfig]
    difficulty_distribution: DifficultyDistribution

    @model_validator(mode="after")
    def check_total_questions(self) -> "QuestionConfig":
        """Ensure total questions across all types is between 1 and 50."""
        total = sum(q.count for q in self.question_types)
        if total < 1 or total > 50:
            raise ValueError("Total number of questions must be between 1 and 50.")
        return self


class GenerateQuestionsRequest(BaseModel):
    """Generate Questions Request."""

    activity_id: uuid.UUID
    concept_ids: list[uuid.UUID]
    config: QuestionConfig
    instructions: str | None = None


# ============================================================================
# HELPERS
# ============================================================================


def extract_question_type_counts_dict(request: GenerateQuestionsRequest) -> dict[str, int]:
    return {qt.type: qt.count for qt in request.config.question_types if qt.count > 0}


def extract_difficulty_percentages(
    difficulty_distribution: DifficultyDistribution,
) -> dict[str, float]:
    return {
        "easy": difficulty_distribution.easy,
        "medium": difficulty_distribution.medium,
        "hard": difficulty_distribution.hard,
    }


def batchify_request(request: GenerateQuestionsRequest, concept_names: list[str]) -> list[Batch]:
    question_type_counts = extract_question_type_counts_dict(request)
    difficulty_percentages = extract_difficulty_percentages(request.config.difficulty_distribution)

    return build_batches_end_to_end(
        question_type_counts=question_type_counts,
        concepts=concept_names,
        difficulty_percent=difficulty_percentages,
        custom_instruction=request.instructions,
        max_questions_per_batch=3,
        seed=None,
        shuffle_input_concepts=True,
        custom_instruction_fraction=0.3,  # Apply to all batches
        custom_instruction_mode="first",
    )


# ============================================================================
# ROUTE
# ============================================================================


async def generate_questions(
    request: GenerateQuestionsRequest,
    user: dict = Depends(require_supabase_user),
) -> Response:
    """Generate questions based on concepts and configuration."""
    try:
        user_id = user.id

        # Get async client
        supabase_client = await get_async_supabase_client()

        if not await check_user_has_credits(supabase_client, user_id):
            return Response(status_code=status.HTTP_402_PAYMENT_REQUIRED, content="Insufficient credits")

        # LOG: Request overview
        total_questions = sum(qt.count for qt in request.config.question_types)
        question_types_summary = ", ".join([f"{qt.type}:{qt.count}" for qt in request.config.question_types])
        instruction_length = len(request.instructions) if request.instructions else 0
        
        logger.info(
            f"REQUEST_START | user_id={user_id} activity_id={request.activity_id} | "
            f"concepts_count={len(request.concept_ids)} total_questions={total_questions} | "
            f"question_types=[{question_types_summary}] | "
            f"difficulty=[E:{request.config.difficulty_distribution.easy}% "
            f"M:{request.config.difficulty_distribution.medium}% "
            f"H:{request.config.difficulty_distribution.hard}%] | "
            f"instruction_length={instruction_length}"
        )

        # Fetch concepts
        def chunked(lst, size):
            for i in range(0, len(lst), size):
                yield lst[i : i + size]

        try:
            ids = [str(cid) for cid in request.concept_ids if cid]
            concepts = []

            for batch in chunked(ids, 300):
                response = (
                    await supabase_client.table("concepts").select("id, name, description").in_("id", batch).execute()
                )
                concepts.extend(response.data or [])
        except Exception as e:
            logger.exception(f"Error fetching concepts: {e}")
            return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        concepts_dict = {concept["name"]: concept["description"] for concept in concepts}
        concepts_name_to_id = {concept["name"]: concept["id"] for concept in concepts}
        
        # LOG: Concepts loaded
        logger.info(f"CONCEPTS_LOADED | count={len(concepts)}")

        # Fetch historical questions for reference
        try:
            ids = [str(cid) for cid in request.concept_ids if cid]
            batches_list = list(chunked(ids, 300))

            async def fetch_concept_map(batch):
                return await (
                    supabase_client.table("bank_questions_concepts_maps")
                    .select("bank_question_id, concept_id")
                    .in_("concept_id", batch)
                    .execute()
                )

            responses = await asyncio.gather(*[fetch_concept_map(b) for b in batches_list])
            concept_maps = [item for resp in responses for item in (resp.data or [])]
            
            logger.debug(f"Concept maps fetched: {len(concept_maps)} mappings")
            if concept_maps:
                logger.debug(f"Sample concept_map: {concept_maps[0]}")
        except Exception as e:
            logger.warning(f"Error Fetching the concept maps: {e}")
            concept_maps = []

        bank_question_ids = list({m["bank_question_id"] for m in concept_maps})

        if bank_question_ids:
            try:
                question_batches = list(chunked(bank_question_ids, 300))

                async def fetch_bank_questions(batch):
                    return await supabase_client.table("bank_questions").select("*").in_("id", batch).execute()

                responses = await asyncio.gather(*[fetch_bank_questions(b) for b in question_batches])
                old_questions = [item for resp in responses for item in (resp.data or [])]
            except Exception as e:
                logger.warning(f"Error Fetching the old questions: {e}")
                old_questions = []
        else:
            old_questions = []
        
        # LOG: Historical questions count (LIKELY TOKEN BOTTLENECK)
        logger.info(f"OLD_QUESTIONS_LOADED | count={len(old_questions)}")
        
        if len(old_questions) > 100:
            logger.warning(
                f"⚠️  HIGH_OLD_QUESTIONS_COUNT | count={len(old_questions)} | "
                f"This may cause token limit issues. Consider limiting historical questions."
            )
        
        # Estimate token count for old_questions
        try:
            old_questions_text = json.dumps(old_questions[:50])  # Sample first 50 for estimation
            sample_tokens = litellm.token_counter(model=get_model(), text=old_questions_text)
            estimated_total_tokens = (sample_tokens * len(old_questions)) // min(50, len(old_questions)) if old_questions else 0

            logger.info(
                f"OLD_QUESTIONS_TOKENS | sample_size={min(50, len(old_questions))} "
                f"sample_tokens={sample_tokens} estimated_total_tokens={estimated_total_tokens}"
            )

            if estimated_total_tokens > 50000:
                logger.warning(
                    f"⚠️  HIGH_TOKEN_ESTIMATE_FOR_OLD_QUESTIONS | estimated={estimated_total_tokens} | "
                    f"This is likely causing rate limit issues!"
                )
        except Exception as token_est_error:
            logger.warning(f"Could not estimate tokens for old_questions: {token_est_error}")

        # Batchification
        concept_names = [concept["name"] for concept in concepts]
        batches = batchify_request(request, concept_names)
        
        # LOG: Batch summary
        batch_types = {}
        for batch in batches:
            batch_types[batch.question_type] = batch_types.get(batch.question_type, 0) + 1
        batch_summary = ", ".join([f"{k}:{v}" for k, v in batch_types.items()])
        
        logger.info(
            f"BATCHES_CREATED | total_batches={len(batches)} | "
            f"batch_distribution=[{batch_summary}]"
        )

        # Initialize context
        ctx = BatchProcessingContext(
            supabase_client=supabase_client,
            concepts_dict=concepts_dict,
            concepts_name_to_id=concepts_name_to_id,
            old_questions=old_questions,
            concept_maps=concept_maps,
            activity_id=request.activity_id,
            original_instructions=request.instructions,
        )

        # Process all batches
        result = await process_all_batches(
            batches=batches,
            ctx=ctx,
            supabase_client=supabase_client,
            max_retries=3,
        )

        # Credits deduction
        questions_inserted = result.get("questions_inserted", 0)
        credits_to_deduct = questions_inserted * 5
        token_usage = result.get("token_usage", {})

        if credits_to_deduct > 0:
            await deduct_user_credits(supabase_client, user_id, credits_to_deduct)
        
        # LOG: Final summary
        logger.info(
            f"REQUEST_SUCCESS | user_id={user_id} activity_id={request.activity_id} | "
            f"questions_inserted={questions_inserted} credits_deducted={credits_to_deduct} | "
            f"TOKEN_SUMMARY: prompt={token_usage.get('prompt_tokens', 0)} "
            f"response={token_usage.get('response_tokens', 0)} "
            f"total={token_usage.get('total_tokens', 0)}"
        )

        return Response(status_code=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception(f"Error generating questions: {e}")
        return Response(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
