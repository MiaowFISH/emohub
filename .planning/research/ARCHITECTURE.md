# Architecture Patterns

**Domain:** Personal Image Management System with Vector Search
**Researched:** 2026-02-11
**Confidence:** HIGH (based on established patterns + project context)

## Recommended Architecture

EmoHub follows a **layered monorepo architecture** with clear separation between presentation, business logic, and data layers. The system is designed for personal use with local-first capabilities and optional sync.

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │ Desktop App  │      │
│  │ (React+Vite) │  │ (RN + Expo)  │  │  (Electron)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/REST + WebSocket
┌────────────────────────────┼─────────────────────────────────┐
│                     API Gateway Layer                        │
│                   ┌────────▼────────┐                        │
│                   │  Fastify Server │                        │
│                   │   (Routes +     │                        │
│                   │   Middleware)   │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Image      │ │    Tag       │ │   Search     │        │
│  │   Service    │ │   Service    │ │   Service    │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
│         │                 │                 │                │
│  ┌──────┴─────────────────┴─────────────────┴──────┐        │
│  │          Vector Processing Service               │        │
│  │  (CLIP embeddings + similarity search)           │        │
│  └──────┬───────────────────────────────────┬───────┘        │
└─────────┼───────────────────────────────────┼────────────────┘
          │                                   │
┌─────────┼───────────────────────────────────┼────────────────┐
│         │        Data Access Layer          │                │
│  ┌──────▼───────┐                    ┌──────▼──────┐        │
│  │   Prisma     │                    │   Vector    │        │
│  │     ORM      │                    │   Storage   │        │
│  └──────┬───────┘                    │ (sqlite-vss)│        │
│         │                            └──────┬──────┘        │
└─────────┼───────────────────────────────────┼────────────────┘
          │                                   │
┌─────────┼───────────────────────────────────┼────────────────┐
│         │         Storage Layer             │                │
│  ┌──────▼───────┐  ┌──────────────┐ ┌──────▼──────┐        │
│  │   SQLite     │  │  File System │ │   Vector    │        │
│  │  (metadata)  │  │   (images)   │ │    Index    │        │
│  └──────────────┘  └──────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Frontend Components (Presentation Layer)

| Component | Responsibility | Communicates With | State Management |
|-----------|---------------|-------------------|------------------|
| **Web App** | User interface for desktop browsers | API Gateway via HTTP/WS | Zustand stores |
| **Mobile App** | Native mobile interface (iOS/Android) | API Gateway via HTTP/WS | Zustand stores (shared) |
| **Desktop App** | Electron wrapper for Web App | API Gateway via HTTP/WS | Zustand stores (shared) |
| **UI Components** | Reusable presentation components | Local state + stores | Props + local state |
| **State Stores** | Client-side state management | Services layer | Zustand |

**Key Patterns:**
- Shared UI components in `packages/ui`
- Shared types/utils in `packages/shared`
- Platform-specific code isolated to app directories
- Optimistic updates for better UX

### API Gateway Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Fastify Server** | HTTP request routing, validation | Business Logic Layer |
| **Route Handlers** | Request/response transformation | Service Layer |
| **Middleware** | CORS, logging, error handling | All routes |
| **WebSocket Handler** | Real-time sync notifications | Sync Service |
| **Validation Layer** | Input schema validation (Zod/Ajv) | Route Handlers |

**Key Patterns:**
- RESTful API design
- Request validation at gateway
- Centralized error handling
- WebSocket for push notifications

### Business Logic Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Image Service** | Image CRUD, upload processing, compression | Prisma ORM, File System, Vector Service |
| **Tag Service** | Tag CRUD, tag-image associations | Prisma ORM |
| **Search Service** | Text search, tag filtering, OCR search | Prisma ORM, Vector Service |
| **Vector Processing Service** | CLIP embedding generation, similarity search | Vector Storage, Image Service |
| **OCR Service** | Text extraction from images (Tesseract.js) | Image Service, Search Service |
| **Sync Service** | Change tracking, conflict resolution | All services, WebSocket Handler |

**Key Patterns:**
- Service layer encapsulates business logic
- Services are stateless and composable
- Each service has single responsibility
- Services communicate through well-defined interfaces

### Data Access Layer

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Prisma ORM** | Type-safe database queries, migrations | SQLite database |
| **Vector Storage Adapter** | Vector CRUD operations, similarity queries | sqlite-vss extension |
| **File Storage Adapter** | Image file I/O, path management | Local file system |
| **Repository Pattern** | Abstract data access, enable testing | Services |

**Key Patterns:**
- Repository pattern for data access abstraction
- Prisma for type-safe SQL operations
- Separate vector storage for performance
- Transaction support for data consistency

### Storage Layer

| Component | Responsibility | Data Type |
|-----------|---------------|-----------|
| **SQLite Database** | Structured metadata (images, tags, relationships) | Relational data |
| **Vector Index (sqlite-vss)** | 512-dim CLIP embeddings, similarity search | Vector data |
| **File System** | Raw image files, thumbnails | Binary files |

