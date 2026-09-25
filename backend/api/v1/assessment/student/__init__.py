"""Student assessment routes."""

from fastapi import APIRouter

from ..attempts import router as attempts_router
from .assigned import router as assigned_router

router = APIRouter()
router.include_router(assigned_router)
router.include_router(attempts_router)
