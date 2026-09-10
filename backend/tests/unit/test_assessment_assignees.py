"""Unit tests for assignee profile enrichment and student search."""

from api.v1.assessment.db import enrich_assignee_row, student_matches_query


def test_enrich_assignee_row_adds_user_profile():
    row = enrich_assignee_row(
        {"id": "asg-1", "test_id": "t-1", "user_id": "u-1"},
        {
            "id": "u-1",
            "name": "Student 1",
            "email": "student1@seed.skolist.com",
            "avatar_url": "https://example.com/a.png",
        },
    )
    assert row["user_id"] == "u-1"
    assert row["name"] == "Student 1"
    assert row["email"] == "student1@seed.skolist.com"
    assert row["avatar_url"] == "https://example.com/a.png"


def test_enrich_assignee_row_without_profile():
    row = enrich_assignee_row({"id": "asg-1", "user_id": "u-1"}, None)
    assert row["name"] is None
    assert row["email"] is None
    assert row["avatar_url"] is None


def test_student_query_matches_name_or_email():
    student = {"name": "Student 1", "email": "student1@seed.skolist.com"}
    assert student_matches_query(student, None)
    assert student_matches_query(student, "  ")
    assert student_matches_query(student, "student 1")
    assert student_matches_query(student, "SEED")
    assert not student_matches_query(student, "teacher")
