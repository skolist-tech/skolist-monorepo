"""Student attempt lifecycle tests for the assessment API.

Seed IDs must match skolist-db/python_seeds/data/data_assessment/uuids_and_meta.py.
"""

import pytest
from fastapi.testclient import TestClient
from supabase import Client

PREFIX = "/api/v1/assessment"
TEST_JEE_MAIN_1 = "00000000-0000-0000-0000-000000000110"
TEST_ADV_DRAFT = "00000000-0000-0000-0000-000000000114"
ATTEMPT_GRADED = "00000000-0000-0000-0000-000000000203"
ATTEMPT_IN_PROGRESS = "00000000-0000-0000-0000-000000000200"
Q_NEET_LIVE_PHY = "00000000-0000-0000-0000-000000000151"


def _assessment(supabase: Client, table_name: str):
    return supabase.schema("assessment").table(table_name)


@pytest.mark.assessment
class TestAssessmentStudentApi:
    def test_unassigned_student_cannot_start_draft(self, student_test_client: TestClient):
        response = student_test_client.post(f"{PREFIX}/tests/{TEST_ADV_DRAFT}/attempts")
        assert response.status_code == 403

    def test_in_progress_result_forbidden(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/attempts/{ATTEMPT_IN_PROGRESS}/result")
        assert response.status_code == 403

    def test_graded_result_available(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/attempts/{ATTEMPT_GRADED}/result")
        assert response.status_code == 200
        body = response.json()
        assert body["attempt"]["status"] == "graded"
        assert body["attempt"]["total_marks_obtained"] is not None

    def test_save_then_conflict_after_seed_in_progress(self, student_test_client: TestClient):
        save = student_test_client.put(
            f"{PREFIX}/attempts/{ATTEMPT_IN_PROGRESS}/responses/{Q_NEET_LIVE_PHY}",
            json={"selected_mcq_option": 3},
        )
        assert save.status_code == 200
        assert "is_correct" not in save.json()

    def test_start_save_submit_and_lock(
        self,
        teacher_test_client: TestClient,
        student_test_client: TestClient,
        student_auth_session: dict,
        service_supabase_client: Client,
    ):
        created = teacher_test_client.post(
            f"{PREFIX}/tests",
            json={
                "name": "Student lifecycle test",
                "exam_type": "jee_main",
                "duration_minutes": 30,
            },
        )
        assert created.status_code == 201
        test_id = created.json()["id"]
        try:
            section = teacher_test_client.post(
                f"{PREFIX}/tests/{test_id}/sections",
                json={"name": "Math", "position": 1},
            )
            section_id = section.json()["id"]
            question = teacher_test_client.post(
                f"{PREFIX}/sections/{section_id}/questions",
                json={
                    "question_text": "3 + 1 = ?",
                    "question_type": "mcq",
                    "position": 1,
                    "marks": 4,
                    "negative_marks": 1,
                    "option1": "3",
                    "option2": "4",
                    "option3": "5",
                    "option4": "6",
                    "correct_mcq_option": 2,
                },
            )
            question_id = question.json()["id"]
            teacher_test_client.post(
                f"{PREFIX}/tests/{test_id}/assignees",
                json={"user_id": student_auth_session["user_id"]},
            )
            teacher_test_client.patch(f"{PREFIX}/tests/{test_id}", json={"status": "published"})

            started = student_test_client.post(f"{PREFIX}/tests/{test_id}/attempts")
            assert started.status_code == 200
            attempt_id = started.json()["id"]

            saved = student_test_client.put(
                f"{PREFIX}/attempts/{attempt_id}/responses/{question_id}",
                json={"selected_mcq_option": 2},
            )
            assert saved.status_code == 200

            submitted = student_test_client.post(f"{PREFIX}/attempts/{attempt_id}/submit")
            assert submitted.status_code == 200
            assert submitted.json()["attempt"]["status"] == "graded"
            assert float(submitted.json()["attempt"]["total_marks_obtained"]) == 4

            locked = student_test_client.put(
                f"{PREFIX}/attempts/{attempt_id}/responses/{question_id}",
                json={"selected_mcq_option": 1},
            )
            assert locked.status_code == 409
        finally:
            _assessment(service_supabase_client, "tests").delete().eq("id", test_id).execute()

    def test_seed_assigned_main_is_visible(self, student_test_client: TestClient):
        response = student_test_client.get(f"{PREFIX}/assigned-tests")
        assert response.status_code == 200
        ids = {item["id"] for item in response.json()["tests"]}
        assert TEST_JEE_MAIN_1 in ids
