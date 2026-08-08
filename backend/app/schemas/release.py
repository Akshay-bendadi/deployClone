import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReleaseStatus


class ReleaseCreate(BaseModel):
    version: str
    commit_sha: str


class ReleaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    version: str
    commit_sha: str
    status: ReleaseStatus
    created_at: datetime
