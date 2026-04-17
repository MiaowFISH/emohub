from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.schemas.gallery import (
    BatchDeleteRequest,
    BatchDeleteResponse,
    GalleryListResponse,
)
from app.services.gallery_service import delete_images, list_gallery

router = APIRouter(prefix="/api/gallery", tags=["gallery"])


@router.get("", response_model=GalleryListResponse)
def get_gallery(
    q: str = "",
    tag: list[str] | None = Query(default=None),
    session: Session = Depends(get_session),
) -> GalleryListResponse:
    return list_gallery(session=session, query=q, normalized_tags=tag or [])


@router.delete("/batch", response_model=BatchDeleteResponse)
def delete_gallery_batch(
    payload: BatchDeleteRequest,
    session: Session = Depends(get_session),
) -> BatchDeleteResponse:
    return BatchDeleteResponse(
        deleted=delete_images(session=session, image_ids=payload.ids)
    )
