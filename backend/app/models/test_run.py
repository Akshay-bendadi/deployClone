import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import TestRunStatus
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.environment import Environment
    from app.models.release import Release
    from app.models.test_result import TestResult
    from app.models.workflow import Workflow


class TestRun(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "test_runs"

    release_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("releases.id"), index=True)
    workflow_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workflows.id"), index=True)
    environment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("environments.id"), index=True)
    status: Mapped[TestRunStatus] = mapped_column(
        Enum(TestRunStatus, name="test_run_status"), default=TestRunStatus.PENDING
    )

    release: Mapped["Release"] = relationship(back_populates="test_runs")
    workflow: Mapped["Workflow"] = relationship(back_populates="test_runs")
    environment: Mapped["Environment"] = relationship(back_populates="test_runs")
    results: Mapped[list["TestResult"]] = relationship(back_populates="test_run", cascade="all, delete-orphan")
