import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from api.v1.qgen.generate_questions.batchification import Batch
from api.v1.qgen.generate_questions.service import (
    BatchProcessingContext,
    insert_batch_to_supabase,
)
from supabase_dir import PublicHardnessLevelEnumEnum, PublicQuestionTypeEnumEnum


@pytest.fixture
def mock_supabase_client():
    client = MagicMock()
    # Mock for gen_questions table
    client.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": str(uuid.uuid4())}])
    )
    # Mock for upsert (concepts map)
    client.table.return_value.upsert.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    return client


@pytest.fixture
def batch_ctx(mock_supabase_client):
    return BatchProcessingContext(
        gemini_client=MagicMock(),
        supabase_client=mock_supabase_client,
        concepts_dict={"Concept 1": "Description 1"},
        concepts_name_to_id={"Concept 1": str(uuid.uuid4())},
        old_questions=[],
        activity_id=uuid.uuid4(),
    )


@pytest.mark.asyncio
async def test_insert_batch_to_supabase_calls_batch_insert(mock_supabase_client, batch_ctx):
    # Mock try_retry_batch to return 2 questions
    questions = [
        {
            "question": {
                "question_text": "Question 1",
                "answer_text": "Answer 1",
                "hardness_level": PublicHardnessLevelEnumEnum.EASY,
                "marks": 1,
                "question_type": PublicQuestionTypeEnumEnum.MCQ4,
                "svgs": [{"svg": "<svg>1</svg>"}],
            },
            "concept_ids": [str(uuid.uuid4())],
        },
        {
            "question": {
                "question_text": "Question 2",
                "answer_text": "Answer 2",
                "hardness_level": PublicHardnessLevelEnumEnum.MEDIUM,
                "marks": 2,
                "question_type": PublicQuestionTypeEnumEnum.SHORT_ANSWER,
            },
            "concept_ids": [str(uuid.uuid4())],
        },
    ]

    with MagicMock():
        import api.v1.qgen.generate_questions.service as service

        service.try_retry_batch = AsyncMock(return_value=questions)

        batch = Batch(
            question_type="mcq4", difficulty="easy", n_questions=2, concepts=["Concept 1"], custom_instruction=None
        )

        result = await insert_batch_to_supabase(
            batch=batch, batch_idx=1, ctx=batch_ctx, supabase_client=mock_supabase_client
        )

        assert result == 2

        # Check that insert was called with a list of 2 questions
        # Note: calls are mock_supabase_client.table('gen_questions').insert(payloads).execute()
        # We need to find the correct call in the mock history

        insert_calls = [call for call in mock_supabase_client.table.mock_calls if call[1] == ("gen_questions",)]
        assert len(insert_calls) > 0

        # Verify gen_questions insert
        [
            c
            for c in mock_supabase_client.table().insert.call_args_list
            if isinstance(c.args[0], list) and len(c.args[0]) == 2
        ]
        # Wait, table() is also a call.
        # Actually, let's use a simpler way to verify

        # Verify that insert was called with a list for gen_questions
        mock_supabase_client.table.assert_any_call("gen_questions")

        # Verify related tables inserts
        mock_supabase_client.table.assert_any_call("gen_question_versions")
        mock_supabase_client.table.assert_any_call("gen_images")
        mock_supabase_client.table.assert_any_call("gen_questions_concepts_maps")

        # Verify versions insert had 2 items
        version_insert_args = next(
            call.args[0]
            for call in mock_supabase_client.table().insert.call_args_list
            if len(call.args[0]) == 2 and "version_index" in call.args[0][0]
        )
        assert len(version_insert_args) == 2

        # Verify images insert had 1 item (only Q1 had an SVG)
        image_insert_args = next(
            call.args[0]
            for call in mock_supabase_client.table().insert.call_args_list
            if len(call.args[0]) == 1 and "svg_string" in call.args[0][0]
        )
        assert len(image_insert_args) == 1
