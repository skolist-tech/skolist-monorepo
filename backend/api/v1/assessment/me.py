"""Current-user profile for the assessment app."""

from fastapi import APIRouter, Depends

from .dependencies import require_assessment_actor
from .models import AssessmentActor, MeResponse

router = APIRouter()


@router.get("/me", response_model=MeResponse)
def get_me(actor: AssessmentActor = Depends(require_assessment_actor)) -> MeResponse:
    return MeResponse(
        id=actor.id,
        email=actor.email,
        user_type=actor.user_type,
        org_id=actor.org_id,
        role=actor.role,
    )
