from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.image import ImageRecord
    from app.db.models.tag import TagRecord


class ImageTagRecord(Base):
    __tablename__ = "image_tags"
    __table_args__ = (
        UniqueConstraint("image_id", "tag_id", name="uq_image_tags_image_tag"),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid4().hex
    )
    image_id: Mapped[str] = mapped_column(
        ForeignKey("images.id", ondelete="CASCADE"), index=True
    )
    tag_id: Mapped[str] = mapped_column(
        ForeignKey("tags.id", ondelete="CASCADE"), index=True
    )
    source: Mapped[str] = mapped_column(String(32), default="manual")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    image: Mapped[ImageRecord] = relationship(back_populates="tag_links")
    tag: Mapped[TagRecord] = relationship(back_populates="image_links")
