# Phase 2: Image Management - Research

**Researched:** 2026-02-12
**Domain:** Image upload, processing, storage, and display
**Confidence:** HIGH

## Summary

Phase 2 implements a complete image management system with drag-drop upload, server-side processing, and virtual scrolling display. The standard stack leverages battle-tested libraries: `@fastify/multipart` for streaming uploads, `sharp` for high-performance image processing (compression, thumbnails, format conversion), `react-dropzone` for drag-drop UI, `yet-another-react-lightbox` for image preview, and `@tanstack/react-virtual` for efficient grid rendering.

The architecture follows a streaming-first approach: files stream directly to disk (never held in memory), are processed asynchronously with sharp, and stored in the existing hash-based directory structure. Duplicate detection uses Node.js crypto module for SHA-256 hashing during upload. The frontend uses virtual scrolling to handle thousands of images efficiently, only rendering visible items.

**Primary recommendation:** Stream files to disk immediately, process with sharp in background, use virtual scrolling for display, and leverage existing storage infrastructure.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @fastify/multipart | Latest | Multipart file upload handling | Official Fastify plugin, stream-based, actively maintained |
| sharp | ^0.34.5 | Image processing (resize, compress, convert) | 4-5x faster than ImageMagick, libvips-based, industry standard |
| react-dropzone | Latest | Drag-drop file upload UI | Hook-based API, HTML5 compliant, 14.4k+ GitHub stars |
| yet-another-react-lightbox | ^3.28.0 | Image preview/lightbox | Modern, plugin-based, React 19 compatible, actively maintained |
| @tanstack/react-virtual | ^3.13.18 | Virtual scrolling for grids | Headless UI, handles variable sizes, TanStack ecosystem |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js crypto | Built-in | SHA-256 file hashing | Duplicate detection, always use for hashing |
| Node.js fs/stream | Built-in | File streaming operations | All file I/O, use pipeline for safety |
| Node.js path | Built-in | Path manipulation | File path construction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sharp | jimp | Pure JS (no native deps) but 10x slower, not suitable for production |
| @fastify/multipart | multer | Express-focused, less Fastify-idiomatic |
| react-dropzone | react-dnd | More complex, overkill for file uploads |
| yet-another-react-lightbox | react-image-lightbox | Older, less maintained, no React 19 support |

**Installation:**
```bash
# Server dependencies
cd packages/server
bun add @fastify/multipart sharp

# Web dependencies
cd apps/web
bun add react-dropzone yet-another-react-lightbox @tanstack/react-virtual
```

## Architecture Patterns

### Recommended Project Structure
```
packages/server/src/
├── routes/
│   └── images.ts           # Upload, list, delete endpoints
├── services/
│   ├── imageService.ts     # Business logic (CRUD operations)
│   └── imageProcessor.ts   # Sharp processing (compress, thumbnail, convert)
└── utils/
    └── hashUtils.ts        # SHA-256 hashing utilities

apps/web/src/
├── components/
│   ├── ImageUpload.tsx     # Drag-drop upload component
│   ├── ImageGrid.tsx       # Virtual scrolling grid
│   └── ImageLightbox.tsx   # Full-size preview
├── hooks/
│   └── useImageUpload.ts   # Upload logic with progress
└── stores/
    └── imageStore.ts       # Zustand store for image state
```

### Pattern 1: Streaming Upload to Disk
**What:** Stream uploaded files directly to disk without buffering in memory
**When to use:** All file uploads, especially for images >1MB
**Example:**
```typescript
// Source: @fastify/multipart official docs
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'

fastify.post('/upload', async (req, reply) => {
  const data = await req.file()
  const targetPath = getImagePath(data.filename)

  // Stream directly to disk
  await pipeline(data.file, fs.createWriteStream(targetPath))

  return { success: true, filename: data.filename }
})
```

### Pattern 2: Async Image Processing Pipeline
**What:** Process images asynchronously after upload completes
**When to use:** Compression, thumbnail generation, format conversion
**Example:**
```typescript
// Source: sharp official docs
import sharp from 'sharp'

async function processImage(inputPath: string, hash: string) {
  const image = sharp(inputPath)
  const metadata = await image.metadata()

  // Generate compressed version
  await image
    .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(getImagePath(hash))

  // Generate thumbnail
  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(getThumbnailPath(hash))

  return { width: metadata.width, height: metadata.height }
}
```

