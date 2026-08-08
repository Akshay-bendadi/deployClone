import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import RiskVerdict
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.release import Release


class RiskReport(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "risk_reports"

    release_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("releases.id"), unique=True)
    risk_score: Mapped[int] = mapped_column(Integer)
    verdict: Mapped[RiskVerdict] = mapped_column(Enum(RiskVerdict, name="risk_verdict"))
    ai_explanation: Mapped[str | None] = mapped_column(String(4000), nullable=True)

    release: Mapped["Release"] = relationship(back_populates="risk_report")
