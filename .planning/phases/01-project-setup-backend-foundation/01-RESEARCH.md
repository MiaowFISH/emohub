# Phase 1: Project Setup & Backend Foundation - Research

**Researched:** 2026-02-12
**Domain:** Monorepo setup, Fastify API, Prisma ORM, SQLite database
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational infrastructure for EmoHub: a bun workspace monorepo with shared TypeScript types, a Fastify API server with Prisma ORM connected to SQLite, and a local filesystem storage structure for images and thumbnails. This phase focuses on proven, production-ready patterns for Node.js monorepos in 2026.

The stack leverages modern tooling: bun for fast package management with workspace support, Fastify 4 for high-performance API routing with plugin-based architecture, Prisma for type-safe database operations with declarative migrations, and SQLite with WAL mode for embedded database simplicity suitable for the project's scale.

**Primary recommendation:** Use bun's isolated linker mode for strict dependency management, structure the monorepo with clear `apps/` and `packages/` separation, implement Fastify's plugin system for modularity, and enable SQLite WAL mode for improved concurrency.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bun | 1.x | Package manager & runtime | 3x faster than npm, native workspace support, content-based caching |
| Fastify | 4.x | API framework | 2-3x faster than Express, plugin architecture, built-in schema validation |
| Prisma | 5.x | ORM & migrations | Type-safe queries, declarative schema, automatic migrations |
| SQLite | 3.x | Embedded database | Zero-config, single-file, excellent for read-heavy workloads |
| TypeScript | 5.9.3 | Type system | Type safety across monorepo, better IDE support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fastify/multipart | 8.x | File upload handling | Required for image upload endpoints |
| @fastify/cors | 9.x | CORS middleware | Required for web client communication |
| fastify-healthcheck | 4.x | Health check endpoint | Required for deployment monitoring |
| sharp | 0.33.x | Image processing | Required for thumbnail generation |
| better-sqlite3 | 11.x | SQLite driver | Alternative to sqlite3 for better performance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bun | pnpm | pnpm more mature for monorepos, but bun faster for pure JS/TS |
| Fastify | Express | Express has larger ecosystem, but Fastify 2-3x faster |
| SQLite | PostgreSQL | PostgreSQL better for high-concurrency writes, but SQLite simpler for this scale |

**Installation:**
```bash
# Root monorepo setup
bun init -y
bun add -D typescript @types/node

# Server package
cd packages/server
bun add fastify @fastify/cors @fastify/multipart
bun add @prisma/client
bun add -D prisma

# Shared types package
cd packages/shared
# No dependencies needed initially
```

## Architecture Patterns

### Recommended Project Structure
```
emohub/
├── apps/
│   └── web/                    # React frontend (Phase 2+)
├── packages/
│   ├── server/                 # Fastify API
│   │   ├── src/
│   │   │   ├── app.ts          # Main app setup, register plugins
│   │   │   ├── server.ts       # Server bootstrap
│   │   │   ├── plugins/        # Fastify plugins (db, auth, etc.)
│   │   │   ├── routes/         # API route definitions
│   │   │   ├── services/       # Business logic
│   │   │   └── utils/          # Helper functions
│   │   └── package.json
│   └── shared/                 # Shared TypeScript types
│       ├── src/
│       │   ├── index.ts        # Re-export all types
│       │   ├── image.ts        # Image-related types
│       │   └── tag.ts          # Tag-related types
│       └── package.json
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Generated migration files
├── storage/
│   ├── images/                 # Original uploaded images
│   └── thumbnails/             # Generated thumbnails
├── bunfig.toml                 # Bun configuration
└── package.json                # Root workspace config
```

### Pattern 1: Bun Workspace with Shared Types
**What:** Use `workspace:*` protocol to link local packages within monorepo
**When to use:** Always for internal package dependencies
**Example:**
```json
// packages/server/package.json
{
  "name": "@emohub/server",
  "dependencies": {
    "@emohub/shared": "workspace:*"
  }
}

// packages/shared/package.json
{
  "name": "@emohub/shared",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "type": "module"
}
```

### Pattern 2: Fastify Plugin Architecture
**What:** Encapsulate functionality in plugins for modularity and testability
**When to use:** For database connections, authentication, route groups
**Example:**
```typescript
// packages/server/src/plugins/db.ts
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export default fp(async (fastify) => {
  const prisma = new PrismaClient();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
});

// packages/server/src/app.ts
import Fastify from 'fastify';
import dbPlugin from './plugins/db';

const app = Fastify({ logger: true });
await app.register(dbPlugin);
```

### Pattern 3: Prisma Schema with Many-to-Many
**What:** Use explicit many-to-many for Image-Tag relationship to support future metadata
**When to use:** When relationship might need additional fields later
**Example:**
```prisma
// prisma/schema.prisma
model Image {
  id          String      @id @default(cuid())
  filename    String
  originalName String
  mimeType    String
  size        Int
  width       Int
  height      Int
  hash        String      @unique
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  tags        ImageTag[]
}

model Tag {
  id        String      @id @default(cuid())
  name      String      @unique
  category  String?
  createdAt DateTime    @default(now())
  images    ImageTag[]
}

model ImageTag {
  imageId   String
  tagId     String
  createdAt DateTime    @default(now())

  image     Image       @relation(fields: [imageId], references: [id], onDelete: Cascade)
  tag       Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([imageId, tagId])
  @@index([tagId])
}
```

