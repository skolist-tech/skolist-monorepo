"""Auth users created by 002_seed_users.py.

Emails, password, and org membership live here. Other seed modules import
these dicts instead of repeating credentials.
"""

from ._001_data_orgs import SEED_ORG

DEFAULT_PASSWORD = "password123"
SEED_ORG_ID = SEED_ORG["id"]


def _auth_user(*, email: str, name: str, user_type: str | None = None) -> dict:
    row = {
        "email": email,
        "password": DEFAULT_PASSWORD,
        "user_metadata": {"name": name},
        "org_id": SEED_ORG_ID,
    }
    if user_type:
        row["user_type"] = user_type
    return row


# Used by backend qgen / bank integration tests (private_user).
TEST_USER = _auth_user(email="test@example.com", name="Test User")

TEACHER_1 = _auth_user(
    email="teacher1@seed.skolist.com",
    name="Teacher 1",
    user_type="teacher",
)
TEACHER_2 = _auth_user(
    email="teacher2@seed.skolist.com",
    name="Teacher 2",
    user_type="teacher",
)
STUDENT_1 = _auth_user(
    email="student1@seed.skolist.com",
    name="Student 1",
    user_type="student",
)
STUDENT_2 = _auth_user(
    email="student2@seed.skolist.com",
    name="Student 2",
    user_type="student",
)
STUDENT_3 = _auth_user(
    email="student3@seed.skolist.com",
    name="Student 3",
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