**Key Patterns:**
- Hybrid storage: SQL for metadata, vectors for search, files for blobs
- Single SQLite file for easy backup/portability
- File system organized by upload date (YYYY/MM/DD structure)

## Data Flow

### Image Upload Flow

```
1. User selects image(s) in UI
   ↓
2. Frontend: Compress image (browser-image-compression)
   ↓
3. Frontend: POST /api/images (multipart/form-data)
   ↓
4. API Gateway: Validate file type, size
   ↓
5. Image Service: Save file to disk
   ↓
6. Image Service: Create database record (Prisma)
   ↓
7. Vector Service: Generate CLIP embedding (async)
   ↓
8. Vector Storage: Store embedding in sqlite-vss
   ↓
9. OCR Service: Extract text (async, if enabled)
   ↓
10. Response: Return image metadata to client
    ↓
11. Frontend: Update UI optimistically
```

**Async Processing:**
- Vector embedding generation happens in background
- OCR processing queued for later
- Client receives immediate response with image metadata
- WebSocket notifies when processing completes

### Vector Search Flow

```
1. User enters search query OR uploads reference image
   ↓
2. Frontend: POST /api/search/vector
   ↓
3. Search Service: Generate query embedding
   - Text query → CLIP text encoder
   - Image query → CLIP image encoder
   ↓
4. Vector Storage: Cosine similarity search
   - SELECT * FROM vss_images WHERE vector MATCH ?
   - ORDER BY distance LIMIT 20
   ↓
5. Image Service: Fetch metadata for results
   ↓
6. Response: Return ranked results with similarity scores
   ↓
7. Frontend: Display results in grid
```

**Performance Optimization:**
- Vector search uses approximate nearest neighbor (ANN)
- Results cached for 5 minutes
- Pagination for large result sets

### Tag Management Flow

```
1. User adds/removes tags on image
   ↓
2. Frontend: PATCH /api/images/:id/tags
   ↓
3. Tag Service: Validate tag names
   ↓
4. Tag Service: Create new tags if needed
   ↓
5. Tag Service: Update image-tag associations
   ↓
6. Response: Return updated image with tags
   ↓
7. Frontend: Update UI immediately
```

**Tag Intelligence:**
- Tag autocomplete based on existing tags
- Tag frequency tracking for recommendations
- Tag hierarchy support (future enhancement)

## Patterns to Follow

### Pattern 1: Repository Pattern

**What:** Abstract data access behind interfaces.

**When:** All database operations.

**Benefits:** Easy testing, swappable backends, decoupled logic.

### Pattern 2: Service Layer

**What:** Encapsulate business logic in service classes.

**When:** Multi-step operations, cross-cutting concerns.

**Benefits:** Centralized logic, composable services, testable.

### Pattern 3: Async Processing

**What:** Offload expensive operations to background jobs.

**When:** Operations >500ms (vector embedding, OCR).

**Benefits:** Fast API responses, better resource use, retry support.

### Pattern 4: Optimistic UI Updates

**What:** Update UI immediately, rollback on error.

**When:** User actions modifying data.

**Benefits:** Instant feedback, better perceived performance.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Tight Coupling Between Layers

**What goes wrong:** Direct database access from routes/UI.

**Why bad:** Hard to test, can't swap implementations.

**Instead:** Always go through proper layers: UI → API → Service → Repository → Database.

### Anti-Pattern 2: Synchronous Vector Processing

**What goes wrong:** Blocking requests for 100-500ms per image.

**Why bad:** Poor UX, timeouts on batch uploads.

**Instead:** Queue as background jobs, notify via WebSocket.

### Anti-Pattern 3: Storing Vectors in Main Database

**What goes wrong:** 512-dim arrays in TEXT/BLOB, linear scan search.

**Why bad:** Extremely slow O(n), high memory, no indexing.

**Instead:** Use sqlite-vss with ANN indexing.

### Anti-Pattern 4: Loading All Images at Once

**What goes wrong:** Fetching all images in one request.

**Why bad:** Slow queries, large payloads, memory issues.

**Instead:** Pagination, virtual scrolling, lazy loading.

## Scalability Considerations

| Concern | At 100 images | At 10K images | At 100K images |
|---------|---------------|---------------|----------------|
| **Database** | SQLite file | SQLite file | Consider PostgreSQL |
| **Vector Search** | In-memory index | sqlite-vss | Dedicated vector DB (Qdrant) |
| **File Storage** | Local filesystem | Local filesystem | Object storage (S3/MinIO) |
| **Image Loading** | Load all | Pagination + lazy load | Virtual scrolling + CDN |
| **Search** | Full scan OK | Indexed search | Caching + optimization |
| **Backup** | Copy SQLite file | Incremental backup | Automated service |

**Current Architecture Limits:**
- SQLite handles up to ~1M images comfortably
- sqlite-vss supports up to ~100K vectors efficiently
- Local filesystem works well for personal use (<100GB)

