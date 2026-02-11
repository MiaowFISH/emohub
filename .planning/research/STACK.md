# Technology Stack

**Project:** EmoHub - Personal Emoji/Sticker Management System
**Researched:** 2026-02-11
**Overall Confidence:** MEDIUM (based on training data from January 2025, unable to verify with current sources)

## Recommended Stack

### Runtime & Package Manager
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Bun | 1.3.9+ | JavaScript runtime & package manager | Fast package installation, built-in bundler, native TypeScript support. 3x faster than npm. Production-ready as of 1.0+ release in Sept 2023. |

**Confidence:** MEDIUM - Bun 1.3.9 is specified in project. Bun reached production stability with 1.0, but ecosystem compatibility should be validated for specific dependencies.

### Frontend Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.2+ | UI library | Industry standard, excellent TypeScript support, rich ecosystem for image galleries and drag-drop. |
| Vite | 5.0+ | Build tool | Fast HMR, optimized for React, native ESM support. Better DX than webpack for SPAs. |
| Tailwind CSS | 3.4+ | Styling | Utility-first CSS, rapid prototyping, small bundle size with purging. Ideal for custom UI components. |

**Confidence:** HIGH - These are battle-tested choices for modern web apps. React 18 concurrent features useful for image loading performance.

### Backend Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Fastify | 4.x | HTTP server | Fastest Node.js framework (20k+ req/s), schema-based validation, excellent TypeScript support. Better performance than Express for API-heavy workloads. |
| @fastify/cors | 9.x | CORS handling | Official Fastify plugin for cross-origin requests |
| @fastify/static | 7.x | Static file serving | Serve uploaded images efficiently |
| @fastify/multipart | 8.x | File uploads | Handle sticker/emoji uploads with streaming support |

**Confidence:** HIGH - Fastify 4 is mature and well-suited for API servers with file handling.

### Database & ORM
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| SQLite | 3.45+ | Database | Zero-config, single-file database perfect for personal apps. No server overhead. |
| Prisma | 5.x | ORM | Type-safe database access, excellent migrations, good SQLite support. |
| sqlite-vss | 0.1.x | Vector search | SQLite extension for vector similarity search using FAISS. Enables CLIP vector queries. |

**Confidence:** MEDIUM - SQLite + Prisma is solid. sqlite-vss is less mature (0.1.x) but purpose-built for this use case. Alternative: pgvector with PostgreSQL (more mature but heavier).

**Critical Note:** sqlite-vss requires native compilation. Verify Bun compatibility with native SQLite extensions.

### ML/AI - Vector Embeddings
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @xenova/transformers | 2.17+ | CLIP model inference | Pure JavaScript ONNX runtime. Run Xenova/clip-vit-base-patch32 in Node.js without Python. Server-side processing avoids client GPU requirements. |
| sharp | 0.33+ | Image preprocessing | Fast image resizing/normalization before CLIP. Native performance, better than canvas-based solutions. |

**Confidence:** HIGH - @xenova/transformers is the standard for running Transformers models in JavaScript. Sharp is industry standard for Node.js image processing.

**Performance Note:** ~50ms per image is reasonable for CLIP inference on CPU. Consider batch processing for bulk imports.

### OCR - Text Extraction
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| tesseract.js | 5.x | OCR engine | Pure JavaScript Tesseract implementation. Supports Chinese + English. No native dependencies. |

**Confidence:** MEDIUM - Tesseract.js is the standard JavaScript OCR library. Performance may be slow (1-3s per image). Consider making OCR optional/async.

**Performance Warning:** OCR is significantly slower than CLIP. Run asynchronously in background queue for bulk imports.

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.x | Schema validation | Validate API inputs, form data. Type-safe runtime validation. |
| react-query (TanStack Query) | 5.x | Server state management | Cache API responses, handle loading/error states. Better than Redux for API-heavy apps. |
| react-router-dom | 6.x | Client-side routing | Navigate between views (gallery, search, settings). |
| @dnd-kit/core | 6.x | Drag and drop | Organize stickers, reorder tags. Modern, accessible DnD library. |
| react-virtuoso | 4.x | Virtual scrolling | Render 4000+ stickers efficiently. Better performance than react-window for dynamic content. |

**Confidence:** HIGH - These are standard choices for React apps with complex UI requirements.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Runtime | Bun 1.3.9 | Node.js 20 LTS | Bun already chosen. Node.js more stable but slower package management. |
| Backend | Fastify 4 | Express 4 | Express slower (5k req/s vs 20k), less TypeScript support. |
| Backend | Fastify 4 | Hono | Hono excellent but less mature ecosystem. Consider for v2. |
| Database | SQLite + sqlite-vss | PostgreSQL + pgvector | PostgreSQL overkill for personal app. Requires server setup. |
| ORM | Prisma 5 | Drizzle ORM | Drizzle lighter but Prisma has better migrations and tooling. |
| Vector Search | sqlite-vss | Qdrant/Milvus | Dedicated vector DBs overkill for 4000 images. Network overhead. |
| Virtual Scrolling | react-virtuoso | react-window | react-window requires fixed item heights. Virtuoso handles dynamic content better. |
| State Management | TanStack Query | Redux Toolkit | Redux overkill for server state. TanStack Query purpose-built for API caching. |

## Installation

### Backend Dependencies

```bash
# Core backend
bun add fastify @fastify/cors @fastify/static @fastify/multipart

# Database & ORM
bun add prisma @prisma/client sqlite-vss

# ML/AI
bun add @xenova/transformers sharp

# OCR
bun add tesseract.js

# Validation
bun add zod
```

### Frontend Dependencies

```bash
# Core frontend
bun add react react-dom react-router-dom

# State management
bun add @tanstack/react-query

# UI libraries
bun add @dnd-kit/core react-virtuoso

# Dev dependencies
bun add -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
bun add -D typescript @types/react @types/react-dom
```

## Sources

**Note:** Research conducted with limited tool access. Unable to verify with Context7 or current official documentation. All recommendations based on training data (January 2025 cutoff).

**Confidence levels reflect this limitation:**
- HIGH: Well-established technologies with stable APIs
- MEDIUM: Newer technologies or those requiring verification
- LOW: Speculative or unverified claims

**Recommended validation:**
- Verify sqlite-vss compatibility with Bun runtime
- Check latest versions of all packages
- Test @xenova/transformers performance with Bun
- Validate Prisma 5.x SQLite vector extension support
