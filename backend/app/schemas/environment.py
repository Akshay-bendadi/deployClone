import uuid

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.models.enums import DeploymentStatus, EnvironmentKind


class EnvironmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    release_id: uuid.UUID
    kind: EnvironmentKind
    api_url: str
    # internal — used only to compute candidate_torn_down below, never serialized itself
    zerops_service_stack_id: str | None = Field(default=None, exclude=True)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def candidate_torn_down(self) -> bool:
        """True once the candidate's live Zerops service has been deleted — its api_url
        is a dead link from this point on. Always False for production environments."""
        return self.kind == EnvironmentKind.CANDIDATE and self.zerops_service_stack_id is None


class DeploymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    environment_id: uuid.UUID
    step: str
    status: DeploymentStatus
    reason: str | None
