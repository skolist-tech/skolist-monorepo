"""Supabase helpers for the assessment schema."""

from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

from .models import STUDENT_USER_TYPE

RESPONSES_TABLE = "responses"
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


def is_assigned(supabase: Client, test_id: UUID | str, user_id: str) -> bool:
    rows = fetch_all(
        assessment_table(supabase, "test_assignees").select("id").eq("test_id", as_str(test_id)).eq("user_id", user_id)
    )
    return bool(rows)
