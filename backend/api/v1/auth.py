"""
FastAPI dependency to require and validate Supabase user via JWT.
"""

import logging
from functools import lru_cache
from typing import Any

from fastapi import Header, HTTPException, Request, status
from supabase import AsyncClient, Client, acreate_client, create_client

from config.settings import SUPABASE_SERVICE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

# Global async client instance (singleton)
_async_supabase_client: AsyncClient | None = None


def _extract_bearer_token(authorization: str | None) -> str | None:
    """
    Extracts the bearer token from the Authorization header.
    """
    if not authorization:
        return None

    value = authorization.strip()
    if not value:
        return None

    if value.lower().startswith("bearer "):
        token = value[7:].strip()
        return token or None

    return value


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Returns a cached Supabase client instance (Responsible for the singletonness).
    """
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not set")
    if not SUPABASE_SERVICE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_KEY is not set")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def get_async_supabase_client() -> AsyncClient:
    """
    Returns an async Supabase client instance (singleton).
    This is more performant for async operations.
    """
    global _async_supabase_client
    if _async_supabase_client is None:
        if not SUPABASE_URL:
            raise RuntimeError("SUPABASE_URL is not set")
        if not SUPABASE_SERVICE_KEY:
            raise RuntimeError("SUPABASE_SERVICE_KEY is not set")
        _async_supabase_client = await acreate_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _async_supabase_client


def require_supabase_user(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> Any:
    """FastAPI dependency: validates request JWT via Supabase Auth.

    Expected header: `Authorization: Bearer <jwt>`.
    """

    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase = get_supabase_client()

    try:
        # Supabase SDK verifies the JWT server-side; no manual decoding here.
        response = supabase.auth.get_user(token)
    except Exception as exc:
        logger.warning(
            "Supabase auth verification failed",
            extra={
                "error": str(exc),
                "error_type": type(exc).__name__,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = getattr(response, "user", None)
    if user is None and isinstance(response, dict):
        user = response.get("user")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    request.state.supabase_user = user
    return user
