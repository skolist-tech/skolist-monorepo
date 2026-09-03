"""Factories for assessment unit tests."""

from typing import Any


def make_question(**overrides: Any) -> dict[str, Any]:
    question = {
        "id": "q-mcq",
        "test_id": "test-1",
        "section_id": "section-1",
        "parent_question_id": None,
        "position": 1,
        "question_text": "2 + 2 = ?",
        "question_type": "mcq",
        "hardness_level": "easy",
        "marks": 4,
        "negative_marks": 1,
        "option1": "3",
        "option2": "4",
        "option3": "5",
        "option4": "6",
        "correct_mcq_option": 2,
        "msq_option1_answer": None,
        "msq_option2_answer": None,
        "msq_option3_answer": None,
        "msq_option4_answer": None,
        "numerical_answer": None,
        "integer_answer": None,
        "answer": "4",
        "explanation": "Because 2+2=4",
    }
    question.update(overrides)
    return question


def make_response(**overrides: Any) -> dict[str, Any]:
    response = {
        "id": "r-1",
        "attempt_id": "a-1",
        "question_id": "q-mcq",
        "selected_mcq_option": 2,
        "selected_msq_options": None,
        "numerical_answer": None,
        "integer_answer": None,
        "is_correct": True,
        "marks_obtained": 4,
        "answered_at": "2026-08-18T05:10:00+00:00",
    }
    response.update(overrides)
    return response
