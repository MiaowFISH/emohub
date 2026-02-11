# Domain Pitfalls

**Domain:** Personal emoji/sticker management with CLIP vector search
**Researched:** 2026-02-11

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Vector Dimension Mismatch Between CLIP Model and Database Schema
**What goes wrong:** Using CLIP model that outputs 512-dim vectors but database schema configured for different dimensions (e.g., 768-dim from other models), or switching CLIP models mid-project without migration strategy.

**Why it happens:**
- Different CLIP model variants output different dimensions (ViT-B/32 = 512, ViT-L/14 = 768)
- @xenova/transformers supports multiple CLIP models
- Schema defined early without considering model flexibility

**Consequences:**
- All existing vectors become invalid if model changes
- Vector search returns incorrect results or fails
- Requires full re-vectorization of entire dataset (4000+ stickers)
- Database migration complexity

**Prevention:**
- Lock CLIP model variant in config from day 1
- Document exact model ID in schema comments
- Add model version metadata to database
- Create migration script before first production use
- Test vector dimension consistency in CI

**Detection:**
- Vector insertion fails with dimension error
- Search results suddenly degrade after model update
- Runtime errors about array size mismatch

---

### Pitfall 2: Synchronous Vectorization Blocking UI Operations
**What goes wrong:** Running CLIP model inference synchronously during image upload/import, causing UI freezes for 4000+ sticker batch imports.

**Why it happens:**
- @xenova/transformers runs in Node.js main thread by default
- CLIP inference takes 100-500ms per image
- Batch imports trigger sequential processing
- No queue or background job system

**Consequences:**
- UI becomes unresponsive during imports
- Users abandon long-running operations
- Server timeouts on large batches
- Poor user experience

**Prevention:**
- Implement job queue system (BullMQ, bee-queue) from Phase 1
- Use worker threads for CLIP inference
- Show progress indicators for batch operations
- Process vectorization asynchronously after upload
- Allow users to continue working while vectorization runs in background

**Detection:**
- Upload endpoint response time > 5 seconds
- Browser "page unresponsive" warnings
- Server timeout errors on batch imports
- CPU pegged at 100% during uploads

---

### Pitfall 3: SQLite Write Contention with Concurrent Vectorization
**What goes wrong:** Multiple concurrent vectorization jobs trying to write to SQLite cause "database is locked" errors, especially with sqlite-vss extension.

**Why it happens:**
- SQLite has single-writer limitation
- Batch vectorization spawns multiple workers
- Each worker tries to write vectors simultaneously
- WAL mode not configured or insufficient

**Consequences:**
- Random "SQLITE_BUSY" errors
- Data loss from failed writes
- Retry storms making problem worse
- Inconsistent vector index state

**Prevention:**
- Enable WAL mode in Prisma from start
- Implement write queue with single writer
- Use batch inserts instead of individual writes
- Configure busy_timeout appropriately (5000ms+)
- Serialize vector writes even if inference is parallel

**Detection:**
- "Database is locked" errors in logs
- Failed vectorization jobs
- Missing vectors for uploaded images
- Inconsistent search results

---

### Pitfall 4: Memory Explosion from Loading All Images into CLIP Model
**What goes wrong:** Loading full-resolution images (especially animated GIFs/stickers) directly into CLIP model causes Node.js heap exhaustion.

**Why it happens:**
- Stickers can be large files (animated GIFs, high-res PNGs)
- CLIP preprocessing loads entire image into memory
- Batch processing multiplies memory usage
- No image resizing before vectorization

**Consequences:**
- Node.js crashes with "JavaScript heap out of memory"
- Server becomes unstable
- Failed vectorization jobs
- Need to restart server frequently

**Prevention:**
- Resize images to CLIP input size (224x224) before inference
- Extract first frame from animated images
- Process images in small batches (10-20 at a time)
- Monitor memory usage and implement backpressure
- Set Node.js heap size appropriately (--max-old-space-size)

**Detection:**
- Memory usage climbing during vectorization
- Heap out of memory errors
- Server crashes during batch imports
- Slow performance as memory fills

---

### Pitfall 5: Tesseract.js OCR Running on Every Search Query
**What goes wrong:** Running OCR on images during search instead of at index time, causing 2-5 second search latency.

**Why it happens:**
- OCR placed in search path instead of indexing path
- Misunderstanding of when to extract text
- No caching of OCR results

**Consequences:**
- Unacceptably slow search (multi-second delays)
- High CPU usage during searches
- Poor user experience
- Wasted computation on repeated searches

**Prevention:**
- Run OCR once during image import/upload
- Store extracted text in database
- Index text for full-text search
- Never run OCR in request path
- Make OCR optional/async for better UX

**Detection:**
- Search queries taking > 1 second
- High CPU during search operations
- Tesseract.js in search endpoint stack traces
- Users complaining about slow search

---

