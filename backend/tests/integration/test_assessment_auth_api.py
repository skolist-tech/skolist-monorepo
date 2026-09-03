"""Auth and key-leakage tests for the assessment API.

Seed IDs must match skolist-db/python_seeds/data/data_assessment/uuids_and_meta.py.
"""

import pytest
from fastapi.testclient import TestClient

from api.v1.assessment.models import QUESTION_SECRET_FIELDS

PREFIX = "/api/v1/assessment"
TEST_JEE_MAIN_1 = "00000000-0000-0000-0000-000000000110"
TEST_JEE_MAIN_2 = "00000000-0000-0000-0000-000000000111"
TEST_NEET_OPEN = "00000000-0000-0000-0000-000000000112"
TEST_NEET_LIVE = "00000000-0000-0000-0000-000000000113"
TEST_ADV_DRAFT = "00000000-0000-0000-0000-000000000114"
TEST_ADV_CLOSED = "00000000-0000-0000-0000-000000000115"
ATTEMPT_IN_PROGRESS = "00000000-0000-0000-0000-000000000200"
ATTEMPT_GRADED = "00000000-0000-0000-0000-000000000203"


def _anon_client(app) -> TestClient:
    return TestClient(app)


def _client_with_token(app, token: str) -> TestClient:
    client = TestClient(app)
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.mark.assessment
class TestAssessmentAuth:
    def test_me_requires_auth(self, app):
        response = _anon_client(app).get(f"{PREFIX}/me")
        assert response.status_code == 401

    def test_me_returns_actor(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/me")
        assert response.status_code == 200
        body = response.json()
        assert body["role"] == "student"
        assert body["user_type"] == "student"

    def test_private_user_cannot_list_teacher_tests(self, app, auth_session: dict):
        response = _client_with_token(app, auth_session["access_token"]).get(f"{PREFIX}/tests")
        assert response.status_code == 403

    def test_private_user_cannot_list_assigned_tests(self, app, auth_session: dict):
        response = _client_with_token(app, auth_session["access_token"]).get(
            f"{PREFIX}/assigned-tests"
        )
        assert response.status_code == 403

    def test_student_cannot_read_teacher_test_detail(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/tests/{TEST_JEE_MAIN_1}")
        assert response.status_code == 403


@pytest.mark.assessment
class TestAssessmentKeyLeakage:
    def test_paper_omits_answer_keys(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/attempts/{ATTEMPT_IN_PROGRESS}/paper")
        assert response.status_code == 200
        body = response.json()
        questions = [question for section in body["sections"] for question in section["questions"]]
        assert questions
        for question in questions:
            assert QUESTION_SECRET_FIELDS.isdisjoint(question.keys())
            for field in QUESTION_SECRET_FIELDS:
                assert field not in question

    def test_in_progress_attempt_hides_scores(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/attempts/{ATTEMPT_IN_PROGRESS}")
        assert response.status_code == 200
        body = response.json()
        assert body["attempt"]["total_marks_obtained"] is None
        for row in body["responses"]:
            assert "is_correct" not in row
            assert "marks_obtained" not in row

    def test_draft_and_closed_are_hidden_from_students(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/assigned-tests")
        assert response.status_code == 200
        ids = {item["id"] for item in response.json()["tests"]}
        assert TEST_ADV_DRAFT not in ids
        assert TEST_ADV_CLOSED not in ids
        assert TEST_JEE_MAIN_1 in ids
        assert TEST_JEE_MAIN_2 in ids
        assert TEST_NEET_OPEN in ids
        assert TEST_NEET_LIVE in ids
