from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models.image import ImageRecord
from app.db.models.image_tag import ImageTagRecord
from app.db.models.tag import TagRecord
from app.schemas.tags import StructuredTagInput


class MissingImageIdsError(ValueError):
    def __init__(self, missing_image_ids: list[str]) -> None:
        super().__init__("Some image_ids do not exist")
        self.missing_image_ids = missing_image_ids


def _to_normalized_key(tag: StructuredTagInput) -> str:
    return f"{tag.category}:{tag.name}"


def apply_batch_mutation(
    *,
    session: Session,
    image_ids: list[str],
    add_tags: list[StructuredTagInput],
    remove_normalized_keys: list[str],
) -> int:
    if not image_ids:
        return 0

    existing_image_ids = set(
        session.scalars(
            select(ImageRecord.id).where(ImageRecord.id.in_(image_ids))
        ).all()
    )
    missing_image_ids = [
        image_id for image_id in image_ids if image_id not in existing_image_ids
    ]
    if missing_image_ids:
        raise MissingImageIdsError(missing_image_ids)

    for entry in add_tags:
        normalized_key = _to_normalized_key(entry)
        tag = session.scalar(
            select(TagRecord).where(TagRecord.normalized_key == normalized_key)
        )
        if tag is None:
            tag = TagRecord(
                category=entry.category,
                name=entry.name,
                normalized_key=normalized_key,
                source="manual",
            )
            session.add(tag)
            session.flush()

        for image_id in image_ids:
            existing_link = session.scalar(
                select(ImageTagRecord)
                .where(ImageTagRecord.image_id == image_id)
                .where(ImageTagRecord.tag_id == tag.id)
            )
            if existing_link is None:
                session.add(
                    ImageTagRecord(image_id=image_id, tag_id=tag.id, source="manual")
                )

    if remove_normalized_keys:
        removable_tag_ids = session.scalars(
            select(TagRecord.id).where(
                TagRecord.normalized_key.in_(remove_normalized_keys)
            )
        ).all()
        if removable_tag_ids:
            session.execute(
                delete(ImageTagRecord)
                .where(ImageTagRecord.image_id.in_(image_ids))
                .where(ImageTagRecord.tag_id.in_(removable_tag_ids))
            )

    session.commit()
    return len(image_ids)
