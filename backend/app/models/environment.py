import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import EnvironmentKind
from app.models.mixins import CreatedAtMixin, IdMixin

if TYPE_CHECKING:
    from app.models.deployment import Deployment
    from app.models.release import Release
    from app.models.test_run import TestRun


class Environment(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "environments"

    release_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("releases.id"), index=True)
    kind: Mapped[EnvironmentKind] = mapped_column(Enum(EnvironmentKind, name="environment_kind"))
    api_url: Mapped[str] = mapped_column(String(500))

    release: Mapped["Release"] = relationship(back_populates="environments")
    deployments: Mapped[list["Deployment"]] = relationship(back_populates="environment", cascade="all, delete-orphan")
    test_runs: Mapped[list["TestRun"]] = relationship(back_populates="environment", cascade="all, delete-orphan")
