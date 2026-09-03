"""Unit tests for assessment student serializers."""

from api.v1.assessment.models import QUESTION_SECRET_FIELDS, RESPONSE_GRADING_FIELDS
from api.v1.assessment.serializers import has_secret_fields, strip_question_for_student, strip_response_for_student
from tests.utils.assessment_factories import make_question, make_response


class TestStripQuestion:
    def test_secret_fields_are_removed(self):
        stripped = strip_question_for_student(make_question())
        assert QUESTION_SECRET_FIELDS.isdisjoint(stripped.keys())
        assert stripped["question_text"] == "2 + 2 = ?"
        assert stripped["option2"] == "4"
        assert not has_secret_fields(stripped)

    def test_nested_payload_detection(self):
        payload = {"sections": [{"questions": [make_question()]}]}
        assert has_secret_fields(payload)
        payload = {"sections": [{"questions": [strip_question_for_student(make_question())]}]}
        assert not has_secret_fields(payload)


class TestStripResponse:
    def test_hides_grading_while_in_progress(self):
        stripped = strip_response_for_student(make_response(), include_grading=False)
        assert RESPONSE_GRADING_FIELDS.isdisjoint(stripped.keys())
        assert stripped["selected_mcq_option"] == 2

    def test_keeps_grading_after_submit(self):
        stripped = strip_response_for_student(make_response(), include_grading=True)
        assert stripped["is_correct"] is True
        assert stripped["marks_obtained"] == 4
