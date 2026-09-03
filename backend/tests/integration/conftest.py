"""
Shared fixtures for integration tests.

These fixtures provide authenticated Supabase clients, test data setup/teardown,
and FastAPI TestClient with authentication headers.

By default, tests use a mock Gemini client. Use --gemini-live to test with real API.
The --gemini-live option is defined in tests/conftest.py.
"""

import os
import uuid
from collections.abc import Generator
from typing import Any
from unittest.mock import patch

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from supabase import AsyncClient, Client, acreate_client, create_client

from api.v1.qgen.models import MCQ4, FillInTheBlank, ShortAnswer, TrueFalse
from app import create_app
from supabase_dir import PublicProductTypeEnumEnum

# ============================================================================
# TEST USER CREDENTIALS (seeded by skolist-db/seed_users.py)
# ============================================================================
# These are hardcoded because they're fixed test data for local Supabase.
# Do not change these unless you also update seed_users.py.

TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "password123"


# ============================================================================
# MOCK RESPONSE FACTORIES (for integration tests)
# ============================================================================


def create_mock_mcq4(question_text: str | None = None) -> MCQ4:
    """Create a mock MCQ4 question."""
    return MCQ4(
        question_text=question_text or "What is the formula for kinetic energy?",
        option1="KE = m*v^2",
        option2="KE = 1/2*m*v",
        option3="KE = 1/2*m*v^2",
        option4="KE = m*g*h",
        correct_mcq_option=3,
        explanation="The kinetic energy formula is KE = 1/2 * m * v^2",
        answer_text="KE = 1/2*m*v^2",
        hardness_level="medium",
        marks=1,
    )


def create_mock_short_answer(question_text: str | None = None) -> ShortAnswer:
    """Create a mock ShortAnswer question."""
    return ShortAnswer(
        question_text=question_text or "Explain Newton's first law of motion.",
        answer_text="An object in motion stays in motion unless acted upon by an external force.",
        explanation="This is the law of inertia.",
        hardness_level="medium",
        marks=2,
    )


def create_mock_true_false(question_text: str | None = None) -> TrueFalse:
    """Create a mock TrueFalse question."""
    return TrueFalse(
        question_text=question_text or "Kinetic energy depends on velocity squared.",
        correct_answer=True,
        explanation="KE = 1/2 * m * v^2, so it depends on v squared.",
        answer_text="True",
        hardness_level="easy",
        marks=1,
    )


def create_mock_fill_in_blank(question_text: str | None = None) -> FillInTheBlank:
    """Create a mock FillInTheBlank question."""
    return FillInTheBlank(
        question_text=question_text or "The formula for kinetic energy is KE = 1/2 * m * ___",
        answer_text="v^2",
        explanation="Velocity squared completes the kinetic energy formula.",
        hardness_level="medium",
        marks=1,
    )


# ============================================================================
# MOCK LLM CLIENT (instructor + litellm, for integration tests)
# ============================================================================


def _messages_to_str(messages: list) -> str:
    """Extract text content from messages for pattern matching."""
    parts = []
    for m in messages:
        content = m.get("content", "")
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    parts.append(block.get("text", ""))
        else:
            parts.append(str(content))
    return " ".join(parts).lower()


def _pick_question(content_str: str):
    """Pick an appropriate mock question based on prompt content."""
    if "short_answer" in content_str or "long_answer" in content_str:
        return create_mock_short_answer("Describe Newton's first law of motion.")
    if "true_false" in content_str:
        return create_mock_true_false()
    if "fill_in_the_blank" in content_str:
        return create_mock_fill_in_blank()
    return create_mock_mcq4()


