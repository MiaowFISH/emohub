from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.duplicate import DuplicateCandidateRecord
from app.db.models.image import ImageRecord
from app.services.vector_index import LocalVectorIndex, get_vector_index


def run_duplicate_scan_job(
    *,
    session: Session,
    image_id: str,
    threshold: float,
    vector_index: LocalVectorIndex | None = None,
) -> None:
    image = session.get(ImageRecord, image_id)
    if image is None:
        raise ValueError(f"image '{image_id}' does not exist")

    resolved_vector_index = vector_index or get_vector_index()
    neighbors = resolved_vector_index.nearest_neighbors(image_id=image_id, limit=10)
    for neighbor in neighbors:
        if neighbor.score < threshold:
            continue

        image_a_id, image_b_id = sorted((image_id, neighbor.image_id))
        existing = session.scalar(
            select(DuplicateCandidateRecord).where(
                DuplicateCandidateRecord.image_a_id == image_a_id,
                DuplicateCandidateRecord.image_b_id == image_b_id,
            )
        )
        if existing is not None:
            if neighbor.score > existing.score:
                existing.score = neighbor.score
                session.add(existing)
            continue

        session.add(
            DuplicateCandidateRecord(
                image_a_id=image_a_id,
                image_b_id=image_b_id,
                score=neighbor.score,
                status="pending",
            )
        )

    session.commit()
