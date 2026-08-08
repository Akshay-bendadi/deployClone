import uuid

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload

from app.api.deps import SessionDep
from app.models.comparison import Comparison
from app.models.enums import ReleaseStatus
from app.models.project import Project
from app.models.release import Release
from app.models.risk_report import RiskReport
from app.models.test_run import TestRun
from app.schemas.comparison import ComparisonRead
from app.schemas.release import ReleaseCreate, ReleaseRead
from app.schemas.risk_report import RiskReportRead
from app.schemas.test_run import TestRunRead
from app.worker.queue import get_release_queue

projects_router = APIRouter(prefix="/api/v1/projects", tags=["releases"])
releases_router = APIRouter(prefix="/api/v1/releases", tags=["releases"])


def _get_release_or_404(db: SessionDep, release_id: uuid.UUID) -> Release:
    release = db.get(Release, release_id)
    if release is None:
        raise HTTPException(status_code=404, detail="Release not found")
    return release


@projects_router.post("/{project_id}/releases", response_model=ReleaseRead, status_code=201)
def create_release(project_id: uuid.UUID, payload: ReleaseCreate, db: SessionDep) -> Release:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    release = Release(project_id=project_id, status=ReleaseStatus.CREATED, **payload.model_dump())
    db.add(release)
    db.commit()
    db.refresh(release)
    return release


@projects_router.get("/{project_id}/releases", response_model=list[ReleaseRead])
def list_releases(project_id: uuid.UUID, db: SessionDep) -> list[Release]:
    return list(
        db.query(Release).filter(Release.project_id == project_id).order_by(Release.created_at.desc()).all()
    )


@releases_router.get("/{release_id}", response_model=ReleaseRead)
def get_release(release_id: uuid.UUID, db: SessionDep) -> Release:
    return _get_release_or_404(db, release_id)


@releases_router.post("/{release_id}/test", response_model=ReleaseRead)
def trigger_test_release(release_id: uuid.UUID, db: SessionDep) -> Release:
    """Kicks off the candidate deployment lifecycle (plan.txt §16) as a background job."""
    release = _get_release_or_404(db, release_id)

    release.status = ReleaseStatus.DEPLOYING
    db.commit()
    db.refresh(release)

    get_release_queue().enqueue("app.worker.tasks.run_release_test", str(release.id))
    return release


@releases_router.get("/{release_id}/test-runs", response_model=list[TestRunRead])
def list_test_runs(release_id: uuid.UUID, db: SessionDep) -> list[TestRun]:
    _get_release_or_404(db, release_id)
    return list(
        db.query(TestRun).filter(TestRun.release_id == release_id).order_by(TestRun.created_at).all()
    )


@releases_router.get("/{release_id}/comparisons", response_model=list[ComparisonRead])
def list_comparisons(release_id: uuid.UUID, db: SessionDep) -> list[Comparison]:
    _get_release_or_404(db, release_id)
    return list(
        db.query(Comparison)
        .filter(Comparison.release_id == release_id)
        .options(selectinload(Comparison.regressions))
        .order_by(Comparison.created_at)
        .all()
    )


@releases_router.get("/{release_id}/risk-report", response_model=RiskReportRead)
def get_risk_report(release_id: uuid.UUID, db: SessionDep) -> RiskReport:
    _get_release_or_404(db, release_id)
    risk_report = db.query(RiskReport).filter(RiskReport.release_id == release_id).one_or_none()
    if risk_report is None:
        raise HTTPException(status_code=404, detail="Risk report not ready yet")
    return risk_report
