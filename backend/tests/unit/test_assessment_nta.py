"""Unit tests for NTA CBT fields (images, visit, mark-for-review)."""

from api.v1.assessment.grading import grade_question, is_unanswered
from api.v1.assessment.models import ResponseUpsert, StudentQuestion, StudentResponse, dump_unset
from api.v1.assessment.serializers import strip_question_for_student, strip_response_for_student
from tests.utils.assessment_factories import make_question, make_response


class TestNtaQuestionImages:
    """Question image URL fields survive student serialization."""

    def test_student_strip_keeps_image_urls(self):
        """Stem/option image URLs stay; answers stay stripped."""
        question = make_question(
            image_url="https://example.com/fig.png",
            option2_image_url="https://example.com/opt2.png",
        )
        stripped = strip_question_for_student(question)
        assert stripped["image_url"] == "https://example.com/fig.png"
        assert stripped["option2_image_url"] == "https://example.com/opt2.png"
        assert "correct_mcq_option" not in stripped
        assert "explanation" not in stripped

    def test_student_question_model_accepts_images(self):
        """StudentQuestion validates image_url."""
        payload = strip_question_for_student(make_question(image_url="https://example.com/a.svg"))
        model = StudentQuestion.model_validate(payload)
        assert model.image_url == "https://example.com/a.svg"


class TestNtaResponseFlags:
    """Visit and mark-for-review flags on responses."""

    def test_strip_keeps_visit_and_review_flags_in_progress(self):
        """In-progress strip keeps NTA flags, hides grading."""
        response = make_response(is_visited=True, is_marked_for_review=True)
        stripped = strip_response_for_student(response, include_grading=False)
        assert stripped["is_visited"] is True
        assert stripped["is_marked_for_review"] is True
        assert "is_correct" not in stripped
        assert "marks_obtained" not in stripped

    def test_student_response_defaults_false_when_missing(self):
        """Missing flags default to False on StudentResponse."""
        row = {
            "id": "r-1",
            "attempt_id": "a-1",
            "question_id": "q-1",
            "selected_mcq_option": None,
        }
        model = StudentResponse.model_validate(row)
        assert model.is_visited is False
        assert model.is_marked_for_review is False

    def test_response_upsert_accepts_nta_flags(self):
        """ResponseUpsert dumps visit/review with answers."""
        body = ResponseUpsert(
            selected_mcq_option=3,
            is_visited=True,
            is_marked_for_review=True,
        )
        payload = dump_unset(body)
        assert payload == {
            "selected_mcq_option": 3,
            "is_visited": True,
            "is_marked_for_review": True,
        }

    def test_response_upsert_visit_only_without_answer(self):
        """Visit-only upsert omits answer keys."""
        body = ResponseUpsert(is_visited=True, is_marked_for_review=False)
        payload = dump_unset(body)
        assert payload == {"is_visited": True, "is_marked_for_review": False}
        assert "selected_mcq_option" not in payload


class TestNtaGradingSemantics:
    """Mark-for-review does not change scoring rules."""

    def test_visited_only_counts_as_unanswered(self):
        """Visited with no answer is unscored."""
        question = make_question()
        response = make_response(
            selected_mcq_option=None,
            is_visited=True,
            is_marked_for_review=False,
            is_correct=None,
            marks_obtained=None,
        )
        assert is_unanswered(question, response) is True
        marks, correct = grade_question(question, response)
        assert marks == 0
        assert correct is None

    def test_marked_for_review_without_answer_is_unscored(self):
        """Marked without answer is unscored."""
        question = make_question()
        response = make_response(
            selected_mcq_option=None,
            is_visited=True,
            is_marked_for_review=True,
            is_correct=None,
            marks_obtained=None,
        )
        assert is_unanswered(question, response) is True
        marks, correct = grade_question(question, response)
        assert marks == 0
        assert correct is None

    def test_answered_and_marked_for_review_is_still_graded(self):
        """NTA: purple+green (answered & marked) is evaluated."""
        question = make_question()
        response = make_response(
            selected_mcq_option=2,
            is_visited=True,
            is_marked_for_review=True,
        )
        assert is_unanswered(question, response) is False
        marks, correct = grade_question(question, response)
        assert marks == 4
        assert correct is True

    def test_wrong_answer_marked_for_review_still_gets_negative(self):
        """Wrong answered+marked still takes negative marks."""
        question = make_question()
        response = make_response(
            selected_mcq_option=1,
            is_visited=True,
            is_marked_for_review=True,
            is_correct=None,
            marks_obtained=None,
        )
        marks, correct = grade_question(question, response)
        assert marks == -1
        assert correct is False
