import uuid

import httpx
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import joinedload, selectinload

from app.api.deps import CurrentUserDep, SessionDep
from app.api.routes.projects import get_owned_project_or_404
from app.models.comparison import Comparison
from app.models.enums import EnvironmentKind, ReleaseStatus
from app.models.environment import Environment
from app.models.release import Release
from app.models.risk_report import RiskReport
from app.models.test_run import TestRun
from app.schemas.comparison import ComparisonRead
from app.schemas.environment import EnvironmentRead
from app.schemas.release import ReleaseCreate, ReleaseRead
from app.schemas.risk_report import RiskReportRead
from app.schemas.test_run import TestRunRead
from app.services.github_client import BranchDiff, GitHubError, compare_branches, resolve_branch_commit
from app.services.zerops_client import get_zerops_client
from app.worker.queue import enqueue_release_test

projects_router = APIRouter(prefix="/api/v1/projects", tags=["releases"])
releases_router = APIRouter(prefix="/api/v1/releases", tags=["releases"])


def get_owned_release_or_404(db: SessionDep, release_id: uuid.UUID, current_user: CurrentUserDep) -> Release:
    release = (
        db.query(Release).options(joinedload(Release.project)).filter(Release.id == release_id).one_or_none()
    )
    if release is None or release.project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Release not found")
    return release


@projects_router.post("/{project_id}/releases", response_model=ReleaseRead, status_code=201)
def create_release(
    project_id: uuid.UUID, payload: ReleaseCreate, db: SessionDep, current_user: CurrentUserDep
) -> Release:
    project = get_owned_project_or_404(db, project_id, current_user)

    try:
        commit_sha = resolve_branch_commit(project.repository, payload.branch, token=project.github_token)
    except GitHubError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    release = Release(
        project_id=project_id,
        status=ReleaseStatus.CREATED,
        version=payload.version,
        branch=payload.branch,
        commit_sha=commit_sha,
    )
    db.add(release)
    db.commit()
    db.refresh(release)
    return release


@projects_router.get("/{project_id}/releases", response_model=list[ReleaseRead])
def list_releases(project_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> list[Release]:
    get_owned_project_or_404(db, project_id, current_user)
    return list(
        db.query(Release).filter(Release.project_id == project_id).order_by(Release.created_at.desc()).all()
    )


@releases_router.get("/{release_id}", response_model=ReleaseRead)
def get_release(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> Release:
    return get_owned_release_or_404(db, release_id, current_user)


@releases_router.post("/{release_id}/test", response_model=ReleaseRead)
def trigger_test_release(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> Release:
    """Kicks off the candidate deployment lifecycle (plan.txt §16) as a background job."""
    release = get_owned_release_or_404(db, release_id, current_user)

    release.status = ReleaseStatus.DEPLOYING
    db.commit()
    db.refresh(release)

    enqueue_release_test(str(release.id))
    return release


@releases_router.get("/{release_id}/environments", response_model=list[EnvironmentRead])
def list_environments(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> list[Environment]:
    get_owned_release_or_404(db, release_id, current_user)
    return list(
        db.query(Environment).filter(Environment.release_id == release_id).order_by(Environment.created_at).all()
    )


@releases_router.post("/{release_id}/candidate/teardown", response_model=EnvironmentRead)
def teardown_candidate(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> Environment:
    """Manually deletes the latest candidate's live Zerops service.

    A release that finishes testing with a real verdict deliberately leaves its
    candidate running so it can be inspected (see app/worker/tasks.py) — this is how
    the user tears it down themselves once they're done, instead of it running (and
    billing) forever.
    """
    get_owned_release_or_404(db, release_id, current_user)
    candidate = (
        db.query(Environment)
        .filter(Environment.release_id == release_id, Environment.kind == EnvironmentKind.CANDIDATE)
        .order_by(Environment.created_at.desc())
        .first()
    )
    if candidate is None:
        raise HTTPException(status_code=404, detail="No twin environment for this release")
    if not candidate.zerops_service_stack_id:
        raise HTTPException(status_code=400, detail="Twin has already been torn down")

    zerops = get_zerops_client()
    if zerops is None:
        raise HTTPException(status_code=503, detail="Zerops is not configured")

    try:
        zerops.delete_service_stack(candidate.zerops_service_stack_id)
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code not in (400, 404):
            raise HTTPException(status_code=502, detail="Failed to delete twin on Zerops") from exc

    candidate.zerops_service_stack_id = None
    db.commit()
    db.refresh(candidate)
    return candidate


@releases_router.get("/{release_id}/branch-diff", response_model=BranchDiff)
def get_branch_diff(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> BranchDiff:
    # Diffs against production_commit_sha (frozen at last deploy), not production_branch's
    # current tip — the tip may have moved since; what matters is the diff against what's
    # actually live.
    release = get_owned_release_or_404(db, release_id, current_user)
    project = release.project
    try:
        return compare_branches(
            project.repository, project.production_commit_sha, release.commit_sha, token=project.github_token
        )
    except GitHubError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@releases_router.get("/{release_id}/test-runs", response_model=list[TestRunRead])
def list_test_runs(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> list[TestRun]:
    get_owned_release_or_404(db, release_id, current_user)
    return list(
        db.query(TestRun).filter(TestRun.release_id == release_id).order_by(TestRun.created_at).all()
    )


@releases_router.get("/{release_id}/comparisons", response_model=list[ComparisonRead])
def list_comparisons(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> list[Comparison]:
    get_owned_release_or_404(db, release_id, current_user)
    return list(
        db.query(Comparison)
        .filter(Comparison.release_id == release_id)
        .options(selectinload(Comparison.regressions))
        .order_by(Comparison.created_at)
        .all()
    )


@releases_router.get("/{release_id}/risk-report", response_model=RiskReportRead)
def get_risk_report(release_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> RiskReport:
    get_owned_release_or_404(db, release_id, current_user)
    risk_report = db.query(RiskReport).filter(RiskReport.release_id == release_id).one_or_none()
    if risk_report is None:
        raise HTTPException(status_code=404, detail="Risk report not ready yet")
    return risk_report
