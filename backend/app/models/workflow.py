import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.test_run import TestRun


class Workflow(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "workflows"

    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    # list of {"name": str, "method": str, "path": str, "body": dict | None}
    # "path"/"body" may contain "{var}" placeholders resolved from prior step responses at run time.
    steps: Mapped[list[dict]] = mapped_column(JSONB)

    project: Mapped["Project"] = relationship(back_populates="workflows")
    test_runs: Mapped[list["TestRun"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
