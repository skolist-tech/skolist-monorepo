"""Current-user profile for the assessment app."""

from fastapi import APIRouter, Depends
from supabase import Client

from api.v1.auth import get_supabase_client

from .dependencies import require_assessment_actor
from .models import AssessmentActor, MeResponse

router = APIRouter()


def _org_name(supabase: Client, org_id: str | None) -> str | None:
    if not org_id:
        return None
    response = supabase.table("orgs").select("header_line").eq("id", org_id).limit(1).execute()
    rows = response.data or []
    if not rows:
        return None
    return rows[0].get("header_line")


@router.get("/me", response_model=MeResponse)
def get_me(
    actor: AssessmentActor = Depends(require_assessment_actor),
    supabase: Client = Depends(get_supabase_client),
) -> MeResponse:
    return MeResponse(
        id=actor.id,
        email=actor.email,
        user_type=actor.user_type,
        org_id=actor.org_id,
        name=actor.name,
        avatar_url=actor.avatar_url,
        role=actor.role,
        org_name=_org_name(supabase, actor.org_id),
    )
