"""Supabase helpers for the assessment schema."""

from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from .models import STUDENT_USER_TYPE

RESPONSES_TABLE = "responses"
REMAINING_TABLE = "test_attempts_remaining_per_student"
USER_PROFILE_FIELDS = "id, name, email, avatar_url"


def assessment_table(supabase: Client, table_name: str):
    return supabase.schema("assessment").table(table_name)


def as_str(value: UUID | str) -> str:
    return str(value)


def fetch_one(query, not_found: str = "Not found") -> dict:
    response = query.limit(1).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=not_found)
    return rows[0]


def fetch_all(query) -> list[dict]:
    response = query.execute()
    return list(response.data or [])


def fetch_test(supabase: Client, test_id: UUID | str) -> dict:
    return fetch_one(
        assessment_table(supabase, "tests").select("*").eq("id", as_str(test_id)),
        "Test not found",
    )


def fetch_section(supabase: Client, section_id: UUID | str) -> dict:
    return fetch_one(
        assessment_table(supabase, "sections").select("*").eq("id", as_str(section_id)),
        "Section not found",
    )


def fetch_question(supabase: Client, question_id: UUID | str) -> dict:
    return fetch_one(
        assessment_table(supabase, "questions").select("*").eq("id", as_str(question_id)),
        "Question not found",
    )


def fetch_attempt(supabase: Client, attempt_id: UUID | str) -> dict:
    return fetch_one(
        assessment_table(supabase, "attempts").select("*").eq("id", as_str(attempt_id)),
        "Attempt not found",
    )


def list_sections_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "sections").select("*").eq("test_id", as_str(test_id)).order("position")
    )


def list_questions_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "questions").select("*").eq("test_id", as_str(test_id)).order("position")
    )


def list_questions_for_section(supabase: Client, section_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "questions").select("*").eq("section_id", as_str(section_id)).order("position")
    )


def student_matches_query(row: dict, query: str | None) -> bool:
    if not query or not str(query).strip():
        return True
    needle = str(query).strip().lower()
    name = (row.get("name") or "").lower()
    email = (row.get("email") or "").lower()
    return needle in name or needle in email


def enrich_assignee_row(row: dict, profile: dict | None) -> dict:
    profile = profile or {}
    return {
        **row,
        "name": profile.get("name"),
        "email": profile.get("email"),
        "avatar_url": profile.get("avatar_url"),
    }


def user_profiles_by_id(supabase: Client, user_ids: list[str]) -> dict[str, dict]:
    ids = list(dict.fromkeys(user_id for user_id in user_ids if user_id))
    if not ids:
        return {}
    rows = fetch_all(supabase.table("users").select(USER_PROFILE_FIELDS).in_("id", ids))
    return {str(row["id"]): row for row in rows}


def enrich_assignees(supabase: Client, assignees: list[dict]) -> list[dict]:
    profiles = user_profiles_by_id(supabase, [str(row.get("user_id") or "") for row in assignees])
    return [enrich_assignee_row(row, profiles.get(str(row.get("user_id") or ""))) for row in assignees]


def list_org_students(supabase: Client, org_id: str | None, query: str | None = None) -> list[dict]:
    if not org_id:
        return []
    rows = fetch_all(
        supabase.table("users")
        .select(USER_PROFILE_FIELDS)
        .eq("org_id", org_id)
        .eq("user_type", STUDENT_USER_TYPE)
        .order("name")
    )
    return [
        {
            "id": str(row["id"]),
            "name": row.get("name"),
            "email": row.get("email"),
            "avatar_url": row.get("avatar_url"),
        }
        for row in rows
        if student_matches_query(row, query)
    ]


def list_assignees_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    rows = fetch_all(
        assessment_table(supabase, "test_assignees").select("*").eq("test_id", as_str(test_id)).order("created_at")
    )
    return enrich_assignees(supabase, rows)


def list_attempts_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "attempts").select("*").eq("test_id", as_str(test_id)).order("created_at")
    )


def list_responses_for_attempt(supabase: Client, attempt_id: UUID | str) -> list[dict]:
    return fetch_all(assessment_table(supabase, RESPONSES_TABLE).select("*").eq("attempt_id", as_str(attempt_id)))


def list_teacher_ids_for_test(supabase: Client, test_id: UUID | str) -> set[str]:
    rows = fetch_all(
        assessment_table(supabase, "test_teacher_access").select("teacher_id").eq("test_id", as_str(test_id))
    )
    return {str(row["teacher_id"]) for row in rows if row.get("teacher_id")}


def grant_teacher_access(supabase: Client, test_id: UUID | str, teacher_id: str) -> None:
    existing = fetch_all(
        assessment_table(supabase, "test_teacher_access")
        .select("id")
        .eq("test_id", as_str(test_id))
        .eq("teacher_id", teacher_id)
    )
    if existing:
        return
    assessment_table(supabase, "test_teacher_access").insert(
        {"test_id": as_str(test_id), "teacher_id": teacher_id}
    ).execute()


def list_tests_for_teacher(supabase: Client, teacher_id: str) -> list[dict]:
    access_rows = fetch_all(
        assessment_table(supabase, "test_teacher_access").select("test_id").eq("teacher_id", teacher_id)
    )
    test_ids = [row["test_id"] for row in access_rows if row.get("test_id")]
    if not test_ids:
        return []
    return fetch_all(assessment_table(supabase, "tests").select("*").in_("id", test_ids).order("created_at", desc=True))


