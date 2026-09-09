"""
Seed dummy auth users from python_seeds/data/_002_data_user.py.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python_seeds.client import (
    SUPABASE_URL,
    create_or_get_auth_user,
    get_supabase_admin_client,
    upload_public_bytes,
)
from python_seeds.data import user as user_data
from python_seeds.data.photos import SEED_ASSETS_BUCKET, avatar_svg


def seed_users():
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print(f"Seeding {len(user_data.SEED_USERS)} users...\n")

    for user in user_data.SEED_USERS:
        name = (user.get("user_metadata") or {}).get("name") or user["email"]
        avatar_url = (
            upload_public_bytes(
                supabase,
                SEED_ASSETS_BUCKET,
                user["avatar_path"],
                avatar_svg(name, user["avatar_color"], email=user["email"]),
            )
            + "?v=portrait"
        )
        payload = {
            **user,
            "user_metadata": {
                **(user.get("user_metadata") or {}),
                "avatar_url": avatar_url,
            },
        }
        user_id = create_or_get_auth_user(supabase, payload)
        updates = {"avatar_url": avatar_url}
        if user.get("user_type"):
            updates["user_type"] = user["user_type"]
        if user.get("org_id"):
            updates["org_id"] = user["org_id"]
        supabase.table("users").update(updates).eq("id", user_id).execute()
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": payload["user_metadata"]},
        )
        print(f"  Updated {user['email']}: {updates}")

    print("\nSeeding complete!")
    print(f"Shared password (from _002_data_user.py): {user_data.DEFAULT_PASSWORD}")
    for user in user_data.SEED_USERS:
        print(f"  {user['email']}")


if __name__ == "__main__":
    seed_users()
