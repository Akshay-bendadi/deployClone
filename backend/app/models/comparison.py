import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import ComparisonCategory
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.regression import Regression
    from app.models.release import Release


class Comparison(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "comparisons"

    release_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("releases.id"), index=True)
    category: Mapped[ComparisonCategory] = mapped_column(Enum(ComparisonCategory, name="comparison_category"))
    production_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    candidate_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    release: Mapped["Release"] = relationship(back_populates="comparisons")
    regressions: Mapped[list["Regression"]] = relationship(back_populates="comparison", cascade="all, delete-orphan")
