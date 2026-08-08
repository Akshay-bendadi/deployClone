import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import DeploymentStatus, EnvironmentKind


class EnvironmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    release_id: uuid.UUID
    kind: EnvironmentKind
    api_url: str


class DeploymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    environment_id: uuid.UUID
    step: str
    status: DeploymentStatus
