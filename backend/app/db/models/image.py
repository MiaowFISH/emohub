from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.image_tag import ImageTagRecord


class ImageRecord(Base):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid4().hex
    )
    sha256: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    ext: Mapped[str] = mapped_column(String(16))
    mime_type: Mapped[str] = mapped_column(String(64))
    file_size: Mapped[int] = mapped_column(Integer)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    original_name: Mapped[str] = mapped_column(String(255))
    storage_path: Mapped[str] = mapped_column(String(512))
    thumbnail_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    processing_state: Mapped[str] = mapped_column(String(32), default="processing")
    embedding_state: Mapped[str] = mapped_column(String(32), default="not_requested")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    tag_links: Mapped[list[ImageTagRecord]] = relationship(
        back_populates="image", cascade="all, delete-orphan"
    )