### Pattern 3: SHA-256 Hash During Upload
**What:** Calculate file hash while streaming to detect duplicates
**When to use:** Every file upload for duplicate detection
**Example:**
```typescript
// Source: Node.js crypto module docs
import crypto from 'node:crypto'
import { pipeline } from 'node:stream/promises'

async function hashFile(stream: NodeJS.ReadableStream): Promise<string> {
  const hash = crypto.createHash('sha256')

  await pipeline(
    stream,
    async function* (source) {
      for await (const chunk of source) {
        hash.update(chunk)
        yield chunk
      }
    }
  )

  return hash.digest('hex')
}
```

### Pattern 4: Virtual Scrolling Grid
**What:** Render only visible images in viewport for performance
**When to use:** Displaying large collections (>100 images)
**Example:**
```typescript
// Source: TanStack Virtual docs
import { useVirtualizer } from '@tanstack/react-virtual'

function ImageGrid({ images }: { images: Image[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: images.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated item height
    overscan: 5 // Render 5 extra items outside viewport
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <img src={images[virtualItem.index].thumbnailPath} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Pattern 5: Drag-Drop Upload with react-dropzone
**What:** User-friendly drag-drop interface with file validation
**When to use:** All file upload UIs
**Example:**
```typescript
// Source: react-dropzone docs
import { useDropzone } from 'react-dropzone'

