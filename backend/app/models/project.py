from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.release import Release
    from app.models.workflow import Workflow


class Project(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(255))
    repository: Mapped[str] = mapped_column(String(500))
    production_url: Mapped[str] = mapped_column(String(500))
    production_version: Mapped[str] = mapped_column(String(100))

    releases: Mapped[list["Release"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    workflows: Mapped[list["Workflow"]] = relationship(back_populates="project", cascade="all, delete-orphan")