### Pattern 4: File Storage Structure
**What:** Organize files by hash prefix to avoid single-directory bottlenecks
**When to use:** For applications handling thousands of images
**Example:**
```typescript
// packages/server/src/utils/storage.ts
import { join } from 'path';

export function getImagePath(hash: string): string {
  // Use first 2 chars of hash as subdirectory
  const prefix = hash.substring(0, 2);
  return join(process.env.STORAGE_PATH || './storage/images', prefix, hash);
}

export function getThumbnailPath(hash: string): string {
  const prefix = hash.substring(0, 2);
  return join(process.env.STORAGE_PATH || './storage/thumbnails', prefix, hash);
}

// Storage structure:
// storage/
//   images/
//     ab/
//       abc123...
//     cd/
//       cde456...
//   thumbnails/
//     ab/
//       abc123...
```

### Anti-Patterns to Avoid
- **Flat file storage:** Don't store all images in single directory (performance degrades after ~10k files)
- **Implicit many-to-many:** Don't use implicit M2M for Image-Tag (limits future extensibility)
- **Global Prisma instance:** Don't create global PrismaClient (use Fastify decorator pattern)
- **Hardcoded paths:** Don't hardcode storage paths (use environment variables)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File uploads | Custom multipart parser | @fastify/multipart | Handles streaming, validation, limits, security |
| Image resizing | Canvas manipulation | sharp | 4-5x faster, handles EXIF, memory-efficient |
| Database migrations | Manual SQL scripts | Prisma Migrate | Type-safe, reversible, tracks history |
| Health checks | Custom /health route | fastify-healthcheck | Integrates with @fastify/under-pressure for system metrics |
| CORS handling | Custom headers | @fastify/cors | Handles preflight, credentials, complex origins |
| Schema validation | Manual validation | Fastify JSON Schema | Pre-compiled validation, 10x faster than runtime checks |

**Key insight:** Fastify's plugin ecosystem and Prisma's tooling handle edge cases (file size limits, concurrent writes, connection pooling, schema drift) that custom solutions miss.

## Common Pitfalls

### Pitfall 1: SQLite Concurrency Issues
**What goes wrong:** Database locked errors when multiple processes try to write simultaneously
**Why it happens:** SQLite uses file-level locking; default journal mode doesn't support concurrent writes
**How to avoid:** Enable WAL (Write-Ahead Logging) mode immediately after database creation
**Warning signs:** `SQLITE_BUSY` errors, timeouts on write operations
```sql
-- In Prisma migration or seed script
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=5000;
```

### Pitfall 2: Bun Workspace Type Resolution
**What goes wrong:** TypeScript can't find types from workspace packages, shows "Cannot find module" errors
**Why it happens:** Incorrect `main` or `types` field in shared package.json, or missing `workspace:*` protocol
**How to avoid:** Always set both `main` and `types` fields in shared packages, use `workspace:*` for dependencies
**Warning signs:** IDE shows red squiggles on imports, `tsc` fails but `bun run` works
```json
// Correct shared package.json
{
  "name": "@emohub/shared",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "type": "module"
}
```

### Pitfall 3: Fastify Plugin Registration Order
**What goes wrong:** Routes can't access decorators (like `fastify.prisma`), undefined errors at runtime
**Why it happens:** Plugins registered after routes, or not using `fastify-plugin` wrapper for decorators
**How to avoid:** Register infrastructure plugins (db, config) before route plugins, use `fastify-plugin` for decorators
**Warning signs:** `fastify.prisma is undefined`, decorators work in some routes but not others
```typescript
// WRONG order
await app.register(routes);
await app.register(dbPlugin);

// CORRECT order
await app.register(dbPlugin);
await app.register(routes);
```

### Pitfall 4: Prisma Client Generation
**What goes wrong:** Type errors after schema changes, outdated types in IDE
**Why it happens:** Forgot to run `prisma generate` after schema modifications
**How to avoid:** Run `prisma generate` after every `prisma migrate dev`, add to postinstall script
**Warning signs:** Types don't match schema, autocomplete shows old fields
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Pitfall 5: File Upload Memory Exhaustion
**What goes wrong:** Server crashes or becomes unresponsive during large file uploads
**Why it happens:** Loading entire file into memory instead of streaming to disk
**How to avoid:** Always use streaming with `@fastify/multipart`, set file size limits
**Warning signs:** High memory usage during uploads, OOM errors
```typescript
// WRONG: Loading to buffer
const data = await request.file();
const buffer = await data.toBuffer(); // Loads entire file to memory

// CORRECT: Streaming to disk
const data = await request.file();
await pipeline(data.file, createWriteStream(path));
```

