# Project Research Summary

**Project:** EmoHub - Personal Emoji/Sticker Management System
**Domain:** Personal image management with AI-powered vector search
**Researched:** 2026-02-11
**Confidence:** MEDIUM

## Executive Summary

EmoHub is a personal sticker/emoji management system that combines traditional image library features with AI-powered search capabilities. The research reveals this is a hybrid product sitting between simple emoji keyboards and professional asset managers. The recommended approach uses a layered monorepo architecture with SQLite for metadata, sqlite-vss for vector search, and @xenova/transformers for CLIP embeddings—all running on Bun runtime for performance.

The core technical challenge is managing 4000+ stickers with real-time vector similarity search while maintaining fast upload and search performance. The recommended stack (Bun + Fastify + React + SQLite + sqlite-vss) provides a lightweight, local-first solution suitable for personal use. Critical success factors include asynchronous vectorization (avoid blocking UI), proper vector normalization, and sqlite-vss index management.

Key risks center around vector processing performance and SQLite concurrency. Mitigation strategies include implementing job queues from day one, enabling WAL mode for SQLite, batch processing with backpressure, and running expensive operations (CLIP embeddings, OCR) asynchronously. The architecture must prioritize async processing to handle bulk imports without freezing the UI.

## Key Findings

### Recommended Stack

The stack is optimized for a local-first personal application with AI capabilities. Bun 1.3.9 provides fast package management and native TypeScript support. Fastify handles API routing with excellent performance (20k+ req/s). React + Vite + Tailwind CSS delivers modern frontend DX. The database layer uses SQLite with Prisma ORM for metadata and sqlite-vss extension for vector similarity search.

**Core technologies:**
- **Bun 1.3.9**: Runtime and package manager — 3x faster than npm, native TypeScript support
- **Fastify 4.x**: HTTP server — fastest Node.js framework, schema validation, TypeScript support
- **React 18.2 + Vite 5.0**: Frontend — industry standard UI library with fast HMR build tool
- **SQLite 3.45 + Prisma 5.x**: Database — zero-config single-file database with type-safe ORM
- **sqlite-vss 0.1.x**: Vector search — SQLite extension for FAISS-based similarity search
- **@xenova/transformers 2.17+**: CLIP inference — pure JavaScript ONNX runtime for embeddings
- **Tesseract.js 5.x**: OCR — pure JavaScript text extraction supporting Chinese + English

**Critical compatibility note:** sqlite-vss requires native compilation. Bun compatibility with native SQLite extensions must be validated early in Phase 1.

### Expected Features

Research identifies clear feature tiers based on user expectations and competitive analysis.

**Must have (table stakes):**
- Upload/Import stickers — core functionality, blocks everything else
- Browse/Grid view — visual content needs visual browsing
- Basic search by filename — minimum discoverability
- Copy to clipboard — primary use case for getting stickers out
- Delete stickers — basic content management
- Basic categorization — simple tag system for organization
- Keyboard shortcuts — power user efficiency
- Responsive UI — web app must work on different screens

**Should have (competitive differentiators):**
- Vector similarity search — find visually similar stickers using CLIP embeddings (core differentiator)
- OCR text extraction — search stickers by text content in images
- Multi-dimensional tagging — character + series + keyword taxonomy
- Tag autocomplete/suggestions — faster tagging workflow
- Bulk tagging operations — efficient management of large collections
- Advanced search filters — combine tags, text, similarity in queries

**Defer (v2+):**
- Favorites/Bookmarks — nice to have but not critical for launch
- Preview/Full view — can work with grid-only initially
- Usage analytics — show most-used stickers
- Duplicate detection — prevent redundant uploads
- Export collections — backup or share curated sets

**Anti-features (explicitly avoid):**
- Social sharing/community features — out of scope for personal tool
- Real-time collaboration — not needed for single-user system
- Cloud sync across devices — v1 is local-first
- Sticker creation/editing — not a design tool
- Mobile native apps — responsive web UI sufficient for v1

### Architecture Approach

EmoHub follows a layered monorepo architecture with clear separation between presentation, business logic, and data layers. The system uses hybrid storage: SQLite for structured metadata, sqlite-vss for vector embeddings, and filesystem for image files. This separation enables efficient vector search while maintaining data portability.

**Major components:**
1. **Presentation Layer** — React web app with Zustand state management, optimistic updates
2. **API Gateway** — Fastify server with route handlers, validation, WebSocket for real-time notifications
3. **Business Logic Layer** — Service classes (Image, Tag, Search, Vector Processing, OCR, Sync)
4. **Data Access Layer** — Prisma ORM for SQL, Vector Storage adapter for sqlite-vss, File Storage adapter
5. **Storage Layer** — SQLite database (metadata), Vector Index (embeddings), File System (images)

**Key patterns:**
- Repository pattern for data access abstraction
- Service layer for business logic encapsulation
- Async processing for expensive operations (vectorization, OCR)
- Optimistic UI updates for better perceived performance

