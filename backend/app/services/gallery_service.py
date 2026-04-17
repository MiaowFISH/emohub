from pathlib import Path

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.core.storage import resolve_storage_path
from app.db.models.image import ImageRecord
from app.db.models.image_tag import ImageTagRecord
from app.db.models.tag import TagRecord
from app.schemas.gallery import GalleryItem, GalleryListResponse


def list_gallery(
    *,
    session: Session,
    query: str,
    normalized_tags: list[str],
) -> GalleryListResponse:
    statement: Select[tuple[ImageRecord]] = select(ImageRecord).options(
        selectinload(ImageRecord.tag_links).selectinload(ImageTagRecord.tag)
    )

    if query.strip():
        keyword = f"%{query.strip()}%"
        statement = statement.where(
            ImageRecord.id.in_(
                select(ImageRecord.id)
                .outerjoin(ImageTagRecord, ImageTagRecord.image_id == ImageRecord.id)
                .outerjoin(TagRecord, TagRecord.id == ImageTagRecord.tag_id)
                .where(
                    ImageRecord.original_name.ilike(keyword)
                    | TagRecord.normalized_key.ilike(keyword)
                )
            )
        )

    for normalized_key in normalized_tags:
        statement = statement.where(
            ImageRecord.id.in_(
                select(ImageTagRecord.image_id)
                .join(TagRecord, TagRecord.id == ImageTagRecord.tag_id)
                .where(TagRecord.normalized_key == normalized_key)
            )
        )

    rows = session.scalars(statement.order_by(ImageRecord.created_at.desc())).all()
    items = [
        GalleryItem(
            id=row.id,
            original_name=row.original_name,
            thumbnail_url=row.thumbnail_path or "",
            processing_state=row.processing_state,
            embedding_state=row.embedding_state,
            tags=[link.tag.normalized_key for link in row.tag_links],
        )
        for row in rows
    ]
    return GalleryListResponse(items=items)


def _resolve_thumbnail_path(storage_path: str | None) -> Path | None:
    if not storage_path:
        return None

    path = Path(storage_path)
    if path.is_absolute():
        return path

    return Path(settings.thumbnail_root) / path


def delete_images(*, session: Session, image_ids: list[str]) -> int:
    if not image_ids:
        return 0

    rows = session.scalars(
        select(ImageRecord).where(ImageRecord.id.in_(image_ids))
    ).all()
    stored_paths = [resolve_storage_path(row.storage_path) for row in rows]
    thumbnail_paths = [_resolve_thumbnail_path(row.thumbnail_path) for row in rows]

    for row in rows:
        session.delete(row)
    session.commit()

    for path in [*stored_paths, *thumbnail_paths]:
        if path is not None:
            path.unlink(missing_ok=True)

    return len(rows)
