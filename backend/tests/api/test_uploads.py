from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select

from app.core.config import settings
from app.core.db import get_session
from app.db.models.image import ImageRecord
from app.main import app
from app.services.hash_file import sha256_bytes
from app.services.upload_service import ingest_uploaded_file

MINIMAL_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n"
    b"\x00\x00\x00\rIHDR"
    b"\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
    b"\x90wS\xde"
    b"\x00\x00\x00\x0cIDATx\x9cc````\x00\x00\x00\x04\x00\x01"
    b"\x0b\xe7\x02\x9d"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_hash_precheck_marks_existing_files(db_session) -> None:
    existing = ImageRecord(
        sha256="known",
        ext="png",
        mime_type="image/png",
        file_size=68,
        width=1,
        height=1,
        original_name="known.png",
        storage_path="images/kn/known.png",
        thumbnail_path="kn/known.jpg",
        processing_state="ready",
        embedding_state="not_requested",
    )
    db_session.add(existing)
    db_session.commit()

    app.dependency_overrides[get_session] = lambda: db_session
    try:
        client = TestClient(app)
        response = client.post(
            "/api/uploads/precheck",
            json={"hashes": ["known", "new"]},
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 200
    assert existing.thumbnail_path == "kn/known.jpg"
    assert response.json() == {
        "existing": [{"hash": "known", "image_id": existing.id}],
        "missing": ["new"],
    }


def test_hash_precheck_rejects_too_many_hashes(db_session) -> None:
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        client = TestClient(app)
        response = client.post(
            "/api/uploads/precheck",
            json={"hashes": [f"hash-{index}" for index in range(257)]},
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 422
    detail = response.json().get("detail", [])
    assert any("at most" in item.get("msg", "") for item in detail)


@pytest.fixture(autouse=True)
def _storage_roots(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr("app.core.config.settings.storage_root", str(tmp_path / "data"))
    monkeypatch.setattr(
        "app.core.config.settings.thumbnail_root",
        str(tmp_path / "data" / "thumbnails"),
    )


def test_single_file_upload_persists_image_and_thumbnail(db_session) -> None:
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        client = TestClient(app)
        response = client.post(
            "/api/uploads/files",
            files={
                "file": (
                    "sample.png",
                    BytesIO(MINIMAL_PNG_BYTES),
                    "image/png",
                )
            },
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 201
    body = response.json()
    digest = sha256_bytes(MINIMAL_PNG_BYTES)

    assert body["duplicate"] is False
    assert body["image"]["sha256"] == digest
    assert body["image"]["processing_state"] == "processing"
    assert body["image"]["thumbnail_url"].endswith(".jpg")

    image = db_session.scalar(select(ImageRecord).where(ImageRecord.sha256 == digest))
    assert image is not None
    assert image.processing_state == "processing"
    assert image.storage_path == f"images/{digest[:2]}/{digest}.png"
    assert image.thumbnail_path == f"{digest[:2]}/{digest}.jpg"

    storage_root = Path(settings.storage_root)
    thumb_root = Path(settings.thumbnail_root)

    assert (storage_root / image.storage_path).exists()
    assert (thumb_root / image.thumbnail_path).exists()


def test_single_file_upload_exposes_explicit_response_model() -> None:
    app.openapi_schema = None

    schema = app.openapi()
    response_schema = schema["paths"]["/api/uploads/files"]["post"]["responses"]["201"]

    assert response_schema["content"]["application/json"]["schema"]["$ref"].endswith(
        "/UploadSingleFileResponse"
    )


def test_single_file_upload_rejects_oversized_file(db_session) -> None:
    oversized_png = MINIMAL_PNG_BYTES + (b"0" * (1_048_577 - len(MINIMAL_PNG_BYTES)))

    app.dependency_overrides[get_session] = lambda: db_session
    try:
        client = TestClient(app)
        response = client.post(
            "/api/uploads/files",
            files={
                "file": (
                    "too-large.png",
                    BytesIO(oversized_png),
                    "image/png",
                )
            },
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 413
    assert response.json() == {"detail": "Uploaded file exceeds maximum size"}


def test_single_file_upload_handles_unique_constraint_race_as_duplicate(
    db_session, monkeypatch
) -> None:
    digest = sha256_bytes(MINIMAL_PNG_BYTES)
    existing = ImageRecord(
        sha256=digest,
        ext="png",
        mime_type="image/png",
        file_size=68,
        width=1,
        height=1,
        original_name="existing.png",
        storage_path=f"images/{digest[:2]}/{digest}.png",
        thumbnail_path=f"{digest[:2]}/{digest}.jpg",
        processing_state="ready",
        embedding_state="not_requested",
    )
    db_session.add(existing)
    db_session.commit()

    def _pretend_missing(_statement):
        return None

    monkeypatch.setattr(db_session, "scalar", _pretend_missing)

    app.dependency_overrides[get_session] = lambda: db_session
    try:
        client = TestClient(app)
        response = client.post(
            "/api/uploads/files",
            files={
                "file": (
                    "sample.png",
                    BytesIO(MINIMAL_PNG_BYTES),
                    "image/png",
                )
            },
        )
    finally:
        app.dependency_overrides.pop(get_session, None)

    assert response.status_code == 201
    assert response.json() == {
        "duplicate": True,
        "image": {
            "id": existing.id,
            "sha256": digest,
            "processing_state": "ready",
            "thumbnail_url": f"{digest[:2]}/{digest}.jpg",
        },
    }


def test_ingest_uploaded_file_cleans_written_image_when_thumbnail_fails(
    db_session, monkeypatch
) -> None:
    digest = sha256_bytes(MINIMAL_PNG_BYTES)
    storage_root = Path(settings.storage_root)

    def _raise_thumb(_content: bytes, _output_path: Path, max_side: int = 512):
        raise RuntimeError("thumbnail failed")

    monkeypatch.setattr("app.services.upload_service.generate_thumbnail", _raise_thumb)

    with pytest.raises(RuntimeError, match="thumbnail failed"):
        ingest_uploaded_file(
            db_session,
            file=pytest.importorskip("fastapi").UploadFile(
                filename="sample.png",
                file=BytesIO(MINIMAL_PNG_BYTES),
                headers={"content-type": "image/png"},
            ),
        )

    assert not (storage_root / f"images/{digest[:2]}/{digest}.png").exists()
    assert not (Path(settings.thumbnail_root) / f"{digest[:2]}/{digest}.jpg").exists()
    assert (
        db_session.scalar(select(ImageRecord).where(ImageRecord.sha256 == digest))
        is None
    )


def test_ingest_uploaded_file_cleans_written_files_when_commit_fails(
    db_session, monkeypatch
) -> None:
    digest = sha256_bytes(MINIMAL_PNG_BYTES)
    storage_root = Path(settings.storage_root)
    original_commit = db_session.commit

    def _raise_commit() -> None:
        raise IntegrityError("insert", {}, Exception("boom"))

    monkeypatch.setattr(db_session, "commit", _raise_commit)

    with pytest.raises(IntegrityError):
        ingest_uploaded_file(
            db_session,
            file=pytest.importorskip("fastapi").UploadFile(
                filename="sample.png",
                file=BytesIO(MINIMAL_PNG_BYTES),
                headers={"content-type": "image/png"},
            ),
        )

    monkeypatch.setattr(db_session, "commit", original_commit)

    assert not (storage_root / f"images/{digest[:2]}/{digest}.png").exists()
    assert not (Path(settings.thumbnail_root) / f"{digest[:2]}/{digest}.jpg").exists()
    assert (
        db_session.scalar(select(ImageRecord).where(ImageRecord.sha256 == digest))
        is None
    )
