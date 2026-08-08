import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import ReleaseStatus
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.comparison import Comparison
    from app.models.environment import Environment
    from app.models.project import Project
    from app.models.risk_report import RiskReport
    from app.models.test_run import TestRun


class Release(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "releases"

    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), index=True)
    version: Mapped[str] = mapped_column(String(100))
    commit_sha: Mapped[str] = mapped_column(String(64))
    status: Mapped[ReleaseStatus] = mapped_column(
        Enum(ReleaseStatus, name="release_status"), default=ReleaseStatus.CREATED
    )

    project: Mapped["Project"] = relationship(back_populates="releases")
    environments: Mapped[list["Environment"]] = relationship(back_populates="release", cascade="all, delete-orphan")
    test_runs: Mapped[list["TestRun"]] = relationship(back_populates="release", cascade="all, delete-orphan")
    comparisons: Mapped[list["Comparison"]] = relationship(back_populates="release", cascade="all, delete-orphan")
    risk_report: Mapped["RiskReport | None"] = relationship(back_populates="release", cascade="all, delete-orphan")