### Pitfall 6: Missing Storage Directory Initialization
**What goes wrong:** File upload fails with ENOENT (no such file or directory) error
**Why it happens:** Storage directories don't exist, not created during setup
**How to avoid:** Create storage directories in server startup script or seed
**Warning signs:** First upload fails, works after manual directory creation
```typescript
// packages/server/src/server.ts
import { mkdir } from 'fs/promises';

async function ensureStorageDirectories() {
  await mkdir('./storage/images', { recursive: true });
  await mkdir('./storage/thumbnails', { recursive: true });
}

await ensureStorageDirectories();
```

## Code Examples

Verified patterns from official sources:

### Fastify Server Bootstrap
```typescript
// packages/server/src/server.ts
import { build } from './app';

const start = async () => {
  const app = await build({
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    }
  });

  try {
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0' // Important for Docker/Kubernetes
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

### Prisma Plugin with Proper Cleanup
```typescript
// packages/server/src/plugins/db.ts
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

export default fp(async (fastify) => {
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });

  // Test connection
  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
});

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
```

### Health Check Setup
```typescript
// packages/server/src/app.ts
import Fastify from 'fastify';
import healthcheck from 'fastify-healthcheck';

export async function build(opts = {}) {
  const app = Fastify(opts);

  await app.register(healthcheck, {
    healthcheckUrl: '/health',
    exposeUptime: true
  });

  return app;
}
```

### Bun Workspace Configuration
```toml
# bunfig.toml (root)
[install]
linker = "isolated"  # Strict dependency isolation like pnpm

[install.cache]
dir = ".bun-cache"
```

```json
// package.json (root)
{
  "name": "emohub",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun --cwd packages/server run dev",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  }
}
```

### Prisma Schema Foundation
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Image {
  id           String      @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  width        Int
  height       Int
  hash         String      @unique
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  tags         ImageTag[]
}

model Tag {
  id        String      @id @default(cuid())
  name      String      @unique
  category  String?
  createdAt DateTime    @default(now())
  images    ImageTag[]
}

model ImageTag {
  imageId   String
  tagId     String
  createdAt DateTime    @default(now())

  image     Image       @relation(fields: [imageId], references: [id], onDelete: Cascade)
  tag       Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([imageId, tagId])
  @@index([tagId])
}
```


## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm/yarn | bun | 2023-2024 | 3x faster installs, native workspace support |
| Express | Fastify | 2020+ | 2-3x performance improvement, better TypeScript support |
| TypeORM | Prisma | 2021+ | Type-safe queries, declarative migrations, better DX |
| SQLite default mode | SQLite WAL mode | Always recommended | Concurrent reads, better write performance |
| Implicit M2M | Explicit M2M | Best practice 2024+ | Extensibility for relationship metadata |

**Deprecated/outdated:**
- `@prisma/cli` package: Merged into `prisma` package (use `prisma` only)
- `fastify-plugin` v3: Use v4+ for better TypeScript support
- SQLite without WAL: Default journal mode inadequate for web apps

## Open Questions

1. **Thumbnail generation timing**
   - What we know: Sharp can generate thumbnails in ~50-100ms
   - What's unclear: Should thumbnails be generated synchronously during upload or async via queue?
   - Recommendation: Start with synchronous (simpler), move to async if upload time >2s

2. **Storage directory structure depth**
   - What we know: 2-char hash prefix prevents single-directory bottleneck
   - What's unclear: Is 2-char prefix sufficient for 100k+ images?
   - Recommendation: 2-char prefix supports 256 subdirectories (~390 files each for 100k images), sufficient for v1

3. **Prisma connection pooling**
   - What we know: SQLite doesn't support traditional connection pooling
   - What's unclear: Does Prisma Client need special configuration for SQLite?
   - Recommendation: Default PrismaClient configuration sufficient for SQLite (single connection)

## Sources

### Primary (HIGH confidence)
- [Fastify Official Docs](https://fastify.dev) - Plugin architecture, routing patterns
- [Prisma Docs](https://prisma.io) - Schema definition, migrations, many-to-many relationships
- [Bun Docs](https://bun.com) - Workspace configuration, linker modes
- [SQLite Official](https://sqlite.org) - WAL mode, pragmas, production considerations

### Secondary (MEDIUM confidence)
- [Fastify Best Practices 2026](https://medium.com) - Project structure recommendations
- [Prisma SQLite Setup](https://dev.to) - Migration workflow patterns
- [Node.js Monorepo 2026](https://aviator.co) - File storage structure
- [Bun Workspace Setup](https://newline.co) - Shared types implementation
- [SQLite Production 2026](https://yyhh.org) - Production deployment considerations
- [Fastify Multipart Best Practices](https://backend.cafe) - File upload security

### Tertiary (LOW confidence)
- Community discussions on Reddit/GitHub - Anecdotal experiences with stack

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are production-proven with extensive documentation
- Architecture: HIGH - Patterns verified from official docs and established best practices
- Pitfalls: HIGH - Common issues documented in official troubleshooting guides

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable stack)
