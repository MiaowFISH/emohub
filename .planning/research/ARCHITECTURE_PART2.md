### Pattern 3: Async Processing with Background Jobs

**What:** Offload expensive operations (vector embedding, OCR) to background processing to keep API responses fast.

**When:** Operations that take >500ms or are not immediately needed.

**Example:**
```typescript
class VectorService {
  private queue: JobQueue

  async generateEmbedding(imageId: string, filePath: string): Promise<void> {
    // Queue job instead of blocking
    await this.queue.add('generate-embedding', {
      imageId,
      filePath
    })
  }

  // Worker processes jobs
  async processEmbeddingJob(job: Job): Promise<void> {
    const { imageId, filePath } = job.data
    const embedding = await this.clipModel.encode(filePath)
    await this.vectorStorage.store(imageId, embedding)

    // Notify client via WebSocket
    this.notifyClient(imageId, 'embedding-ready')
  }
}
```

**Benefits:**
- Fast API responses
- Better resource utilization
- Retry failed jobs automatically

### Pattern 4: Optimistic UI Updates

**What:** Update UI immediately before server confirms, rollback on error.

**When:** User actions that modify data (add tag, delete image).

**Example:**
```typescript
// Zustand store
const useImageStore = create((set, get) => ({
  images: [],

  addTag: async (imageId: string, tag: string) => {
    // Optimistic update
    set(state => ({
      images: state.images.map(img =>
        img.id === imageId
          ? { ...img, tags: [...img.tags, tag] }
          : img
      )
    }))

    try {
      // Confirm with server
      await api.addTag(imageId, tag)
    } catch (error) {
      // Rollback on error
      set(state => ({
        images: state.images.map(img =>
          img.id === imageId
            ? { ...img, tags: img.tags.filter(t => t !== tag) }
            : img
        )
      }))
      throw error
    }
  }
}))
```

**Benefits:**
- Instant feedback for users
- Better perceived performance
- Graceful error handling

## Anti-Patterns to Avoid

### Anti-Pattern 1: Tight Coupling Between Layers

**What goes wrong:** Direct database access from route handlers, or UI components calling repositories directly.

**Why bad:** Makes testing difficult, prevents swapping implementations, violates separation of concerns.

**Instead:** Always go through the proper layers: UI → API → Service → Repository → Database.

### Anti-Pattern 2: Synchronous Vector Processing

**What goes wrong:** Generating CLIP embeddings during image upload blocks the request for 100-500ms per image.

**Why bad:** Poor user experience, timeouts on batch uploads, wasted server resources.

**Instead:** Queue vector processing as background jobs, return immediately, notify via WebSocket when complete.

### Anti-Pattern 3: Storing Vectors in Main Database

**What goes wrong:** Storing 512-dim float arrays in SQLite TEXT/BLOB columns, doing similarity search with application code.

**Why bad:** Extremely slow (O(n) linear scan), high memory usage, no indexing support.

**Instead:** Use sqlite-vss extension for vector storage with proper indexing (approximate nearest neighbor).

### Anti-Pattern 4: Loading All Images at Once

**What goes wrong:** Fetching all images from database and sending to frontend in one request.

**Why bad:** Slow queries, large payloads, memory issues, poor UX.

**Instead:** Implement pagination, virtual scrolling, lazy loading of images.

## Scalability Considerations

| Concern | At 100 images | At 10K images | At 100K images |
|---------|---------------|---------------|----------------|
| **Database** | SQLite file | SQLite file | Consider PostgreSQL |
| **Vector Search** | In-memory index | sqlite-vss | Dedicated vector DB (Qdrant) |
| **File Storage** | Local filesystem | Local filesystem | Object storage (S3/MinIO) |
| **Image Loading** | Load all | Pagination + lazy load | Virtual scrolling + CDN |
| **Search** | Full scan OK | Indexed search | Caching + search optimization |
| **Backup** | Copy SQLite file | Incremental backup | Automated backup service |

**Current Architecture Limits:**
- SQLite handles up to ~1M images comfortably
- sqlite-vss supports up to ~100K vectors efficiently
- Local filesystem works well for personal use (<100GB)

**Migration Path (if needed):**
1. SQLite → PostgreSQL (when multi-user needed)
2. sqlite-vss → Qdrant/Milvus (when >100K images)
3. Local files → S3/MinIO (when >100GB storage)

