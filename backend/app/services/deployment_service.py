"""Candidate deployment lifecycle (plan.txt §16).

Each lifecycle step is persisted as a Deployment row with a real status
(pending/in_progress/complete/failed) — per plan.txt §31, the frontend
deployment screen must show actual backend statuses, not fake animations.

Steps 1-2 (resolve commit, read zerops.yaml) are fully implemented against
GitHub's public raw-content API. Steps 3+ require the Zerops write API,
which is not yet verified (see zerops_client.py) — they fail loudly with a
clear reason instead of pretending to provision infrastructure.
"""

import re
from typing import NoReturn

import httpx
from sqlalchemy.orm import Session

from app.models.deployment import Deployment
from app.models.enums import DeploymentStatus, EnvironmentKind
from app.models.environment import Environment
from app.models.release import Release
from app.services.zerops_client import get_zerops_client

_GITHUB_REPO_RE = re.compile(r"github\.com[:/](?P<owner>[^/]+)/(?P<repo>[^/.]+)")

LIFECYCLE_STEPS = [
    "Resolve commit",
    "Read deployment definition",
    "Create candidate environment",
    "Create candidate services",
    "Deploy candidate",
    "Configure environment variables",
    "Create candidate database",
    "Run migrations",
    "Seed synthetic data",
    "Start workers",
    "Run health checks",
]


class DeploymentError(Exception):
    def __init__(self, step: str, reason: str) -> None:
        self.step = step
        self.reason = reason
        super().__init__(f"{step}: {reason}")


def _parse_github_repository(repository: str) -> tuple[str, str]:
    match = _GITHUB_REPO_RE.search(repository)
    if not match:
        raise ValueError(f"Not a recognizable GitHub repository: {repository!r}")
    return match.group("owner"), match.group("repo")


def fetch_deployment_definition(repository: str, commit_sha: str) -> str:
    """Fetches zerops.yaml from the repository at the given commit (plan.txt §7)."""
    owner, repo = _parse_github_repository(repository)
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{commit_sha}/zerops.yaml"
    response = httpx.get(url, timeout=15.0)
    if response.status_code == 404:
        raise DeploymentError("Read deployment definition", f"No zerops.yaml found at {commit_sha}")
    response.raise_for_status()
    return response.text


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

    start("Resolve commit")
    if not release.commit_sha:
        fail("Resolve commit", "Release has no commit SHA")
    finish("Resolve commit")

    start("Read deployment definition")
    try:
        fetch_deployment_definition(release.project.repository, release.commit_sha)
    except DeploymentError as exc:
        fail("Read deployment definition", exc.reason)
    except (httpx.HTTPError, ValueError) as exc:
        fail("Read deployment definition", str(exc))
    finish("Read deployment definition")

    zerops = get_zerops_client()
    if zerops is None:
        fail(
            "Create candidate environment",
            "ZEROPS_API_TOKEN is not configured — candidate provisioning requires a Zerops token.",
        )

    for step_name in LIFECYCLE_STEPS[2:]:
        start(step_name)
        fail(step_name, "Zerops write API not yet verified — see zerops_client.py TODOs.")

    return environment
