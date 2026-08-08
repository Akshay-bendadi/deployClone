import uuid

from fastapi import APIRouter

from app.api.deps import CurrentUserDep, SessionDep
from app.api.routes.projects import get_owned_project_or_404
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowRead

router = APIRouter(prefix="/api/v1/projects", tags=["workflows"])


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
