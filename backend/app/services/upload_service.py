from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.storage import storage_paths_for_hash
from app.db.models.image import ImageRecord
from app.services.hash_file import sha256_bytes
from app.services.thumbnailer import generate_thumbnail

MAX_UPLOAD_FILE_SIZE_BYTES = 1_048_576


@dataclass
class UploadedImageSummary:
    id: str
    sha256: str
    processing_state: str
    thumbnail_url: str


@dataclass
class UploadIngestResult:
    duplicate: bool
    image: UploadedImageSummary


def _to_image_summary(image: ImageRecord) -> UploadedImageSummary:
    thumbnail_url = image.thumbnail_path or ""
    return UploadedImageSummary(
        id=image.id,
        sha256=image.sha256,
        processing_state=image.processing_state,
        thumbnail_url=thumbnail_url,
    )


def _cleanup_file(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


def _is_duplicate_sha_integrity_error(error: IntegrityError) -> bool:
    message = str(error.orig).lower() if error.orig is not None else ""
    return "unique constraint failed" in message and "images.sha256" in message


def ingest_uploaded_file(session: Session, file: UploadFile) -> UploadIngestResult:
    payload = file.file.read(MAX_UPLOAD_FILE_SIZE_BYTES + 1)
    if len(payload) > MAX_UPLOAD_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded file exceeds maximum size",
        )
    digest = sha256_bytes(payload)

    existing = session.scalar(select(ImageRecord).where(ImageRecord.sha256 == digest))
    if existing is not None:
        return UploadIngestResult(duplicate=True, image=_to_image_summary(existing))

    ext = (file.filename or "upload.bin").rsplit(".", 1)[-1].lower()
    image_path, thumb_path = storage_paths_for_hash(digest, ext)
    storage_rel_path = f"images/{digest[:2]}/{digest}.{ext}"
    thumbnail_rel_path = f"{digest[:2]}/{digest}.jpg"
    image_path.write_bytes(payload)

    try:
        width, height = generate_thumbnail(payload, thumb_path)

        image = ImageRecord(
            sha256=digest,
            ext=ext,
            mime_type=file.content_type or "application/octet-stream",
            file_size=len(payload),
            width=width,
            height=height,
            original_name=file.filename or "upload.bin",
            storage_path=storage_rel_path,
            thumbnail_path=thumbnail_rel_path,
            processing_state="processing",
            embedding_state="not_requested",
        )
        session.add(image)
        session.commit()
        session.refresh(image)
    except IntegrityError as error:
        session.rollback()
        duplicate = (
            session.execute(select(ImageRecord).where(ImageRecord.sha256 == digest))
            .scalars()
            .first()
        )
        if _is_duplicate_sha_integrity_error(error) and duplicate is not None:
            if duplicate.storage_path != storage_rel_path:
                _cleanup_file(image_path)
            if duplicate.thumbnail_path != thumbnail_rel_path:
                _cleanup_file(thumb_path)
            return UploadIngestResult(
                duplicate=True, image=_to_image_summary(duplicate)
            )
        _cleanup_file(image_path)
        _cleanup_file(thumb_path)
        raise
    except Exception:
        session.rollback()
        _cleanup_file(image_path)
        _cleanup_file(thumb_path)
        raise

    return UploadIngestResult(duplicate=False, image=_to_image_summary(image))
