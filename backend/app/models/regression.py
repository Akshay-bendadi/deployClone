import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import RegressionSeverity
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.comparison import Comparison


class Regression(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "regressions"

    comparison_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("comparisons.id"), index=True)
    severity: Mapped[RegressionSeverity] = mapped_column(Enum(RegressionSeverity, name="regression_severity"))
    summary: Mapped[str] = mapped_column(String(1000))

    comparison: Mapped["Comparison"] = relationship(back_populates="regressions")