def list_assigned_test_ids(supabase: Client, user_id: str) -> list[str]:
    direct = fetch_all(assessment_table(supabase, "test_assignees").select("test_id").eq("user_id", user_id))
    ids = [str(row["test_id"]) for row in direct if row.get("test_id")]
    group_ids = list_group_ids_for_user(supabase, user_id)
    if group_ids:
        links = fetch_all(
            assessment_table(supabase, "test_group_assignees").select("test_id").in_("group_id", group_ids)
        )
        ids.extend(str(row["test_id"]) for row in links if row.get("test_id"))
    return list(dict.fromkeys(ids))


def list_group_ids_for_user(supabase: Client, user_id: str) -> list[str]:
    rows = fetch_all(assessment_table(supabase, "student_group_members").select("group_id").eq("user_id", user_id))
    return [str(row["group_id"]) for row in rows if row.get("group_id")]


def is_assigned(supabase: Client, test_id: UUID | str, user_id: str) -> bool:
    rows = fetch_all(
        assessment_table(supabase, "test_assignees").select("id").eq("test_id", as_str(test_id)).eq("user_id", user_id)
    )
    if rows:
        return True
    group_ids = list_group_ids_for_user(supabase, user_id)
    if not group_ids:
        return False
    links = fetch_all(
        assessment_table(supabase, "test_group_assignees")
        .select("id")
        .eq("test_id", as_str(test_id))
        .in_("group_id", group_ids)
    )
    return bool(links)


def list_group_assignees_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    links = fetch_all(
        assessment_table(supabase, "test_group_assignees")
        .select("*")
        .eq("test_id", as_str(test_id))
        .order("created_at")
    )
    if not links:
        return []
    group_ids = [row["group_id"] for row in links]
    groups = fetch_all(assessment_table(supabase, "student_groups").select("id, name, org_id").in_("id", group_ids))
    by_id = {str(row["id"]): row for row in groups}
    payload = []
    for link in links:
        group = by_id.get(str(link.get("group_id")), {})
        payload.append({**link, "name": group.get("name"), "org_id": group.get("org_id")})
    return payload


def list_org_groups(supabase: Client, org_id: str | None) -> list[dict]:
    if not org_id:
        return []
    return fetch_all(
        assessment_table(supabase, "student_groups").select("id, name, org_id").eq("org_id", org_id).order("name")
    )


def list_group_member_ids(supabase: Client, group_id: UUID | str) -> list[str]:
    """User ids currently in a student group."""
    rows = fetch_all(
        assessment_table(supabase, "student_group_members").select("user_id").eq("group_id", as_str(group_id))
    )
    return [str(row["user_id"]) for row in rows if row.get("user_id")]


def get_attempts_remaining(supabase: Client, test_id: UUID | str, student_id: str) -> int:
    """Remaining new starts for one student on one test. Missing row is 0."""
    rows = fetch_all(
        assessment_table(supabase, REMAINING_TABLE)
        .select("attempts_remaining")
        .eq("test_id", as_str(test_id))
        .eq("student_id", student_id)
    )
    if not rows:
        return 0
    return int(rows[0].get("attempts_remaining") or 0)


def list_attempts_remaining_for_student(supabase: Client, student_id: str, test_ids: list[str]) -> dict[str, int]:
    """Map test id to remaining starts for a student."""
    if not test_ids:
        return {}
    rows = fetch_all(
        assessment_table(supabase, REMAINING_TABLE)
        .select("test_id, attempts_remaining")
        .eq("student_id", student_id)
        .in_("test_id", test_ids)
    )
    return {str(row["test_id"]): int(row.get("attempts_remaining") or 0) for row in rows if row.get("test_id")}


def grant_attempts_remaining(
    supabase: Client,
    test_id: UUID | str,
    student_ids: list[str],
    amount: int = 1,
) -> None:
    """Insert remaining=amount for students who do not already have a row."""
    for student_id in dict.fromkeys(user_id for user_id in student_ids if user_id):
        existing = fetch_all(
            assessment_table(supabase, REMAINING_TABLE)
            .select("id")
            .eq("test_id", as_str(test_id))
            .eq("student_id", student_id)
        )
        if existing:
            continue
        assessment_table(supabase, REMAINING_TABLE).insert(
            {
                "test_id": as_str(test_id),
                "student_id": student_id,
                "attempts_remaining": amount,
            }
        ).execute()


def consume_attempt_slot(supabase: Client, test_id: UUID | str, student_id: str) -> bool:
    """Decrement remaining by 1. False if the student has none left."""
    rows = fetch_all(
        assessment_table(supabase, REMAINING_TABLE)
        .select("id, attempts_remaining")
        .eq("test_id", as_str(test_id))
        .eq("student_id", student_id)
    )
    if not rows:
        return False
    current = int(rows[0].get("attempts_remaining") or 0)
    if current < 1:
        return False
    updated = (
        assessment_table(supabase, REMAINING_TABLE)
        .update({"attempts_remaining": current - 1})
        .eq("id", rows[0]["id"])
        .eq("attempts_remaining", current)
        .execute()
    )
    return bool(updated.data)


def refund_attempt_slot(supabase: Client, test_id: UUID | str, student_id: str) -> None:
    """Give back one remaining start after a failed attempt insert."""
    rows = fetch_all(
        assessment_table(supabase, REMAINING_TABLE)
        .select("id, attempts_remaining")
        .eq("test_id", as_str(test_id))
        .eq("student_id", student_id)
    )
    if not rows:
        grant_attempts_remaining(supabase, test_id, [student_id])
        return
    current = int(rows[0].get("attempts_remaining") or 0)
    assessment_table(supabase, REMAINING_TABLE).update({"attempts_remaining": current + 1}).eq(
        "id", rows[0]["id"]
    ).execute()
