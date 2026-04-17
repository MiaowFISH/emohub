from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.db.models.image_tag import ImageTagRecord
from app.db.models.tag import TagRecord
from app.schemas.tags import BatchTagMutation
from app.services.tag_service import MissingImageIdsError, apply_batch_mutation

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("")
def list_tags(session: Session = Depends(get_session)) -> dict[str, object]:
    rows = session.execute(
        select(
            TagRecord.id,
            TagRecord.name,
            TagRecord.category,
            TagRecord.created_at,
            func.count(ImageTagRecord.id).label("image_count"),
        )
        .outerjoin(ImageTagRecord, ImageTagRecord.tag_id == TagRecord.id)
        .group_by(TagRecord.id)
        .order_by(func.count(ImageTagRecord.id).desc(), TagRecord.created_at.desc())
    ).all()

    return {
        "success": True,
        "data": [
            {
                "id": row.id,
                "name": row.name,
                "category": row.category,
                "createdAt": row.created_at.isoformat(),
                "imageCount": row.image_count,
            }
            for row in rows
        ],
    }


@router.post("/batch")
def batch_mutate_tags(
    payload: BatchTagMutation,
    session: Session = Depends(get_session),
) -> dict[str, int]:
    try:
        updated = apply_batch_mutation(
            session=session,
            image_ids=payload.image_ids,
            add_tags=payload.add,
            remove_normalized_keys=payload.remove,
        )
    except MissingImageIdsError as error:
        raise HTTPException(
            status_code=400,
            detail={"image_ids": error.missing_image_ids},
        ) from error
    return {"updated": updated}
