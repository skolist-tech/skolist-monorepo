"""Assessment email + organisation-code sign-in."""

import pytest
from fastapi.testclient import TestClient

from tests.integration.conftest import (
    ASSESSMENT_PASSWORD,
    ASSESSMENT_STUDENT_EMAIL,
    ASSESSMENT_TEACHER_EMAIL,
)

PREFIX = "/api/v1/assessment"
SEED_ORG_CODE = "SEEDOR"


@pytest.mark.assessment
class TestAssessmentLogin:
    def test_teacher_can_sign_in_with_org_code(self, app):
        response = TestClient(app).post(
            f"{PREFIX}/auth/login",
            json={
                "email": ASSESSMENT_TEACHER_EMAIL,
                "password": ASSESSMENT_PASSWORD,
                "organisation_code": SEED_ORG_CODE,
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body.get("access_token")
        assert body.get("refresh_token")

    def test_student_can_sign_in_with_org_code(self, app):
        response = TestClient(app).post(
            f"{PREFIX}/auth/login",
            json={
                "email": ASSESSMENT_STUDENT_EMAIL,
                "password": ASSESSMENT_PASSWORD,
                "organisation_code": "seedor",
            },
        )
        assert response.status_code == 200
        assert response.json().get("access_token")

    def test_wrong_password_is_rejected(self, app):
        response = TestClient(app).post(
            f"{PREFIX}/auth/login",
            json={
                "email": ASSESSMENT_TEACHER_EMAIL,
                "password": "wrong-password-xxxxx",
                "organisation_code": SEED_ORG_CODE,
            },
        )
        assert response.status_code == 401

    def test_wrong_org_code_is_rejected(self, app):
        response = TestClient(app).post(
            f"{PREFIX}/auth/login",
            json={
                "email": ASSESSMENT_TEACHER_EMAIL,
                "password": ASSESSMENT_PASSWORD,
                "organisation_code": "ZZZZZZ",
            },
        )
        assert response.status_code == 401

    def test_missing_org_code_is_rejected(self, app):
        response = TestClient(app).post(
            f"{PREFIX}/auth/login",
            json={
                "email": ASSESSMENT_TEACHER_EMAIL,
                "password": ASSESSMENT_PASSWORD,
            },
        )
        assert response.status_code == 422
