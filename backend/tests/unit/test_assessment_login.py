from unittest.mock import MagicMock, patch

from api.v1.assessment.login import (
    ORG_CODE_PATTERN,
    normalize_organisation_code,
    sign_in_with_password,
)


def test_normalizes_organisation_code_to_uppercase():
    assert normalize_organisation_code(" seedor ") == "SEEDOR"
    assert ORG_CODE_PATTERN.fullmatch("SEEDOR")
    assert not ORG_CODE_PATTERN.fullmatch("SEED1")
    assert not ORG_CODE_PATTERN.fullmatch("SEED")


def test_password_sign_in_uses_a_throwaway_client():
    """sign_in must not reuse the shared service-role client."""
    fake_client = MagicMock()
    with patch("api.v1.assessment.login.create_client", return_value=fake_client) as create:
        sign_in_with_password("teacher1@seed.skolist.com", "password123")
    create.assert_called_once()
    fake_client.auth.sign_in_with_password.assert_called_once_with(
        {"email": "teacher1@seed.skolist.com", "password": "password123"}
    )
