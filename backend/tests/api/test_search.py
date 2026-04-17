from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.db import get_session
from app.db.models.image import ImageRecord
from app.db.models.image_tag import ImageTagRecord
from app.db.models.tag import TagRecord
from app.main import app
from app.api.routes.search import get_text_embedder_dependency
from app.services.vector_index import get_vector_index


@pytest.fixture
def client(db_session) -> TestClient:
    app.dependency_overrides[get_session] = lambda: db_session
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_session, None)


@pytest.fixture(autouse=True)
def _reset_vector_index() -> None:
    vector_index = get_vector_index()
    vector_index.reset()


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


def test_search_returns_text_tag_fallback_mode_and_gallery_items(
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
        "/api/search",
        params=[("q", "wave"), ("tag", "character:艾玛")],
    )

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "text_tag_fallback"
    assert len(body["items"]) == 1
    assert body["items"][0]["id"] == image.id
    assert body["items"][0]["original_name"] == "emma-wave.png"
    assert body["items"][0]["tags"] == ["character:艾玛"]


def test_search_returns_hybrid_mode_with_semantic_match_and_tag_filter(
    client,
    image_factory,
    tag_factory,
) -> None:
    semantic_hit = image_factory(original_name="totally-unrelated-name.png")
    semantic_miss = image_factory(original_name="also-unrelated.png")
    tag_factory(
        image=semantic_hit,
        category="character",
        name="艾玛",
        normalized_key="character:艾玛",
    )
    tag_factory(
        image=semantic_miss,
        category="character",
        name="露西",
        normalized_key="character:露西",
    )

    vector_index = get_vector_index()
    vector_index.upsert_image_embedding(image_id=semantic_hit.id, embedding=[1.0, 0.0])
    vector_index.upsert_image_embedding(image_id=semantic_miss.id, embedding=[0.0, 1.0])

    class FakeTextEmbedder:
        def embed_text(self, text: str) -> list[float]:
            assert text == "no-keyword-match"
            return [1.0, 0.0]

    app.dependency_overrides[get_text_embedder_dependency] = lambda: FakeTextEmbedder()

    try:
        response = client.get(
            "/api/search",
            params=[("q", "no-keyword-match"), ("tag", "character:艾玛")],
        )
    finally:
        app.dependency_overrides.pop(get_text_embedder_dependency, None)

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "hybrid"
    assert [item["id"] for item in body["items"]] == [semantic_hit.id]


def test_search_uses_fallback_mode_when_embeddings_are_unavailable(
    client,
    image_factory,
) -> None:
    image = image_factory(original_name="emma-wave.png")

    class FakeTextEmbedder:
        def embed_text(self, text: str) -> list[float]:
            raise AssertionError(
                "embed_text must not run when vector index is not ready"
            )

    app.dependency_overrides[get_text_embedder_dependency] = lambda: FakeTextEmbedder()

    try:
        response = client.get("/api/search", params={"q": "wave"})
    finally:
        app.dependency_overrides.pop(get_text_embedder_dependency, None)

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "text_tag_fallback"
    assert [item["id"] for item in body["items"]] == [image.id]


def test_search_falls_back_when_text_embedder_raises(
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

    vector_index = get_vector_index()
    vector_index.upsert_image_embedding(image_id=image.id, embedding=[1.0, 0.0])

    class FakeTextEmbedder:
        def embed_text(self, text: str) -> list[float]:
            raise RuntimeError("provider unavailable")

    app.dependency_overrides[get_text_embedder_dependency] = lambda: FakeTextEmbedder()

    try:
        response = client.get(
            "/api/search",
            params=[("q", "wave"), ("tag", "character:艾玛")],
        )
    finally:
        app.dependency_overrides.pop(get_text_embedder_dependency, None)

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "text_tag_fallback"
    assert [item["id"] for item in body["items"]] == [image.id]


def test_search_falls_back_when_semantic_embedding_dimension_mismatches_index(
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

    vector_index = get_vector_index()
    vector_index.upsert_image_embedding(image_id=image.id, embedding=[1.0, 0.0])

    class FakeTextEmbedder:
        def embed_text(self, text: str) -> list[float]:
            return [1.0, 0.0, 0.0]

    app.dependency_overrides[get_text_embedder_dependency] = lambda: FakeTextEmbedder()

    try:
        response = client.get(
            "/api/search",
            params=[("q", "wave"), ("tag", "character:艾玛")],
        )
    finally:
        app.dependency_overrides.pop(get_text_embedder_dependency, None)

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "text_tag_fallback"
    assert [item["id"] for item in body["items"]] == [image.id]
