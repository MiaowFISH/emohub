from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.core.config import settings
from app.db.models.duplicate import DuplicateCandidateRecord
from app.db.models.image import ImageRecord
from app.services.vector_index import get_vector_index
from app.worker.jobs.duplicate_scan import run_duplicate_scan_job
from app.worker.jobs.embed_image import run_embed_image_job


def _image_factory(db_session):
    def _create(**overrides) -> ImageRecord:
        sha = overrides.pop("sha256", uuid4().hex)
        image = ImageRecord(
            sha256=sha,
            ext=overrides.pop("ext", "png"),
            mime_type=overrides.pop("mime_type", "image/png"),
            file_size=overrides.pop("file_size", 42),
            width=overrides.pop("width", 100),
            height=overrides.pop("height", 80),
            original_name=overrides.pop("original_name", f"{sha}.png"),
            storage_path=overrides.pop("storage_path", f"/tmp/{sha}.png"),
            thumbnail_path=overrides.pop("thumbnail_path", f"/tmp/{sha}.jpg"),
            processing_state=overrides.pop("processing_state", "ready"),
            embedding_state=overrides.pop("embedding_state", "not_requested"),
            **overrides,
        )
        db_session.add(image)
        db_session.commit()
        db_session.refresh(image)
        return image

    return _create


@pytest.fixture(autouse=True)
def _storage_roots(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(settings, "storage_root", str(tmp_path / "data"))


def test_embed_image_job_writes_embedding_and_marks_image_ready(db_session) -> None:
    vector_index = get_vector_index()
    vector_index.reset()
    image_factory = _image_factory(db_session)
    image = image_factory(
        embedding_state="pending",
        storage_path="images/ab/source.png",
    )
    expected_path = Path(settings.storage_root) / image.storage_path

    class FakeEmbedder:
        def embed_image(self, image_path: str) -> list[float]:
            assert image_path == str(expected_path)
            return [0.25, 0.75]

    run_embed_image_job(
        session=db_session,
        image_id=image.id,
        embedder=FakeEmbedder(),
        vector_index=vector_index,
    )

    refreshed = db_session.get(ImageRecord, image.id)
    assert refreshed is not None
    assert refreshed.embedding_state == "ready"
    assert vector_index.fetch_embedding(image.id) == [0.25, 0.75]


def test_local_vector_index_rejects_mixed_dimensions_on_upsert() -> None:
    vector_index = get_vector_index()
    vector_index.reset()

    vector_index.upsert_image_embedding(image_id="image-a", embedding=[1.0, 0.0])

    with pytest.raises(ValueError, match="embedding dimensions must match"):
        vector_index.upsert_image_embedding(
            image_id="image-b",
            embedding=[1.0, 0.0, 0.5],
        )


def test_duplicate_scan_job_creates_pending_canonical_pairs(db_session) -> None:
    vector_index = get_vector_index()
    vector_index.reset()
    image_factory = _image_factory(db_session)
    source = image_factory(original_name="source.png")
    near = image_factory(original_name="near.png")
    far = image_factory(original_name="far.png")

    vector_index.upsert_image_embedding(image_id=source.id, embedding=[1.0, 0.0])
    vector_index.upsert_image_embedding(image_id=near.id, embedding=[0.98, 0.02])
    vector_index.upsert_image_embedding(image_id=far.id, embedding=[0.0, 1.0])

    run_duplicate_scan_job(
        session=db_session,
        image_id=source.id,
        threshold=0.95,
        vector_index=vector_index,
    )
    run_duplicate_scan_job(
        session=db_session,
        image_id=near.id,
        threshold=0.95,
        vector_index=vector_index,
    )

    rows = db_session.scalars(select(DuplicateCandidateRecord)).all()
    assert len(rows) == 1
    candidate = rows[0]
    assert candidate.image_a_id == min(source.id, near.id)
    assert candidate.image_b_id == max(source.id, near.id)
    assert candidate.score >= 0.95
    assert candidate.status == "pending"
