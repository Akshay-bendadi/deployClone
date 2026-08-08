import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import ComparisonCategory, RegressionSeverity


class RegressionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    comparison_id: uuid.UUID
    severity: RegressionSeverity
    summary: str


class ComparisonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    release_id: uuid.UUID
    category: ComparisonCategory
    production_value: dict | None
    candidate_value: dict | None
    regressions: list[RegressionRead] = []
