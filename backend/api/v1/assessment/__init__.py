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

from .assignees import router as assignees_router
from .attempts import router as attempts_router
from .me import router as me_router
from .questions import router as questions_router
from .sections import router as sections_router
from .student import router as student_router
from .tests import router as tests_router

router = APIRouter(
    prefix="/assessment",
    tags=["assessment"],
    dependencies=[Depends(require_supabase_user)],
)

router.include_router(me_router)
router.include_router(student_router)
router.include_router(tests_router)
router.include_router(sections_router)
router.include_router(questions_router)
router.include_router(assignees_router)
router.include_router(attempts_router)
