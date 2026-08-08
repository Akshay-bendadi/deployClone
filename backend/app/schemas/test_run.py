import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import TestRunStatus


class TestResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    test_run_id: uuid.UUID
    step_name: str
    http_status: int | None
    latency_ms: float | None
    response_body: dict | list | None
    error: str | None


class TestRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    release_id: uuid.UUID
    workflow_id: uuid.UUID
    environment_id: uuid.UUID
    status: TestRunStatus
