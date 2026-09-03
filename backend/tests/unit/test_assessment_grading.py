"""Unit tests for assessment grading."""

from api.v1.assessment.grading import grade_attempt, grade_question
from tests.utils.assessment_factories import make_question, make_response


class TestGradeQuestion:
    def test_mcq_correct(self):
        question = make_question()
        marks, correct = grade_question(question, make_response(selected_mcq_option=2))
        assert marks == 4
        assert correct is True

    def test_mcq_incorrect_applies_negative(self):
        question = make_question()
        marks, correct = grade_question(question, make_response(selected_mcq_option=1))
        assert marks == -1
        assert correct is False

    def test_unanswered_is_zero(self):
        question = make_question()
        marks, correct = grade_question(question, None)
        assert marks == 0
        assert correct is None

    def test_msq_all_flags_must_match(self):
        question = make_question(
            id="q-msq",
            question_type="msq",
            correct_mcq_option=None,
            msq_option1_answer=True,
            msq_option2_answer=True,
            msq_option3_answer=False,
            msq_option4_answer=False,
            negative_marks=2,
        )
        marks, correct = grade_question(
            question,
            make_response(
                question_id="q-msq",
                selected_mcq_option=None,
                selected_msq_options=[True, True, False, False],
            ),
        )
        assert marks == 4
        assert correct is True

        marks, correct = grade_question(
            question,
            make_response(
                question_id="q-msq",
                selected_mcq_option=None,
                selected_msq_options=[True, False, False, False],
            ),
        )
        assert marks == -2
        assert correct is False

    def test_numerical_tolerance(self):
        question = make_question(
            id="q-num",
            question_type="numerical",
            correct_mcq_option=None,
            numerical_answer=9.8,
            negative_marks=0,
        )
        marks, correct = grade_question(
            question,
            make_response(question_id="q-num", selected_mcq_option=None, numerical_answer=9.8),
        )
        assert correct is True
        marks, correct = grade_question(
            question,
            make_response(question_id="q-num", selected_mcq_option=None, numerical_answer=10.0),
        )
        assert marks == 0
        assert correct is False

    def test_integer_exact(self):
        question = make_question(
            id="q-int",
            question_type="integer",
            correct_mcq_option=None,
            integer_answer=2,
            negative_marks=0,
        )
        marks, correct = grade_question(
            question,
            make_response(question_id="q-int", selected_mcq_option=None, integer_answer=2),
        )
        assert correct is True
        marks, correct = grade_question(
            question,
            make_response(question_id="q-int", selected_mcq_option=None, integer_answer=3),
        )
        assert correct is False

    def test_passage_unscored(self):
        question = make_question(marks=0, negative_marks=0, correct_mcq_option=None)
        marks, correct = grade_question(question, make_response(selected_mcq_option=1))
        assert marks == 0
        assert correct is None


class TestGradeAttempt:
    def test_sums_marks_and_possible(self):
        questions = [
            make_question(id="q1"),
            make_question(id="q2", marks=4, negative_marks=1, correct_mcq_option=3),
        ]
        responses = [
            make_response(id="r1", question_id="q1", selected_mcq_option=2),
            make_response(id="r2", question_id="q2", selected_mcq_option=1),
        ]
        results, obtained, possible = grade_attempt(questions, responses)
        assert possible == 8
        assert obtained == 3
        assert results[0]["is_correct"] is True
        assert results[1]["is_correct"] is False
