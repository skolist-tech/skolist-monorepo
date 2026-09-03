"""Shared Supabase admin client for python_seeds scripts."""

import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")


def get_supabase_admin_client() -> Client:
    """Create a Supabase client with the service role key."""
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError(
            "SUPABASE_SERVICE_ROLE_KEY environment variable is required. "
            "You can find it by running: supabase status"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def create_or_get_auth_user(supabase: Client, user_data: dict) -> str:
    """
    Create an auth user (auto-confirmed) or return the existing public.users id.
    """
    email = user_data["email"]

    existing = (
        supabase.table("users")
        .select("id")
        .eq("email", email)
        .execute()
    )
    if existing.data:
        user_id = existing.data[0]["id"]
        print(f"⚠ User already exists: {email} (ID: {user_id})")
        return user_id

    try:
        response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": user_data["password"],
                "email_confirm": True,
                "user_metadata": user_data.get("user_metadata", {}),
            }
        )
        user_id = response.user.id
        print(f"✓ Created user: {email} (ID: {user_id})")
        return user_id
    except Exception as e:
        error_msg = str(e)
        if "already been registered" not in error_msg and "already exists" not in error_msg:
            print(f"✗ Failed to create user {email}: {error_msg}")
            raise

        print(f"⚠ Auth user already exists: {email}")
        retry = (
            supabase.table("users")
            .select("id")
            .eq("email", email)
            .execute()
        )
        if retry.data:
            user_id = retry.data[0]["id"]
            print(f"✓ Found existing user: {email} (ID: {user_id})")
            return user_id

        raise ValueError(f"User {email} exists in auth but not in public.users") from e


def get_public_user(supabase: Client, user_id: str) -> dict:
    response = (
        supabase.table("users")
        .select("id, email, user_type, org_id")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return response.data


def require_public_user(supabase: Client, email: str, role: str) -> dict:
    response = (
        supabase.table("users")
        .select("id, email, user_type, org_id")
        .eq("email", email)
        .execute()
    )
    if not response.data:
        raise RuntimeError(
            f"{role} {email} not found in public.users. "
            "Run 001_seed_orgs.py and 002_seed_users.py first."
        )
    return response.data[0]
