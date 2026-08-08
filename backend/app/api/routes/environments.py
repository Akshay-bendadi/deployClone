import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import joinedload

from app.api.deps import CurrentUserDep, SessionDep
from app.models.deployment import Deployment
from app.models.environment import Environment
from app.models.release import Release
from app.schemas.environment import DeploymentRead

router = APIRouter(prefix="/api/v1/environments", tags=["environments"])


def _get_owned_environment_or_404(
    db: SessionDep, environment_id: uuid.UUID, current_user: CurrentUserDep
) -> Environment:
    environment = (
        db.query(Environment)
        .join(Release, Environment.release_id == Release.id)
        .options(joinedload(Environment.release).joinedload(Release.project))
        .filter(Environment.id == environment_id)
        .one_or_none()
    )
    if environment is None or environment.release.project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Environment not found")
    return environment


@router.get("/{environment_id}/deployments", response_model=list[DeploymentRead])
def list_deployments(
    environment_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep
) -> list[Deployment]:
    _get_owned_environment_or_404(db, environment_id, current_user)
    return list(
        db.query(Deployment)
        .filter(Deployment.environment_id == environment_id)
        .order_by(Deployment.created_at)
        .all()
    )