**Migration Path (if needed):**
1. SQLite → PostgreSQL (when multi-user needed)
2. sqlite-vss → Qdrant/Milvus (when >100K images)
3. Local files → S3/MinIO (when >100GB storage)

## Suggested Build Order

### Phase 1: Foundation (Build First)

**Why first:** Everything depends on these components.

1. **Shared Types** (`packages/shared/types`)
   - Image, Tag, SearchResult interfaces
   - API request/response DTOs
   - Enables type safety across monorepo

2. **Database Schema** (`packages/server/prisma`)
   - Prisma schema definition
   - Initial migration
   - Seed data for development

3. **Repository Layer** (`packages/server/repositories`)
   - ImageRepository, TagRepository interfaces
   - Prisma implementations
   - Enables data access abstraction

### Phase 2: Core Backend (Build Second)

**Why second:** Provides API for frontend to consume.

4. **Service Layer** (`packages/server/services`)
   - ImageService, TagService
   - File storage utilities
   - Business logic foundation

5. **API Gateway** (`packages/server/routes`)
   - Fastify server setup
   - Image CRUD endpoints
   - Tag CRUD endpoints
   - Middleware (CORS, validation, error handling)

6. **File Storage** (`packages/server/storage`)
   - File upload handling
   - Path management
   - Image compression

### Phase 3: Frontend Foundation (Build Third)

**Why third:** Can now integrate with backend API.

7. **State Management** (`apps/web/stores`)
   - Zustand stores for images, tags
   - API client setup
   - Optimistic update patterns

8. **UI Components** (`packages/ui`)
   - ImageCard, ImageGrid
   - TagInput, TagList
   - Shared components

9. **Web App Pages** (`apps/web/pages`)
   - Home page with image grid
   - Upload page
   - Image detail view

### Phase 4: Vector Search (Build Fourth)

**Why fourth:** Requires working image system first.

10. **Vector Storage** (`packages/server/vector`)
    - sqlite-vss setup
    - Vector CRUD operations
    - Similarity search queries

11. **Vector Service** (`packages/server/services/vector`)
    - CLIP model integration
    - Embedding generation
    - Background job queue

12. **Search API** (`packages/server/routes/search`)
    - Vector search endpoint
    - Text-to-vector conversion
    - Image-to-vector conversion

13. **Search UI** (`apps/web/pages/search`)
    - Search input
    - Vector search results
    - Image-based search

### Phase 5: Advanced Features (Build Fifth)

**Why fifth:** Enhancements to core functionality.

14. **OCR Service** (`packages/server/services/ocr`)
    - Tesseract.js integration
    - Text extraction
    - OCR search support

15. **WebSocket** (`packages/server/websocket`)
    - Real-time notifications
    - Processing status updates
    - Sync events

16. **Sync Service** (`packages/server/services/sync`)
    - Change tracking
    - Conflict resolution
    - Incremental sync

### Phase 6: Mobile/Desktop (Build Last)

**Why last:** Reuses all backend and shared code.

17. **Mobile App** (`apps/mobile`)
    - React Native setup
    - Reuse Zustand stores
    - Platform-specific UI

18. **Desktop App** (`apps/desktop`)
    - Electron wrapper
    - Reuse Web App code
    - Native integrations

## Build Dependencies

```
Phase 1 (Foundation)
  ├─ Shared Types (no dependencies)
  ├─ Database Schema (no dependencies)
  └─ Repository Layer (depends on: Database Schema, Shared Types)

Phase 2 (Core Backend)
  ├─ Service Layer (depends on: Repository Layer, Shared Types)
  ├─ API Gateway (depends on: Service Layer, Shared Types)
  └─ File Storage (depends on: Service Layer)

Phase 3 (Frontend Foundation)
  ├─ State Management (depends on: API Gateway, Shared Types)
  ├─ UI Components (depends on: Shared Types)
  └─ Web App Pages (depends on: State Management, UI Components)

Phase 4 (Vector Search)
  ├─ Vector Storage (depends on: Database Schema)
  ├─ Vector Service (depends on: Vector Storage, Service Layer)
  ├─ Search API (depends on: Vector Service, API Gateway)
  └─ Search UI (depends on: Search API, Web App Pages)

Phase 5 (Advanced Features)
  ├─ OCR Service (depends on: Service Layer)
  ├─ WebSocket (depends on: API Gateway)
  └─ Sync Service (depends on: Service Layer, WebSocket)

Phase 6 (Mobile/Desktop)
  ├─ Mobile App (depends on: API Gateway, State Management, UI Components)
  └─ Desktop App (depends on: Web App Pages)
```

## Sources

Based on established patterns for:
- Layered architecture (Martin Fowler's Enterprise Application Architecture)
- Repository pattern (Domain-Driven Design)
- Service layer pattern (Patterns of Enterprise Application Architecture)
- Vector search systems (CLIP paper, sqlite-vss documentation)
- Monorepo best practices (Turborepo, Nx documentation)
- React state management (Zustand documentation)
- Fastify architecture (Fastify official documentation)