### Pitfall 6: No Normalization of CLIP Vectors Before Storage
**What goes wrong:** Storing raw CLIP vectors without L2 normalization breaks cosine similarity search in sqlite-vss.

**Why it happens:**
- Assuming CLIP outputs normalized vectors (it doesn't always)
- Not understanding vector similarity metrics
- Missing normalization step in pipeline

**Consequences:**
- Incorrect similarity scores
- Poor search result ranking
- Inconsistent results across queries
- Distance metrics don't work as expected

**Prevention:**
- Always L2-normalize vectors before storage
- Verify normalization in tests (vector magnitude = 1.0)
- Document normalization requirement
- Add validation to catch unnormalized vectors

**Detection:**
- Search results seem random
- Similar images ranked far apart
- Vector magnitudes != 1.0 when queried
- Inconsistent similarity scores

---

### Pitfall 7: sqlite-vss Index Not Created or Rebuilt After Bulk Inserts
**What goes wrong:** Forgetting to create/rebuild vector index after bulk inserting 4000+ stickers, causing linear scan searches that take 10+ seconds.

**Why it happens:**
- sqlite-vss requires explicit index creation
- Index not automatically maintained during bulk inserts
- Missing index rebuild step in import workflow

**Consequences:**
- Extremely slow vector searches (linear scan of all vectors)
- Poor user experience
- Wasted CLIP computation if search is unusable

**Prevention:**
- Create index immediately after schema setup
- Rebuild index after bulk imports
- Add index existence check to search endpoint
- Document index maintenance in import procedures

**Detection:**
- Search queries taking 5-10+ seconds
- CPU usage high during searches
- sqlite-vss not using index (check EXPLAIN QUERY PLAN)
- Performance degrades with more stickers

---

## Moderate Pitfalls

### Pitfall 1: Prisma Schema Not Configured for sqlite-vss Virtual Tables
**What goes wrong:** Prisma doesn't natively support sqlite-vss virtual tables, requiring raw SQL queries that bypass type safety.

**Why it happens:**
- sqlite-vss uses virtual tables (CREATE VIRTUAL TABLE)
- Prisma schema doesn't support virtual table syntax
- Attempting to define vss tables in schema.prisma fails

**Consequences:**
- Loss of type safety for vector operations
- Manual SQL query management
- No migration support for vector tables
- Increased maintenance burden

**Prevention:**
- Use Prisma for regular tables only
- Create separate migration files for sqlite-vss tables
- Wrap raw SQL in typed repository layer
- Document the hybrid approach clearly
- Consider using Prisma.$executeRaw with typed parameters

---

### Pitfall 2: No Pagination for Vector Search Results
**What goes wrong:** Returning all matching vectors from search without pagination causes memory issues and slow response times.

**Why it happens:**
- Vector search returns similarity scores for all items
- No LIMIT clause on vector queries
- Assuming small result sets

**Consequences:**
- Large JSON payloads (4000+ results)
- Slow API responses
- High memory usage
- Poor mobile performance

**Prevention:**
- Always use LIMIT on vector searches (default 20-50)
- Implement cursor-based pagination
- Return only necessary fields
- Add configurable result limits

---

### Pitfall 3: Storing Full File Paths Instead of Relative Paths
**What goes wrong:** Storing absolute file paths in database makes the system non-portable across environments.

**Why it happens:**
- Using process.cwd() or __dirname in file path storage
- Not separating storage root from relative paths
- Hardcoding paths during development

**Consequences:**
- Database not portable between dev/prod
- Broken paths when moving storage location
- Difficult to backup/restore
- Environment-specific database

**Prevention:**
- Store relative paths from storage root
- Configure storage root via environment variable
- Resolve full paths at runtime only
- Test with different storage locations

---

### Pitfall 4: No Deduplication Strategy for Identical Stickers
**What goes wrong:** Importing same sticker multiple times creates duplicate vectors and wastes storage.

**Why it happens:**
- No hash-based deduplication
- Relying only on filename
- No perceptual hashing

**Consequences:**
- Wasted storage space
- Duplicate search results
- Slower searches (more vectors to compare)
- Confused users seeing duplicates

**Prevention:**
- Calculate file hash (SHA-256) on import
- Check for existing hash before vectorization
- Optionally use perceptual hashing for near-duplicates
- Add unique constraint on hash column

---

### Pitfall 5: Bun Runtime Compatibility Issues with Native Modules
**What goes wrong:** @xenova/transformers or sqlite-vss may have compatibility issues with bun runtime vs Node.js.

**Why it happens:**
- Bun is not 100% Node.js compatible
- Native modules may use Node-specific APIs
- WASM modules may behave differently

**Consequences:**
- Runtime errors in production
- Unexpected behavior differences
- Difficult debugging
- Need to switch runtimes

**Prevention:**
- Test all critical paths with bun early
- Have Node.js fallback plan
- Check bun compatibility for all native deps
- Monitor bun issue tracker for known issues
- Consider using Node.js for server if issues arise

---

### Pitfall 6: @xenova/transformers Model Download on First Run
**What goes wrong:** CLIP model downloads on first inference (can be 500MB+), causing timeout on first upload.

**Why it happens:**
- Models cached locally after first download
- No pre-warming of model cache
- First user hits cold start

**Consequences:**
- First upload times out
- Poor first-run experience
- Unexpected bandwidth usage

**Prevention:**
- Pre-download models during build/deployment
- Add model warmup step to startup
- Document model cache location
- Show loading state during first model load

---

## Minor Pitfalls

### Pitfall 1: No Thumbnail Generation for Large Stickers
**What goes wrong:** Serving full-resolution stickers in grid views causes slow page loads and high bandwidth usage.

**Why it happens:**
- No image resizing pipeline
- Serving original files directly
- Not considering mobile/slow connections

**Consequences:**
- Slow grid view loading
- High bandwidth costs
- Poor mobile experience

**Prevention:**
- Generate thumbnails on import (150x150, 300x300)
- Store multiple sizes
- Serve appropriate size based on context
- Use lazy loading for grids

---

### Pitfall 2: Missing CORS Configuration for Local File Access
**What goes wrong:** Browser blocks loading sticker images from local file system in web app.

**Why it happens:**
- Serving files directly from file:// protocol
- No static file server configured
- CORS not configured for local development

**Consequences:**
- Images don't display in browser
- Development workflow broken
- Confusion about why images work in backend but not frontend

**Prevention:**
- Always serve files through HTTP server
- Configure static file serving in development
- Set appropriate CORS headers
- Use proper URL construction

---

### Pitfall 3: No Error Handling for Corrupted Image Files
**What goes wrong:** Corrupted or invalid image files crash vectorization pipeline.

**Why it happens:**
- No validation before processing
- Assuming all files are valid images
- No try-catch around image loading

**Consequences:**
- Pipeline crashes on bad files
- Batch imports fail completely
- No visibility into which files are problematic

**Prevention:**
- Validate image files before processing
- Wrap image operations in try-catch
- Log failed files for manual review
- Continue processing remaining files on error
- Add file format validation

---

### Pitfall 4: SQLite Database File Not in .gitignore
**What goes wrong:** Committing SQLite database file to git causes merge conflicts and bloated repository.

**Why it happens:**
- Default .gitignore doesn't include *.db files
- Database created in project root
- Not thinking about version control

**Consequences:**
- Large git repository
- Merge conflicts on database file
- Accidental commit of user data

**Prevention:**
- Add *.db, *.db-shm, *.db-wal to .gitignore immediately
- Store database outside project root or in dedicated data/ folder
- Document database location in README

---

### Pitfall 5: No Logging for Vectorization Pipeline
**What goes wrong:** When vectorization fails, no visibility into what went wrong or which images failed.

**Why it happens:**
- No structured logging
- Silent failures
- No progress tracking

**Consequences:**
- Difficult debugging
- Unknown failure rates
- Can't identify problematic images

**Prevention:**
- Add structured logging from day 1
- Log start/end of each vectorization
- Log failures with image path and error
- Track success/failure metrics

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Database Schema Design | Vector dimension mismatch, Prisma/sqlite-vss incompatibility | Lock CLIP model early, plan hybrid Prisma + raw SQL approach |
| Image Import/Upload | Synchronous vectorization blocking UI, memory explosion | Implement job queue from start, batch processing with backpressure |
| Vector Search Implementation | Missing index, no normalization, no pagination | Create index immediately, normalize vectors, always use LIMIT |
| OCR Integration | Running OCR in search path | Run OCR at index time only, store results in database |
| Batch Processing | SQLite write contention, no progress tracking | Enable WAL mode, serialize writes, add logging and progress indicators |
| File Storage | Absolute paths, no thumbnails, CORS issues | Use relative paths, generate thumbnails, configure static file serving |
| Production Deployment | Model download on first run, bun compatibility | Pre-download models, test with bun early, have Node.js fallback |

## Sources

**Confidence Level: MEDIUM**

Research based on:
- Knowledge of CLIP model architecture and @xenova/transformers implementation patterns
- SQLite and sqlite-vss extension behavior and limitations
- Common Node.js/Bun runtime patterns and pitfalls
- Tesseract.js OCR performance characteristics
- Prisma ORM capabilities and limitations with SQLite
- Standard image management system architecture patterns

**Note:** This research is based on training data and domain knowledge. Key findings should be verified during implementation:
- sqlite-vss specific API and index management (check official docs)
- @xenova/transformers model download behavior and caching
- Bun compatibility with native modules (test early)
- Prisma virtual table support status (may have changed)

**Recommended validation:**
- Test sqlite-vss index creation and query performance with sample dataset
- Verify @xenova/transformers CLIP model dimensions and normalization
- Benchmark vectorization performance with actual sticker files
- Test bun compatibility with all dependencies early in Phase 1
