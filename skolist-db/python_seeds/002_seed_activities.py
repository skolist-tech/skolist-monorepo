"""
Seed script to create a real auth user and patch the dummy activity.

This script:
1. Creates a real auth user via Supabase Admin API
2. Patches the seeded activity to use the real user's ID
3. Deletes the dummy user from public.users

Run this AFTER running `supabase db reset` to apply the SQL seeds.
"""

import os

from dotenv import load_dotenv

load_dotenv()
from supabase import create_client, Client

# Configuration - update these or use environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Hardcoded IDs from the SQL seed file (011_qgen_activities.sql)
DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001"
ACTIVITY_ID = "00000000-0000-0000-0000-000000000002"

# Real user to create
SEED_USER = {
    "email": "seed_activity_user@skolist.com",
    "password": "password123",
    "user_metadata": {"name": "Seed Activity User"},
}


def get_supabase_admin_client() -> Client:
    """Create a Supabase client with service role key for admin operations."""
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError(
            "SUPABASE_SERVICE_ROLE_KEY environment variable is required. "
            "You can find it by running: supabase status"
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def create_seed_user() -> str:
    """
    Create a real auth user via Supabase Admin API.
    Returns the user's UUID.
    Handles "already exists" case by fetching the existing user.
    """
    supabase = get_supabase_admin_client()
    email = SEED_USER["email"]

    print(f"Creating auth user: {email}...")

    try:
        # Use admin API to create user (bypasses email confirmation)
        response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": SEED_USER["password"],
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": SEED_USER.get("user_metadata", {}),
            }
        )
        user_id = response.user.id
        print(f"✓ Created user: {email} (ID: {user_id})")
        return user_id

    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            print(f"⚠ User already exists: {email}")
            print("  Fetching existing user ID...")

            # Fetch existing user by email
            try:
                # List users and find by email
                users_response = supabase.auth.admin.list_users()
                matching_users = [
                    u for u in users_response if u.email == email
                ]

                if matching_users:
                    user_id = matching_users[0].id
                    print(f"✓ Found existing user: {email} (ID: {user_id})")
                    return user_id
                else:
                    raise ValueError(
                        f"User {email} exists but could not be fetched"
                    )

            except Exception as fetch_error:
                print(f"✗ Failed to fetch existing user: {fetch_error}")
                raise
        else:
            print(f"✗ Failed to create user {email}: {error_msg}")
            raise


def patch_activity_user(real_user_id: str):
    """
    Patch the seeded activity to use the real user's ID.
    Delete the dummy user from public.users.
    """
    supabase = get_supabase_admin_client()

    print(f"\nPatching activity {ACTIVITY_ID} with user {real_user_id}...")

    try:
        # Update activity's user_id
        response = (
            supabase.table("activities")
            .update({"user_id": real_user_id})
            .eq("id", ACTIVITY_ID)
            .execute()
        )

        if response.data:
            print(f"✓ Updated activity user_id to: {real_user_id}")
        else:
            print(f"⚠ Activity {ACTIVITY_ID} not found or already updated")

    except Exception as e:
        print(f"✗ Failed to update activity: {e}")
        raise

    print(f"\nDeleting dummy user {DUMMY_USER_ID} from public.users...")

    try:
        # Delete dummy user from public.users
        response = (
            supabase.table("users")
            .delete()
            .eq("id", DUMMY_USER_ID)
            .execute()
        )

        if response.data:
            print(f"✓ Deleted dummy user: {DUMMY_USER_ID}")
        else:
            print(f"⚠ Dummy user {DUMMY_USER_ID} not found or already deleted")

    except Exception as e:
        print(f"✗ Failed to delete dummy user: {e}")
        # Non-fatal - the dummy user might have been cleaned up already
        print("  (This is non-fatal - continuing...)")


def seed_activity():
    """Main function to seed the activity with a real auth user."""
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print("=" * 60)

    # Step 1: Create real auth user (or get existing)
    real_user_id = create_seed_user()

    # Step 2: Patch activity and clean up dummy user
    patch_activity_user(real_user_id)

    print("\n" + "=" * 60)
    print("✓ Activity seeding complete!")
    print(f"\nYou can now log in with:")
    print(f"  Email: {SEED_USER['email']}")
    print(f"  Password: {SEED_USER['password']}")
    print(f"\nActivity ID: {ACTIVITY_ID}")
    print(f"User ID: {real_user_id}")


if __name__ == "__main__":
    seed_activity()
