"""Permission and visibility rules for assessment tests."""

from datetime import UTC, datetime
from typing import Any

from ..dependencies import parse_datetime, teacher_has_access
from ..models import TeacherQuestion

TERMINAL_STATUSES = {"submitted", "timed_out", "graded"}

# Blueprint columns copied onto a new test question; ids are assigned by the clone.
_CLONE_ASSIGNED_FIELDS = {"id", "test_id", "section_id", "parent_question_id"}
QUESTION_COPY_FIELDS = tuple(field for field in TeacherQuestion.model_fields if field not in _CLONE_ASSIGNED_FIELDS)

__all__ = [
    "QUESTION_COPY_FIELDS",
    "attempt_summary",
    "is_past_test",
    "question_clone_payload",
    "student_can_review_attempt",
    "student_can_see_answers",
    "teacher_has_access",
]


def is_past_test(test: dict[str, Any], now: datetime | None = None) -> bool:
    if test.get("status") == "closed":
        return True
    ends_at = parse_datetime(test.get("ends_at"))
    if ends_at is None:
        return False
    return (now or datetime.now(UTC)) > ends_at


def student_can_review_attempt(test: dict[str, Any], attempt: dict[str, Any], now: datetime | None = None) -> bool:
    if attempt.get("status") not in TERMINAL_STATUSES:
        return True
    if not is_past_test(test, now):
        return True
    return bool(test.get("students_can_review_attempts"))


def student_can_see_answers(test: dict[str, Any], attempt: dict[str, Any]) -> bool:
    if attempt.get("status") not in TERMINAL_STATUSES:
        return False
    return bool(test.get("students_can_see_answers"))


def attempt_summary(questions: list[dict], responses: list[dict]) -> dict[str, int]:
    by_question = {row.get("question_id"): row for row in responses}
    correct = 0
    wrong = 0
    unanswered = 0
    for question in questions:
        response = by_question.get(question.get("id"))
        if not response or response.get("is_correct") is None:
            unanswered += 1
        elif response.get("is_correct"):
            correct += 1
        else:
            wrong += 1
    return {"correct": correct, "wrong": wrong, "unanswered": unanswered, "total": len(questions)}


def question_clone_payload(question: dict[str, Any], test_id: str, section_id: str) -> dict[str, Any]:
    payload = {field: question.get(field) for field in QUESTION_COPY_FIELDS}
    payload["test_id"] = test_id
    payload["section_id"] = section_id
    return payload
