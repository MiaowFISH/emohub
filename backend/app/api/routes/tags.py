from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.schemas.tags import BatchTagMutation
from app.services.tag_service import MissingImageIdsError, apply_batch_mutation

router = APIRouter(prefix="/api/tags", tags=["tags"])


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
