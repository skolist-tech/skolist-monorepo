"""
Shared fixtures for unit tests.

Provides:
- mock_llm_client (autouse): patches api.v1.qgen.llm.get_async_client for all
  active service tests (generate_questions, regenerate, auto_correct, etc.)
- gemini_client: legacy fixture for tests that still exercise regenerate_question.py
  (the old dead-code path that still uses genai.Client directly).

The --gemini-live option is defined in tests/conftest.py.
"""

import os
from typing import Any
from unittest.mock import MagicMock, patch

import google.genai as genai
import pytest
from dotenv import load_dotenv

from api.v1.qgen.models import MCQ4, FillInTheBlank, ShortAnswer, TrueFalse

# ============================================================================
# MOCK RESPONSE FACTORIES
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
        answer_text="KE = 1/2*m*v^2",
        explanation="The kinetic energy formula is KE = 1/2 * m * v^2",
    )


def create_mock_short_answer(question_text: str | None = None) -> ShortAnswer:
    """Create a mock ShortAnswer question."""
    return ShortAnswer(
        question_text=question_text or "Explain Newton's first law of motion.",
        answer_text="An object in motion stays in motion unless acted upon by an external force.",
        explanation="This is the law of inertia.",
    )


def create_mock_true_false(question_text: str | None = None) -> TrueFalse:
    """Create a mock TrueFalse question."""
    return TrueFalse(
        question_text=question_text or "Kinetic energy depends on velocity squared.",
        answer_text="True",
        explanation="KE = 1/2 * m * v^2, so it depends on v squared.",
    )


def create_mock_fill_in_blank(question_text: str | None = None) -> FillInTheBlank:
    """Create a mock FillInTheBlank question."""
    return FillInTheBlank(
        question_text=question_text or "The formula for kinetic energy is KE = 1/2 * m * ___",
        answer_text="v^2",
        explanation="Velocity squared completes the kinetic energy formula.",
    )


# ============================================================================
# MOCK GEMINI CLIENT
# ============================================================================


class MockParsedResponse:
    """Mock for response.parsed and response.text attributes."""

    def __init__(self, parsed_obj: Any, text: str = ""):
        self._parsed = parsed_obj
        self._text = text

    @property
    def parsed(self):
        return self._parsed

    @property
    def text(self):
        return self._text


class MockQuestionsResponse:
    """Mock for questions response with .questions attribute."""

    def __init__(self, questions: list):
        self.questions = questions


class MockGeminiModels:
    """Mock for gemini_client.aio.models."""

    def __init__(self):
        self._call_count = 0

    async def generate_content(
        self,
        model: str,
        contents: Any,
        config: dict,
    ) -> MockParsedResponse:
        """Mock generate_content that returns appropriate responses based on schema."""
        schema = config.get("response_schema")
        schema_name = getattr(schema, "__name__", str(schema))
        contents_str = str(contents).lower()

        # Handle auto-correct endpoint (returns wrapper with .question)
        if "AutoCorrected" in schema_name:
            # Check if it's a short answer based on input
            if "short_answer" in contents_str:

                class QuestionWrapper:
                    question = create_mock_short_answer("What is Newton's first law of motion?")

                return MockParsedResponse(QuestionWrapper())
            else:

                class QuestionWrapper:
                    question = create_mock_mcq4("What is the formula for kinetic energy?")

                return MockParsedResponse(QuestionWrapper())

        # Handle regenerate endpoints (returns wrapper with .question)
        if "Regenerated" in schema_name:
            # Check if it's a short answer based on input
            if "short_answer" in contents_str:

                class QuestionWrapper:
                    question = create_mock_short_answer("Describe the principle of conservation of momentum.")

                return MockParsedResponse(QuestionWrapper())
            else:

                class QuestionWrapper:
                    question = create_mock_mcq4("Calculate the kinetic energy of a 5kg object moving at 10 m/s.")

                return MockParsedResponse(QuestionWrapper())

        # Handle feedback endpoint (returns FeedbackList with .feedbacks list)
        if "FeedbackList" in schema_name or "feedback" in contents_str:
            from api.v1.qgen.models import FeedbackItem, FeedbackList

            feedback_list = FeedbackList(
                feedbacks=[
                    FeedbackItem(
                        message="Consider adding more variety in question difficulty levels.",
                        priority=7,
                    ),
                    FeedbackItem(message="Some questions could benefit from clearer wording.", priority=5),
                ]
            )
            return MockParsedResponse(feedback_list)

        # Handle question generation schemas (returns wrapper with .questions list)
        if "mcq4" in contents_str:
            questions = MockQuestionsResponse([create_mock_mcq4()])
            return MockParsedResponse(questions)

        if "true_false" in contents_str:
            questions = MockQuestionsResponse([create_mock_true_false()])
            return MockParsedResponse(questions)

        if "fill_in_the_blank" in contents_str:
            questions = MockQuestionsResponse([create_mock_fill_in_blank()])
            return MockParsedResponse(questions)

        if "short_answer" in contents_str:
            questions = MockQuestionsResponse([create_mock_short_answer()])
            return MockParsedResponse(questions)

        # Default: return MCQ4 questions list
        questions = MockQuestionsResponse([create_mock_mcq4()])
        return MockParsedResponse(questions)