def _build_questions_list_response(response_model, content_str: str):
    """Build a mock list-of-questions response for generation schemas."""
    from api.v1.qgen.generate_questions.models import (
        FillInTheBlankWithConcepts,
        IntegerAnswerWithConcepts,
        MCQ4WithConcepts,
        NumericalAnswerWithConcepts,
        ShortAnswerWithConcepts,
        TrueFalseWithConcepts,
    )

    name = response_model.__name__

    if "TrueFalse" in name:
        q = TrueFalseWithConcepts(
            question_text="Kinetic energy depends on velocity squared.",
            answer_text="True",
            concepts=["Kinetic Energy"],
        )
    elif "FillInTheBlank" in name:
        q = FillInTheBlankWithConcepts(
            question_text="The formula for KE is KE = ½ * m * ___",
            answer_text="v²",
            concepts=["Kinetic Energy"],
        )
    elif "ShortAnswer" in name or "LongAnswer" in name:
        q = ShortAnswerWithConcepts(
            question_text="Explain Newton's first law of motion.",
            answer_text="An object in motion stays in motion unless acted upon.",
            concepts=["Newton's Laws"],
        )
    elif "Numerical" in name:
        q = NumericalAnswerWithConcepts(
            question_text="Calculate KE of a 2 kg object moving at 3 m/s.",
            answer_text=9.0,
            concepts=["Kinetic Energy"],
        )
    elif "Integer" in name:
        q = IntegerAnswerWithConcepts(
            question_text="How many laws did Newton formulate?",
            answer_text=3,
            concepts=["Newton's Laws"],
        )
    else:
        # MCQ4, MSQ4, MatchTheFollowing — default to MCQ4
        q = MCQ4WithConcepts(
            question_text="What is the formula for kinetic energy?",
            option1="KE = mv²",
            option2="KE = ½mv²",
            option3="KE = mgh",
            option4="KE = Fd",
            correct_mcq_option=2,
            answer_text="KE = ½mv²",
            concepts=["Kinetic Energy"],
        )

    return response_model(questions=[q])


def _build_mock_response(response_model, messages: list):
    """Return a validated instance of response_model populated with mock data."""
    from api.v1.qgen.models import (
        AutoCorrectedQuestion,
        ExtractedQuestion,
        ExtractedQuestionsList,
        FeedbackItem,
        FeedbackList,
    )

    content_str = _messages_to_str(messages)
    name = getattr(response_model, "__name__", "")

    if name == "AutoCorrectedQuestion":
        return AutoCorrectedQuestion(question=_pick_question(content_str))

    if name == "RegeneratedQuestion":
        from api.v1.qgen.regenerate.service import RegeneratedQuestion
        return RegeneratedQuestion(question=_pick_question(content_str))

    if name == "FeedbackList":
        return FeedbackList(
            feedbacks=[
                FeedbackItem(message="Consider adding more variety in difficulty levels.", priority=7),
                FeedbackItem(message="Some questions could benefit from clearer wording.", priority=5),
            ]
        )

    if name == "ExtractedQuestionsList":
        return ExtractedQuestionsList(
            questions=[
                ExtractedQuestion(
                    question_type="mcq4",
                    question_text="What is the formula for kinetic energy?",
                    option1="KE = mv²",
                    option2="KE = ½mv²",
                    option3="KE = mgh",
                    option4="KE = Fd",
                    correct_mcq_option=2,
                    answer_text="KE = ½mv²",
                )
            ]
        )

    # Question generation schemas (MCQ4WithConceptsList, ShortAnswerWithConceptsList, …)
    if "questions" in getattr(response_model, "model_fields", {}):
        return _build_questions_list_response(response_model, content_str)

    from unittest.mock import MagicMock
    return MagicMock()


class _MockUsage:
    prompt_tokens = 100
    completion_tokens = 50
    total_tokens = 150


class _MockCompletion:
    usage = _MockUsage()


class _MockInstructorCompletions:
    async def create(self, model, messages, response_model, **kwargs):
        return _build_mock_response(response_model, messages)

    async def create_with_completion(self, model, messages, response_model, **kwargs):
        result = _build_mock_response(response_model, messages)
        return result, _MockCompletion()


class _MockInstructorChat:
    def __init__(self):
        self.completions = _MockInstructorCompletions()


class MockInstructorClient:
    """Mock instructor.AsyncInstructor that returns provider-agnostic Pydantic instances."""

    def __init__(self):
        self.chat = _MockInstructorChat()


async def _mock_svg_acompletion(model, messages, **kwargs):
    """Mock for litellm.acompletion used by edit_svg service."""
    from unittest.mock import MagicMock
    mock = MagicMock()
    mock.choices = [MagicMock()]
    mock.choices[0].message.content = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">'
        '<circle cx="100" cy="100" r="75" fill="blue"/>'
        '<text x="100" y="100" text-anchor="middle">r = 75</text>'
        "</svg>"
    )
    return mock


