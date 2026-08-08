import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class EnvVar(BaseModel):
    key: str
    value: str


class ProjectCreate(BaseModel):
    name: str
    repository: str
    production_url: str
    zerops_runtime: str
    production_branch: str
    env_vars: list[EnvVar] = []
    # required only for private repos; omit/leave blank for public ones
    github_token: str | None = None
    # how to build/run the candidate — we generate zerops.yaml from these ourselves rather
    # than depending on the target repo having its own (most repos won't)
    build_command: str | None = None
    start_command: str

    @field_validator("start_command")
    @classmethod
    def start_command_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("start_command must not be blank")
        return value


class ProjectUpdate(BaseModel):
    name: str
    repository: str
    production_url: str
    zerops_runtime: str
    production_branch: str
    env_vars: list[EnvVar] = []
    # blank means "keep the existing token" — the current value is never sent back to the
    # client to prefill, so an empty field can't be distinguished from "user chose to clear it"
    github_token: str | None = None
    build_command: str | None = None
    start_command: str

    @field_validator("start_command")
    @classmethod
    def start_command_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("start_command must not be blank")
        return value


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    repository: str
    production_url: str
    zerops_runtime: str
    production_branch: str
    production_commit_sha: str
    env_vars: list[EnvVar]
    build_command: str | None
    start_command: str | None
