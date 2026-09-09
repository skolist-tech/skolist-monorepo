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


def ensure_public_bucket(supabase: Client, bucket_id: str) -> None:
    """Create a public storage bucket if it is not already present."""
    try:
        buckets = supabase.storage.list_buckets()
    except Exception:
        buckets = []
    existing = set()
    for bucket in buckets:
        name = getattr(bucket, "name", None) or getattr(bucket, "id", None)
        if name is None and isinstance(bucket, dict):
            name = bucket.get("name") or bucket.get("id")
        if name:
            existing.add(name)
    if bucket_id in existing:
        return
    try:
        supabase.storage.create_bucket(
            bucket_id,
            options={
                "public": True,
                "file_size_limit": 2 * 1024 * 1024,
                "allowed_mime_types": [
                    "image/png",
                    "image/jpeg",
                    "image/svg+xml",
                    "image/webp",
                ],
            },
        )
        print(f"✓ Created public storage bucket: {bucket_id}")
    except Exception as exc:
        message = str(exc).lower()
        if "already exists" not in message and "duplicate" not in message:
            raise


def upload_public_bytes(
    supabase: Client,
    bucket_id: str,
    object_path: str,
    content: bytes,
    content_type: str = "image/svg+xml",
) -> str:
    """Upsert a public object and return its public URL."""
    ensure_public_bucket(supabase, bucket_id)
    bucket = supabase.storage.from_(bucket_id)
    options = {"content-type": content_type, "upsert": "true"}
    try:
        bucket.upload(object_path, content, file_options=options)
    except Exception as exc:
        message = str(exc).lower()
        if "already exists" not in message and "duplicate" not in message:
            raise
        bucket.update(object_path, content, file_options=options)
    url = bucket.get_public_url(object_path)
    return url.split("?", 1)[0]


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
            "Run _001_seed_orgs.py and _002_seed_users.py first."
        )
    return response.data[0]
