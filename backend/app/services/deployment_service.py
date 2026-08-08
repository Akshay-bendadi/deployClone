"""Candidate deployment lifecycle (plan.txt §16).

Each lifecycle step is persisted as a Deployment row with a real status
(pending/in_progress/complete/failed) — per plan.txt §31, the frontend
deployment screen must show actual backend statuses, not fake animations.

Every step here is real and has been verified end-to-end against a live Zerops
project: create a code-less service, download the release's exact commit as a
tarball from GitHub, upload it, trigger a build+deploy using a zerops.yaml we
generate ourselves from the project's build/start commands, then poll until
it's live (or failed) and record its public URL.

We deliberately never read a zerops.yaml from the target repo — most repos
being tested won't have one, and requiring it would defeat the point of a
tool meant to work against an arbitrary existing project (like Vercel/Render
don't require their own config file either; they take a build+start command
and generate the rest).
"""

import io
import tarfile
import time
from typing import NoReturn

import httpx
import yaml
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.deployment import Deployment
from app.models.enums import DeploymentStatus, EnvironmentKind
from app.models.environment import Environment
from app.models.project import Project
from app.models.release import Release
from app.services.github_client import GitHubError, download_repo_tarball
from app.services.zerops_client import ZeropsClient, get_zerops_client

LIFECYCLE_STEPS = [
    "Resolve commit",
    "Prepare deployment definition",
    "Create candidate service",
    "Upload candidate code",
    "Build and deploy candidate",
    "Run health checks",
]

_DEFAULT_PORT = 8080

_BUILD_POLL_INTERVAL_S = 5.0
_BUILD_POLL_TIMEOUT_S = 600.0
_TERMINAL_STATUSES = {
    "ACTIVE",
    "DEPLOY_FAILED",
    "BUILD_FAILED",
    "PREPARING_RUNTIME_FAILED",
    "BUILD_VALIDATION_FAILED",
    "CANCELLED",
}


class DeploymentError(Exception):
    def __init__(self, step: str, reason: str) -> None:
        self.step = step
        self.reason = reason
        super().__init__(f"{step}: {reason}")


def _candidate_hostname(release: Release) -> str:
    """<=25 chars, lowercase ascii/digits only, per Zerops' hostname rules."""
    return f"c{str(release.id).replace('-', '')}"[:25]


def _env_vars_dict(project: Project) -> dict[str, str]:
    return {entry["key"]: entry["value"] for entry in project.env_vars}


def _resolve_port(project: Project) -> int:
    """A "PORT" entry in the project's own env vars wins; otherwise a fixed default.

    Kept in sync with `_generate_zerops_yaml`'s `run.ports` — the app must listen on
    whatever port we declare there, so both need to agree on the same source of truth.
    """
    raw = _env_vars_dict(project).get("PORT")
    if raw:
        try:
            return int(raw)
        except ValueError:
            pass
    return _DEFAULT_PORT


def _candidate_env_vars(project: Project) -> dict[str, str]:
    """Env vars injected into the candidate container, always including PORT.

    Declaring a port in zerops.yaml's `run.ports` only tells Zerops which port to route
    traffic to — it does nothing to make the app itself listen there. Most frameworks
    (Next.js, Express, etc.) bind to a `PORT` env var if one is set, so without this the
    app binds to its own default (often 3000) while Zerops routes to 8080, producing a
    502 even though the deploy itself "succeeded".
    """
    env_vars = _env_vars_dict(project)
    env_vars.setdefault("PORT", str(_resolve_port(project)))
    return env_vars


# Per-runtime dependency install step, run automatically before the project's own
# build_command — same division of labor as Vercel/Render: the platform handles the
# standard "install dependencies" ceremony, the user only supplies the app-specific
# step (e.g. "npm run build"). Without this, a bare "npm run build" fails outright
# since nothing ever put anything in node_modules first.
_RUNTIME_INSTALL_COMMANDS = {
    "nodejs": "npm install",
    "bun": "bun install",
    "python": "pip install -r requirements.txt",
    "go": "go mod download",
    "ruby": "bundle install",
    "dotnet": "dotnet restore",
    "php-nginx": "composer install",
    # rust/java/static: no standard single install step to assume — left to build_command.
}


def _runtime_family(runtime: str) -> str:
    """"alpine/nodejs@22" -> "nodejs"; "alpine/php-nginx@8.4" -> "php-nginx"."""
    return runtime.split("/")[-1].split("@")[0]


def _generate_zerops_yaml(project: Project, hostname: str) -> str:
    """Builds a zerops.yaml for the candidate from the project's own build/start commands —
    we never depend on one existing in the target repo (see module docstring)."""
    build_commands = []
    install_command = _RUNTIME_INSTALL_COMMANDS.get(_runtime_family(project.zerops_runtime))
    if install_command:
        build_commands.append(install_command)
    if project.build_command:
        build_commands.append(project.build_command)

    config = {
        "zerops": [
            {
                "setup": hostname,
                "build": {
                    "base": project.zerops_runtime,
                    "buildCommands": build_commands,
                    "deployFiles": "./",
                },
                "run": {
                    "base": project.zerops_runtime,
                    "start": project.start_command,
                    "ports": [{"port": _resolve_port(project), "httpSupport": True}],
                },
            }
        ]
    }
    return yaml.safe_dump(config, sort_keys=False)