**Critical data flows:**
- Image upload → compress → save file → create DB record → async vectorization → async OCR
- Vector search → generate query embedding → similarity search → fetch metadata → return ranked results
- All expensive operations (CLIP inference 100-500ms, OCR 1-3s) run asynchronously to avoid blocking UI

### Critical Pitfalls

Research identified 7 critical pitfalls that could cause rewrites or major issues:

1. **Vector dimension mismatch** — Using CLIP model with different dimensions than database schema. Lock CLIP model variant (ViT-B/32 = 512-dim) in config from day 1, add model version metadata to database.

2. **Synchronous vectorization blocking UI** — Running CLIP inference synchronously during uploads causes UI freezes on batch imports. Implement job queue system (BullMQ) from Phase 1, use worker threads, process asynchronously.

3. **SQLite write contention** — Multiple concurrent vectorization jobs cause "database is locked" errors. Enable WAL mode in Prisma from start, implement write queue with single writer, serialize vector writes.

4. **Memory explosion from full-resolution images** — Loading large images into CLIP causes heap exhaustion. Resize images to 224x224 before inference, extract first frame from animated images, process in small batches.

5. **OCR running on every search** — Running OCR during search instead of at index time causes 2-5 second latency. Run OCR once during import, store extracted text in database, never run OCR in request path.

6. **No vector normalization** — Storing raw CLIP vectors without L2 normalization breaks cosine similarity search. Always L2-normalize vectors before storage, verify normalization in tests.

7. **Missing sqlite-vss index** — Forgetting to create/rebuild vector index after bulk inserts causes 10+ second searches. Create index immediately after schema setup, rebuild after bulk imports.

## Implications for Roadmap

Based on research, suggested phase structure follows architectural dependencies and avoids critical pitfalls:

### Phase 1: Foundation & Core Backend
**Rationale:** Everything depends on database schema, type system, and basic API. Must establish vector dimension contract and async processing patterns before building features.

**Delivers:**
- Shared types across monorepo
- Database schema (Prisma + sqlite-vss hybrid)
- Repository layer with data access abstraction
- Service layer foundation (Image, Tag services)
- Fastify API with CRUD endpoints
- File storage with upload handling

**Addresses:**
- Upload/Import stickers (table stakes)
- Delete stickers (table stakes)
- Basic categorization via simple tags

**Avoids:**
- Pitfall #1 (vector dimension mismatch) — lock CLIP model early
- Pitfall #3 (SQLite write contention) — enable WAL mode from start
- Pitfall #6 (no normalization) — establish vector processing contract

**Research flag:** MEDIUM — sqlite-vss integration with Prisma needs validation, Bun compatibility with native extensions must be tested.

### Phase 2: Frontend Foundation
**Rationale:** With working backend API, build UI to consume it. Establishes user interaction patterns and state management before adding complex features.

**Delivers:**
- React web app with Vite build
- Zustand state management with optimistic updates
- UI components (ImageCard, ImageGrid, TagInput)
- Browse/Grid view with virtual scrolling
- Basic search by filename
- Copy to clipboard functionality
- Keyboard shortcuts

**Addresses:**
- Browse/Grid view (table stakes)
- Basic search (table stakes)
- Copy to clipboard (table stakes)
- Keyboard shortcuts (table stakes)
- Responsive UI (table stakes)

**Uses:**
- React 18.2 + Vite 5.0 + Tailwind CSS
- TanStack Query for server state
- react-virtuoso for efficient rendering of 4000+ items

**Research flag:** LOW — standard React patterns, well-documented.

### Phase 3: Vector Search System
**Rationale:** Requires working image system first. Core differentiator but high complexity. Must implement async processing to avoid blocking UI.

**Delivers:**
- Vector storage layer with sqlite-vss
- CLIP embedding generation service
- Background job queue for vectorization
- Vector similarity search API
- Search UI with image-based queries

**Addresses:**
- Vector similarity search (core differentiator)

**Uses:**
- @xenova/transformers for CLIP inference
- sqlite-vss for vector indexing
- BullMQ or similar for job queue

**Avoids:**
- Pitfall #2 (synchronous vectorization) — job queue from start
- Pitfall #4 (memory explosion) — resize images before inference
- Pitfall #7 (missing index) — create index immediately

**Research flag:** HIGH — sqlite-vss API and performance characteristics need validation, CLIP model download and caching behavior must be tested, job queue integration requires planning.

### Phase 4: OCR & Advanced Search
**Rationale:** Enhances search capabilities after core vector search works. OCR is expensive (1-3s per image) so must be async.

**Delivers:**
- OCR service with Tesseract.js
- Text extraction at index time
- Full-text search integration
- Advanced search filters (tags + text + similarity)
- Tag autocomplete and suggestions

**Addresses:**
- OCR text extraction (differentiator)
- Advanced search filters (differentiator)
- Tag autocomplete (differentiator)

**Uses:**
- Tesseract.js 5.x with Chinese + English support

**Avoids:**
- Pitfall #5 (OCR in search path) — run at index time only

**Research flag:** MEDIUM — Tesseract.js performance with large batches needs testing, Chinese language support validation required.

