"""
Insert the qgen activity tree for teacher1 / student1 from _002_data_user.py.

Activity.user_id is the teacher auth id. Inserting the activity lets DB
triggers create the draft, generation pane, and default instructions.
This script then fills pane/draft fields and upserts section, questions,
versions, and concept maps.

Idempotent. Run after 001_seed_orgs.py and 002_seed_users.py.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from python_seeds.client import (
    SUPABASE_URL,
    get_public_user,
    get_supabase_admin_client,
    require_public_user,
)
from python_seeds.data import activities as data


def _upsert(supabase, table: str, rows, on_conflict: str = "id"):
    if not rows:
        return
    payload = rows if isinstance(rows, list) else [rows]
    response = supabase.table(table).upsert(payload, on_conflict=on_conflict).execute()
    return response.data


def ensure_user_fields(supabase, user_id: str, user_type: str, org_id: str | None):
    current = get_public_user(supabase, user_id)
    updates = {}
    if current.get("user_type") != user_type:
        updates["user_type"] = user_type
    if org_id and current.get("org_id") != org_id:
        updates["org_id"] = org_id

    if not updates:
        print(f"✓ User {user_id} already has user_type={user_type}")
        return

    supabase.table("users").update(updates).eq("id", user_id).execute()
    print(f"✓ Updated user {user_id}: {updates}")


def ensure_activity(supabase, teacher_user_id: str) -> None:
    existing = (
        supabase.table("activities")
        .select("id, user_id")
        .eq("id", data.ACTIVITY_ID)
        .execute()
    )

    if existing.data:
        if existing.data[0]["user_id"] != teacher_user_id:
            supabase.table("activities").update({"user_id": teacher_user_id}).eq(
                "id", data.ACTIVITY_ID
            ).execute()
            print(f"✓ Updated activity {data.ACTIVITY_ID} user_id -> {teacher_user_id}")
        else:
            print(f"✓ Activity {data.ACTIVITY_ID} already belongs to teacher")
        return

    row = {**data.ACTIVITY, "user_id": teacher_user_id}
    supabase.table("activities").insert(row).execute()
    print(f"✓ Created activity {data.ACTIVITY_ID}")


def get_activity_draft_and_pane(supabase):
    draft = (
        supabase.table("qgen_drafts")
        .select("id")
        .eq("activity_id", data.ACTIVITY_ID)
        .single()
        .execute()
    )
    pane = (
        supabase.table("qgen_generation_panes")
        .select("id")
        .eq("activity_id", data.ACTIVITY_ID)
        .single()
        .execute()
    )
    if not draft.data or not pane.data:
        raise RuntimeError(
            "Draft or generation pane missing after activity insert. "
            "Expected triggers trg_create_qgen_draft / trg_create_qgen_generation_pane."
        )
    return draft.data["id"], pane.data["id"]


def seed_activity_tree(supabase) -> None:
    draft_id, _pane_id = get_activity_draft_and_pane(supabase)

    supabase.table("qgen_generation_panes").update(data.GENERATION_PANE).eq(
        "activity_id", data.ACTIVITY_ID
    ).execute()
    print("✓ Updated generation pane")

    supabase.table("qgen_drafts").update(data.DRAFT).eq("id", draft_id).execute()
    print(f"✓ Updated draft {draft_id}")

    section = {**data.SECTION, "qgen_draft_id": draft_id}
    _upsert(supabase, "qgen_draft_sections", section)
    print(f"✓ Upserted draft section {data.SECTION_ID}")

    existing_q = (
        supabase.table("gen_questions")
        .select("id")
        .eq("activity_id", data.ACTIVITY_ID)
        .execute()
    )
    existing_ids = {row["id"] for row in (existing_q.data or [])}

    for question in data.QUESTIONS:
        if question["id"] in existing_ids:
            payload = {k: v for k, v in question.items() if k != "id"}
            supabase.table("gen_questions").update(payload).eq("id", question["id"]).execute()
        else:
            supabase.table("gen_questions").insert(question).execute()
    print(f"✓ Seeded {len(data.QUESTIONS)} gen_questions")

    _upsert(supabase, "gen_question_versions", data.QUESTION_VERSIONS)
    print(f"✓ Upserted {len(data.QUESTION_VERSIONS)} gen_question_versions")

    _upsert(supabase, "gen_questions_concepts_maps", data.QUESTION_CONCEPT_MAPS)
    print(f"✓ Upserted {len(data.QUESTION_CONCEPT_MAPS)} concept maps")


def seed_activity():
    supabase = get_supabase_admin_client()
    print(f"Connecting to Supabase at: {SUPABASE_URL}")
    print("=" * 60)

    teacher = require_public_user(supabase, data.SEED_USER["email"], "Teacher")
    student = require_public_user(supabase, data.STUDENT_USER["email"], "Student")
    teacher_user_id = teacher["id"]
    student_user_id = student["id"]
    teacher_org_id = teacher.get("org_id")

    ensure_user_fields(supabase, teacher_user_id, data.SEED_USER_TYPE, teacher_org_id)
    ensure_user_fields(supabase, student_user_id, data.STUDENT_USER_TYPE, teacher_org_id)

    ensure_activity(supabase, teacher_user_id)
    seed_activity_tree(supabase)

    print("\n" + "=" * 60)
    print("✓ Activity seeding complete!")
    print("🔄 This script is idempotent - safe to run multiple times")
    print(f"\nTeacher: {data.SEED_USER['email']}")
    print(f"Student: {data.STUDENT_USER['email']}")
    print(f"\nActivity ID: {data.ACTIVITY_ID}")
    print(f"Teacher ID: {teacher_user_id}")
    print(f"Student ID: {student_user_id}")
    if teacher_org_id:
        print(f"Org ID: {teacher_org_id}")


if __name__ == "__main__":
    seed_activity()
