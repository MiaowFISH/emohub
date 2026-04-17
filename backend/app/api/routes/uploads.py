from fastapi import APIRouter, Depends, UploadFile
from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.db.models.image import ImageRecord
from app.schemas.uploads import (
    UploadPrecheckExisting,
    UploadPrecheckRequest,
    UploadPrecheckResponse,
    UploadSingleFileResponse,
    UploadedImageResponse,
)
from app.services.upload_service import ingest_uploaded_file

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/precheck", response_model=UploadPrecheckResponse)
def upload_precheck(
    payload: UploadPrecheckRequest,
    session: Session = Depends(get_session),
) -> UploadPrecheckResponse:
    rows = session.scalars(
        select(ImageRecord).where(ImageRecord.sha256.in_(payload.hashes))
    ).all()

    existing = [
        UploadPrecheckExisting(hash=row.sha256, image_id=row.id) for row in rows
    ]
    existing_hashes = {row.sha256 for row in rows}
    missing = [value for value in payload.hashes if value not in existing_hashes]

    return UploadPrecheckResponse(existing=existing, missing=missing)


@router.post(
    "/files",
    status_code=status.HTTP_201_CREATED,
    response_model=UploadSingleFileResponse,
)
def upload_single_file(
    file: UploadFile,
    session: Session = Depends(get_session),
) -> UploadSingleFileResponse:
    result = ingest_uploaded_file(session, file)
    return UploadSingleFileResponse(
        duplicate=result.duplicate,
        image=UploadedImageResponse(
            id=result.image.id,
            sha256=result.image.sha256,
            processing_state=result.image.processing_state,
            thumbnail_url=result.image.thumbnail_url,
        ),
    )