### Phase 5: Bulk Operations & Polish
**Rationale:** Workflow enhancements after core functionality complete. Addresses power user needs.

**Delivers:**
- Bulk tagging operations
- Multi-dimensional tag taxonomy
- Thumbnail generation
- Progress indicators for async operations
- WebSocket notifications for processing status

**Addresses:**
- Bulk tagging operations (differentiator)
- Multi-dimensional tagging (differentiator)

**Implements:**
- WebSocket handler for real-time updates
- Thumbnail generation pipeline

**Research flag:** LOW — standard patterns for bulk operations and WebSockets.

### Phase 6: Mobile & Desktop (Optional)
**Rationale:** Reuses all backend and shared code. Only if web app proves insufficient.

**Delivers:**
- React Native mobile app (iOS/Android)
- Electron desktop wrapper

**Addresses:**
- Platform-specific needs if web UI insufficient

**Research flag:** LOW — defer until web app validated with users.

### Phase Ordering Rationale

- **Foundation first** — Database schema and type system establish contracts for all other phases. Vector dimension mismatch is critical pitfall that must be avoided early.
- **Backend before frontend** — API must exist before UI can consume it. Service layer encapsulates business logic for reuse.
- **Core features before differentiators** — Upload, browse, search by filename are table stakes. Vector search and OCR are differentiators that can launch later.
- **Async processing from Phase 1** — Job queue and background processing patterns must be established before vector search to avoid UI blocking pitfalls.
- **Vector search before OCR** — CLIP embeddings are faster (100-500ms) than OCR (1-3s). Validate vector search performance before adding OCR complexity.
- **Mobile/Desktop last** — Reuses all backend code. Only build if responsive web UI proves insufficient.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Vector Search):** Complex integration with sqlite-vss, CLIP model behavior, job queue architecture. Needs API research and performance testing.
- **Phase 4 (OCR):** Tesseract.js performance characteristics with large batches, Chinese language support validation.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Frontend Foundation):** Well-documented React patterns, standard state management.
- **Phase 5 (Bulk Operations):** Standard CRUD operations and WebSocket patterns.
- **Phase 6 (Mobile/Desktop):** Standard React Native and Electron patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core technologies (React, Fastify, SQLite, Prisma) are HIGH confidence. sqlite-vss (0.1.x) and Bun compatibility with native extensions are MEDIUM confidence—need validation. |
| Features | MEDIUM | Table stakes features based on competitor analysis patterns. Differentiators (vector search, OCR) are well-understood but implementation complexity is MEDIUM. |
| Architecture | HIGH | Layered architecture with repository pattern and service layer are established patterns. Async processing approach is proven for expensive operations. |
| Pitfalls | MEDIUM | Critical pitfalls identified from domain knowledge of CLIP, SQLite, and Node.js patterns. Specific sqlite-vss behaviors need validation during implementation. |

**Overall confidence:** MEDIUM

Research is based on training data (January 2025 cutoff) without access to current documentation or Context7. Core architectural patterns and technology choices are sound, but specific implementation details need validation.

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **sqlite-vss API and behavior:** Official documentation needed for index creation, query syntax, performance characteristics. Test with sample dataset in Phase 1.
- **Bun compatibility with native modules:** sqlite-vss requires native compilation. Test compatibility early in Phase 1, have Node.js fallback plan.
- **@xenova/transformers model caching:** Verify model download behavior (500MB+ on first run), cache location, warmup strategy. Test in Phase 3.
- **CLIP model dimensions and normalization:** Verify exact output dimensions for chosen model variant, confirm normalization requirements. Document in Phase 1.
- **Prisma virtual table support:** Prisma doesn't natively support sqlite-vss virtual tables. Plan hybrid approach (Prisma for regular tables, raw SQL for vector operations) in Phase 1.
- **Tesseract.js Chinese support:** Validate Chinese language pack availability and performance. Test in Phase 4.
- **Job queue selection:** Evaluate BullMQ vs alternatives for Bun compatibility. Decide in Phase 1.

## Sources

### Primary (HIGH confidence)
- Layered architecture patterns (Martin Fowler's Enterprise Application Architecture)
- Repository pattern (Domain-Driven Design)
- React 18 documentation and concurrent features
- Fastify 4 official documentation
- Prisma 5 documentation for SQLite

### Secondary (MEDIUM confidence)
- CLIP paper and model architecture (ViT-B/32 = 512-dim, ViT-L/14 = 768-dim)
- @xenova/transformers library patterns for ONNX runtime
- sqlite-vss extension capabilities (based on training data, needs verification)
- Competitor analysis patterns (Gboard, Telegram stickers, Discord emoji managers, Eagle, Pixave)
- Node.js/Bun runtime patterns and performance characteristics

### Tertiary (LOW confidence)
- Bun 1.3.9 compatibility with native SQLite extensions (needs testing)
- sqlite-vss 0.1.x API details (needs official documentation)
- Tesseract.js 5.x Chinese language support (needs validation)

---
*Research completed: 2026-02-11*
*Ready for roadmap: yes*
