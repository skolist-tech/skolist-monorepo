from .uuids_and_meta import STUDENT_GROUP_MEMBER_S3, STUDENT_GROUP_SEED

STUDENT_GROUPS = [
    {
        "id": STUDENT_GROUP_SEED,
        "org_id": None,
        "name": "Seed Group",
    }
]

STUDENT_GROUP_MEMBERS = [
    {
        "id": STUDENT_GROUP_MEMBER_S3,
        "group_id": STUDENT_GROUP_SEED,
        "user_id": None,
        "student_key": "student3",
    }
]
