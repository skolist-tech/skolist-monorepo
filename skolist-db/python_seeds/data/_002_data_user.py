"""Auth users created by _002_seed_users.py.

Emails, password, and org membership live here. Other seed modules import
these dicts instead of repeating credentials.

Avatars are generated as portrait SVGs (not name initials) and uploaded
to the public `seed_assets` bucket by `_002_seed_users.py`.
"""

from ._001_data_orgs import SEED_ORG
from .photos import USER_AVATAR_COLORS, avatar_object_path

DEFAULT_PASSWORD = "password123"
SEED_ORG_ID = SEED_ORG["id"]


def _seed_user_uuid(n: int) -> str:
    if not 1 <= n <= 99:
        raise ValueError(f"seed user uuid out of range: {n}")
    return f"00000000-0000-0000-0000-{n:012d}"


TEST_USER_ID = _seed_user_uuid(1)
TEACHER_1_ID = _seed_user_uuid(2)
TEACHER_2_ID = _seed_user_uuid(3)
STUDENT_1_ID = _seed_user_uuid(4)
STUDENT_2_ID = _seed_user_uuid(5)
STUDENT_3_ID = _seed_user_uuid(6)


def _auth_user(
    *, email: str, name: str, user_id: str, user_type: str | None = None
) -> dict:
    row = {
        "id": user_id,
        "email": email,
        "password": DEFAULT_PASSWORD,
        "user_metadata": {"name": name},
        "org_id": SEED_ORG_ID,
        "avatar_path": avatar_object_path(email),
        "avatar_color": USER_AVATAR_COLORS.get(email, "#475569"),
    }
    if user_type:
        row["user_type"] = user_type
    return row


# Used by backend qgen / bank integration tests (private_user).
TEST_USER = _auth_user(
    email="test@example.com", name="Test User", user_id=TEST_USER_ID
)

TEACHER_1 = _auth_user(
    email="teacher1@seed.skolist.com",
    name="Teacher 1",
    user_id=TEACHER_1_ID,
    user_type="teacher",
)
TEACHER_2 = _auth_user(
    email="teacher2@seed.skolist.com",
    name="Teacher 2",
    user_id=TEACHER_2_ID,
    user_type="teacher",
)
STUDENT_1 = _auth_user(
    email="student1@seed.skolist.com",
    name="Student 1",
    user_id=STUDENT_1_ID,
    user_type="student",
)
STUDENT_2 = _auth_user(
    email="student2@seed.skolist.com",
    name="Student 2",
    user_id=STUDENT_2_ID,
    user_type="student",
)
STUDENT_3 = _auth_user(
    email="student3@seed.skolist.com",
    name="Student 3",
    user_id=STUDENT_3_ID,
    user_type="student",
)

TEACHERS = {
    "teacher1": TEACHER_1,
    "teacher2": TEACHER_2,
}
STUDENTS = {
    "student1": STUDENT_1,
    "student2": STUDENT_2,
    "student3": STUDENT_3,
}

SEED_USERS = [
    TEST_USER,
    TEACHER_1,
    TEACHER_2,
    STUDENT_1,
    STUDENT_2,
    STUDENT_3,
]
