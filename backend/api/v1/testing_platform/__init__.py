"""Testing platform API routes."""

from fastapi import APIRouter

from .grading import router as grading_router
from .student_attempts import router as student_attempts_router
from .test_lookup import router as test_lookup_router

router = APIRouter(prefix="/test-attempts", tags=["test_attempts"])

router.include_router(student_attempts_router)
router.include_router(test_lookup_router)
router.include_router(grading_router)
