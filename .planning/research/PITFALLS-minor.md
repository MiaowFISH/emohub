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

