from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.db import get_session
from app.db.models.duplicate import DuplicateCandidateRecord
from app.db.models.image import ImageRecord
from app.db.models.image_tag import ImageTagRecord
from app.db.models.tag import TagRecord
from app.main import app


@pytest.fixture
def client(db_session) -> TestClient:
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_session, None)


@pytest.fixture
def image_factory(db_session):
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
            storage_path=overrides.pop("storage_path", f"images/{sha[:2]}/{sha}.png"),
            thumbnail_path=overrides.pop("thumbnail_path", f"{sha[:2]}/{sha}.jpg"),
            processing_state=overrides.pop("processing_state", "ready"),
            embedding_state=overrides.pop("embedding_state", "not_requested"),
            **overrides,
        )
        db_session.add(image)
        db_session.commit()
        db_session.refresh(image)
        return image

    return _create


@pytest.fixture
def tag_factory(db_session):
    def _create(
        *,
        image: ImageRecord,
        category: str,
        name: str,
        normalized_key: str,
        source: str = "manual",
    ) -> TagRecord:
        tag = db_session.scalar(
            select(TagRecord).where(TagRecord.normalized_key == normalized_key)
        )
        if tag is None:
            tag = TagRecord(
                category=category,
                name=name,
                normalized_key=normalized_key,
                source=source,
            )
            db_session.add(tag)
            db_session.flush()

        link = ImageTagRecord(image_id=image.id, tag_id=tag.id, source=source)
        db_session.add(link)
        db_session.commit()
        return tag

    return _create


def test_gallery_filters_by_keyword_and_structured_tag(
    client,
    image_factory,
    tag_factory,
) -> None:
    image = image_factory(original_name="emma-wave.png")
    tag_factory(
        image=image,
        category="character",
        name="艾玛",
        normalized_key="character:艾玛",
    )
    image_factory(original_name="other.png")

    response = client.get(
        "/api/gallery",
        params=[("q", "wave"), ("tag", "character:艾玛")],
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == image.id
    assert body["items"][0]["original_name"] == "emma-wave.png"
    assert body["items"][0]["tags"] == ["character:艾玛"]


def test_batch_tag_add_and_remove(client, db_session, image_factory) -> None:
    image = image_factory(original_name="batch.png")

    add_response = client.post(
        "/api/tags/batch",
        json={
            "image_ids": [image.id],
            "add": [{"category": "action", "name": "举手"}],
            "remove": [],
        },
    )

    assert add_response.status_code == 200
    assert add_response.json() == {"updated": 1}

    added = db_session.scalar(
        select(ImageTagRecord)
        .join(TagRecord, TagRecord.id == ImageTagRecord.tag_id)
        .where(ImageTagRecord.image_id == image.id)
        .where(TagRecord.normalized_key == "action:举手")
    )
    assert added is not None

    remove_response = client.post(
        "/api/tags/batch",
        json={
            "image_ids": [image.id],
            "add": [],
            "remove": ["action:举手"],
        },
    )

    assert remove_response.status_code == 200
    assert remove_response.json() == {"updated": 1}

    removed = db_session.scalar(
        select(ImageTagRecord)
        .join(TagRecord, TagRecord.id == ImageTagRecord.tag_id)
        .where(ImageTagRecord.image_id == image.id)
        .where(TagRecord.normalized_key == "action:举手")
    )
    assert removed is None


@pytest.mark.parametrize(
    ("tag_payload", "expected_fragment"),
    [
        ({"category": "bad:category", "name": "ok"}, "must not contain ':'"),
        ({"category": "x" * 33, "name": "ok"}, "at most 32 characters"),
        ({"category": "ok", "name": "x" * 129}, "at most 128 characters"),
    ],
)
def test_batch_tag_rejects_invalid_structured_tag_input_before_db_commit(
    client,
    db_session,
    image_factory,
    tag_payload,
    expected_fragment,
) -> None:
    image = image_factory(original_name="invalid-input.png")

    response = client.post(
        "/api/tags/batch",
        json={
            "image_ids": [image.id],
            "add": [tag_payload],
            "remove": [],
        },
    )

    assert response.status_code == 422
    assert expected_fragment in str(response.json())

    links = db_session.scalars(
        select(ImageTagRecord).where(ImageTagRecord.image_id == image.id)
    ).all()
    assert links == []


def test_batch_tag_rejects_nonexistent_image_ids_with_client_error(
    client,
    db_session,
    image_factory,
) -> None:
    image = image_factory(original_name="existing.png")
    missing_image_id = uuid4().hex

    response = client.post(
        "/api/tags/batch",
        json={
            "image_ids": [image.id, missing_image_id],
            "add": [{"category": "action", "name": "举手"}],
            "remove": [],
        },
    )

    assert response.status_code == 400
    assert "image_ids" in str(response.json())

    tag = db_session.scalar(
        select(TagRecord).where(TagRecord.normalized_key == "action:举手")
    )
    assert tag is None

    links = db_session.scalars(
        select(ImageTagRecord).where(ImageTagRecord.image_id == image.id)
    ).all()
    assert links == []


def test_duplicates_returns_pending_candidates(
    client, image_factory, db_session
) -> None:
    a = image_factory(original_name="a.png")
    b = image_factory(original_name="b.png")
    c = image_factory(original_name="c.png")

    pending = DuplicateCandidateRecord(
        image_a_id=a.id,
        image_b_id=b.id,
        score=0.01,
        status="pending",
    )
    accepted = DuplicateCandidateRecord(
        image_a_id=a.id,
        image_b_id=c.id,
        score=0.02,
        status="accepted",
    )
    db_session.add_all([pending, accepted])
    db_session.commit()

    response = client.get("/api/duplicates")

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == pending.id
    assert body["items"][0]["status"] == "pending"
