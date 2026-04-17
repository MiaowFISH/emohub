from __future__ import annotations

from typing import Protocol

from sqlalchemy.orm import Session

from app.core.storage import resolve_storage_path
from app.db.models.image import ImageRecord
from app.services.vector_index import LocalVectorIndex, get_vector_index


class ImageEmbedder(Protocol):
    def embed_image(self, image_path: str) -> list[float]: ...


def run_embed_image_job(
    *,
    session: Session,
    image_id: str,
    embedder: ImageEmbedder,
    vector_index: LocalVectorIndex | None = None,
) -> None:
    image = session.get(ImageRecord, image_id)
    if image is None:
        raise ValueError(f"image '{image_id}' does not exist")

    resolved_vector_index = vector_index or get_vector_index()
    embedding = embedder.embed_image(str(resolve_storage_path(image.storage_path)))
    resolved_vector_index.upsert_image_embedding(
        image_id=image.id,
        embedding=embedding,
    )
    image.embedding_state = "ready"
    session.add(image)
    session.commit()
