"""
Insert assessment tests, sections, questions, attempts, and responses.

Org, teachers, and students are imported from _001_data_orgs / _002_data_user.
Idempotent. Run after 001_seed_orgs.py and 002_seed_users.py.
"""

import copy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python_seeds.client import SUPABASE_URL, get_supabase_admin_client, require_public_user
from python_seeds.data import assessment as data
from python_seeds.data import orgs as org_data
from python_seeds.data import user as user_data

SEED_KEYS = ("created_by_key", "student_key")


def assessment_table(supabase, table_name: str):
    try:
        return supabase.schema("assessment").table(table_name)
    except Exception as e:
        raise RuntimeError(
            "Could not query the assessment schema. Expose it in "
            "supabase/config.toml (api.schemas) and restart Supabase "
            "(supabase stop && supabase start)."
        ) from e


def resolve_responses_table(supabase) -> str:
    for name in ("responses", "answers"):
        try:
            assessment_table(supabase, name).select("id").limit(1).execute()
            return name
        except Exception:
            continue
    raise RuntimeError(
        "Neither assessment.responses nor assessment.answers is reachable."
    )


def strip_seed_keys(row: dict) -> dict:
    return {key: value for key, value in row.items() if key not in SEED_KEYS}


def upsert_rows(supabase, table_name: str, rows: list[dict], on_conflict: str = "id"):
    if not rows:
        return
    payload = [strip_seed_keys(row) for row in rows]
    response = (
        assessment_table(supabase, table_name)
        .upsert(payload, on_conflict=on_conflict)
        .execute()
    )
    print(f"✓ Upserted {len(response.data or payload)} row(s) into assessment.{table_name}")
    return response.data


def upsert_questions(supabase, rows: list[dict]):
    try:
        upsert_rows(supabase, "questions", rows)
    except Exception as e:
        if "answer" not in str(e).lower():
            raise
        stripped = [{k: v for k, v in row.items() if k != "answer"} for row in rows]
        print("⚠ questions.answer column missing; retrying without it")
        upsert_rows(supabase, "questions", stripped)


def seed_assessment():
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print("=" * 60)

    org_id = org_data.SEED_ORG["id"]
    teachers = {
        key: require_public_user(supabase, spec["email"], f"Teacher {key}")
        for key, spec in user_data.TEACHERS.items()
    }
    students = {
        key: require_public_user(supabase, spec["email"], f"Student {key}")
        for key, spec in user_data.STUDENTS.items()
    }

    tests = copy.deepcopy(data.TESTS)
    for test in tests:
        teacher = teachers[test["created_by_key"]]
        test["created_by"] = teacher["id"]
        test["org_id"] = org_id

    attempts = copy.deepcopy(data.ATTEMPTS)
    for attempt in attempts:
        attempt["student_id"] = students[attempt["student_key"]]["id"]

    assignees = copy.deepcopy(data.TEST_ASSIGNEES)
    for assignee in assignees:
        assignee["user_id"] = students[assignee["student_key"]]["id"]

    questions = copy.deepcopy(data.QUESTIONS)
    parents = [q for q in questions if not q.get("parent_question_id")]
    children = [q for q in questions if q.get("parent_question_id")]

    upsert_rows(supabase, "tests", tests)
    upsert_rows(supabase, "test_assignees", assignees)
    upsert_rows(supabase, "sections", copy.deepcopy(data.SECTIONS))
    upsert_questions(supabase, parents)
    upsert_questions(supabase, children)
    upsert_rows(supabase, "attempts", attempts)
    upsert_rows(supabase, resolve_responses_table(supabase), copy.deepcopy(data.RESPONSES))

    print("\n" + "=" * 60)
    print("✓ Assessment seeding complete!")
    print(f"Org: {org_data.SEED_ORG['header_line']} ({org_id})")
    print("Teachers:")
    for key, teacher in teachers.items():
        print(f"  {key}: {teacher['email']}  {teacher['id']}")
    print("Students:")
    for key, student in students.items():
        print(f"  {key}: {student['email']}  {student['id']}")
    print("Tests:")
    for test in tests:
        print(f"  {test['id']}  [{test['created_by_key']}] {test['status']:10}  {test['name']}")


if __name__ == "__main__":
    seed_assessment()
