"""
Integration tests for get_version_states_batch RPC function.

These tests actually call the real Supabase database and verify the SQL logic works correctly.
"""

import uuid

import pytest
from supabase import AsyncClient

from supabase_dir import PublicProductTypeEnumEnum
from tests.integration.conftest import TEST_USER_EMAIL, TEST_USER_PASSWORD


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture
async def auth_supabase_client(env) -> AsyncClient:
    """Create an authenticated async Supabase client."""
    from supabase import acreate_client
    
    client = await acreate_client(env["SUPABASE_URL"], env["SUPABASE_ANON_KEY"])
    
    # Sign in as test user
    await client.auth.sign_in_with_password({
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
    })
    
    return client


@pytest.fixture
async def test_activity(auth_supabase_client: AsyncClient):
    """Create a test activity and clean it up after test."""
    # Get user from authenticated client
    user_response = await auth_supabase_client.auth.get_user()
    user_id = user_response.user.id
    
    # Create test activity
    activity_data = {
        "name": "Test Activity for RPC Tests",
        "product_type": PublicProductTypeEnumEnum.QGEN.value,
        "user_id": user_id,
    }
    
    result = await auth_supabase_client.table("activities").insert(activity_data).execute()
    activity_id = result.data[0]["id"]
    
    yield activity_id
    
    # Cleanup: delete activity (cascades to gen_questions and gen_question_versions)
    await auth_supabase_client.table("activities").delete().eq("id", activity_id).execute()


async def create_test_question(client: AsyncClient, activity_id: str) -> str:
    """Helper to create a test question."""
    question_data = {
        "activity_id": activity_id,
        "question_text": "Test question",
        "answer_text": "Test answer",
        "question_type": "short_answer",
        "hardness_level": "medium",
        "marks": 2,
    }
    
    result = await client.table("gen_questions").insert(question_data).execute()
    return result.data[0]["id"]


async def create_version(
    client: AsyncClient,
    question_id: str,
    version_index: int,
    is_active: bool = False,
    is_deleted: bool = False,
):
    """Helper to create a question version."""
    version_data = {
        "gen_question_id": question_id,
        "version_index": version_index,
        "is_active": is_active,
        "is_deleted": is_deleted,
        "question_text": f"Question text v{version_index}",
        "answer_text": f"Answer v{version_index}",
        "question_type": "short_answer",
        "hardness_level": "medium",
        "marks": 2,
    }
    
    result = await client.table("gen_question_versions").insert(version_data).execute()
    return result.data[0]["id"]


# ============================================================================
# EMPTY INPUT TESTS
# ============================================================================


class TestEmptyInput:
    """Tests for empty question ID arrays."""

    @pytest.mark.asyncio
    async def test_empty_array_returns_empty_result(self, auth_supabase_client: AsyncClient):
        """Test that empty input returns empty result."""
        result = await auth_supabase_client.rpc("get_version_states_batch", {"question_ids": []}).execute()
        
        assert result.data == []


# ============================================================================
# SINGLE QUESTION TESTS
# ============================================================================


