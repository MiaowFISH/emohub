from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.db.models.duplicate import DuplicateCandidateRecord

router = APIRouter(prefix="/api/duplicates", tags=["duplicates"])


@router.get("")
def list_duplicates(
    session: Session = Depends(get_session),
) -> dict[str, list[dict[str, object]]]:
    rows = session.scalars(
        select(DuplicateCandidateRecord)
        .where(DuplicateCandidateRecord.status == "pending")
        .order_by(DuplicateCandidateRecord.created_at.desc())
    ).all()

    return {
        "items": [
            {
                "id": row.id,
                "image_a_id": row.image_a_id,
                "image_b_id": row.image_b_id,
                "score": row.score,
                "status": row.status,
            }
            for row in rows
        ]
    }
