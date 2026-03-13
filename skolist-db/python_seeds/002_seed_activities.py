"""
Seed script to create a real auth user and patch the dummy activity.

This script:
1. Creates a real auth user (teacher) via Supabase Admin API
2. Creates a student user in the same organization
3. Updates the created public.users rows to teacher/student (idempotent)
4. Patches the seeded activity to use the teacher user's ID (idempotent)
5. Deletes the dummy user from public.users (idempotent)

This script is idempotent - safe to run multiple times without `supabase db reset`.

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

# Real users to create
SEED_USER = {
    "email": "seed_activity_user@skolist.com",
    "password": "password123",
    "user_metadata": {"name": "Seed Activity User"},
}
SEED_USER_TYPE = "teacher"

STUDENT_USER = {
    "email": "seed_student_user@skolist.com",
    "password": "password123",
    "user_metadata": {"name": "Test Student User"},
}
STUDENT_USER_TYPE = "student"


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


def create_student_user() -> str:
    """
    Create a student auth user via Supabase Admin API.
    Returns the user's UUID.
    Handles "already exists" case by fetching the existing user.
    """
    supabase = get_supabase_admin_client()
    email = STUDENT_USER["email"]

    print(f"Creating student auth user: {email}...")

    try:
        # Use admin API to create user (bypasses email confirmation)
        response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": STUDENT_USER["password"],
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": STUDENT_USER.get("user_metadata", {}),
            }
        )
        user_id = response.user.id
        print(f"✓ Created student user: {email} (ID: {user_id})")
        return user_id

    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg:
            print(f"⚠ Student user already exists: {email}")
            print("  Fetching existing student user ID...")

            # Fetch existing user by email
            try:
                # List users and find by email
                users_response = supabase.auth.admin.list_users()
                matching_users = [
                    u for u in users_response if u.email == email
                ]

                if matching_users:
                    user_id = matching_users[0].id
                    print(f"✓ Found existing student user: {email} (ID: {user_id})")
                    return user_id
                else:
                    raise ValueError(
                        f"Student user {email} exists but could not be fetched"
                    )

            except Exception as fetch_error:
                print(f"✗ Failed to fetch existing student user: {fetch_error}")
                raise
        else:
            print(f"✗ Failed to create student user {email}: {error_msg}")
            raise


def ensure_seed_user_type(real_user_id: str):
    """Update the generated public.users row so the seed user can create tests."""
    supabase = get_supabase_admin_client()

    # First check if user_type is already correct
    try:
        response = (
            supabase.table("users")
            .select("user_type")
            .eq("id", real_user_id)
            .single()
            .execute()
        )
        
        if response.data and response.data["user_type"] == SEED_USER_TYPE:
            print(f"✓ User {real_user_id} already has user_type: {SEED_USER_TYPE}")
            return
    except Exception:
        pass  # User might not exist, continue with update

    print(f"\nSetting public.users.user_type to {SEED_USER_TYPE} for {real_user_id}...")

    try:
        response = (
            supabase.table("users")
            .update({"user_type": SEED_USER_TYPE})
            .eq("id", real_user_id)
            .execute()
        )

        if response.data:
            print(f"✓ Updated user_type to: {SEED_USER_TYPE}")
        else:
            print(f"⚠ User {real_user_id} not found in public.users")

    except Exception as e:
        print(f"✗ Failed to update user_type: {e}")
        raise


def ensure_student_user_setup(student_user_id: str, teacher_org_id: str):
    """Set student user_type and assign to same org as teacher."""
    supabase = get_supabase_admin_client()

    # First check if student is already configured correctly
    try:
        response = (
            supabase.table("users")
            .select("user_type, org_id")
            .eq("id", student_user_id)
            .single()
            .execute()
        )
        
        if response.data:
            current_user_type = response.data["user_type"]
            current_org_id = response.data["org_id"]
            
            if current_user_type == STUDENT_USER_TYPE and current_org_id == teacher_org_id:
                print(f"✓ Student user {student_user_id} already configured correctly")
                return
    except Exception:
        pass  # Continue with update

    print(f"\nSetting up student user {student_user_id} in org {teacher_org_id}...")

    try:
        response = (
            supabase.table("users")
            .update({
                "user_type": STUDENT_USER_TYPE,
                "org_id": teacher_org_id
            })
            .eq("id", student_user_id)
            .execute()
        )

        if response.data:
            print(f"✓ Updated student user_type to {STUDENT_USER_TYPE} and org_id to {teacher_org_id}")
        else:
            print(f"⚠ Student user {student_user_id} not found in public.users")

    except Exception as e:
        print(f"✗ Failed to update student user: {e}")
        raise


def patch_activity_user(real_user_id: str):
    """
    Patch the seeded activity to use the real user's ID.
    Delete the dummy user from public.users.
    """
    supabase = get_supabase_admin_client()

    # First check if activity is already using the correct user_id
    try:
        activity_response = (
            supabase.table("activities")
            .select("user_id")
            .eq("id", ACTIVITY_ID)
            .single()
            .execute()
        )
        
        if activity_response.data and activity_response.data["user_id"] == real_user_id:
            print(f"✓ Activity {ACTIVITY_ID} already uses correct user_id: {real_user_id}")
        else:
            print(f"\nPatching activity {ACTIVITY_ID} with user {real_user_id}...")
            
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
        print(f"✗ Failed to check/update activity: {e}")
        raise

    # Check if dummy user still exists before trying to delete
    try:
        dummy_check = (
            supabase.table("users")
            .select("id")
            .eq("id", DUMMY_USER_ID)
            .execute()
        )
        
        if dummy_check.data:
            print(f"\nDeleting dummy user {DUMMY_USER_ID} from public.users...")
            
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
                print(f"⚠ Dummy user {DUMMY_USER_ID} could not be deleted")
        else:
            print(f"✓ Dummy user {DUMMY_USER_ID} already deleted")

    except Exception as e:
        print(f"✗ Failed to delete dummy user: {e}")
        # Non-fatal - the dummy user might have been cleaned up already
        print("  (This is non-fatal - continuing...)")


def seed_activity():
    """Main function to seed the activity with a real auth user."""
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print("=" * 60)

    # Step 1: Create real auth users (or get existing)
    teacher_user_id = create_seed_user()
    student_user_id = create_student_user()

    # Step 2: Ensure the teacher user can create tests
    ensure_seed_user_type(teacher_user_id)

    # Step 3: Get teacher's org_id for student setup
    supabase = get_supabase_admin_client()
    teacher_response = (
        supabase.table("users")
        .select("org_id")
        .eq("id", teacher_user_id)
        .single()
        .execute()
    )
    
    teacher_org_id = teacher_response.data["org_id"] if teacher_response.data else None
    if not teacher_org_id:
        print("⚠ Teacher has no org_id, student will also have no org (may not be able to access tests)")
        teacher_org_id = None

    # Step 4: Setup student user in same org
    ensure_student_user_setup(student_user_id, teacher_org_id)

    # Step 5: Patch activity and clean up dummy user
    patch_activity_user(teacher_user_id)

    print("\n" + "=" * 60)
    print("✓ Activity seeding complete!")
    print("🔄 This script is idempotent - safe to run multiple times")
    print(f"\nTeacher login:")
    print(f"  Email: {SEED_USER['email']}")
    print(f"  Password: {SEED_USER['password']}")
    print(f"\nStudent login:")
    print(f"  Email: {STUDENT_USER['email']}")
    print(f"  Password: {STUDENT_USER['password']}")
    print(f"\nActivity ID: {ACTIVITY_ID}")
    print(f"Teacher ID: {teacher_user_id}")
    print(f"Student ID: {student_user_id}")
    if teacher_org_id:
        print(f"Org ID: {teacher_org_id}")


if __name__ == "__main__":
    seed_activity()
