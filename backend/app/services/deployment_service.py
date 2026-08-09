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
import uuid
from datetime import datetime, timezone
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
    "Create twin service",
    "Upload twin code",
    "Build and deploy twin",
    "Run health checks",
]

_DEFAULT_PORT = 3000

_BUILD_POLL_INTERVAL_S = 5.0
_BUILD_POLL_TIMEOUT_S = 600.0
_HEALTH_CHECK_ATTEMPTS = 10
_HEALTH_CHECK_INTERVAL_S = 3.0
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


def _candidate_hostname() -> str:
    """<=25 chars, lowercase ascii/digits only, per Zerops' hostname rules.
    Unique per attempt so retries never collide with a still-deleting twin."""
    return f"c{uuid.uuid4().hex}"[:25]


def _env_vars_dict(project: Project) -> dict[str, str]:
    return {entry["key"]: entry["value"] for entry in project.env_vars}


def _resolve_port(project: Project) -> int:
    """Which port Zerops should route traffic to.

    We deliberately do NOT try to inject a PORT env var to force the app onto a
    specific port — confirmed by direct testing that neither `envSecrets` nor
    `envVariables` on the service-import YAML actually reach the container (silently
    dropped, no error). Zerops' own official recipes (e.g. recipe-nextjs-nodejs) don't
    fight this either — they just leave the framework on its own default port and match
    that in `ports`. A "PORT" entry in the project's env vars is honored here only as
    "this is the port our own start_command already binds to" (e.g. if start_command is
    `next start -p 4000`), not as something we can push into the app ourselves.
    """
    raw = _env_vars_dict(project).get("PORT")
    if raw:
        try:
            return int(raw)
        except ValueError:
            pass
    return _DEFAULT_PORT


# Per-runtime dependency install step, run automatically before the project's own
# build_command — same division of labor as Vercel/Render: the platform handles the
# standard "install dependencies" ceremony, the user only supplies the app-specific
# step (e.g. "npm run build"). Without this, a bare "npm run build" fails outright
# since nothing ever put anything in node_modules first.
_RUNTIME_INSTALL_COMMANDS = {
    "nodejs": "npm install",
    "bun": "bun install",
    "python": "pip install --no-cache-dir -r requirements.txt --target .packages",
    "go": "go mod download",
    "ruby": "bundle install",
    "dotnet": "dotnet restore",
    "php-nginx": "composer install",
    # rust/java/static: no standard single install step to assume — left to build_command.
}

_RUNTIME_EXTRA_ENV = {
    "python": {"PYTHONPATH": ".packages"},
}


_PYTHON_CLI_TOOLS = {"uvicorn", "gunicorn", "flask", "django", "hypercorn", "daphne"}


