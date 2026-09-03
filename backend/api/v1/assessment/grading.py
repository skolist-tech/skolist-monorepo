"""Pure grading helpers for assessment questions."""

from typing import Any

NUMERICAL_TOLERANCE = 0.01


def _as_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    return float(value)


def _msq_flags(row: dict[str, Any] | None, prefix: str) -> list[bool]:
    if not row:
        return [False, False, False, False]
    return [
        bool(row.get(f"{prefix}1_answer") or False),
        bool(row.get(f"{prefix}2_answer") or False),
        bool(row.get(f"{prefix}3_answer") or False),
        bool(row.get(f"{prefix}4_answer") or False),
    ]


def _selected_msq(response: dict[str, Any] | None) -> list[bool]:
    raw = (response or {}).get("selected_msq_options") or []
    return [bool(raw[i]) if i < len(raw) else False for i in range(4)]


def is_unanswered(question: dict[str, Any], response: dict[str, Any] | None) -> bool:
    qtype = str(question.get("question_type") or "").lower()
    if not response:
        return True
    if qtype == "mcq":
        return response.get("selected_mcq_option") is None
    if qtype == "msq":
        return not any(_selected_msq(response))
    if qtype == "numerical":
        return response.get("numerical_answer") is None
    if qtype == "integer":
        return response.get("integer_answer") is None
    return True


def grade_question(
    question: dict[str, Any],
    response: dict[str, Any] | None,
) -> tuple[float, bool | None]:
    """Return (marks_obtained, is_correct). is_correct is None when unanswered or unscored."""
    marks = _as_float(question.get("marks"))
    negative = _as_float(question.get("negative_marks"))
    qtype = str(question.get("question_type") or "").lower()

    if marks == 0:
        return (0.0, None)

    if is_unanswered(question, response):
        return (0.0, None)

    assert response is not None
    correct = False

    if qtype == "mcq":
        correct = response.get("selected_mcq_option") == question.get("correct_mcq_option")
    elif qtype == "msq":
        correct = _selected_msq(response) == _msq_flags(question, "msq_option")
    elif qtype == "numerical":
        selected = _as_float(response.get("numerical_answer"))
        expected = question.get("numerical_answer")
        if expected is None:
            return (0.0, None)
        correct = abs(selected - _as_float(expected)) <= NUMERICAL_TOLERANCE
    elif qtype == "integer":
        expected = question.get("integer_answer")
        if expected is None:
            return (0.0, None)
        correct = int(response.get("integer_answer")) == int(expected)
    else:
        return (0.0, None)

    if correct:
        return (marks, True)
    return (-negative, False)


def grade_attempt(
    questions: list[dict[str, Any]],
    responses: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], float, float]:
    """Grade all questions. Returns (per-question results, obtained, possible)."""
    by_question = {row["question_id"]: row for row in responses}
    results: list[dict[str, Any]] = []
    obtained = 0.0
    possible = 0.0

    for question in questions:
        possible += _as_float(question.get("marks"))
        marks_obtained, is_correct = grade_question(question, by_question.get(question["id"]))
        obtained += marks_obtained
        results.append(
            {
                "question_id": question["id"],
                "marks_obtained": marks_obtained,
                "is_correct": is_correct,
            }
        )

    return results, obtained, possible
