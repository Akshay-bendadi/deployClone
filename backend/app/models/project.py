import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.mixins import CreatedAtMixin, IdMixin
from app.services.encryption import EncryptedJSON, EncryptedString

if TYPE_CHECKING:
    from app.models.release import Release
    from app.models.user import User
    from app.models.workflow import Workflow


class Project(Base, IdMixin, CreatedAtMixin):
    __tablename__ = "projects"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    repository: Mapped[str] = mapped_column(String(500))
    production_url: Mapped[str] = mapped_column(String(500))
    # Zerops runtime type for the candidate service, e.g. "alpine/python@3.12"
    zerops_runtime: Mapped[str] = mapped_column(String(100))
    production_branch: Mapped[str] = mapped_column(String(255))
    # resolved server-side from `production_branch` via the GitHub API, same as Release.commit_sha
    production_commit_sha: Mapped[str] = mapped_column(String(64))
    # write-only: a GitHub PAT for resolving branches on private repos. Never returned by the
    # API. Encrypted at rest (EncryptedString) — this is a live credential with repo access.
    github_token: Mapped[str | None] = mapped_column(EncryptedString, nullable=True)
    # candidate-only config injected into the deployed candidate service
    # e.g. [{"key": "DATABASE_URL", "value": "postgresql://..."}] — never copied from production.
    # A "PORT" entry here (optional, defaults to 8080) is also used to build the candidate's
    # generated zerops.yaml, so the app and its declared listen port always agree.
    # Encrypted at rest (EncryptedJSON) — routinely holds secrets like DB connection strings.
    env_vars: Mapped[list[dict]] = mapped_column(EncryptedJSON, default=list)
    # Used to generate the candidate's zerops.yaml server-side — we never depend on the target
    # repo having its own zerops.yaml (most repos won't). None/empty means no build step.
    build_command: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    start_command: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    root_directory: Mapped[str | None] = mapped_column(String(500), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="projects")
    releases: Mapped[list["Release"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    workflows: Mapped[list["Workflow"]] = relationship(back_populates="project", cascade="all, delete-orphan")
