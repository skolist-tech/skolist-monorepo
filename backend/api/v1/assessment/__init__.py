"""
This is the assessment API.

This is different from qgen API and the testing platform API. testing platform API is used
for conducting tests generated via qgen.

This Assessment API is completely independent of it, it's an assessment platform on its own.

Schools / Coachings can use this API to create assessments, and students can take the assessments.

Data lives in the `assessment` schema (tests, sections, questions, test_assignees, attempts, responses),
aimed at JEE Main, JEE Advanced, and NEET papers.
"""

from fastapi import APIRouter, Depends

from api.v1.auth import require_supabase_user

from .login import router as login_router
from .me import router as me_router
from .student import router as student_router
from .teacher import router as teacher_router

public_router = APIRouter(prefix="/assessment", tags=["assessment"])
public_router.include_router(login_router)

router = APIRouter(
    prefix="/assessment",
    tags=["assessment"],
    dependencies=[Depends(require_supabase_user)],
)

router.include_router(me_router)
router.include_router(teacher_router)
router.include_router(student_router)
