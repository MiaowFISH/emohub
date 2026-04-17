from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

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
