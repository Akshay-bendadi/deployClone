import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models.deployment import Deployment
from app.models.environment import Environment
from app.schemas.environment import DeploymentRead

router = APIRouter(prefix="/api/v1/environments", tags=["environments"])


@router.get("/{environment_id}/deployments", response_model=list[DeploymentRead])
def list_deployments(environment_id: uuid.UUID, db: SessionDep) -> list[Deployment]:
    if db.get(Environment, environment_id) is None:
        raise HTTPException(status_code=404, detail="Environment not found")
    return list(
        db.query(Deployment)
        .filter(Deployment.environment_id == environment_id)
        .order_by(Deployment.created_at)
        .all()
    )
