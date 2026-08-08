import uuid

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    name: str
    repository: str
    production_url: str
    production_version: str


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    repository: str
    production_url: str
    production_version: str
