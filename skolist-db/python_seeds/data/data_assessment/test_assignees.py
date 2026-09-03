from itertools import product

from .uuids_and_meta import (
    ASSIGNED_TEST_IDS,
    ASSIGNEE_ID_START,
    CREATED_AT,
    STUDENT_KEYS,
    seed_uuid,
)


def _assignees() -> list[dict]:
    rows = []
    n = ASSIGNEE_ID_START
    for test_id, student_key in product(ASSIGNED_TEST_IDS, STUDENT_KEYS):
        rows.append(
            {
                "id": seed_uuid(n),
                "test_id": test_id,
                "user_id": None,
                "student_key": student_key,
                "created_at": CREATED_AT,
            }
        )
        n += 1
    return rows


TEST_ASSIGNEES = _assignees()
