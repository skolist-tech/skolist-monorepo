"""Teacher CRUD tests for the assessment API.

Seed IDs must match skolist-db/python_seeds/data/data_assessment/uuids_and_meta.py.
"""

import pytest
from fastapi.testclient import TestClient
from supabase import Client

PREFIX = "/api/v1/assessment"
TEST_JEE_MAIN_1 = "00000000-0000-0000-0000-000000000110"


def _assessment(supabase: Client, table_name: str):
    return supabase.schema("assessment").table(table_name)


@pytest.mark.assessment
class TestAssessmentTeacherApi:
    def test_teacher_can_list_seed_tests(self, teacher_test_client: TestClient):
        response = teacher_test_client.get(f"{PREFIX}/tests")
        assert response.status_code == 200
        ids = {item["id"] for item in response.json()["tests"]}
        assert TEST_JEE_MAIN_1 in ids

    def test_teacher_can_read_full_paper_with_keys(self, teacher_test_client: TestClient):
        response = teacher_test_client.get(f"{PREFIX}/tests/{TEST_JEE_MAIN_1}")
        assert response.status_code == 200
        body = response.json()
        questions = [q for section in body["sections"] for q in section["questions"]]
        assert questions
        assert any(q.get("correct_mcq_option") is not None for q in questions)
        assert any(q.get("explanation") for q in questions)

    def test_teacher_crud_and_assign(
        self,
        teacher_test_client: TestClient,
        student_test_client: TestClient,
        student_auth_session: dict,
        service_supabase_client: Client,
    ):
        created = teacher_test_client.post(
            f"{PREFIX}/tests",
            json={
                "name": "API CRUD Test",
                "exam_type": "jee_main",
                "duration_minutes": 60,
                "default_correct_marks": 4,
                "default_negative_marks": 1,
            },
        )
        assert created.status_code == 201
        test_id = created.json()["id"]
        try:
            section = teacher_test_client.post(
                f"{PREFIX}/tests/{test_id}/sections",
                json={"name": "Physics", "position": 1},
            )
            assert section.status_code == 201
            section_id = section.json()["id"]

            question = teacher_test_client.post(
                f"{PREFIX}/sections/{section_id}/questions",
                json={
                    "question_text": "1 + 1 = ?",
                    "question_type": "mcq",
                    "position": 1,
                    "marks": 4,
                    "negative_marks": 1,
                    "option1": "1",
                    "option2": "2",
                    "option3": "3",
                    "option4": "4",
                    "correct_mcq_option": 2,
                    "explanation": "1+1=2",
                    "answer": "2",
                },
            )
            assert question.status_code == 201

            assigned = teacher_test_client.post(
                f"{PREFIX}/tests/{test_id}/assignees",
                json={"user_id": student_auth_session["user_id"]},
            )
            assert assigned.status_code == 201

            published = teacher_test_client.patch(
                f"{PREFIX}/tests/{test_id}",
                json={"status": "published"},
            )
            assert published.status_code == 200
            assert published.json()["status"] == "published"

            assigned_tests = student_test_client.get(f"{PREFIX}/assigned-tests")
            assert assigned_tests.status_code == 200
            ids = {item["id"] for item in assigned_tests.json()["tests"]}
            assert test_id in ids
        finally:
            _assessment(service_supabase_client, "tests").delete().eq("id", test_id).execute()
