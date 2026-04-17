import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, or_, select, update
from sqlalchemy.orm import Session

from app.db.models.task import ProcessingTaskRecord

DEFAULT_LEASE_MINUTES = 5
MAX_LEASE_ATTEMPTS = 50


def enqueue_processing_task(
    *,
    session: Session,
    task_type: str,
    payload: dict[str, object],
) -> ProcessingTaskRecord:
    task = ProcessingTaskRecord(
        task_type=task_type,
        status="pending",
        payload_json=json.dumps(payload, ensure_ascii=False),
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def lease_next_task(
    *,
    session: Session,
    worker_id: str,
    task_types: list[str],
) -> ProcessingTaskRecord | None:
    if not task_types:
        return None

    for _ in range(MAX_LEASE_ATTEMPTS):
        now = datetime.now(timezone.utc)
        lease_expires_at = now + timedelta(minutes=DEFAULT_LEASE_MINUTES)

        candidate = session.scalar(
            select(ProcessingTaskRecord.id)
            .where(ProcessingTaskRecord.task_type.in_(task_types))
            .where(
                or_(
                    ProcessingTaskRecord.status == "pending",
                    and_(
                        ProcessingTaskRecord.status == "leased",
                        ProcessingTaskRecord.lease_expires_at.is_not(None),
                        ProcessingTaskRecord.lease_expires_at <= now,
                    ),
                )
            )
            .order_by(ProcessingTaskRecord.created_at.asc())
            .limit(1)
        )
        if candidate is None:
            return None

        result = session.execute(
            update(ProcessingTaskRecord)
            .where(ProcessingTaskRecord.id == candidate)
            .where(
                or_(
                    ProcessingTaskRecord.status == "pending",
                    and_(
                        ProcessingTaskRecord.status == "leased",
                        ProcessingTaskRecord.lease_expires_at.is_not(None),
                        ProcessingTaskRecord.lease_expires_at <= now,
                    ),
                )
            )
            .values(
                status="leased",
                lease_owner=worker_id,
                lease_expires_at=lease_expires_at,
            )
            .execution_options(synchronize_session=False)
        )
        if result.rowcount == 0:
            continue

        session.commit()
        session.expire_all()
        task = session.scalar(
            select(ProcessingTaskRecord).where(ProcessingTaskRecord.id == candidate)
        )
        if task is not None:
            return task

    return None


def serialize_task(task: ProcessingTaskRecord) -> dict[str, object]:
    payload = json.loads(task.payload_json)
    return {
        "id": task.id,
        "task_type": task.task_type,
        "status": task.status,
        "lease_owner": task.lease_owner,
        "lease_expires_at": (
            task.lease_expires_at.isoformat()
            if task.lease_expires_at is not None
            else None
        ),
        "payload": payload,
    }
