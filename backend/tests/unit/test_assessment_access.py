"""Permission and visibility rules for assessment tests."""

from datetime import UTC, datetime

from api.v1.assessment.common.access import (
    attempt_summary,
    is_past_test,
    question_clone_payload,
    student_can_review_attempt,
    student_can_see_answers,
    teacher_has_access,
)
from api.v1.assessment.models import AssessmentActor


def _actor(user_type: str = "teacher", actor_id: str = "teacher-1") -> AssessmentActor:
    return AssessmentActor(id=actor_id, user_type=user_type, org_id="org-1")


def test_teacher_access_is_explicit():
    actor = _actor()
    assert teacher_has_access(actor, {"teacher-1"}) is True
    assert teacher_has_access(actor, set()) is False
    assert teacher_has_access(_actor("skolist-admin", "admin"), set()) is True


def test_past_test_is_closed_or_ended():
    now = datetime(2026, 9, 25, tzinfo=UTC)
    assert is_past_test({"status": "closed"}, now) is True
    assert is_past_test({"status": "published", "ends_at": "2026-09-01T00:00:00+00:00"}, now) is True
    assert is_past_test({"status": "published", "ends_at": "2026-12-01T00:00:00+00:00"}, now) is False


def test_review_and_answer_flags():
    active = {"status": "published", "students_can_review_attempts": False, "students_can_see_answers": False}
    closed = {"status": "closed", "students_can_review_attempts": False, "students_can_see_answers": True}
    graded = {"status": "graded"}
    assert student_can_review_attempt(active, graded) is True
    assert student_can_review_attempt(closed, graded) is False
    closed["students_can_review_attempts"] = True
    assert student_can_review_attempt(closed, graded) is True
    assert student_can_see_answers(active, graded) is False
    active["students_can_see_answers"] = True
    assert student_can_see_answers(active, graded) is True
    assert student_can_see_answers(active, {"status": "in_progress"}) is False


def test_attempt_summary_counts():
    questions = [{"id": "q1"}, {"id": "q2"}, {"id": "q3"}]
    responses = [
        {"question_id": "q1", "is_correct": True},
        {"question_id": "q2", "is_correct": False},
    ]
    assert attempt_summary(questions, responses) == {
        "correct": 1,
        "wrong": 1,
        "unanswered": 1,
        "total": 3,
    }


def test_question_clone_payload_copies_key_and_stem():
    payload = question_clone_payload(
        {"question_text": "Stem", "correct_mcq_option": 2, "position": 1, "marks": 4},
        "test-1",
        "section-1",
    )
    assert payload["test_id"] == "test-1"
    assert payload["section_id"] == "section-1"
    assert payload["question_text"] == "Stem"
    assert payload["correct_mcq_option"] == 2
