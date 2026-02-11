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