def _python_module_start(start_command: str) -> str:
    """Rewrites 'uvicorn main:app ...' to 'python -m uvicorn main:app ...'
    so the tool is found via PYTHONPATH instead of requiring it on PATH."""
    if "python -m" in start_command or "python3 -m" in start_command:
        return start_command
    parts = start_command.split()
    for i, part in enumerate(parts):
        if part in _PYTHON_CLI_TOOLS:
            parts[i] = f"python -m {part}"
            return " ".join(parts)
    return start_command


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

    start_command = project.start_command
    family = _runtime_family(project.zerops_runtime)
    if family == "python" and start_command:
        start_command = _python_module_start(start_command)

    run_config: dict = {
        "base": project.zerops_runtime,
        "start": start_command,
        "ports": [{"port": _resolve_port(project), "httpSupport": True}],
    }

    env_vars = _env_vars_dict(project)
    runtime_env = _RUNTIME_EXTRA_ENV.get(_runtime_family(project.zerops_runtime), {})
    merged_env = {**runtime_env, **env_vars}
    if merged_env:
        run_config["envVariables"] = merged_env

    config = {
        "zerops": [
            {
                "setup": hostname,
                "build": {
                    "base": project.zerops_runtime,
                    "buildCommands": build_commands,
                    "deployFiles": "./",
                },
                "run": run_config,
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


def _strip_to_subdirectory(raw: bytes, root_directory: str) -> bytes:
    """Keeps only files under root_directory and re-roots them, so the twin's
    directory structure matches a production deploy of just that subdirectory."""
    prefix = root_directory.strip("/") + "/"
    src = tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz")
    out_buffer = io.BytesIO()
    with tarfile.open(fileobj=out_buffer, mode="w:gz") as dst:
        for member in src.getmembers():
            if not member.name.startswith(prefix):
                continue
            new_name = member.name[len(prefix):]
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


def _wait_for_healthy(url: str) -> bool:
    """Actually pings the candidate until it responds, instead of assuming a build that
    reached ACTIVE means the app is reachable. A container can finish building and still
    take a few seconds before the process inside is actually listening — polling here is
    what turns "Run health checks" into a real check instead of just recording a URL."""
    for _ in range(_HEALTH_CHECK_ATTEMPTS):
        try:
            response = httpx.get(url, timeout=10.0, follow_redirects=True)
            if response.status_code < 500:
                return True
        except httpx.HTTPError:
            pass
        time.sleep(_HEALTH_CHECK_INTERVAL_S)
    return False


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
        step_rows[step_name].started_at = datetime.now(timezone.utc)
        db.commit()

    def finish(step_name: str) -> None:
        step_rows[step_name].status = DeploymentStatus.COMPLETE
        step_rows[step_name].finished_at = datetime.now(timezone.utc)
        db.commit()

    def fail(step_name: str, reason: str) -> NoReturn:
        step_rows[step_name].status = DeploymentStatus.FAILED
        step_rows[step_name].finished_at = datetime.now(timezone.utc)
        step_rows[step_name].reason = reason
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
    hostname = _candidate_hostname()
    zerops_yaml = _generate_zerops_yaml(project, hostname)
    finish("Prepare deployment definition")

    settings = get_settings()
    zerops = get_zerops_client()
    if zerops is None or not settings.zerops_project_id:
        fail(
            "Create twin service",
            "ZEROPS_API_TOKEN/ZEROPS_PROJECT_ID is not configured — twin provisioning "
            "requires both.",
        )

    start("Create twin service")
    try:
        # KNOWN GAP: env_vars here (plan.txt §17's candidate-only config, e.g. a test
        # DATABASE_URL) is confirmed non-functional — verified by direct testing that
        # neither `envSecrets` nor `envVariables` on this import YAML actually reach the
        # container (silently dropped, no error, nothing shows in the service's env
        # listing). Still passed through in case Zerops fixes this service-side, but the
        # real mechanism (if one exists) hasn't been found yet.
        service_stack_id = zerops.import_service_stack(
            settings.zerops_project_id,
            hostname=hostname,
            service_type=project.zerops_runtime,
            env_vars=_env_vars_dict(project) or None,
        )
    except httpx.HTTPError as exc:
        fail("Create twin service", str(exc))
    # Record the id immediately, before anything that could still fail — otherwise a
    # later failure in this same step leaves a real Zerops service created but
    # untracked in our DB, which _cleanup_candidate can never find or delete, and its
    # hostname permanently blocks retries (hostnames are deterministic per release).
    environment.zerops_service_stack_id = service_stack_id
    db.commit()
    finish("Create twin service")

    start("Upload twin code")
    try:
        tarball = download_repo_tarball(project.repository, release.commit_sha, token=project.github_token)
    except GitHubError as exc:
        fail("Upload twin code", str(exc))
    tarball = _strip_tarball_root(tarball)
    if project.root_directory:
        tarball = _strip_to_subdirectory(tarball, project.root_directory)
    try:
        app_version_id, upload_url = zerops.create_app_version(service_stack_id)
        zerops.upload_artifact(upload_url, tarball)
    except httpx.HTTPError as exc:
        fail("Upload twin code", str(exc))
    finish("Upload twin code")

    start("Build and deploy twin")
    try:
        zerops.build_and_deploy(app_version_id, zerops_yaml)
    except httpx.HTTPError as exc:
        fail("Build and deploy twin", str(exc))

    deadline = time.monotonic() + _BUILD_POLL_TIMEOUT_S
    status = "WAITING_TO_BUILD"
    while time.monotonic() < deadline:
        app_version = zerops.get_app_version(app_version_id)
        status = app_version.get("status", status)
        if status in _TERMINAL_STATUSES:
            break
        time.sleep(_BUILD_POLL_INTERVAL_S)
    if status != "ACTIVE":
        fail("Build and deploy twin", f"Build ended with status {status}")
    finish("Build and deploy twin")

    start("Run health checks")
    # Must happen after the build, not at service creation — enable-subdomain-access
    # requires the service to already be recognized as HTTP (i.e. have `ports` with
    # httpSupport from the deploy-time zerops.yaml), which only exists once a build has
    # actually run. Calling it earlier 400s with "Service stack is not http or https".
    try:
        zerops.enable_subdomain_access(service_stack_id)
    except httpx.HTTPError as exc:
        fail("Run health checks", f"Could not enable subdomain access: {exc}")
    public_url = _public_url(zerops, service_stack_id)
    if not public_url:
        fail("Run health checks", "Twin deployed but has no public URL")
    environment.api_url = public_url
    db.commit()
    if not _wait_for_healthy(public_url):
        fail(
            "Run health checks",
            f"Twin deployed to {public_url} but never responded successfully after "
            f"{_HEALTH_CHECK_ATTEMPTS * _HEALTH_CHECK_INTERVAL_S:.0f}s — check the app's own "
            "logs on Zerops, it likely crashed on startup",
        )
    finish("Run health checks")

    return environment
