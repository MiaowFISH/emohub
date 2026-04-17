# EmoHub Rebuild Design Spec

## Overview

EmoHub will be rebuilt as a single-user LAN image management system with a Python backend, a rebuilt Web/PWA client, and an optional GPU worker. The new system is greenfield: it does not migrate legacy data and does not preserve the current Bun/Fastify backend architecture. Legacy code remains reference-only during the rebuild.

## Goals

1. Make image ingest, browsing, tagging, and retrieval reliable on a CPU-only main host.
2. Keep GPU-dependent enrichment optional so the system remains usable when the worker is offline.
3. Support structured tags, text/tag retrieval, semantic retrieval, and image-to-image retrieval.
4. Optimize upload UX around browser-side prehashing, duplicate precheck, and per-file progress.
5. Prioritize a desktop-first management workspace while preserving a workable mobile PWA layout.

## Non-Goals

1. No multi-user accounts, auth, or permissions.
2. No legacy database migration.
3. No native mobile client in MVP.
4. No automatic duplicate merge.
5. No offline editing or local database sync.

## Section 1: System Architecture And Service Boundaries

### Main Service

The always-on CPU main service is the system of record. It owns:

1. SQLite metadata database.
2. Managed original-image and thumbnail storage.
3. Structured tag catalog and image-tag relations.
4. Processing task queue.
5. Local vector index.
6. Web API, media serving, and PWA assets.

The main service must remain fully usable for:

1. Upload precheck.
2. Single-file upload ingest.
3. Gallery browsing.
4. Tag editing.
5. Text and structured-tag search.

### GPU Worker

The GPU worker is a pull-based optional service. It comes online only when image-side AI jobs are needed and polls the main service for work. It is responsible for:

1. Image embedding generation.
2. Image-to-image search preparation.
3. Near-duplicate candidate generation.
4. Optional future auto-tag suggestions.

The worker does not own storage, metadata, or task truth. It only leases tasks from the main service and writes results back.

### Client

The client is a rebuilt Web/PWA app. It targets desktop first, with adaptive behavior for smaller screens. The default large-screen layout is:

1. Left rail: search, structured tag filters, and utility filters.
2. Center: multi-column gallery.
3. Right rail: detail view, tag editing, and duplicate-review context.

## Section 2: Data Model And Index Boundaries

### Core Metadata Model

The main database stores:

1. Images.
2. Tags.
3. Image-tag relations.
4. Processing tasks.
5. Duplicate candidates.

Images become browseable immediately after the main service finishes synchronous ingest. AI-derived enrichment updates the same records later.

### Structured Tags

Tags are structured, not flat. MVP categories include examples like:

1. `character:艾玛`
2. `series:demo`
3. `action:举手`
4. `source:telegram`

Each tag has a category, display name, normalized key, and source. The UI surfaces categories explicitly instead of requiring users to learn a power query language.

### Dedupe Model

Hard dedupe uses image content hash as the authoritative key. Near-duplicates are stored as review candidates and never auto-merged.

### Vector Index

The vector index lives with the main service. It is a local capability, not a separate always-on database process. It is updated by worker-produced image embeddings and queried by the main service during semantic search.

## Section 3: Import, Upload, And Processing Pipeline

### Supported Entry Paths

There are two ingest paths:

1. Browser upload.
2. Bulk folder import.

Both paths normalize into the same main-service ingest pipeline.

### Browser Upload Flow

Browser upload is explicitly optimized for early duplicate rejection and visible progress:

1. The browser computes a SHA-256 hash for each selected file.
2. The client sends hashes to a lightweight precheck endpoint.
3. Existing files are marked duplicate and skipped before upload.
4. Missing files upload one by one, or with very small controlled concurrency.
5. The server recomputes the file hash and remains the final source of truth.
6. Each file shows its own progress and status in the upload queue.

This avoids the old behavior where dozens of files upload first and only return status after the whole batch completes.

### Main-Service Synchronous Work

For every accepted image, the main service synchronously performs:

1. Final hash verification.
2. Hard dedupe check.
3. Metadata extraction.
4. Thumbnail generation.
5. Storage placement.
6. Structured tag attachment from manual input, sidecars, or inherited folder tags.
7. Initial gallery visibility.

At this point the image is already browseable and editable.

### Deferred Worker Tasks

The worker later performs:

1. Image embedding generation.
2. Vector-index update.
3. Near-duplicate candidate generation.
4. Optional later AI tag suggestions.

Worker failure or worker absence must not block the normal management workflow.

### Import Rules

Folder import supports:

1. Historical bulk imports.
2. Ongoing repeated imports.
3. Folder-derived tags.
4. Sidecar `.txt` tags.

Import also goes through hard dedupe so re-importing the same assets is safe.

## Section 4: Search Model And Client Interaction

### Hybrid Search UX

The UI uses one general search box plus structured filters. Users do not need to learn a special query syntax to be productive.

Search combines:

1. Free-text keywords.
2. Structured tag filters.
3. Semantic retrieval when embeddings exist.

### Graceful Degradation

If embeddings are unavailable for some or all images, the same search surface falls back to text and tag retrieval instead of failing.

### Image-To-Image Retrieval

Image-to-image search is initiated from the search rail and returns results in the same gallery view with a clear mode label.

### Management UI

MVP management capabilities include:

1. Single-image detail view.
2. Tag add/remove/edit.
3. Batch selection.
4. Batch add/remove tags.
5. Duplicate candidate review list.

The gallery should render as a multi-column image grid, not a single-column stream.

## Section 5: Caching, Deployment, Failure Recovery, And MVP Acceptance

### Cache Strategy

1. Original-image and thumbnail URLs are content-addressed and can use long immutable caching.
2. Metadata and search APIs use conservative caching so edits are reflected immediately.
3. The PWA caches the application shell, not a full offline metadata store.

### Deployment Shape

1. Main host: FastAPI service, SQLite, image storage, thumbnails, task queue, vector index, static assets.
2. Worker host: optional pull-based GPU worker.
3. Reverse proxy: Caddy or Nginx in front of the main service.

### Failure Recovery Rules

1. If the worker is offline, uploads, browsing, tag editing, and text/tag search still work.
2. If an AI task fails, the image remains in the gallery and the task becomes retryable.
3. If the vector index is stale or damaged, text/tag search still works and the index can be rebuilt.
4. If thumbnails are missing, they can be regenerated from original files.

### MVP Acceptance Boundary

MVP must include:

1. Web + PWA installability.
2. Desktop-first adaptive workspace.
3. Multi-column gallery.
4. Structured tags.
5. Folder import.
6. Browser prehash + precheck + per-file progress upload flow.
7. Hash-based hard dedupe.
8. Text/tag retrieval.
9. Semantic search.
10. Image-to-image search.
11. Duplicate candidate review.
12. Worker-optional operation.

MVP explicitly excludes:

1. Multi-user support.
2. Native mobile app.
3. Offline editing.
4. Automatic duplicate merge.
5. Legacy data migration.

## Delivery Guidance

Implementation should proceed as small vertical slices, keeping the legacy Node server and mobile app untouched until the new stack is verified. The next execution artifact is the matching implementation plan in `docs/superpowers/plans/2026-04-16-emohub-rebuild-implementation.md`.