# ============================================================================
# LLM MOCK FIXTURE (auto-applied unless --gemini-live)
# ============================================================================


@pytest.fixture(autouse=True)
def mock_llm_client(use_live_gemini):
    """
    Patch the LLM layer for all integration tests unless --gemini-live is used.

    Patches a single entry point (api.v1.qgen.llm.get_async_client) so all
    structured-output services get a mock instructor client, plus patches
    litellm.acompletion in edit_svg which uses free-form text output.
    """
    if use_live_gemini:
        yield
    else:
        # Patch each service module's own reference — `from ..llm import get_async_client`
        # creates a local copy per module, so we must patch where the name is USED, not defined.
        with (
            patch("api.v1.qgen.generate_questions.service.get_async_client", return_value=MockInstructorClient()),
            patch("api.v1.qgen.regenerate.service.get_async_client", return_value=MockInstructorClient()),
            patch("api.v1.qgen.auto_correct.service.get_async_client", return_value=MockInstructorClient()),
            patch("api.v1.qgen.extract_questions.service.get_async_client", return_value=MockInstructorClient()),
            patch("api.v1.qgen.regenerate_with_prompt.service.get_async_client", return_value=MockInstructorClient()),
            patch("api.v1.qgen.get_feedback.get_async_client", return_value=MockInstructorClient()),
            patch("api.v1.qgen.edit_svg.service.litellm.acompletion", new=_mock_svg_acompletion),
        ):
            yield


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def _get_session_access_token(auth_response) -> str | None:
    """Extract access_token from supabase-py auth response across versions."""
    session = getattr(auth_response, "session", None)
    if session is None and isinstance(auth_response, dict):
        session = auth_response.get("session")

    if session is None:
        return None

    token = getattr(session, "access_token", None)
    if token is None and isinstance(session, dict):
        token = session.get("access_token")

    return token


def _get_user_id(auth_response) -> str | None:
    """Extract user id from supabase-py auth response."""
    user = getattr(auth_response, "user", None)
    if user is None and isinstance(auth_response, dict):
        user = auth_response.get("user")

    if user is None:
        return None

    user_id = getattr(user, "id", None)
    if user_id is None and isinstance(user, dict):
        user_id = user.get("id")

    return user_id


# ============================================================================
# ENVIRONMENT FIXTURES
# ============================================================================


@pytest.fixture(scope="session")
def env(request) -> dict[str, str]:
    """
    Load and validate required environment variables for integration tests.

    GEMINI_API_KEY is only required when --gemini-live flag is used.
    """
    load_dotenv()

    use_live_gemini = request.config.getoption("--gemini-live", default=False)

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    # Base required vars (always needed for Supabase)
    required_vars = [
        ("SUPABASE_URL", supabase_url),
        ("SUPABASE_ANON_KEY", supabase_anon_key),
        ("SUPABASE_SERVICE_KEY", supabase_service_key),
    ]

    # LLM API key only required with --gemini-live (provider determined by QGEN_MODEL env var)
    if use_live_gemini and not gemini_api_key:
        pytest.skip("GEMINI_API_KEY not set — required for --gemini-live with Gemini models")

    missing = [name for name, value in required_vars if not value]
    if missing:
        pytest.skip("Missing env vars for integration tests: " + ", ".join(missing))

    return {
        "SUPABASE_URL": supabase_url,
        "SUPABASE_ANON_KEY": supabase_anon_key,
        "SUPABASE_SERVICE_KEY": supabase_service_key,
        "GEMINI_API_KEY": gemini_api_key or "mock-api-key",
    }


# ============================================================================
# SUPABASE CLIENT FIXTURES
# ============================================================================


@pytest.fixture(scope="session")
def service_supabase_client(env: dict[str, str]) -> Client:
    """
    Create a Supabase client with service role key.
    Used for test data setup/teardown operations.
    """
    return create_client(env["SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"])


# Global async client for test session
_test_async_client: AsyncClient | None = None


