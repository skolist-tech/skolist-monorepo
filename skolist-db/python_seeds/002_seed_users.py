"""
Seed dummy auth users from python_seeds/data/_002_data_user.py.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python_seeds.client import SUPABASE_URL, create_or_get_auth_user, get_supabase_admin_client
from python_seeds.data import user as user_data


def seed_users():
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print(f"Seeding {len(user_data.SEED_USERS)} users...\n")

    for user in user_data.SEED_USERS:
        user_id = create_or_get_auth_user(supabase, user)
        updates = {}
        if user.get("user_type"):
            updates["user_type"] = user["user_type"]
        if user.get("org_id"):
            updates["org_id"] = user["org_id"]
        if updates:
            supabase.table("users").update(updates).eq("id", user_id).execute()
            print(f"  Updated {user['email']}: {updates}")

    print("\nSeeding complete!")
    print(f"Shared password (from _002_data_user.py): {user_data.DEFAULT_PASSWORD}")
    for user in user_data.SEED_USERS:
        print(f"  {user['email']}")


if __name__ == "__main__":
    seed_users()
