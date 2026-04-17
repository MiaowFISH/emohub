from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_session
from app.services.task_queue import lease_next_task, serialize_task

router = APIRouter(prefix="/internal/tasks", tags=["internal-tasks"])


class TaskLeaseRequest(BaseModel):
    worker_id: str = Field(min_length=1)
    task_types: list[str] = Field(min_length=1)


class TaskLeaseResponse(BaseModel):
    task: dict[str, object] | None


@router.post("/lease", response_model=TaskLeaseResponse)
def lease_task(
    payload: TaskLeaseRequest,
    session: Session = Depends(get_session),
    internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
) -> TaskLeaseResponse:
    if not settings.internal_worker_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="internal worker api key not configured",
        )

    if internal_api_key != settings.internal_worker_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid internal api key",
        )

    task = lease_next_task(
        session=session,
        worker_id=payload.worker_id,
        task_types=payload.task_types,
    )
    return TaskLeaseResponse(task=None if task is None else serialize_task(task))
