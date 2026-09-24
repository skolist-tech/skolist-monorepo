"""Public assessment sign-in: email, password, and organisation code."""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

from api.v1.auth import get_supabase_client
from config.settings import SUPABASE_SERVICE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

INVALID_CREDENTIALS = "Invalid email, password, or organisation code"
ORG_CODE_PATTERN = re.compile(r"^[A-Z]{6}$")

router = APIRouter()


class AssessmentLoginRequest(BaseModel):
    """Email, password, and 6-letter organisation code."""

    email: str
    password: str = Field(min_length=1)
    organisation_code: str

    @field_validator("email")
    @classmethod
    def email_required(cls, value: str) -> str:
        """Reject a blank email after trimming."""
        email = value.strip()
        if not email:
            raise ValueError("Email is required")
        return email

    @field_validator("organisation_code")
    @classmethod
    def organisation_code_is_six_letters(cls, value: str) -> str:
        """Normalise and require a 6-letter organisation code."""
        code = normalize_organisation_code(value)
        if not ORG_CODE_PATTERN.fullmatch(code):
            raise ValueError("Organisation code must be 6 letters")
        return code


class AssessmentLoginResponse(BaseModel):
    """Supabase session tokens after a successful organisation-scoped sign-in."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    expires_at: int | None = None


def normalize_organisation_code(value: str) -> str:
    """Trim and uppercase an organisation code."""
    return (value or "").strip().upper()


def _session_value(session: object, key: str):
    if session is None:
        return None
    if isinstance(session, dict):
        return session.get(key)
    return getattr(session, key, None)


def sign_in_with_password(email: str, password: str):
    """Password-check on a throwaway client.

    Do not call sign_in on the shared service-role client: that binds the
    user JWT onto every later PostgREST call, and assessment tables have RLS
    with no policies.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Supabase is not configured")
    auth_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return auth_client.auth.sign_in_with_password({"email": email, "password": password})


@router.post("/auth/login", response_model=AssessmentLoginResponse)
def login_with_organisation(
    body: AssessmentLoginRequest,
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    """Sign in only when email, password, and organisation code all match."""
    org_rows = supabase.table("orgs").select("id").eq("organisation_code", body.organisation_code).limit(1).execute()
    org = (org_rows.data or [None])[0]
    if not org:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

    try:
        auth_response = sign_in_with_password(body.email, body.password)
    except Exception:
        logger.info("Assessment login rejected")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
        ) from None

    session = getattr(auth_response, "session", None)
    user = getattr(auth_response, "user", None)
    access_token = _session_value(session, "access_token")
    refresh_token = _session_value(session, "refresh_token")
    user_id = getattr(user, "id", None) if user is not None else None
    if isinstance(user, dict):
        user_id = user_id or user.get("id")

    if not access_token or not refresh_token or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

    profile_rows = supabase.table("users").select("org_id").eq("id", str(user_id)).limit(1).execute()
    profile = (profile_rows.data or [None])[0]
    if not profile or str(profile.get("org_id") or "") != str(org["id"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=INVALID_CREDENTIALS)

    expires_in = _session_value(session, "expires_in")
    expires_at = _session_value(session, "expires_at")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": _session_value(session, "token_type") or "bearer",
        "expires_in": int(expires_in) if expires_in is not None else None,
        "expires_at": int(expires_at) if expires_at is not None else None,
    }
