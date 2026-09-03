"""Supabase helpers for the assessment schema."""

from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client

RESPONSES_TABLE = "responses"


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
        assessment_table(supabase, "sections")
        .select("*")
        .eq("test_id", as_str(test_id))
        .order("position")
    )


def list_questions_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "questions")
        .select("*")
        .eq("test_id", as_str(test_id))
        .order("position")
    )


def list_questions_for_section(supabase: Client, section_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "questions")
        .select("*")
        .eq("section_id", as_str(section_id))
        .order("position")
    )


def list_assignees_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "test_assignees")
        .select("*")
        .eq("test_id", as_str(test_id))
        .order("created_at")
    )


def list_attempts_for_test(supabase: Client, test_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, "attempts")
        .select("*")
        .eq("test_id", as_str(test_id))
        .order("created_at")
    )


def list_responses_for_attempt(supabase: Client, attempt_id: UUID | str) -> list[dict]:
    return fetch_all(
        assessment_table(supabase, RESPONSES_TABLE)
        .select("*")
        .eq("attempt_id", as_str(attempt_id))
    )


def is_assigned(supabase: Client, test_id: UUID | str, user_id: str) -> bool:
    rows = fetch_all(
        assessment_table(supabase, "test_assignees")
        .select("id")
        .eq("test_id", as_str(test_id))
        .eq("user_id", user_id)
    )
    return bool(rows)
