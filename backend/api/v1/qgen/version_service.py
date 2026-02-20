"""
Question Version Service

Handles version management for gen_questions, enabling undo/redo functionality.
"""

import logging
from typing import Any

from supabase import AsyncClient

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURABLE VERSION FIELDS
# These are the fields that get versioned. Easy to modify this list.
# ============================================================================

VERSION_FIELDS = [
    "question_text",
    "answer_text",
    "explanation",
    "option1",
    "option2",
    "option3",
    "option4",
    "correct_mcq_option",
    "msq_option1_answer",
    "msq_option2_answer",
    "msq_option3_answer",
    "msq_option4_answer",
    "question_type",
    "hardness_level",
    "marks",
    "match_the_following_columns",
]


def extract_version_data(question_data: dict[str, Any]) -> dict[str, Any]:
    """Extract only the versioned fields from question data."""
    return {key: question_data.get(key) for key in VERSION_FIELDS if key in question_data}


async def create_initial_version(
    supabase_client: AsyncClient,
    gen_question_id: str,
    question_data: dict[str, Any],
) -> dict[str, Any] | None:
    """
    Create version 0 when a question is first created.

    Args:
        supabase_client: Async Supabase client instance
        gen_question_id: The ID of the newly created question
        question_data: The question data (all fields)

    Returns:
        The created version record, or None if failed
    """
    try:
        version_data = extract_version_data(question_data)
        version_data.update(
            {
                "gen_question_id": gen_question_id,
                "version_index": 0,
                "is_active": True,
                "is_deleted": False,
            }
        )

        result = await supabase_client.table("gen_question_versions").insert(version_data).execute()

        if result.data:
            logger.debug(f"Created initial version (v0) for question {gen_question_id}")
            return result.data[0]

        return None

    except Exception as e:
        logger.error(f"Failed to create initial version for question {gen_question_id}: {e}")
        return None


async def create_initial_versions_batch(
    supabase_client: AsyncClient,
    versions_data: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Create initial versions for multiple questions in a single batch.

    Args:
        supabase_client: Async Supabase client instance
        versions_data: List of dictionaries, each containing question data and gen_question_id

    Returns:
        The list of created version records
    """
    if not versions_data:
        return []

    try:
        batch_payload = []
        for item in versions_data:
            gen_question_id = item.get("gen_question_id")
            question_data = item.get("question_data")
            if not gen_question_id or not question_data:
                continue

            version_data = extract_version_data(question_data)
            version_data.update(
                {
                    "gen_question_id": gen_question_id,
                    "version_index": 0,
                    "is_active": True,
                    "is_deleted": False,
                }
            )
            batch_payload.append(version_data)

        if not batch_payload:
            return []

        result = await supabase_client.table("gen_question_versions").insert(batch_payload).execute()

        if result.data:
            logger.debug(f"Created {len(result.data)} initial versions in batch")
            return result.data

        return []

    except Exception as e:
        logger.error(f"Failed to create initial versions batch: {e}")
        return []


async def create_new_version_on_update(
    supabase_client: AsyncClient,
    gen_question_id: str,
    new_question_data: dict[str, Any],
) -> dict[str, Any] | None:
    """
    Create a new version when a question is updated.

    This function:
    1. Fetches the current question to get all fields
    2. Merges with the update data
    3. Gets the current active version index
    4. Marks all versions with index > current as is_deleted=true
    5. Sets current active version to is_active=false
    6. Creates new version with index = max + 1, is_active=true

    Args:
        supabase_client: Async Supabase client instance
        gen_question_id: The ID of the question being updated
        new_question_data: The update data (may be partial)

    Returns:
        The created version record, or None if failed
    """
    try:
        # 0. Fetch the current question to get ALL fields (required for NOT NULL constraints)
        current_question_result = await (
            supabase_client.table("gen_questions").select("*").eq("id", gen_question_id).single().execute()
        )

        if not current_question_result.data:
            logger.error(f"Question {gen_question_id} not found, cannot create version")
            return None

        # Merge current question data with the updates (updates take precedence)
        full_question_data = {**current_question_result.data, **new_question_data}

        # 1. Get current active version
        active_result = await (
            supabase_client.table("gen_question_versions")
            .select("id, version_index")
            .eq("gen_question_id", gen_question_id)
            .eq("is_active", True)
            .eq("is_deleted", False)
            .single()
            .execute()
        )

        if not active_result.data:
            # No active version exists - create initial version first
            logger.warning(f"No active version found for question {gen_question_id}, creating initial version")
            return await create_initial_version(supabase_client, gen_question_id, full_question_data)

        current_active = active_result.data
        current_index = current_active["version_index"]

        # 2. Mark all versions with index > current as deleted (invalidate redo history)
        await (
            supabase_client.table("gen_question_versions")
            .update({"is_deleted": True})
            .eq("gen_question_id", gen_question_id)
            .gt("version_index", current_index)
            .eq("is_deleted", False)
            .execute()
        )

        # 3. Set current active to inactive
        await (
            supabase_client.table("gen_question_versions")
            .update({"is_active": False})
            .eq("id", current_active["id"])
            .execute()
        )

        # 4. Get max version index for this question
        max_result = await (
            supabase_client.table("gen_question_versions")
            .select("version_index")
            .eq("gen_question_id", gen_question_id)
            .order("version_index", desc=True)
            .limit(1)
            .execute()
        )

        max_index = max_result.data[0]["version_index"] if max_result.data else -1
        new_index = max_index + 1

        # 5. Create new version with FULL question data (merged)
        version_data = extract_version_data(full_question_data)
        version_data.update(
            {
                "gen_question_id": gen_question_id,
                "version_index": new_index,
                "is_active": True,
                "is_deleted": False,
            }
        )

        result = await supabase_client.table("gen_question_versions").insert(version_data).execute()

        if result.data:
            logger.debug(f"Created new version (v{new_index}) for question {gen_question_id}")
            return result.data[0]

        return None

    except Exception as e:
        logger.error(f"Failed to create new version for question {gen_question_id}: {e}")
        return None