@pytest.fixture(scope="session")
def async_supabase_client(env: dict[str, str]):
    """
    Create an async Supabase client for integration tests.
    This will be used to override the get_async_supabase_client dependency.
    """
    import asyncio

    async def create_client_async():
        global _test_async_client
        if _test_async_client is None:
            _test_async_client = await acreate_client(env["SUPABASE_URL"], env["SUPABASE_SERVICE_KEY"])
        return _test_async_client

    # Run the async creation in a new event loop for the session fixture
    loop = asyncio.new_event_loop()
    client = loop.run_until_complete(create_client_async())
    loop.close()
    return client


@pytest.fixture(scope="session")
def auth_session(env: dict[str, str], service_supabase_client: Client) -> dict[str, Any]:
    """
    Authenticate as test user and return session info.

    Uses hardcoded credentials from TEST_USER_EMAIL/TEST_USER_PASSWORD constants.
    These users are seeded by skolist-db/seed_users.py.

    Also ensures the user exists in public.users as a non-admin (private_user).
    """
    client = create_client(env["SUPABASE_URL"], env["SUPABASE_ANON_KEY"])
    auth_response = client.auth.sign_in_with_password(
        {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
        }
    )

    token = _get_session_access_token(auth_response)
    user_id = _get_user_id(auth_response)

    if not token:
        pytest.fail("Failed to get access token from Supabase sign-in")

    if not user_id:
        pytest.fail("Failed to get user ID from Supabase sign-in")

    # Ensure user exists in public.users as non-admin with credits
    # This resets any admin status from previous test runs
    service_supabase_client.table("users").upsert(
        {
            "id": user_id,
            "email": TEST_USER_EMAIL,
            "user_type": "private_user",
            "credits": 10000,  # Give test user plenty of credits
        }
    ).execute()

    return {
        "access_token": token,
        "user_id": user_id,
    }


# ============================================================================
# FASTAPI TEST CLIENT FIXTURES
# ============================================================================


@pytest.fixture(scope="session")
def app(service_supabase_client: Client, async_supabase_client: AsyncClient):
    """
    Create the FastAPI application instance with test Supabase client.

    Overrides get_supabase_client and get_async_supabase_client to use the same
    Supabase instance that the tests authenticate against, ensuring JWT validation succeeds.
    """
    from api.v1.auth import get_async_supabase_client, get_supabase_client

    # Clear any cached client that may point to a different Supabase instance
    get_supabase_client.cache_clear()

    app_instance = create_app()

    # Override the get_supabase_client dependency (for require_supabase_user)
    app_instance.dependency_overrides[get_supabase_client] = lambda: service_supabase_client

    # Override the async client dependency for all API routes
    async def get_test_async_client():
        return async_supabase_client

    app_instance.dependency_overrides[get_async_supabase_client] = get_test_async_client

    # Also patch the function directly since require_supabase_user calls it directly
    with patch("api.v1.auth.get_supabase_client", return_value=service_supabase_client):
        yield app_instance


