"""Shared helpers for testing platform routes."""

from fastapi import HTTPException, Request, status


def get_request_user_id(request: Request) -> str:
    """Extract authenticated user id from request state."""
    user = getattr(request.state, "supabase_user", None)
    user_id = getattr(user, "id", None)
    if isinstance(user, dict):
        user_id = user_id or user.get("id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )

    return str(user_id)
