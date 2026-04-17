from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.image_tag import ImageTagRecord


class TagRecord(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid4().hex
    )
    category: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(128))
    normalized_key: Mapped[str] = mapped_column(String(256), unique=True, index=True)
    source: Mapped[str] = mapped_column(String(32), default="manual")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    image_links: Mapped[list[ImageTagRecord]] = relationship(
        back_populates="tag", cascade="all, delete-orphan"
    )
