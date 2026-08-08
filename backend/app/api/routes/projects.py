import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectRead

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: SessionDep) -> Project:
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectRead])
def list_projects(db: SessionDep) -> list[Project]:
    return list(db.query(Project).order_by(Project.created_at.desc()).all())


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: uuid.UUID, db: SessionDep) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
