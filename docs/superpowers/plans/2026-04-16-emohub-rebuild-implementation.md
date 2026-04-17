# EmoHub Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-ready slice of the new EmoHub system: Python main service, optional GPU worker, and rebuilt Web/PWA client for single-user LAN image management and search.

**Architecture:** Keep the old Bun/TypeScript server and mobile app untouched during the rebuild. Add a new Python backend under `backend/`, rebuild `apps/web` in place against the new API, and only consider deleting the old Node paths after the new stack is verified end to end. The main FastAPI service owns SQLite, managed storage, thumbnails, tags, tasks, and the local vector index; the worker is a pull-based enhancer for image-side AI jobs.

**Tech Stack:** Python 3.12 + FastAPI + SQLAlchemy + Alembic + Pydantic + Pillow + sqlite-vec + pytest; React 19 + Vite 6 + TanStack Router + Zustand + Vitest + Testing Library + vite-plugin-pwa.

---

## Scope Check

This spec spans tightly coupled subsystems, so keep it as one plan but execute it phase-by-phase. Do not bundle optional cleanup of `packages/server` and `apps/mobile` into MVP delivery; treat legacy-code removal as a later, separate cleanup plan after cutover.

## Target File Structure

### New Python backend

- Create: `backend/pyproject.toml`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/20260416_0001_rebuild_init.py`
- Create: `backend/app/main.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/app/api/routes/uploads.py`
- Create: `backend/app/api/routes/gallery.py`
- Create: `backend/app/api/routes/tags.py`
- Create: `backend/app/api/routes/search.py`
- Create: `backend/app/api/routes/duplicates.py`
- Create: `backend/app/api/routes/internal_tasks.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/db.py`
- Create: `backend/app/core/storage.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/models/image.py`
- Create: `backend/app/db/models/image_tag.py`
- Create: `backend/app/db/models/tag.py`
- Create: `backend/app/db/models/task.py`
- Create: `backend/app/db/models/duplicate.py`
- Create: `backend/app/schemas/uploads.py`
- Create: `backend/app/schemas/gallery.py`
- Create: `backend/app/schemas/tags.py`
- Create: `backend/app/services/hash_file.py`
- Create: `backend/app/services/thumbnailer.py`
- Create: `backend/app/services/upload_service.py`
- Create: `backend/app/services/gallery_service.py`
- Create: `backend/app/services/tag_service.py`
- Create: `backend/app/services/task_queue.py`
- Create: `backend/app/services/vector_index.py`
- Create: `backend/app/services/search_service.py`
- Create: `backend/app/services/import_service.py`
- Create: `backend/app/worker/main.py`
- Create: `backend/app/worker/jobs/embed_image.py`
- Create: `backend/app/worker/jobs/duplicate_scan.py`
- Create: `backend/app/cli/import_images.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/api/test_health.py`
- Create: `backend/tests/api/test_uploads.py`
- Create: `backend/tests/api/test_gallery_tags.py`
- Create: `backend/tests/api/test_internal_tasks.py`
- Create: `backend/tests/api/test_search.py`
- Create: `backend/tests/cli/test_import_images.py`
- Create: `backend/tests/worker/test_embed_job.py`

### Rebuilt web client

- Modify: `apps/web/package.json`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/lib/api/contracts.ts`
- Create: `apps/web/src/lib/api/client.ts`
- Create: `apps/web/src/lib/query.ts`
- Create: `apps/web/src/app/AppShell.tsx`
- Create: `apps/web/src/features/layout/WorkspaceLayout.tsx`
- Create: `apps/web/src/features/gallery/GalleryGrid.tsx`
- Create: `apps/web/src/features/gallery/GalleryCard.tsx`
- Create: `apps/web/src/features/search/SearchRail.tsx`
- Create: `apps/web/src/features/search/SearchBox.tsx`
- Create: `apps/web/src/features/upload/UploadQueue.tsx`
- Create: `apps/web/src/features/upload/useUploadQueue.ts`
- Create: `apps/web/src/features/detail/DetailRail.tsx`
- Create: `apps/web/src/features/tags/TagEditor.tsx`
- Create: `apps/web/src/features/tags/BatchTagBar.tsx`
- Create: `apps/web/src/features/duplicates/DuplicateReviewPanel.tsx`
- Create: `apps/web/src/features/pwa/registerServiceWorker.ts`
- Create: `apps/web/public/manifest.webmanifest`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/features/upload/UploadQueue.test.tsx`
- Create: `apps/web/src/features/layout/WorkspaceLayout.test.tsx`
- Create: `apps/web/src/features/detail/DetailRail.test.tsx`

### Repo-level changes

- Modify: `package.json`
- Create: `docs/superpowers/runbooks/rebuild-dev-setup.md`
- Create: `docs/superpowers/runbooks/rebuild-deploy.md`

## Execution Rules

1. Keep `packages/server/**` and `apps/mobile/**` untouched during MVP implementation.
2. Do not point the rebuilt web client at the legacy Fastify API once `backend/` exists.
3. Every new behavior starts with a failing test.
4. Prefer small vertical slices that are independently verifiable.
5. Use conventional commits exactly as written in each task.

### Task 1: Scaffold The Python Main Service

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/main.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/tests/api/test_health.py`
- Modify: `package.json`
- Create: `docs/superpowers/runbooks/rebuild-dev-setup.md`

- [ ] **Step 1: Write the failing backend health test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run --directory backend pytest backend/tests/api/test_health.py -q`
Expected: FAIL with `ModuleNotFoundError: No module named 'app'`

- [ ] **Step 3: Add the minimal FastAPI scaffold and root scripts**

```toml
[project]
name = "emohub-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115,<0.116",
  "uvicorn[standard]>=0.35,<0.36",
  "sqlalchemy>=2.0,<2.1",
  "alembic>=1.16,<1.17",
  "pydantic-settings>=2.10,<2.11",
  "pillow>=11.3,<11.4",
  "httpx>=0.28,<0.29",
  "python-multipart>=0.0.20,<0.0.21",
  "sqlite-vec>=0.1.6,<0.2"
]

[dependency-groups]
dev = [
  "pytest>=8.4,<8.5",
  "pytest-asyncio>=1.1,<1.2",
  "ruff>=0.12,<0.13"
]
```

```python
from fastapi import APIRouter, FastAPI


health_router = APIRouter()


@health_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app = FastAPI(title="EmoHub API")
app.include_router(health_router)
```

```json
{
  "scripts": {
    "dev:web": "bun --cwd apps/web dev",
    "build:web": "bun --cwd apps/web build",
    "test:web": "bun --cwd apps/web test",
    "dev:api": "uv run --directory backend uvicorn app.main:app --reload --host 0.0.0.0 --port 8000",
    "test:api": "uv run --directory backend pytest",
    "lint:api": "uv run --directory backend ruff check backend/app backend/tests"
  }
}
```

```md
# Rebuild Dev Setup

1. Install `uv` and Python 3.12.
2. Run `uv sync --directory backend`.
3. Run `bun install` at repo root.
4. Start API with `bun run dev:api`.
5. Start web with `bun run dev:web`.
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `uv run --directory backend pytest backend/tests/api/test_health.py -q`
Expected: PASS with `1 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/app/main.py backend/tests/api/test_health.py package.json docs/superpowers/runbooks/rebuild-dev-setup.md
git commit -m "feat(api): scaffold FastAPI rebuild service"
```

### Task 2: Define The New Database Schema And Migration

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/20260416_0001_rebuild_init.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/db.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/db/models/image.py`
- Create: `backend/app/db/models/image_tag.py`
- Create: `backend/app/db/models/tag.py`
- Create: `backend/app/db/models/task.py`
- Create: `backend/app/db/models/duplicate.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/api/test_gallery_tags.py`

- [ ] **Step 1: Write the failing schema smoke test**

```python
from sqlalchemy import select

from app.db.models.image import ImageRecord
from app.db.models.image_tag import ImageTagRecord
from app.db.models.tag import TagRecord


def test_image_and_tag_records_round_trip(db_session) -> None:
    image = ImageRecord(
        sha256="abc",
        ext="png",
        mime_type="image/png",
        file_size=42,
        width=100,
        height=80,
        original_name="demo.png",
        storage_path="images/ab/abc.png",
        processing_state="ready",
        embedding_state="not_requested",
    )
    tag = TagRecord(category="character", name="艾玛", normalized_key="character:艾玛", source="manual")
    image.tag_links.append(ImageTagRecord(tag=tag, source="manual"))

    db_session.add(image)
    db_session.commit()

    row = db_session.scalar(select(ImageRecord).where(ImageRecord.sha256 == "abc"))

    assert row is not None
    assert row.tag_links[0].tag.normalized_key == "character:艾玛"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `uv run --directory backend pytest backend/tests/api/test_gallery_tags.py -q`
Expected: FAIL with `ImportError` because the SQLAlchemy models do not exist yet.

- [ ] **Step 3: Add settings, SQLAlchemy models, and Alembic baseline**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./emohub.db"
    storage_root: str = "./data"
    thumbnail_root: str = "./data/thumbnails"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

```python
class ImageRecord(Base):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: uuid4().hex)
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
    tag_links: Mapped[list[ImageTagRecord]] = relationship(back_populates="image", cascade="all, delete-orphan")
```

```python
class ProcessingTaskRecord(Base):
    __tablename__ = "processing_tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: uuid4().hex)
    task_type: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    payload_json: Mapped[str] = mapped_column(Text)
    lease_owner: Mapped[str | None] = mapped_column(String(128), nullable=True)
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_text: Mapped[str | None] = mapped_column(Text, nullable=True)
```

```python
def upgrade() -> None:
    op.create_table(
        "images",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("ext", sa.String(length=16), nullable=False),
        sa.Column("mime_type", sa.String(length=64), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("storage_path", sa.String(length=512), nullable=False),
        sa.Column("thumbnail_path", sa.String(length=512), nullable=True),
        sa.Column("processing_state", sa.String(length=32), nullable=False),
        sa.Column("embedding_state", sa.String(length=32), nullable=False),
    )
```

- [ ] **Step 4: Run tests and migration verification**

Run: `uv run --directory backend pytest backend/tests/api/test_gallery_tags.py -q`
Expected: PASS with `1 passed`

Run: `uv run --directory backend alembic upgrade head`
Expected: PASS with an upgrade line ending in `20260416_0001_rebuild_init`

- [ ] **Step 5: Commit**

```bash
git add backend/alembic.ini backend/alembic backend/app/core/config.py backend/app/core/db.py backend/app/db backend/tests/conftest.py backend/tests/api/test_gallery_tags.py
git commit -m "feat(api): add rebuild metadata schema"
```

### Task 3: Implement Managed Storage, Hash Precheck, And Single-File Upload

**Files:**
- Create: `backend/app/core/storage.py`
- Create: `backend/app/schemas/uploads.py`
- Create: `backend/app/services/hash_file.py`
- Create: `backend/app/services/thumbnailer.py`
- Create: `backend/app/services/upload_service.py`
- Create: `backend/app/api/routes/uploads.py`
- Modify: `backend/app/api/router.py`
- Create: `backend/tests/api/test_uploads.py`

- [ ] **Step 1: Write the failing upload tests**

```python
from io import BytesIO


def test_hash_precheck_marks_existing_files(client, image_factory) -> None:
    existing = image_factory(sha256="known")

    response = client.post("/api/uploads/precheck", json={"hashes": ["known", "new"]})

    assert response.status_code == 200
    assert response.json() == {
        "existing": [{"hash": "known", "image_id": existing.id}],
        "missing": ["new"],
    }


def test_single_file_upload_persists_image_and_thumbnail(client) -> None:
    payload = BytesIO(MINIMAL_PNG_BYTES)

    response = client.post(
        "/api/uploads/files",
        files={"file": ("sample.png", payload, "image/png")},
    )

    body = response.json()

    assert response.status_code == 201
    assert body["duplicate"] is False
    assert body["image"]["processing_state"] == "processing"
    assert body["image"]["thumbnail_url"].endswith(".jpg")
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run --directory backend pytest backend/tests/api/test_uploads.py -q`
Expected: FAIL with `404 Not Found` because `/api/uploads/precheck` and `/api/uploads/files` do not exist yet.

- [ ] **Step 3: Add storage helpers, precheck schema, and upload route**

```python
class UploadPrecheckRequest(BaseModel):
    hashes: list[str]


class UploadPrecheckResponse(BaseModel):
    existing: list[dict[str, str]]
    missing: list[str]
```

```python
def storage_paths_for_hash(sha256: str, ext: str) -> tuple[Path, Path]:
    shard = sha256[:2]
    image_path = Path(settings.storage_root) / "images" / shard / f"{sha256}.{ext}"
    thumb_path = Path(settings.thumbnail_root) / shard / f"{sha256}.jpg"
    image_path.parent.mkdir(parents=True, exist_ok=True)
    thumb_path.parent.mkdir(parents=True, exist_ok=True)
    return image_path, thumb_path
```

```python
@router.post("/precheck", response_model=UploadPrecheckResponse)
def precheck_hashes(payload: UploadPrecheckRequest, session: SessionDep) -> UploadPrecheckResponse:
    rows = session.scalars(select(ImageRecord).where(ImageRecord.sha256.in_(payload.hashes))).all()
    existing = [{"hash": row.sha256, "image_id": row.id} for row in rows]
    missing = [value for value in payload.hashes if value not in {row.sha256 for row in rows}]
    return UploadPrecheckResponse(existing=existing, missing=missing)


@router.post("/files", status_code=201)
def upload_single_file(file: UploadFile, session: SessionDep) -> dict:
    result = upload_service.ingest_uploaded_file(session, file)
    return {"duplicate": result.duplicate, "image": result.image.to_summary()}
```

- [ ] **Step 4: Run tests and verify image files land in managed storage**

Run: `uv run --directory backend pytest backend/tests/api/test_uploads.py -q`
Expected: PASS with `2 passed`

Run: `uv run --directory backend pytest backend/tests/api/test_uploads.py -q -k single_file_upload_persists_image_and_thumbnail`
Expected: PASS and the temporary test storage directory contains one original plus one thumbnail file.

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/storage.py backend/app/schemas/uploads.py backend/app/services/hash_file.py backend/app/services/thumbnailer.py backend/app/services/upload_service.py backend/app/api/routes/uploads.py backend/app/api/router.py backend/tests/api/test_uploads.py
git commit -m "feat(api): add hash precheck and managed uploads"
```

### Task 4: Add Gallery, Tags, Batch Tag Mutations, And Duplicate Review APIs

**Files:**
- Create: `backend/app/schemas/gallery.py`
- Create: `backend/app/schemas/tags.py`
- Create: `backend/app/services/gallery_service.py`
- Create: `backend/app/services/tag_service.py`
- Create: `backend/app/api/routes/gallery.py`
- Create: `backend/app/api/routes/tags.py`
- Create: `backend/app/api/routes/duplicates.py`
- Modify: `backend/app/api/router.py`
- Modify: `backend/tests/api/test_gallery_tags.py`

- [ ] **Step 1: Write the failing API tests for gallery filtering and batch tagging**

```python
def test_gallery_filters_by_keyword_and_structured_tag(client, image_factory, tag_factory) -> None:
    image = image_factory(original_name="emma-wave.png")
    tag_factory(image=image, category="character", name="艾玛", normalized_key="character:艾玛")

    response = client.get("/api/gallery", params={"q": "wave", "tag": ["character:艾玛"]})

    assert response.status_code == 200
    assert response.json()["items"][0]["id"] == image.id


def test_batch_tag_add_and_remove(client, image_factory) -> None:
    image = image_factory()

    add_response = client.post(
        "/api/tags/batch",
        json={"image_ids": [image.id], "add": [{"category": "action", "name": "举手"}], "remove": []},
    )

    remove_response = client.post(
        "/api/tags/batch",
        json={"image_ids": [image.id], "add": [], "remove": ["action:举手"]},
    )

    assert add_response.status_code == 200
    assert remove_response.status_code == 200
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run --directory backend pytest backend/tests/api/test_gallery_tags.py -q`
Expected: FAIL with `404 Not Found` for `/api/gallery` and `/api/tags/batch`.

- [ ] **Step 3: Implement summary schemas, gallery querying, tag CRUD, and duplicate review endpoints**

```python
class GalleryItem(BaseModel):
    id: str
    original_name: str
    thumbnail_url: str
    processing_state: str
    embedding_state: str
    tags: list[str]
```

```python
@router.get("")
def list_gallery(
    q: str = "",
    tag: list[str] | None = Query(default=None),
    session: SessionDep = Depends(get_session),
) -> dict:
    return gallery_service.list_gallery(session=session, query=q, normalized_tags=tag or [])
```

```python
@router.post("/batch")
def batch_mutate_tags(payload: BatchTagMutation, session: SessionDep) -> dict[str, int]:
    updated = tag_service.apply_batch_mutation(
        session=session,
        image_ids=payload.image_ids,
        add_tags=payload.add,
        remove_normalized_keys=payload.remove,
    )
    return {"updated": updated}
```

```python
@router.get("")
def list_duplicate_candidates(session: SessionDep) -> dict:
    return {"items": duplicate_service.list_pending_review(session)}
```

- [ ] **Step 4: Run the tests to verify the gallery and tagging slice works**

Run: `uv run --directory backend pytest backend/tests/api/test_gallery_tags.py -q`
Expected: PASS with `3 passed` or more, depending on helper coverage.

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/gallery.py backend/app/schemas/tags.py backend/app/services/gallery_service.py backend/app/services/tag_service.py backend/app/api/routes/gallery.py backend/app/api/routes/tags.py backend/app/api/routes/duplicates.py backend/app/api/router.py backend/tests/api/test_gallery_tags.py
git commit -m "feat(api): add gallery and structured tag APIs"
```

### Task 5: Add The Pull-Based Task Queue And Folder Import CLI

**Files:**
- Modify: `backend/app/core/config.py`
- Create: `backend/app/services/task_queue.py`
- Create: `backend/app/services/import_service.py`
- Create: `backend/app/api/routes/internal_tasks.py`
- Modify: `backend/app/api/router.py`
- Create: `backend/app/cli/import_images.py`
- Create: `backend/tests/api/test_internal_tasks.py`
- Create: `backend/tests/cli/test_import_images.py`

- [ ] **Step 1: Write the failing task-lease and import tests**

```python
def test_worker_can_lease_the_oldest_pending_task(client, task_factory, internal_headers) -> None:
    task_factory(task_type="embed_image", status="pending", payload_json='{"image_id":"1"}')

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "gpu-box", "task_types": ["embed_image"]},
        headers=internal_headers,
    )

    assert response.status_code == 200
    assert response.json()["task"]["task_type"] == "embed_image"
    assert response.json()["task"]["status"] == "leased"


def test_internal_lease_requires_internal_api_key(client, task_factory) -> None:
    task_factory(task_type="embed_image", status="pending", payload_json='{"image_id":"1"}')

    response = client.post(
        "/internal/tasks/lease",
        json={"worker_id": "gpu-box", "task_types": ["embed_image"]},
    )

    assert response.status_code == 401


def test_import_cli_reads_folder_tags_and_sidecars(import_cli_runner, tmp_path) -> None:
    folder = tmp_path / "角色_艾玛"
    folder.mkdir()
    image = folder / "wave.png"
    image.write_bytes(MINIMAL_PNG_BYTES)
    (folder / "wave.txt").write_text("action:举手\nseries:demo\n", encoding="utf-8")

    result = import_cli_runner([str(folder)])

    assert result.exit_code == 0
    assert "queued=1" in result.stdout
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run --directory backend pytest backend/tests/api/test_internal_tasks.py backend/tests/cli/test_import_images.py -q`
Expected: FAIL because the internal task route and CLI entrypoint do not exist yet.

- [ ] **Step 3: Implement task queue primitives and the import command**

```python
def lease_next_task(session: Session, worker_id: str, task_types: list[str]) -> ProcessingTaskRecord | None:
    now = datetime.now(timezone.utc)
    lease_expires_at = now + timedelta(minutes=5)

    candidate = session.scalar(
        select(ProcessingTaskRecord.id)
        .where(ProcessingTaskRecord.task_type.in_(task_types))
        .where(
            or_(
                ProcessingTaskRecord.status == "pending",
                and_(
                    ProcessingTaskRecord.status == "leased",
                    ProcessingTaskRecord.lease_expires_at.is_not(None),
                    ProcessingTaskRecord.lease_expires_at <= now,
                ),
            )
        )
        .order_by(ProcessingTaskRecord.created_at.asc())
        .limit(1)
    )
    if candidate is None:
        return None

    claimed = session.execute(
        update(ProcessingTaskRecord)
        .where(ProcessingTaskRecord.id == candidate)
        .where(
            or_(
                ProcessingTaskRecord.status == "pending",
                and_(
                    ProcessingTaskRecord.status == "leased",
                    ProcessingTaskRecord.lease_expires_at.is_not(None),
                    ProcessingTaskRecord.lease_expires_at <= now,
                ),
            )
        )
        .values(
            status="leased",
            lease_owner=worker_id,
            lease_expires_at=lease_expires_at,
        )
    )
    if claimed.rowcount == 0:
        return None

    session.commit()
    return session.get(ProcessingTaskRecord, candidate)
```

```python
@router.post("/lease")
def lease_task(
    payload: TaskLeaseRequest,
    session: SessionDep,
    internal_api_key: str | None = Header(default=None, alias="X-Internal-API-Key"),
) -> dict:
    if not settings.internal_worker_api_key:
        raise HTTPException(status_code=503, detail="internal worker api key not configured")
    if internal_api_key != settings.internal_worker_api_key:
        raise HTTPException(status_code=401, detail="invalid internal api key")

    task = task_queue.lease_next_task(session, payload.worker_id, payload.task_types)
    return {"task": None if task is None else task_queue.serialize(task)}
```

```python
def import_folder(session: Session, folder: Path) -> ImportStats:
    stats = ImportStats()
    for image_path in iter_supported_images(folder):
        inherited_tags = derive_folder_tags(image_path.parent)
        sidecar_tags = read_sidecar_tags(image_path.with_suffix(".txt"))
        enqueue_processing_task(
            session=session,
            task_type="embed_image",
            payload={"image_path": str(image_path), "tags": sorted(inherited_tags | sidecar_tags)},
        )
        stats.queued += 1
    return stats
```

- [ ] **Step 4: Run the tests to verify tasks can be leased and imports enqueue work**

Run: `uv run --directory backend pytest backend/tests/api/test_internal_tasks.py backend/tests/cli/test_import_images.py -q`
Expected: PASS with `2 passed` or more as lease-hardening coverage is added.

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/config.py backend/app/services/task_queue.py backend/app/services/import_service.py backend/app/api/routes/internal_tasks.py backend/app/api/router.py backend/app/cli/import_images.py backend/tests/api/test_internal_tasks.py backend/tests/cli/test_import_images.py
git commit -m "feat(api): add worker leasing and import queue"
```

### Task 6: Implement Worker Jobs For Image Embeddings And Duplicate Candidates

**Files:**
- Create: `backend/app/worker/main.py`
- Create: `backend/app/worker/jobs/embed_image.py`
- Create: `backend/app/worker/jobs/duplicate_scan.py`
- Create: `backend/app/services/vector_index.py`
- Create: `backend/tests/worker/test_embed_job.py`

- [ ] **Step 1: Write the failing worker job tests**

```python
def test_embed_image_job_writes_vector_row(session, image_factory, fake_embedding_model) -> None:
    image = image_factory(storage_path="tests/data/sample.png", embedding_state="pending")

    run_embed_image_job(session=session, image_id=image.id, model=fake_embedding_model)

    refreshed = session.get(ImageRecord, image.id)
    assert refreshed.embedding_state == "ready"
    assert vector_index.fetch_embedding(image.id) is not None


def test_duplicate_scan_creates_manual_review_candidate(session, image_pair_factory, fake_embedding_model) -> None:
    first, second = image_pair_factory(distance=0.01)

    run_duplicate_scan_job(session=session, image_id=second.id, threshold=0.05)

    rows = session.scalars(select(DuplicateCandidateRecord)).all()
    assert len(rows) == 1
    assert rows[0].review_state == "pending"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run --directory backend pytest backend/tests/worker/test_embed_job.py -q`
Expected: FAIL because the worker job functions and vector index helpers do not exist yet.

- [ ] **Step 3: Implement the worker loop, embedding job, and duplicate scan**

```python
def run_embed_image_job(session: Session, image_id: str, model: OpenClipModel) -> None:
    image = session.get(ImageRecord, image_id)
    embedding = model.encode_image(Path(image.storage_path))
    vector_index.upsert_image_embedding(image_id=image.id, embedding=embedding)
    image.embedding_state = "ready"
    session.commit()
```

```python
def run_duplicate_scan_job(session: Session, image_id: str, threshold: float) -> None:
    neighbors = vector_index.nearest_neighbors(image_id=image_id, limit=10)
    for neighbor in neighbors:
        if neighbor.distance > threshold:
            continue
        session.add(
            DuplicateCandidateRecord(
                left_image_id=image_id,
                right_image_id=neighbor.image_id,
                distance=neighbor.distance,
                review_state="pending",
            )
        )
    session.commit()
```

```python
def worker_loop(worker_id: str) -> None:
    while True:
        leased = task_client.lease(worker_id=worker_id, task_types=["embed_image", "scan_duplicates"])
        if leased is None:
            time.sleep(3)
            continue
        dispatch_task(leased)
```

- [ ] **Step 4: Run the worker tests to verify embeddings and duplicate candidates are produced**

Run: `uv run --directory backend pytest backend/tests/worker/test_embed_job.py -q`
Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/worker/main.py backend/app/worker/jobs/embed_image.py backend/app/worker/jobs/duplicate_scan.py backend/app/services/vector_index.py backend/tests/worker/test_embed_job.py
git commit -m "feat(worker): add embedding and duplicate jobs"
```

### Task 7: Add Hybrid Search And Graceful Semantic Fallback

**Files:**
- Create: `backend/app/services/search_service.py`
- Create: `backend/app/api/routes/search.py`
- Modify: `backend/app/api/router.py`
- Create: `backend/tests/api/test_search.py`

- [ ] **Step 1: Write the failing search tests**

```python
def test_search_combines_text_query_and_structured_tag_filter(client, indexed_image_factory) -> None:
    indexed_image_factory(name="emma-wave.png", tags=["character:艾玛", "action:举手"], semantic_text="emma waving")

    response = client.get("/api/search", params={"q": "waving emma", "tag": ["character:艾玛"]})

    assert response.status_code == 200
    assert response.json()["mode"] == "hybrid"
    assert response.json()["items"][0]["original_name"] == "emma-wave.png"


def test_search_falls_back_to_text_and_tag_when_embedding_missing(client, image_factory) -> None:
    image_factory(original_name="emma-wave.png", embedding_state="not_requested", tags=["character:艾玛"])

    response = client.get("/api/search", params={"q": "emma", "tag": ["character:艾玛"]})

    assert response.status_code == 200
    assert response.json()["mode"] == "text_tag_fallback"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `uv run --directory backend pytest backend/tests/api/test_search.py -q`
Expected: FAIL with `404 Not Found` for `/api/search`.

- [ ] **Step 3: Implement a hybrid search service with CPU text encoding and fallback logic**

```python
def search(session: Session, query: str, normalized_tags: list[str]) -> SearchResult:
    base_rows = gallery_service.query_gallery(session=session, query=query, normalized_tags=normalized_tags)
    if not query.strip() or not vector_index.is_ready():
        return SearchResult(mode="text_tag_fallback", items=base_rows)

    query_embedding = text_encoder.encode(query)
    semantic_hits = vector_index.search_text(query_embedding, limit=100)
    merged = merge_semantic_and_metadata(base_rows, semantic_hits)
    return SearchResult(mode="hybrid", items=merged)
```

```python
@router.get("")
def search_images(
    q: str = "",
    tag: list[str] | None = Query(default=None),
    session: SessionDep = Depends(get_session),
) -> dict:
    return search_service.search(session=session, query=q, normalized_tags=tag or []).model_dump()
```

**Important:** use the same embedding family for CPU text encoding and GPU image encoding. Do not mix unrelated external text embeddings with local image embeddings in MVP.

- [ ] **Step 4: Run the search tests**

Run: `uv run --directory backend pytest backend/tests/api/test_search.py -q`
Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/search_service.py backend/app/api/routes/search.py backend/app/api/router.py backend/tests/api/test_search.py
git commit -m "feat(api): add hybrid search and fallback"
```

### Task 8: Rebuild The Web Shell Around The New Three-Pane Workspace

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/lib/api/contracts.ts`
- Create: `apps/web/src/lib/api/client.ts`
- Create: `apps/web/src/lib/query.ts`
- Create: `apps/web/src/app/AppShell.tsx`
- Create: `apps/web/src/features/layout/WorkspaceLayout.tsx`
- Create: `apps/web/src/features/gallery/GalleryGrid.tsx`
- Create: `apps/web/src/features/search/SearchRail.tsx`
- Create: `apps/web/src/features/detail/DetailRail.tsx`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/features/layout/WorkspaceLayout.test.tsx`

- [ ] **Step 1: Write the failing layout test**

```tsx
import { render, screen } from '@testing-library/react'
import { WorkspaceLayout } from './WorkspaceLayout'

test('desktop workspace renders left rail, gallery, and right rail', () => {
  render(
    <WorkspaceLayout
      left={<div>search rail</div>}
      center={<div>gallery grid</div>}
      right={<div>detail rail</div>}
    />,
  )

  expect(screen.getByText('search rail')).toBeInTheDocument()
  expect(screen.getByText('gallery grid')).toBeInTheDocument()
  expect(screen.getByText('detail rail')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun --cwd apps/web test`
Expected: FAIL because `vitest`, `@testing-library/react`, and the new workspace components are not configured.

- [ ] **Step 3: Add test tooling, API client, and the adaptive three-pane shell**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b --noEmit && vite build",
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.4",
    "@testing-library/react": "^16.3.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.6.1",
    "msw": "^2.10.5",
    "vite-plugin-pwa": "^1.0.3"
  }
}
```

```tsx
export function WorkspaceLayout({ left, center, right }: WorkspaceLayoutProps) {
  return (
    <div className="workspace-layout">
      <aside className="workspace-left">{left}</aside>
      <main className="workspace-center">{center}</main>
      <aside className="workspace-right">{right}</aside>
    </div>
  )
}
```

```tsx
export const Route = createFileRoute('/')({
  component: () => (
    <AppShell>
      <WorkspaceLayout
        left={<SearchRail />}
        center={<GalleryGrid />}
        right={<DetailRail />}
      />
    </AppShell>
  ),
})
```

- [ ] **Step 4: Run the web tests**

Run: `bun --cwd apps/web test`
Expected: PASS with at least the new workspace layout test green.

- [ ] **Step 5: Commit**

```bash
git add apps/web/package.json apps/web/src/main.tsx apps/web/src/routes/index.tsx apps/web/src/lib/api/contracts.ts apps/web/src/lib/api/client.ts apps/web/src/lib/query.ts apps/web/src/app/AppShell.tsx apps/web/src/features/layout/WorkspaceLayout.tsx apps/web/src/features/layout/WorkspaceLayout.test.tsx apps/web/src/features/gallery/GalleryGrid.tsx apps/web/src/features/search/SearchRail.tsx apps/web/src/features/detail/DetailRail.tsx apps/web/src/test/setup.ts apps/web/vitest.config.ts
git commit -m "feat(web): rebuild the workspace shell"
```

### Task 9: Implement Upload Queue, Search Rail, Detail Rail, And Duplicate Review UI

**Files:**
- Create: `apps/web/src/features/upload/useUploadQueue.ts`
- Create: `apps/web/src/features/upload/UploadQueue.tsx`
- Create: `apps/web/src/features/gallery/GalleryCard.tsx`
- Create: `apps/web/src/features/tags/TagEditor.tsx`
- Create: `apps/web/src/features/tags/BatchTagBar.tsx`
- Create: `apps/web/src/features/duplicates/DuplicateReviewPanel.tsx`
- Modify: `apps/web/src/features/search/SearchRail.tsx`
- Modify: `apps/web/src/features/detail/DetailRail.tsx`
- Create: `apps/web/src/features/upload/UploadQueue.test.tsx`
- Create: `apps/web/src/features/detail/DetailRail.test.tsx`

- [ ] **Step 1: Write the failing upload queue and detail rail tests**

```tsx
test('upload queue prechecks hashes and marks duplicates before upload', async () => {
  server.use(
    http.post('/api/uploads/precheck', () => HttpResponse.json({ existing: [{ hash: 'dup', image_id: '1' }], missing: ['fresh'] })),
    http.post('/api/uploads/files', () => HttpResponse.json({ duplicate: false, image: { id: '2', processing_state: 'processing' } }, { status: 201 })),
  )

  const { result } = renderHook(() => useUploadQueue())

  await act(async () => {
    await result.current.enqueue([
      new File(['dup'], 'dup.png', { type: 'image/png' }),
      new File(['fresh'], 'fresh.png', { type: 'image/png' }),
    ])
  })

  expect(result.current.items.map((item) => item.status)).toEqual(['duplicate', 'uploaded'])
})
```

```tsx
test('detail rail edits structured tags for the selected image', async () => {
  render(<DetailRail selectedImage={demoImage} />)

  await userEvent.type(screen.getByLabelText('Add tag'), 'action:举手{enter}')

  expect(await screen.findByText('action:举手')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun --cwd apps/web test`
Expected: FAIL because the upload queue hook, duplicate handling, and detail rail editor do not exist yet.

- [ ] **Step 3: Implement browser prehashing, per-file progress, and management rails**

```ts
export async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('')
}
```

```ts
async function enqueue(files: File[]) {
  const hashed = await Promise.all(files.map(async (file) => ({ file, hash: await sha256File(file) })))
  const precheck = await api.precheckUploads(hashed.map((entry) => entry.hash))
  for (const entry of hashed) {
    if (precheck.existing.some((row) => row.hash === entry.hash)) {
      markDuplicate(entry.hash)
      continue
    }
    await uploadOne(entry)
  }
}
```

```tsx
export function DetailRail() {
  return (
    <section>
      <TagEditor />
      <BatchTagBar />
      <DuplicateReviewPanel />
    </section>
  )
}
```

- [ ] **Step 4: Run the web tests and a manual UI verification**

Run: `bun --cwd apps/web test`
Expected: PASS with the upload queue and detail rail tests green.

Run: `bun run dev:web`
Expected: open the browser, select two files where one is already known, and confirm the queue shows `duplicate` for one item and upload progress for the other.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/upload/useUploadQueue.ts apps/web/src/features/upload/UploadQueue.tsx apps/web/src/features/gallery/GalleryCard.tsx apps/web/src/features/tags/TagEditor.tsx apps/web/src/features/tags/BatchTagBar.tsx apps/web/src/features/duplicates/DuplicateReviewPanel.tsx apps/web/src/features/search/SearchRail.tsx apps/web/src/features/detail/DetailRail.tsx apps/web/src/features/upload/UploadQueue.test.tsx apps/web/src/features/detail/DetailRail.test.tsx
git commit -m "feat(web): add upload queue and management rails"
```

### Task 10: Add PWA Caching, Deployment Runbooks, And End-To-End Verification

**Files:**
- Create: `apps/web/src/features/pwa/registerServiceWorker.ts`
- Create: `apps/web/public/manifest.webmanifest`
- Modify: `apps/web/src/main.tsx`
- Modify: `apps/web/package.json`
- Modify: `backend/app/main.py`
- Create: `docs/superpowers/runbooks/rebuild-deploy.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing PWA smoke test and deployment checklist assertions**

```tsx
test('registers the service worker in production mode', async () => {
  const register = vi.fn()
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: { register },
    configurable: true,
  })

  await registerServiceWorker()

  expect(register).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun --cwd apps/web test`
Expected: FAIL because the PWA registration helper does not exist yet.

- [ ] **Step 3: Add PWA registration, cache policy, and deployment documentation**

```ts
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  await navigator.serviceWorker.register('/sw.js')
}
```

```python
@app.middleware("http")
async def add_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/media/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response
```

```md
# Rebuild Deploy Runbook

1. Main host: run `uv run --directory backend alembic upgrade head`.
2. Main host: run `uv run --directory backend uvicorn app.main:app --host 0.0.0.0 --port 8000` behind Caddy.
3. Worker host: run `uv run --directory backend python -m app.worker.main --worker-id gpu-01` only when GPU jobs are needed.
4. Web build: run `bun --cwd apps/web build` and serve the output from the same main host.
5. Verify `/health`, gallery listing, upload precheck, search, and duplicate review before exposing the service.
```

- [ ] **Step 4: Run the full verification pass**

Run: `uv run --directory backend pytest`
Expected: PASS with the backend suite green.

Run: `bun --cwd apps/web test`
Expected: PASS with the frontend suite green.

Run: `bun --cwd apps/web build`
Expected: PASS with a production bundle emitted.

Run: `uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port 8000`
Run: `bun run dev:web`
Expected: manual smoke check passes for health, upload precheck, single-file upload, gallery search, tag edit, duplicate review, and offline shell boot.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/pwa/registerServiceWorker.ts apps/web/public/manifest.webmanifest apps/web/src/main.tsx apps/web/package.json backend/app/main.py docs/superpowers/runbooks/rebuild-deploy.md README.md
git commit -m "feat(pwa): add deployment-ready rebuild shell"
```

## Verification Checklist

- [ ] Backend tests pass with `uv run --directory backend pytest`
- [ ] Frontend tests pass with `bun --cwd apps/web test`
- [ ] Frontend production build passes with `bun --cwd apps/web build`
- [ ] Manual upload check confirms `precheck -> duplicate skip -> per-file progress -> browseable image`
- [ ] Manual search check confirms `text/tag fallback` without worker and `hybrid` mode once embeddings exist
- [ ] Worker offline check confirms gallery, tag editing, and uploads remain functional
- [ ] Duplicate review check confirms candidates are listed but never auto-merged

## Risks And Guardrails

1. **Embedding mismatch risk:** do not mix unrelated external text embeddings with local image embeddings in MVP. Use one embedding family across text and image paths.
2. **Legacy contamination risk:** do not reuse `packages/server/src/**` in the new Python service. Treat it only as behavioral reference.
3. **Upload UX risk:** keep uploads as `prehash -> precheck -> sequential or tiny-concurrency uploads`; do not revert to one giant multipart batch request.
4. **Cleanup risk:** deleting legacy mobile or Fastify code is explicitly out of scope for this plan.

## Plan Self-Review

**Citation quality:** This plan is derived directly from the confirmed rebuild spec in `docs/superpowers/specs/` and the accepted architecture decisions in the current session: Python backend, rebuilt web client, pull-based worker, structured tags, browser prehash precheck, hybrid search, and adaptive three-pane desktop workspace.

**Completeness:** The tasks cover main service bootstrap, schema, upload path, gallery and tag management, task queue, worker jobs, hybrid search, web rebuild, upload UX, PWA delivery, deployment, and verification.

**Actionability:** Every task names exact files, failing tests, commands, expected results, and a conventional commit message. There are no placeholder TODOs left in this file.
