import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUserDep, SessionDep
from app.api.routes.projects import get_owned_project_or_404
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowRead

router = APIRouter(prefix="/api/v1/projects", tags=["workflows"])
workflow_router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


def get_owned_workflow_or_404(db: SessionDep, workflow_id: uuid.UUID, current_user: CurrentUserDep) -> Workflow:
    workflow = db.get(Workflow, workflow_id)
    if workflow is None or workflow.project.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.post("/{project_id}/workflows", response_model=WorkflowRead, status_code=201)
def create_workflow(
    project_id: uuid.UUID, payload: WorkflowCreate, db: SessionDep, current_user: CurrentUserDep
) -> Workflow:
    get_owned_project_or_404(db, project_id, current_user)

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
def list_workflows(project_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> list[Workflow]:
    get_owned_project_or_404(db, project_id, current_user)
    return list(
        db.query(Workflow).filter(Workflow.project_id == project_id).order_by(Workflow.created_at).all()
    )


@workflow_router.patch("/{workflow_id}", response_model=WorkflowRead)
def update_workflow(
    workflow_id: uuid.UUID, payload: WorkflowCreate, db: SessionDep, current_user: CurrentUserDep
) -> Workflow:
    workflow = get_owned_workflow_or_404(db, workflow_id, current_user)
    workflow.name = payload.name
    workflow.steps = [step.model_dump() for step in payload.steps]
    db.commit()
    db.refresh(workflow)
    return workflow


@workflow_router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: uuid.UUID, db: SessionDep, current_user: CurrentUserDep) -> None:
    workflow = get_owned_workflow_or_404(db, workflow_id, current_user)
    db.delete(workflow)
    db.commit()
