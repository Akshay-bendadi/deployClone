import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentUserDep, SessionDep
from app.models.project import Project
from app.models.release import Release
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.github_client import GitHubError, list_branches, resolve_branch_commit

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


def get_owned_project_or_404(db: SessionDep, project_id: uuid.UUID, current_user: CurrentUserDep) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _attach_latest_release_status(db: SessionDep, project: Project) -> Project:
    # Non-persisted attribute — Pydantic picks it up via from_attributes.
    latest = (
        db.query(Release.status)
        .filter(Release.project_id == project.id)
        .order_by(Release.created_at.desc())
        .first()
    )
    project.latest_release_status = latest[0] if latest else None  # type: ignore[attr-defined]
    return project


def _resolve_production_commit(repository: str, branch: str, token: str | None) -> str:
    try:
        return resolve_branch_commit(repository, branch, token=token)
    except GitHubError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


class BranchesRequest(BaseModel):
    repository: str
    # blank/omitted means "use this project's stored token" when project_id is given,
    # otherwise treated as a public repo
    github_token: str | None = None


class BranchesResponse(BaseModel):
    branches: list[str]


@router.post("/branches", response_model=BranchesResponse)
def list_repo_branches(payload: BranchesRequest, current_user: CurrentUserDep) -> BranchesResponse:
    try:
        return BranchesResponse(branches=list_branches(payload.repository, token=payload.github_token))
    except GitHubError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{project_id}/branches", response_model=BranchesResponse)
def list_project_branches(project_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> BranchesResponse:
    project = get_owned_project_or_404(db, project_id, current_user)
    try:
        return BranchesResponse(branches=list_branches(project.repository, token=project.github_token))
    except GitHubError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: SessionDep, current_user: CurrentUserDep) -> Project:
    commit_sha = _resolve_production_commit(
        payload.repository, payload.production_branch, payload.github_token
    )
    project = Project(
        owner_id=current_user.id,
        production_commit_sha=commit_sha,
        **payload.model_dump(),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _attach_latest_release_status(db, project)


@router.get("", response_model=list[ProjectRead])
def list_projects(db: SessionDep, current_user: CurrentUserDep) -> list[Project]:
    projects = (
        db.query(Project)
        .filter(Project.owner_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )
    return [_attach_latest_release_status(db, project) for project in projects]


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> Project:
    project = get_owned_project_or_404(db, project_id, current_user)
    return _attach_latest_release_status(db, project)


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: uuid.UUID, payload: ProjectUpdate, db: SessionDep, current_user: CurrentUserDep
) -> Project:
    project = get_owned_project_or_404(db, project_id, current_user)
    # A blank token means "keep the existing one" — see ProjectUpdate.github_token docstring.
    effective_token = payload.github_token or project.github_token
    commit_sha = _resolve_production_commit(payload.repository, payload.production_branch, effective_token)

    update_fields = payload.model_dump(exclude={"github_token"})
    for field, value in update_fields.items():
        setattr(project, field, value)
    if payload.github_token:
        project.github_token = payload.github_token
    project.production_commit_sha = commit_sha

    db.commit()
    db.refresh(project)
    return _attach_latest_release_status(db, project)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> None:
    project = get_owned_project_or_404(db, project_id, current_user)
    db.delete(project)
    db.commit()
