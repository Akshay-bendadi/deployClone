import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models.project import Project
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowRead

router = APIRouter(prefix="/api/v1/projects", tags=["workflows"])


@router.post("/{project_id}/workflows", response_model=WorkflowRead, status_code=201)
def create_workflow(project_id: uuid.UUID, payload: WorkflowCreate, db: SessionDep) -> Workflow:
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")

    workflow = Workflow(
        project_id=project_id,
        name=payload.name,
        steps=[step.model_dump() for step in payload.steps],
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("/{project_id}/workflows", response_model=list[WorkflowRead])
def list_workflows(project_id: uuid.UUID, db: SessionDep) -> list[Workflow]:
    return list(
        db.query(Workflow).filter(Workflow.project_id == project_id).order_by(Workflow.created_at).all()
    )