class MockAioNamespace:
    """Mock for gemini_client.aio namespace."""

    def __init__(self):
        self.models = MockGeminiModels()


class MockGeminiClient:
    """Mock Gemini client that mimics real client interface."""

    def __init__(self):
        self.aio = MockAioNamespace()
        # Also provide sync interface for compatibility
        self.models = MagicMock()


# ============================================================================
# MOCK INSTRUCTOR CLIENT (for active service tests)
# ============================================================================


def _messages_to_str(messages: list) -> str:
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
    if "short_answer" in content_str or "long_answer" in content_str:
        return create_mock_short_answer()
    if "true_false" in content_str:
        return create_mock_true_false()
    if "fill_in_the_blank" in content_str:
        return create_mock_fill_in_blank()
    return create_mock_mcq4()


def _build_mock_response(response_model, messages: list):
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
                FeedbackItem(message="Add more variety in difficulty.", priority=7),
                FeedbackItem(message="Clearer wording needed.", priority=5),
            ]
        )

    if name == "ExtractedQuestionsList":
        return ExtractedQuestionsList(
            questions=[
                ExtractedQuestion(
                    question_type="mcq4",
                    question_text="What is kinetic energy?",
                    option1="KE = mv²",
                    option2="KE = ½mv²",
                    option3="KE = mgh",
                    option4="KE = Fd",
                    correct_mcq_option=2,
                    answer_text="KE = ½mv²",
                )
            ]
        )

    if "questions" in getattr(response_model, "model_fields", {}):
        from api.v1.qgen.generate_questions.models import (
            FillInTheBlankWithConcepts,
            IntegerAnswerWithConcepts,
            MCQ4WithConcepts,
            NumericalAnswerWithConcepts,
            ShortAnswerWithConcepts,
            TrueFalseWithConcepts,
        )
        n = response_model.__name__
        if "TrueFalse" in n:
            q = TrueFalseWithConcepts(question_text="KE depends on v².", answer_text="True", concepts=["Kinetic Energy"])
        elif "FillInTheBlank" in n:
            q = FillInTheBlankWithConcepts(question_text="KE = ½ * m * ___", answer_text="v²", concepts=["Kinetic Energy"])
        elif "ShortAnswer" in n or "LongAnswer" in n:
            q = ShortAnswerWithConcepts(question_text="Explain Newton's first law.", answer_text="Objects stay in motion.", concepts=["Newton's Laws"])
        elif "Numerical" in n:
            q = NumericalAnswerWithConcepts(question_text="KE of 2kg at 3m/s?", answer_text=9.0, concepts=["Kinetic Energy"])
        elif "Integer" in n:
            q = IntegerAnswerWithConcepts(question_text="How many Newton's laws?", answer_text=3, concepts=["Newton's Laws"])
        else:
            q = MCQ4WithConcepts(
                question_text="What is kinetic energy?",
                option1="KE = mv²", option2="KE = ½mv²", option3="KE = mgh", option4="KE = Fd",
                correct_mcq_option=2, answer_text="KE = ½mv²", concepts=["Kinetic Energy"],
            )
        return response_model(questions=[q])

    return MagicMock()


class _MockUsage:
    prompt_tokens = 50
    completion_tokens = 25
    total_tokens = 75


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
    """Mock instructor.AsyncInstructor for unit tests."""

    def __init__(self):
        self.chat = _MockInstructorChat()


async def _mock_svg_acompletion(model, messages, **kwargs):
    mock = MagicMock()
    mock.choices = [MagicMock()]
    mock.choices[0].message.content = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'
    return mock


# ============================================================================
# FIXTURES
# ============================================================================


@pytest.fixture(autouse=True)
def mock_llm_client(use_live_gemini):
    """
    Patch the LLM layer for all unit tests unless --gemini-live is used.
    Patches api.v1.qgen.llm.get_async_client so active service code
    gets a mock instructor client without real API calls.
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


@pytest.fixture(scope="session")
def gemini_client(use_live_gemini) -> genai.Client:
    """
    Provide Gemini client - mock by default, real with --gemini-live flag.

    Usage:
        pytest tests/unit/                    # Uses mock client
        pytest tests/unit/ --gemini-live      # Uses real API
    """
    if use_live_gemini:
        load_dotenv()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            pytest.skip("GEMINI_API_KEY not set in environment")
        return genai.Client(api_key=api_key)
    else:
        return MockGeminiClient()
