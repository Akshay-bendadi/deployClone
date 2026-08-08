import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.test_run import TestRun


class TestResult(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "test_results"

    test_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("test_runs.id"), index=True)
    step_name: Mapped[str] = mapped_column(String(255))
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    response_body: Mapped[dict | list | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    test_run: Mapped["TestRun"] = relationship(back_populates="results")