function ImageUpload({ onUpload }: { onUpload: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: onUpload
  })

  return (
    <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '20px' }}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop images here...</p>
      ) : (
        <p>Drag and drop images, or click to select</p>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Buffering entire file in memory:** Always stream to disk, never use `toBuffer()` for uploads
- **Processing before saving:** Save original first, then process asynchronously
- **Rendering all images at once:** Use virtual scrolling for collections >50 items
- **Client-side image processing:** Keep heavy processing (compression, thumbnails) on server
- **Synchronous file operations:** Always use async/await with streams and sharp

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression | Custom canvas/quality logic | sharp with mozjpeg | Handles color spaces, ICC profiles, progressive encoding |
| Thumbnail generation | Manual resize calculations | sharp.resize() | Handles aspect ratios, upscaling prevention, multiple fit modes |
| File hashing | Custom chunk reading | crypto.createHash() | Optimized, handles streams, battle-tested |
| Drag-drop upload | Custom drag event handlers | react-dropzone | Handles file validation, multiple files, folder drops, accessibility |
| Virtual scrolling | Custom scroll calculations | @tanstack/react-virtual | Handles dynamic sizes, scroll restoration, overscan optimization |
| Image lightbox | Custom modal + zoom | yet-another-react-lightbox | Keyboard nav, touch gestures, responsive images, plugins |
| Duplicate detection | Filename comparison | SHA-256 hash comparison | Detects identical content regardless of filename |

**Key insight:** Image processing has countless edge cases (color profiles, EXIF orientation, progressive encoding, memory management). Use sharp's battle-tested libvips implementation rather than reinventing.


## Common Pitfalls

### Pitfall 1: Memory Exhaustion from Buffering
**What goes wrong:** Loading entire files into memory causes OOM errors with large images or concurrent uploads
**Why it happens:** Using `toBuffer()` or not consuming streams properly
**How to avoid:** Always use `pipeline()` to stream directly to disk, never buffer in memory
**Warning signs:** High memory usage during uploads, server crashes under load

### Pitfall 2: Race Condition in Hash-Then-Save
**What goes wrong:** Calculating hash first, then saving file separately can cause duplicates if concurrent uploads happen
**Why it happens:** Two requests upload same file simultaneously before either completes
**How to avoid:** Use database unique constraint on hash field, handle duplicate key errors gracefully
**Warning signs:** Duplicate images appearing despite hash checking

### Pitfall 3: Sharp Processing Blocking Event Loop
**What goes wrong:** Processing large images synchronously blocks Node.js event loop
**Why it happens:** Not awaiting sharp operations or processing too many images concurrently
**How to avoid:** Always await sharp operations, limit concurrent processing (e.g., p-limit library)
**Warning signs:** API becomes unresponsive during image uploads

### Pitfall 4: Missing MIME Type Validation
**What goes wrong:** Users upload non-image files or malicious files disguised as images
**Why it happens:** Trusting client-provided MIME type without verification
**How to avoid:** Use sharp to validate image format (will throw error for non-images)
**Warning signs:** Storage fills with non-image files, security vulnerabilities

### Pitfall 5: Virtual Scrolling Without Estimated Sizes
**What goes wrong:** Scroll position jumps erratically as images load
**Why it happens:** Not providing `estimateSize` to virtualizer, causing layout shifts
**How to avoid:** Store image dimensions in database, provide accurate estimates to virtualizer
**Warning signs:** Janky scrolling, scroll position jumping

### Pitfall 6: Not Handling Upload Errors
**What goes wrong:** Partial uploads leave orphaned files on disk
**Why it happens:** Stream errors not caught, no cleanup on failure
**How to avoid:** Wrap pipeline in try-catch, delete partial files on error
**Warning signs:** Storage directory fills with incomplete files

### Pitfall 7: Converting Animated GIFs to Static
**What goes wrong:** User uploads animated GIF, sharp converts only first frame
**Why it happens:** Sharp defaults to first frame for multi-frame GIFs
**How to avoid:** Check `metadata.pages > 1` to detect animated GIFs, handle separately
**Warning signs:** Users complain animated GIFs become static


## Code Examples

Verified patterns from official sources:

### Multiple File Upload with Duplicate Detection
```typescript
// Source: @fastify/multipart + Node.js crypto
import { pipeline } from 'node:stream/promises'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

fastify.post('/api/images/upload', async (req, reply) => {
  const files = req.files()
  const results = []

  for await (const file of files) {
    const tempPath = path.join(tmpdir(), `upload-${Date.now()}`)
    const hash = crypto.createHash('sha256')
    
    // Stream to temp file while calculating hash
    await pipeline(
      file.file,
      new Transform({
        transform(chunk, encoding, callback) {
          hash.update(chunk)
          callback(null, chunk)
        }
      }),
      fs.createWriteStream(tempPath)
    )

    const fileHash = hash.digest('hex')
    
    // Check for duplicate
    const existing = await prisma.image.findUnique({ where: { hash: fileHash } })
    if (existing) {
      await fs.unlink(tempPath)
      results.push({ filename: file.filename, duplicate: true, id: existing.id })
      continue
    }

    // Process and save
    const finalPath = getImagePath(fileHash)
    await processImage(tempPath, finalPath, fileHash)
    
    const image = await prisma.image.create({
      data: {
        filename: `${fileHash}.jpg`,
        originalName: file.filename,
        mimeType: file.mimetype,
        hash: fileHash,
        storagePath: finalPath,
        // ... other fields
      }
    })

    results.push({ filename: file.filename, duplicate: false, id: image.id })
  }

  return { success: true, results }
})
```

### Image to Single-Frame GIF Conversion
```typescript
// Source: sharp docs
import sharp from 'sharp'

async function convertToGif(imagePath: string, outputPath: string) {
  await sharp(imagePath)
    .gif() // Convert to GIF format
    .toFile(outputPath)
  
  return outputPath
}

// For QQ/WeChat sticker compatibility
async function convertToStickerGif(imagePath: string, hash: string) {
  const outputPath = getImagePath(`${hash}.gif`)
  
  await sharp(imagePath)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .gif()
    .toFile(outputPath)
  
  return outputPath
}
```

### Virtual Grid with Dynamic Columns
```typescript
// Source: TanStack Virtual + custom grid logic
import { useVirtualizer } from '@tanstack/react-virtual'

function ImageGrid({ images }: { images: Image[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(4)

  // Calculate columns based on container width
  useEffect(() => {
    const updateColumns = () => {
      if (parentRef.current) {
        const width = parentRef.current.offsetWidth
        setColumns(Math.floor(width / 250)) // 250px per column
      }
    }
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(images.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250,
    overscan: 2
  })

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const rowImages = images.slice(startIndex, startIndex + columns)
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                gap: '8px'
              }}
            >
              {rowImages.map((image) => (
                <img
                  key={image.id}
                  src={`/api/images/${image.id}/thumbnail`}
                  alt={image.originalName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```


### Lightbox with Keyboard Navigation
```typescript
// Source: yet-another-react-lightbox docs
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

function ImageLightbox({ images, index, onClose }: Props) {
  const slides = images.map(img => ({
    src: `/api/images/${img.id}/full`,
    alt: img.originalName,
    width: img.width,
    height: img.height
  }))

  return (
    <Lightbox
      open={index >= 0}
      close={onClose}
      index={index}
      slides={slides}
      carousel={{ finite: true }}
      controller={{ closeOnBackdropClick: true }}
    />
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| multer for Fastify | @fastify/multipart | 2020+ | Better Fastify integration, native streaming |
| ImageMagick/GraphicsMagick | sharp (libvips) | 2015+ | 4-5x faster, lower memory usage |
| react-window | @tanstack/react-virtual | 2023+ | Better API, dynamic sizing, framework agnostic core |
| Buffering files in memory | Streaming to disk | Always | Prevents OOM, handles large files |
| Client-side compression | Server-side with sharp | Best practice | Consistent quality, security, handles all formats |

**Deprecated/outdated:**
- **busboy directly**: Use @fastify/multipart wrapper instead (handles Fastify integration)
- **react-virtualized**: Unmaintained, use @tanstack/react-virtual
- **react-image-lightbox**: No React 19 support, use yet-another-react-lightbox


## Open Questions

1. **Concurrent Upload Limits**
   - What we know: @fastify/multipart supports concurrent file processing
   - What's unclear: Optimal concurrency limit for sharp processing without blocking event loop
   - Recommendation: Start with 3 concurrent sharp operations, monitor CPU usage, adjust as needed

2. **Image Format Priority**
   - What we know: Sharp supports JPEG, PNG, WebP, GIF, AVIF
   - What's unclear: Should we convert all uploads to WebP for storage efficiency?
   - Recommendation: Keep original format, generate WebP thumbnails for web display

3. **Animated GIF Handling**
   - What we know: Sharp processes first frame by default, can detect multi-frame GIFs
   - What's unclear: Should we preserve animated GIFs or convert to video format?
   - Recommendation: Preserve animated GIFs, add metadata flag `isAnimated: boolean`

4. **Virtual Scrolling Performance**
   - What we know: TanStack Virtual handles thousands of items efficiently
   - What's unclear: Optimal overscan value and estimated size for image grids
   - Recommendation: Start with overscan=5, estimateSize=250px, tune based on testing


## Sources

### Primary (HIGH confidence)
- [@fastify/multipart GitHub](https://github.com/fastify/fastify-multipart) - Official Fastify plugin for multipart handling
- [sharp GitHub](https://github.com/lovell/sharp) - Official sharp documentation and API reference
- [TanStack Virtual Docs](https://tanstack.com/virtual/latest) - Official TanStack Virtual documentation
- [Node.js crypto module](https://nodejs.org/api/crypto.html) - Built-in Node.js crypto documentation
- [Node.js stream module](https://nodejs.org/api/stream.html) - Built-in Node.js stream documentation

### Secondary (MEDIUM confidence)
- [react-dropzone docs](https://react-dropzone.js.org) - Official react-dropzone documentation, v14.4.0 released Jan 2026
- [yet-another-react-lightbox GitHub](https://github.com/igordanchenko/yet-another-react-lightbox) - v3.28.0 released Dec 2025
- [LogRocket: Node.js image processing with Sharp](https://logrocket.com) - Verified sharp usage patterns
- [Better Stack: Fastify file uploads](https://betterstack.com) - Verified @fastify/multipart best practices

### Tertiary (LOW confidence)
- WebSearch results for ecosystem trends and community patterns


## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official sources, actively maintained, production-ready
- Architecture: HIGH - Patterns verified from official docs, aligned with existing codebase structure
- Pitfalls: HIGH - Common issues documented in official repos and community discussions

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable ecosystem)

**Notes:**
- All core libraries (sharp, @fastify/multipart, TanStack Virtual) are mature and stable
- React 19 compatibility verified for all frontend libraries
- Existing storage infrastructure (hash-based directories) can be reused without modification
- Prisma schema already includes necessary Image model fields
