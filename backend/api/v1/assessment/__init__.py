"""
This is the assessment API.

This is different from qgen API and the testing platform API. testing platform API is used to for conducting tests generated via qgen.

This Assessment API is completely independent of it, it's an assessment platform on its own.

Schools / Coachings can use this API to create assessments, and students can take the assessments.

Data lives in the `assessment` schema (tests, sections, questions, attempts, answers),
aimed at JEE Main, JEE Advanced, and NEET papers.
"""

from fastapi import APIRouter, Depends

from api.v1.auth import require_supabase_user

router = APIRouter(
    prefix="/assessment",
    tags=["assessment"],
    dependencies=[Depends(require_supabase_user)],
)
