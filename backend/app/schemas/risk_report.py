import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import RiskVerdict


class RiskReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    release_id: uuid.UUID
    risk_score: int
    verdict: RiskVerdict
    ai_explanation: str | None
