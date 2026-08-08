import uuid

from pydantic import BaseModel, ConfigDict


class WorkflowStep(BaseModel):
    name: str
    method: str
    path: str
    body: dict | None = None


class WorkflowCreate(BaseModel):
    name: str
    steps: list[WorkflowStep]


class WorkflowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    steps: list[WorkflowStep]
