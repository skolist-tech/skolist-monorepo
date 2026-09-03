"""Strip answer keys and grading fields for student-facing payloads."""

from typing import Any

from .models import QUESTION_SECRET_FIELDS, RESPONSE_GRADING_FIELDS, StudentQuestion, StudentResponse


def strip_question_for_student(question: dict[str, Any]) -> dict[str, Any]:
    payload = {key: value for key, value in question.items() if key not in QUESTION_SECRET_FIELDS}
    return StudentQuestion.model_validate(payload).model_dump()


def strip_response_for_student(response: dict[str, Any], include_grading: bool) -> dict[str, Any]:
    if include_grading:
        return dict(response)
    payload = {key: value for key, value in response.items() if key not in RESPONSE_GRADING_FIELDS}
    return StudentResponse.model_validate(payload).model_dump()


def has_secret_fields(payload: Any) -> bool:
    if isinstance(payload, dict):
        if QUESTION_SECRET_FIELDS.intersection(payload.keys()):
            return True
        return any(has_secret_fields(value) for value in payload.values())
    if isinstance(payload, list):
        return any(has_secret_fields(item) for item in payload)
    return False
