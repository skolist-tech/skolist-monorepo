"""Student attempt start, save, submit, and paper/result reads."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client

from api.v1.auth import get_supabase_client

from .db import (
    RESPONSES_TABLE,
    as_str,
    assessment_table,
    fetch_all,
    fetch_question,
    fetch_test,
    list_questions_for_test,
    list_responses_for_attempt,
    list_sections_for_test,
)
from .dependencies import can_student_attempt, require_assigned_test, require_attempt_owner, require_student
from .grading import grade_attempt
from .models import AssessmentActor, ResponseUpsert, dump_unset
from .serializers import strip_question_for_student, strip_response_for_student

router = APIRouter()

IN_PROGRESS = "in_progress"
TERMINAL_STATUSES = {"submitted", "timed_out", "graded"}


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _require_in_progress(attempt: dict) -> None:
    if attempt.get("status") != IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attempt is no longer in progress",
        )


def _paper_payload(supabase: Client, attempt: dict, include_grading: bool) -> dict:
    test = fetch_test(supabase, attempt["test_id"])
    sections = list_sections_for_test(supabase, test["id"])
    questions = list_questions_for_test(supabase, test["id"])
    responses = list_responses_for_attempt(supabase, attempt["id"])
    questions_by_section: dict[str, list] = {section["id"]: [] for section in sections}
    for question in questions:
        questions_by_section.setdefault(question["section_id"], []).append(strip_question_for_student(question))

    return {
        "attempt": attempt if include_grading else {**attempt, "total_marks_obtained": None},
        "test": {
            "id": test["id"],
            "name": test["name"],
            "description": test.get("description"),
            "exam_type": test.get("exam_type"),
            "duration_minutes": test.get("duration_minutes"),
            "total_marks": test.get("total_marks"),
            "status": test.get("status"),
        },
        "sections": [{**section, "questions": questions_by_section.get(section["id"], [])} for section in sections],
        "responses": [strip_response_for_student(row, include_grading=include_grading) for row in responses],
    }


@router.post("/tests/{test_id}/attempts")
def start_attempt(
    test_id: UUID,
    test: dict = Depends(require_assigned_test),
    actor: AssessmentActor = Depends(require_student),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    if not can_student_attempt(test):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Test is not open for attempts",
        )

    existing = fetch_all(
        assessment_table(supabase, "attempts")
        .select("*")
        .eq("test_id", as_str(test_id))
        .eq("student_id", actor.id)
        .order("attempt_number")
    )
    in_progress = next((row for row in existing if row.get("status") == IN_PROGRESS), None)
    if in_progress:
        return in_progress

    next_number = (max((row.get("attempt_number") or 1) for row in existing) + 1) if existing else 1
    questions = list_questions_for_test(supabase, test_id)
    possible = sum(float(q.get("marks") or 0) for q in questions)
    insert = {
        "test_id": as_str(test_id),
        "student_id": actor.id,
        "attempt_number": next_number,
        "status": IN_PROGRESS,
        "started_at": _now_iso(),
        "total_marks_possible": possible,
    }
    response = assessment_table(supabase, "attempts").insert(insert).execute()
    rows = response.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to start attempt")
    return rows[0]


@router.get("/attempts/{attempt_id}")
def get_attempt(
    attempt: dict = Depends(require_attempt_owner),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    include_grading = attempt.get("status") in TERMINAL_STATUSES
    responses = list_responses_for_attempt(supabase, attempt["id"])
    attempt_out = dict(attempt)
    if not include_grading:
        attempt_out["total_marks_obtained"] = None
    return {
        "attempt": attempt_out,
        "responses": [strip_response_for_student(row, include_grading=include_grading) for row in responses],
    }


@router.get("/attempts/{attempt_id}/paper")
def get_attempt_paper(
    attempt: dict = Depends(require_attempt_owner),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    include_grading = attempt.get("status") in TERMINAL_STATUSES
    return _paper_payload(supabase, attempt, include_grading=include_grading)


@router.put("/attempts/{attempt_id}/responses/{question_id}")
def save_response(
    question_id: UUID,
    body: ResponseUpsert,
    attempt: dict = Depends(require_attempt_owner),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    _require_in_progress(attempt)
    question = fetch_question(supabase, question_id)
    if question.get("test_id") != attempt.get("test_id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is not part of this test")

    payload = dump_unset(body)
    payload["answered_at"] = _now_iso()
    existing = fetch_all(
        assessment_table(supabase, RESPONSES_TABLE)
        .select("*")
        .eq("attempt_id", attempt["id"])
        .eq("question_id", as_str(question_id))
    )
    if existing:
        response = (
            assessment_table(supabase, RESPONSES_TABLE)
            .update({**payload, "is_correct": None, "marks_obtained": None})
            .eq("id", existing[0]["id"])
            .execute()
        )
        row = (response.data or existing)[0]
    else:
        response = (
            assessment_table(supabase, RESPONSES_TABLE)
            .insert(
                {
                    "attempt_id": attempt["id"],
                    "question_id": as_str(question_id),
                    **payload,
                }
            )
            .execute()
        )
        rows = response.data or []
        if not rows:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save response")
        row = rows[0]
    return strip_response_for_student(row, include_grading=False)


@router.post("/attempts/{attempt_id}/submit")
def submit_attempt(
    attempt: dict = Depends(require_attempt_owner),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    if attempt.get("status") in TERMINAL_STATUSES:
        return _result_payload(supabase, attempt)

    _require_in_progress(attempt)
    questions = list_questions_for_test(supabase, attempt["test_id"])
    responses = list_responses_for_attempt(supabase, attempt["id"])
    results, obtained, possible = grade_attempt(questions, responses)
    by_question = {row["question_id"]: row for row in responses}

    for result in results:
        existing = by_question.get(result["question_id"])
        if not existing:
            continue
        assessment_table(supabase, RESPONSES_TABLE).update(
            {
                "is_correct": result["is_correct"],
                "marks_obtained": result["marks_obtained"],
            }
        ).eq("id", existing["id"]).execute()

    updated = (
        assessment_table(supabase, "attempts")
        .update(
            {
                "status": "graded",
                "submitted_at": _now_iso(),
                "total_marks_obtained": obtained,
                "total_marks_possible": possible,
            }
        )
        .eq("id", attempt["id"])
        .execute()
    )
    attempt_row = (updated.data or [attempt])[0]
    return _result_payload(supabase, attempt_row)


@router.get("/attempts/{attempt_id}/result")
def get_attempt_result(
    attempt: dict = Depends(require_attempt_owner),
    supabase: Client = Depends(get_supabase_client),
) -> dict:
    if attempt.get("status") not in TERMINAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Results are available after submit",
        )
    return _result_payload(supabase, attempt)


def _result_payload(supabase: Client, attempt: dict) -> dict:
    questions = list_questions_for_test(supabase, attempt["test_id"])
    responses = list_responses_for_attempt(supabase, attempt["id"])
    paper = _paper_payload(supabase, attempt, include_grading=True)
    # Results may include explanations after submit, but never live keys during an attempt.
    # After submit, teachers own the keys; students get explanations + correctness only.
    questions_by_id = {q["id"]: q for q in questions}
    graded_questions = []
    for question in questions:
        item = strip_question_for_student(question)
        item["explanation"] = questions_by_id[question["id"]].get("explanation")
        item["answer"] = questions_by_id[question["id"]].get("answer")
        graded_questions.append(item)

    by_section: dict[str, list] = {}
    for question in graded_questions:
        by_section.setdefault(question["section_id"], []).append(question)
    paper["sections"] = [{**section, "questions": by_section.get(section["id"], [])} for section in paper["sections"]]
    paper["responses"] = responses
    paper["attempt"] = attempt
    return paper