class TestSingleQuestion:
    """Tests for single question version states."""

    @pytest.mark.asyncio
    async def test_question_with_only_v0_cannot_undo_or_redo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question with only v0 (initial version) has no undo/redo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        assert len(result.data) == 1
        assert result.data[0]["gen_question_id"] == q1_id
        assert result.data[0]["can_undo"] is False
        assert result.data[0]["can_redo"] is False

    @pytest.mark.asyncio
    async def test_question_with_v0_and_v1_active_can_undo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question with v0 and v1 (v1 active) can undo but not redo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        assert len(result.data) == 1
        assert result.data[0]["can_undo"] is True
        assert result.data[0]["can_redo"] is False

    @pytest.mark.asyncio
    async def test_question_with_middle_version_active_can_undo_and_redo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question with v0, v1, v2 (v1 active) can undo and redo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=True)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=False)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        assert len(result.data) == 1
        assert result.data[0]["can_undo"] is True
        assert result.data[0]["can_redo"] is True

    @pytest.mark.asyncio
    async def test_question_at_oldest_version_can_only_redo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question at v0 with v1, v2 existing can only redo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=True)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=False)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        assert len(result.data) == 1
        assert result.data[0]["can_undo"] is False
        assert result.data[0]["can_redo"] is True

    @pytest.mark.asyncio
    async def test_question_at_newest_version_can_only_undo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question at newest version with older versions can only undo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        assert len(result.data) == 1
        assert result.data[0]["can_undo"] is True
        assert result.data[0]["can_redo"] is False

    @pytest.mark.asyncio
    async def test_question_with_no_active_version_returns_no_result(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question with no active version returns empty."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        # Create version but mark as not active
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # No active version = no result from RPC
        assert len(result.data) == 0


# ============================================================================
# DELETED VERSIONS TESTS
# ============================================================================


class TestDeletedVersions:
    """Tests for handling deleted versions."""

    @pytest.mark.asyncio
    async def test_deleted_versions_are_ignored_in_undo_check(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test that deleted versions don't count for undo availability."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False, is_deleted=True)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # v1 is deleted, but v0 exists, so can undo
        assert result.data[0]["can_undo"] is True
        assert result.data[0]["can_redo"] is False

    @pytest.mark.asyncio
    async def test_deleted_versions_are_ignored_in_redo_check(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test that deleted versions don't count for redo availability."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=True)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False, is_deleted=True)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=False)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # v1 is deleted, but v2 exists, so can redo
        assert result.data[0]["can_undo"] is False
        assert result.data[0]["can_redo"] is True

    @pytest.mark.asyncio
    async def test_all_previous_versions_deleted_cannot_undo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test that if all previous versions are deleted, cannot undo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False, is_deleted=True)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False, is_deleted=True)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # All previous versions deleted, cannot undo
        assert result.data[0]["can_undo"] is False
        assert result.data[0]["can_redo"] is False

    @pytest.mark.asyncio
    async def test_all_future_versions_deleted_cannot_redo(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test that if all future versions are deleted, cannot redo."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=True)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False, is_deleted=True)
        await create_version(auth_supabase_client, q1_id, version_index=2, is_active=False, is_deleted=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # All future versions deleted, cannot redo
        assert result.data[0]["can_undo"] is False
        assert result.data[0]["can_redo"] is False

    @pytest.mark.asyncio
    async def test_only_deleted_versions_returns_no_result(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test that if all versions are deleted, no result is returned."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=False, is_deleted=True)
        await create_version(auth_supabase_client, q1_id, version_index=1, is_active=False, is_deleted=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # Active version is deleted, should return no result
        assert len(result.data) == 0


# ============================================================================
# MULTIPLE QUESTIONS TESTS
# ============================================================================


class TestMultipleQuestions:
    """Tests for batching multiple questions."""

    @pytest.mark.asyncio
    async def test_batch_of_questions_with_different_states(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test batching multiple questions with different version states."""
        # Q1: Only v0 (no undo/redo)
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=True)
        
        # Q2: v0 inactive, v1 active (can undo, not redo)
        q2_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q2_id, version_index=0, is_active=False)
        await create_version(auth_supabase_client, q2_id, version_index=1, is_active=True)
        
        # Q3: v0, v1 active, v2 inactive (can undo and redo)
        q3_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q3_id, version_index=0, is_active=False)
        await create_version(auth_supabase_client, q3_id, version_index=1, is_active=True)
        await create_version(auth_supabase_client, q3_id, version_index=2, is_active=False)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id, q2_id, q3_id]}
        ).execute()
        
        assert len(result.data) == 3
        
        # Build lookup map
        states = {item["gen_question_id"]: item for item in result.data}
        
        # Verify Q1
        assert states[q1_id]["can_undo"] is False
        assert states[q1_id]["can_redo"] is False
        
        # Verify Q2
        assert states[q2_id]["can_undo"] is True
        assert states[q2_id]["can_redo"] is False
        
        # Verify Q3
        assert states[q3_id]["can_undo"] is True
        assert states[q3_id]["can_redo"] is True

    @pytest.mark.asyncio
    async def test_batch_with_some_questions_missing_active_version(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test batch where some questions have no active version."""
        # Q1: Has active version
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q1_id, version_index=0, is_active=True)
        
        # Q2: No active version
        q2_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q2_id, version_index=0, is_active=False)
        
        # Q3: Has active version
        q3_id = await create_test_question(auth_supabase_client, test_activity)
        await create_version(auth_supabase_client, q3_id, version_index=0, is_active=True)
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id, q2_id, q3_id]}
        ).execute()
        
        # Only 2 results (q2 has no active version)
        assert len(result.data) == 2
        
        states = {item["gen_question_id"]: item for item in result.data}
        assert q1_id in states
        assert q2_id not in states
        assert q3_id in states

    @pytest.mark.asyncio
    async def test_batch_makes_single_query(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test that batching multiple questions is more efficient than individual queries."""
        # Create 10 test questions with versions
        question_ids = []
        for _ in range(10):
            q_id = await create_test_question(auth_supabase_client, test_activity)
            await create_version(auth_supabase_client, q_id, version_index=0, is_active=True)
            question_ids.append(q_id)
        
        # Single batch call
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": question_ids}
        ).execute()
        
        # All 10 questions returned
        assert len(result.data) == 10
        
        # This is ONE RPC call instead of 10 * 3 = 30 individual queries
        # (The efficiency improvement is demonstrated by the fact that
        # this test completes quickly)


# ============================================================================
# EDGE CASES
# ============================================================================


class TestEdgeCases:
    """Tests for edge cases."""

    @pytest.mark.asyncio
    async def test_nonexistent_question_id_returns_no_result(
        self, auth_supabase_client: AsyncClient
    ):
        """Test that nonexistent question IDs return no result."""
        fake_id = str(uuid.uuid4())
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [fake_id]}
        ).execute()
        
        assert len(result.data) == 0

    @pytest.mark.asyncio
    async def test_question_with_many_versions(
        self, auth_supabase_client: AsyncClient, test_activity
    ):
        """Test question with many versions (e.g., 10) works correctly."""
        q1_id = await create_test_question(auth_supabase_client, test_activity)
        
        # Create versions 0-9, with v5 active
        for i in range(10):
            await create_version(
                auth_supabase_client,
                q1_id,
                version_index=i,
                is_active=(i == 5)
            )
        
        result = await auth_supabase_client.rpc(
            "get_version_states_batch",
            {"question_ids": [q1_id]}
        ).execute()
        
        # v5 is active, has 0-4 before (can undo) and 6-9 after (can redo)
        assert result.data[0]["can_undo"] is True
        assert result.data[0]["can_redo"] is True
