from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.core.storage import resolve_storage_path
from app.db.models.image import ImageRecord

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("/{image_id}/full", include_in_schema=False)
def get_full_image(
    image_id: str,
    session: Session = Depends(get_session),
) -> FileResponse:
    image = session.get(ImageRecord, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    image_path = resolve_storage_path(image.storage_path)
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")

    return FileResponse(
        image_path, media_type=image.mime_type, filename=image.original_name
    )
