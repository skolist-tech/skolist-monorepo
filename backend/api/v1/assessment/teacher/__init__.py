"""Teacher assessment routes."""

from fastapi import APIRouter

from ..assignees import router as assignees_router
from ..questions import router as questions_router
from ..sections import router as sections_router
from ..tests import router as tests_router
from .blueprints import router as blueprints_router
from .groups import router as groups_router
from .question_images import router as question_images_router

router = APIRouter()
router.include_router(tests_router)
router.include_router(sections_router)
router.include_router(questions_router)
router.include_router(assignees_router)
router.include_router(blueprints_router)
router.include_router(groups_router)
router.include_router(question_images_router)
