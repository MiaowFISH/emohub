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

