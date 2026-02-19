import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from api.v1.qgen.generate_questions.batchification import Batch
from api.v1.qgen.generate_questions.service import (
    BatchProcessingContext,
    insert_batch_to_supabase,
)
from supabase_dir import PublicHardnessLevelEnumEnum


@pytest.fixture
def mock_supabase_client():
    client = MagicMock()
    # Mock for gen_questions insert
    client.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": str(uuid.uuid4())}, {"id": str(uuid.uuid4())}])
    )
    return client


@pytest.fixture
def batch_ctx(mock_supabase_client):
    return BatchProcessingContext(
        gemini_client=MagicMock(),
        supabase_client=mock_supabase_client,
        concepts_dict={"Concept 1": "Desc 1"},
        concepts_name_to_id={"Concept 1": str(uuid.uuid4())},
        old_questions=[],
        activity_id=uuid.uuid4(),
    )


@pytest.mark.asyncio
async def test_insert_batch_to_supabase_uses_batch_insert(batch_ctx, mock_supabase_client):
    # Mock try_retry_batch to return 2 questions
    with MagicMock():
        from api.v1.qgen.generate_questions import service

        # We need to mock try_retry_batch which is called inside insert_batch_to_supabase
        service.try_retry_batch = AsyncMock(
            return_value=[
                {
                    "question": {
                        "question_text": "Q1",
                        "answer_text": "A1",
                        "svgs": [{"svg": "<svg1>"}],
                        "question_type": "mcq4",
                        "hardness_level": PublicHardnessLevelEnumEnum.EASY,
                    },
                    "concept_ids": [str(uuid.uuid4())],
                },
                {
                    "question": {
                        "question_text": "Q2",
                        "answer_text": "A2",
                        "svgs": [{"svg": "<svg2>"}],
                        "question_type": "mcq4",
                        "hardness_level": PublicHardnessLevelEnumEnum.EASY,
                    },
                    "concept_ids": [str(uuid.uuid4())],
                },
            ]
        )

        batch = Batch(
            question_type="mcq4",
            difficulty="easy",
            n_questions=2,
            concepts=["Concept 1"],
            custom_instruction=None,
        )

        inserted_count = await insert_batch_to_supabase(
            batch=batch, batch_idx=1, ctx=batch_ctx, supabase_client=mock_supabase_client
        )

        assert inserted_count == 2

        # Easier way: check if insert was called with a list
        mock_supabase_client.table.assert_any_call("gen_questions")
        mock_supabase_client.table.assert_any_call("gen_images")
        mock_supabase_client.table.assert_any_call("gen_questions_concepts_maps")
        mock_supabase_client.table.assert_any_call("gen_question_versions")

        # Verify by checking the arguments of insert() calls
        insert_calls = mock_supabase_client.table.return_value.insert.call_args_list
        assert len(insert_calls) >= 3  # gen_questions, gen_images, gen_question_versions, gen_questions_concepts_maps

        for call in insert_calls:
            payload = call[0][0]
            assert isinstance(payload, list), "Insert should be called with a list for batching"
            if len(payload) > 0:
                assert isinstance(payload[0], dict)