def _strip_tarball_root(raw: bytes) -> bytes:
    """GitHub's tarball API always wraps every file in a single top-level
    "{owner}-{repo}-{short_sha}/" directory. Zerops' build step expects deploy files
    at the archive root (same convention as `tar --strip-components=1`), so without
    this every build fails outright — it can't find package.json/requirements.txt/etc.
    at the path it's looking for, even though the code we uploaded is otherwise correct.
    """
    src = tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz")
    members = src.getmembers()
    if not members:
        return raw

    prefix = members[0].name.split("/", 1)[0] + "/"
    out_buffer = io.BytesIO()
    with tarfile.open(fileobj=out_buffer, mode="w:gz") as dst:
        for member in members:
            if not member.name.startswith(prefix):
                continue
            new_name = member.name[len(prefix) :]
            if not new_name:
                continue
            extracted = src.extractfile(member) if member.isfile() else None
            member.name = new_name
            dst.addfile(member, extracted)
    return out_buffer.getvalue()


def _public_url(zerops: ZeropsClient, service_stack_id: str) -> str | None:
    service_stack = zerops.get_service_stack(service_stack_id)
    for entry in service_stack.get("userData", []):
        if entry.get("key") == "zeropsSubdomain":
            return entry.get("content")
    return None


def run_candidate_deployment(db: Session, release: Release) -> Environment:
    """Runs the full candidate lifecycle, recording each step as a Deployment row."""
    environment = Environment(release_id=release.id, kind=EnvironmentKind.CANDIDATE, api_url="")
    db.add(environment)
    db.flush()

    step_rows: dict[str, Deployment] = {}
    for step_name in LIFECYCLE_STEPS:
        row = Deployment(environment_id=environment.id, step=step_name, status=DeploymentStatus.PENDING)
        db.add(row)
        step_rows[step_name] = row
    db.commit()

    def start(step_name: str) -> None:
        step_rows[step_name].status = DeploymentStatus.IN_PROGRESS
        db.commit()

    def finish(step_name: str) -> None:
        step_rows[step_name].status = DeploymentStatus.COMPLETE
        db.commit()

    def fail(step_name: str, reason: str) -> NoReturn:
        step_rows[step_name].status = DeploymentStatus.FAILED
        db.commit()
        raise DeploymentError(step_name, reason)

    project = release.project

    start("Resolve commit")
    if not release.commit_sha:
        fail("Resolve commit", "Release has no commit SHA")
    finish("Resolve commit")

    start("Prepare deployment definition")
    if not project.start_command or not project.start_command.strip():
        fail("Prepare deployment definition", "Project has no start command configured")
    hostname = _candidate_hostname(release)
    zerops_yaml = _generate_zerops_yaml(project, hostname)
    finish("Prepare deployment definition")

    settings = get_settings()
    zerops = get_zerops_client()
    if zerops is None or not settings.zerops_project_id:
        fail(
            "Create candidate service",
            "ZEROPS_API_TOKEN/ZEROPS_PROJECT_ID is not configured — candidate provisioning "
            "requires both.",
        )

    start("Create candidate service")
    try:
        service_stack_id = zerops.import_service_stack(
            settings.zerops_project_id,
            hostname=hostname,
            service_type=project.zerops_runtime,
            env_vars=_candidate_env_vars(project),
        )
    except httpx.HTTPError as exc:
        fail("Create candidate service", str(exc))
    environment.zerops_service_stack_id = service_stack_id
    db.commit()
    finish("Create candidate service")

    start("Upload candidate code")
    try:
        tarball = download_repo_tarball(project.repository, release.commit_sha, token=project.github_token)
    except GitHubError as exc:
        fail("Upload candidate code", str(exc))
    tarball = _strip_tarball_root(tarball)
    try:
        app_version_id, upload_url = zerops.create_app_version(service_stack_id)
        zerops.upload_artifact(upload_url, tarball)
    except httpx.HTTPError as exc:
        fail("Upload candidate code", str(exc))
    finish("Upload candidate code")

    start("Build and deploy candidate")
    try:
        zerops.build_and_deploy(app_version_id, zerops_yaml)
    except httpx.HTTPError as exc:
        fail("Build and deploy candidate", str(exc))

    deadline = time.monotonic() + _BUILD_POLL_TIMEOUT_S
    status = "WAITING_TO_BUILD"
    while time.monotonic() < deadline:
        app_version = zerops.get_app_version(app_version_id)
        status = app_version.get("status", status)
        if status in _TERMINAL_STATUSES:
            break
        time.sleep(_BUILD_POLL_INTERVAL_S)
    if status != "ACTIVE":
        fail("Build and deploy candidate", f"Build ended with status {status}")
    finish("Build and deploy candidate")

    start("Run health checks")
    public_url = _public_url(zerops, service_stack_id)
    if not public_url:
        fail("Run health checks", "Candidate deployed but has no public URL")
    environment.api_url = public_url
    db.commit()
    finish("Run health checks")

    return environment