@pytest.fixture(scope="session")
def _lifespan_client(app) -> Generator[TestClient, None, None]:
    """
    Session-scoped TestClient that properly triggers app lifespan events.

    This ensures BrowserService and other startup/shutdown code runs once
    at the start/end of the test session.
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def test_client(_lifespan_client: TestClient, auth_session: dict[str, Any]) -> TestClient:
    """
    Create an authenticated TestClient.

    Reuses the lifespan client and adds authentication headers.
    """
    _lifespan_client.headers["Authorization"] = f"Bearer {auth_session['access_token']}"
    return _lifespan_client


@pytest.fixture
def unauthenticated_test_client(_lifespan_client: TestClient) -> TestClient:
    """
    Create a TestClient without authentication headers.

    Temporarily clears auth headers for this test.
    """
    # Save and clear auth header
    original_auth = _lifespan_client.headers.pop("Authorization", None)
    yield _lifespan_client
    # Restore auth header if it was set
    if original_auth:
        _lifespan_client.headers["Authorization"] = original_auth


# ============================================================================
# TEST DATA FIXTURES
# ============================================================================


@pytest.fixture(scope="module")
def test_topic_id(service_supabase_client: Client) -> Generator[str, None, None]:
    """
    Get or create a test topic for concept creation.
    We need a valid topic_id since concepts require it.
    """
    # First, try to get an existing topic
    response = service_supabase_client.table("topics").select("id").limit(1).execute()

    if response.data and len(response.data) > 0:
        yield response.data[0]["id"]
    else:
        # If no topics exist, we need to create the hierarchy:
        # board -> school_class -> subject -> chapter -> topic

        # Check for existing board
        board_resp = service_supabase_client.table("boards").select("id").limit(1).execute()
        if board_resp.data:
            board_id = board_resp.data[0]["id"]
        else:
            board_id = str(uuid.uuid4())
            service_supabase_client.table("boards").insert({"id": board_id, "name": "Test Board"}).execute()

        # Check for existing school_class
        class_resp = service_supabase_client.table("school_classes").select("id").limit(1).execute()
        if class_resp.data:
            class_id = class_resp.data[0]["id"]
        else:
            class_id = str(uuid.uuid4())
            service_supabase_client.table("school_classes").insert(
                {
                    "id": class_id,
                    "name": "Test Class",
                    "board_id": board_id,
                    "position": 1,
                }
            ).execute()

        # Check for existing subject
        subject_resp = service_supabase_client.table("subjects").select("id").limit(1).execute()
        if subject_resp.data:
            subject_id = subject_resp.data[0]["id"]
        else:
            subject_id = str(uuid.uuid4())
            service_supabase_client.table("subjects").insert(
                {"id": subject_id, "name": "Test Subject", "school_class_id": class_id}
            ).execute()

        # Check for existing chapter
        chapter_resp = service_supabase_client.table("chapters").select("id").limit(1).execute()
        if chapter_resp.data:
            chapter_id = chapter_resp.data[0]["id"]
        else:
            chapter_id = str(uuid.uuid4())
            service_supabase_client.table("chapters").insert(
                {"id": chapter_id, "name": "Test Chapter", "subject_id": subject_id}
            ).execute()

        # Create topic
        topic_id = str(uuid.uuid4())
        service_supabase_client.table("topics").insert(
            {
                "id": topic_id,
                "name": "Test Topic",
                "chapter_id": chapter_id,
                "position": 1,
            }
        ).execute()

        yield topic_id

        # Cleanup: We won't delete the hierarchy to avoid breaking other tests


@pytest.fixture
def test_concepts(
    service_supabase_client: Client,
    test_topic_id: str,
) -> Generator[list[dict[str, Any]], None, None]:
    """
    Create test concepts in Supabase and clean up after test.
    """
    concept_ids = [str(uuid.uuid4()), str(uuid.uuid4())]

    concepts_data = [
        {
            "id": concept_ids[0],
            "name": "Newton's Laws of Motion",
            "description": ("The three fundamental laws describing the relationship between forces and motion."),
            "topic_id": test_topic_id,
            "page_number": 1,
        },
        {
            "id": concept_ids[1],
            "name": "Kinetic Energy",
            "description": ("Energy possessed by an object due to its motion. Formula: KE = 1/2 * m * v^2."),
            "topic_id": test_topic_id,
            "page_number": 2,
        },
    ]

    # Insert concepts
    response = service_supabase_client.table("concepts").insert(concepts_data).execute()

    yield response.data

    # Cleanup: Delete test concepts
    service_supabase_client.table("concepts").delete().in_("id", concept_ids).execute()


@pytest.fixture
def test_activity(
    service_supabase_client: Client,
    auth_session: dict[str, Any],
) -> Generator[dict[str, Any], None, None]:
    """
    Create a test activity in Supabase and clean up after test.
    """
    activity_id = str(uuid.uuid4())
    user_id = auth_session["user_id"]

    activity_data = {
        "id": activity_id,
        "name": "Test Activity for Question Generation",
        "product_type": PublicProductTypeEnumEnum.QGEN.value,
        "user_id": user_id,
    }

    # Insert activity
    response = service_supabase_client.table("activities").insert(activity_data).execute()

    yield response.data[0]

    # Cleanup: First delete related data, then delete activity
    # Delete gen_questions_concepts_maps entries
    gen_questions = service_supabase_client.table("gen_questions").select("id").eq("activity_id", activity_id).execute()

    if gen_questions.data:
        question_ids = [q["id"] for q in gen_questions.data]
        service_supabase_client.table("gen_questions_concepts_maps").delete().in_(
            "gen_question_id", question_ids
        ).execute()

        # Delete gen_questions
        service_supabase_client.table("gen_questions").delete().eq("activity_id", activity_id).execute()

    # Delete the activity
    service_supabase_client.table("activities").delete().eq("id", activity_id).execute()


@pytest.fixture
def test_bank_questions(
    service_supabase_client: Client,
    test_concepts: list[dict[str, Any]],
) -> Generator[list[dict[str, Any]], None, None]:
    """
    Create test bank questions (historical questions) for the concepts.
    These are used as reference data for question generation.
    """
    # Get a subject_id for the bank questions
    subject_resp = service_supabase_client.table("subjects").select("id").limit(1).execute()

    if not subject_resp.data:
        pytest.skip("No subjects available for bank questions")

    subject_id = subject_resp.data[0]["id"]

    question_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
    concept_ids = [c["id"] for c in test_concepts]

    bank_questions_data = [
        {
            "id": question_ids[0],
            "question_text": "What is Newton's First Law of Motion?",
            "question_type": "mcq4",
            "option1": "Law of Inertia",
            "option2": "Law of Acceleration",
            "option3": "Law of Action-Reaction",
            "option4": "Law of Gravity",
            "correct_mcq_option": 1,
            "answer_text": "Law of Inertia",
            "explanation": "Newton's First Law states that an object at rest stays at rest.",
            "hardness_level": "easy",
            "marks": 1,
            "subject_id": subject_id,
        },
        {
            "id": question_ids[1],
            "question_text": "Calculate the kinetic energy of a 2kg object moving at 3 m/s.",
            "question_type": "short_answer",
            "answer_text": "KE = 1/2 * 2 * 3^2 = 9 Joules",
            "explanation": "Using the formula KE = 1/2 * m * v^2",
            "hardness_level": "medium",
            "marks": 2,
            "subject_id": subject_id,
        },
    ]

    # Insert bank questions
    response = service_supabase_client.table("bank_questions").insert(bank_questions_data).execute()

    # Create mappings between bank questions and concepts
    mappings_data = [
        {
            "id": str(uuid.uuid4()),
            "bank_question_id": question_ids[0],
            "concept_id": concept_ids[0],
        },
        {
            "id": str(uuid.uuid4()),
            "bank_question_id": question_ids[1],
            "concept_id": concept_ids[1],
        },
    ]

    service_supabase_client.table("bank_questions_concepts_maps").insert(mappings_data).execute()

    yield response.data

    # Cleanup: Delete mappings first, then questions
    service_supabase_client.table("bank_questions_concepts_maps").delete().in_(
        "bank_question_id", question_ids
    ).execute()

    service_supabase_client.table("bank_questions").delete().in_("id", question_ids).execute()


# ============================================================================
# ASSESSMENT AUTH FIXTURES
# ============================================================================

ASSESSMENT_TEACHER_EMAIL = "teacher1@seed.skolist.com"
ASSESSMENT_STUDENT_EMAIL = "student1@seed.skolist.com"
ASSESSMENT_PASSWORD = "password123"


def _sign_in_session(env: dict[str, str], email: str, password: str) -> dict[str, Any]:
    client = create_client(env["SUPABASE_URL"], env["SUPABASE_ANON_KEY"])
    auth_response = client.auth.sign_in_with_password({"email": email, "password": password})
    token = _get_session_access_token(auth_response)
    user_id = _get_user_id(auth_response)
    if not token or not user_id:
        pytest.skip(f"Could not authenticate {email}. Run skolist-db python seeds first.")
    return {"access_token": token, "user_id": user_id, "email": email}


@pytest.fixture
def teacher_auth_session(env: dict[str, str]) -> dict[str, Any]:
    return _sign_in_session(env, ASSESSMENT_TEACHER_EMAIL, ASSESSMENT_PASSWORD)


@pytest.fixture
def student_auth_session(env: dict[str, str]) -> dict[str, Any]:
    return _sign_in_session(env, ASSESSMENT_STUDENT_EMAIL, ASSESSMENT_PASSWORD)


@pytest.fixture
def teacher_test_client(app, teacher_auth_session: dict[str, Any]) -> TestClient:
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {teacher_auth_session['access_token']}"
    return client


@pytest.fixture
def student_test_client(app, student_auth_session: dict[str, Any]) -> TestClient:
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {student_auth_session['access_token']}"
    return client
