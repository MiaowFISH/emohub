from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DuplicateCandidateRecord(Base):
    __tablename__ = "duplicate_candidates"
    __table_args__ = (
        UniqueConstraint(
            "image_a_id", "image_b_id", name="uq_duplicate_candidates_image_pair"
        ),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: uuid4().hex
    )
    image_a_id: Mapped[str] = mapped_column(
        ForeignKey("images.id", ondelete="CASCADE"), index=True
    )
    image_b_id: Mapped[str] = mapped_column(
        ForeignKey("images.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
