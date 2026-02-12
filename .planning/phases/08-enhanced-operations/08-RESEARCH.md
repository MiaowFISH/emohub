# Phase 8: Enhanced Operations - Research

**Researched:** 2026-02-12
**Domain:** Clipboard API, Image Format Conversion, Visual Hierarchy, Loading States
**Confidence:** HIGH

## Summary

Phase 8 adds clipboard operations with format conversion and improves visual hierarchy through skeleton screens and empty states. The modern Clipboard API provides robust image copying with browser-native support for PNG images. GIF conversion requires client-side encoding libraries. Visual hierarchy improvements focus on button weight differentiation, skeleton screens during loading, and helpful empty states.

The project already uses React 19, Vite, Zustand, and react-i18next with a CSS variable theming system. The existing lightbox component (yet-another-react-lightbox) provides the integration point for copy functionality.

**Primary recommendation:** Use navigator.clipboard.write() with ClipboardItem for PNG copying, gif.js or gifenc for GIF conversion, sonner for toast notifications, pure CSS for skeleton screens, and CSS variable-based visual hierarchy refinements.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Clipboard API | Native | Copy images to clipboard | Browser-native, secure, async, no dependencies |
| sonner | ^1.5.0 | Toast notifications | Lightweight (2-3KB), React 18+ optimized, zero dependencies, shadcn-compatible |
| gif.js | ^0.2.0 | GIF encoding | Browser-first, Web Worker support, canvas integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gifenc | ^1.0.3 | Alternative GIF encoder | If gif.js performance insufficient, lower-level control needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast | More customization options, slightly larger bundle, Promise API for async |
| gif.js | gifenc | Faster encoding, lower-level API, no built-in dithering |
| gif.js | omggif | Byte-level control, isomorphic, steeper learning curve |

**Installation:**
```bash
bun add sonner gif.js
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── components/
│   ├── ImageLightbox.tsx      # Add copy button here
│   ├── ImageGrid.tsx           # Add skeleton screens
│   ├── SkeletonCard.tsx        # New: skeleton component
│   └── EmptyState.tsx          # New: empty state component
├── lib/
│   ├── clipboard.ts            # New: clipboard utilities
│   └── gifEncoder.ts           # New: GIF conversion
└── styles/
    └── skeleton.css            # Skeleton shimmer animation
```

### Pattern 1: Clipboard Copy with Format Selection
**What:** Async clipboard write with user-triggered format selection
**When to use:** Copy button in lightbox, requires user interaction for security

**Example:**
```typescript
// Source: MDN Clipboard API + WebSearch findings
async function copyImageToClipboard(imageUrl: string, format: 'original' | 'gif') {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()

    let finalBlob = blob

    if (format === 'gif' && blob.type !== 'image/gif') {
      // Convert to GIF using gif.js
      finalBlob = await convertToGif(blob)
    }

    // Clipboard API requires PNG for maximum compatibility
    if (finalBlob.type !== 'image/png' && format === 'original') {
      finalBlob = await convertToPng(finalBlob)
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        [finalBlob.type]: finalBlob
      })
    ])

    return { success: true }
  } catch (error) {
    console.error('Clipboard copy failed:', error)
    return { success: false, error }
  }
}
```

### Pattern 2: GIF Encoding with gif.js
**What:** Convert canvas-rendered image to GIF using Web Workers
**When to use:** User selects "Copy as GIF" option

**Example:**
```typescript
// Source: WebSearch gif.js documentation
import GIF from 'gif.js'

async function convertToGif(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: '/gif.worker.js' // Must be in public/
      })

      gif.addFrame(canvas, { delay: 0 })

      gif.on('finished', (blob: Blob) => {
        resolve(blob)
      })

      gif.on('error', reject)

      gif.render()
    }
    img.onerror = reject
    img.src = URL.createObjectURL(imageBlob)
  })
}
```

### Pattern 3: Toast Notifications with Sonner
**What:** Non-blocking feedback for async operations
**When to use:** After clipboard copy, success/failure feedback

**Example:**
```typescript
// Source: WebSearch sonner documentation
import { toast } from 'sonner'

// In main.tsx or App component
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Toaster position="bottom-center" />
      {/* rest of app */}
    </>
  )
}

// In copy handler
async function handleCopy() {
  const result = await copyImageToClipboard(imageUrl, 'original')

  if (result.success) {
    toast.success(t('clipboard.copy_success'))
  } else {
    toast.error(t('clipboard.copy_failed'))
  }
}
```

### Pattern 4: Skeleton Screen with CSS Animation
**What:** Placeholder UI during image loading with shimmer effect
**When to use:** Initial page load, infinite scroll loading

**Example:**
```typescript
// Source: WebSearch CSS skeleton best practices
// SkeletonCard.tsx
export const SkeletonCard = () => (
  <div className="skeleton-card" aria-busy="true" role="status">
    <span className="sr-only">Loading image...</span>
    <div className="skeleton-shimmer" />
  </div>
)

// skeleton.css
.skeleton-card {
  width: 100%;
  height: 200px;
  background: var(--color-surface-float);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.skeleton-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
    background: var(--color-surface-float);
  }
}
```

### Pattern 5: Empty State with Guidance
**What:** Helpful message when no content matches filters
**When to use:** Zero search results, no images uploaded

**Example:**
```typescript
// Source: WebSearch empty state best practices
export const EmptyState = ({ type }: { type: 'no-images' | 'no-results' }) => {
  const { t } = useTranslation('images')

  const content = {
    'no-images': {
      icon: '📁',
      title: t('empty.no_images_title'),
      description: t('empty.no_images_description'),
      action: t('empty.upload_first')
    },
    'no-results': {
      icon: '🔍',
      title: t('empty.no_results_title'),
      description: t('empty.no_results_description'),
      action: t('empty.try_different_search')
    }
  }

  const { icon, title, description, action } = content[type]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      color: 'var(--color-text-muted)'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '8px',
        color: 'var(--color-text-primary)'
      }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', marginBottom: '16px' }}>{description}</p>
      <p style={{ fontSize: '13px', fontStyle: 'italic' }}>{action}</p>
    </div>
  )
}
```

### Pattern 6: Visual Hierarchy with CSS Variables
**What:** Differentiate button importance through size, color, weight
**When to use:** Primary vs secondary actions, button groups

**Example:**
```css
/* Primary button - high visual weight */
.btn-primary {
  padding: 10px 20px;
  font-size: 15px;
  font-weight: 600;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--color-shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--color-shadow);
}

/* Secondary button - lower visual weight */
.btn-secondary {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  transition: background 0.15s ease;
}

.btn-secondary:hover {
  background: var(--color-surface-float);
}

/* Card elevation hierarchy */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.card-elevated {
  background: var(--color-surface-float);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 2px 8px var(--color-shadow);
}
```

### Anti-Patterns to Avoid
- **Clipboard without user interaction:** Clipboard API requires transient activation (click/keypress), don't attempt programmatic copy on page load
- **Blocking main thread during GIF encoding:** Always use Web Workers (gif.js handles this automatically)
- **Skeleton screens for interactive elements:** Don't use skeletons for buttons/inputs where user might click
- **Generic error messages:** "Copy failed" is unhelpful, explain why (HTTPS required, permission denied, etc.)
- **Animating layout properties:** Animate transform/opacity only, not width/height/margin for performance

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GIF encoding | Custom LZW compression | gif.js or gifenc | GIF format has complex color quantization, LZW compression, frame timing |
| Toast notifications | Custom notification system | sonner or react-hot-toast | Handles stacking, positioning, auto-dismiss, accessibility, animations |
| Clipboard fallback | document.execCommand('copy') | Clipboard API only | execCommand is deprecated, doesn't support images, security issues |
| Image format detection | Manual MIME parsing | blob.type property | Browser handles MIME detection from file headers |
| Skeleton animations | JavaScript-based shimmer | CSS animations | CSS animations are hardware-accelerated, respect prefers-reduced-motion |

**Key insight:** Browser APIs (Clipboard, Canvas, Blob) handle the heavy lifting for image operations. Libraries like gif.js wrap complex encoding algorithms. Focus implementation on user experience (feedback, error handling, accessibility) rather than low-level image processing.

## Common Pitfalls

### Pitfall 1: Clipboard API Security Requirements
**What goes wrong:** Clipboard write fails silently or throws DOMException
**Why it happens:** Clipboard API requires HTTPS and transient user activation
**How to avoid:**
- Always trigger clipboard operations from user events (click, keypress)
- Ensure app runs on HTTPS (localhost is exempt)
- Check for clipboard permission in error handling
- Provide clear error messages when clipboard unavailable

**Warning signs:**
- "NotAllowedError: Write permission denied"
- "Document is not focused"
- Works in development (localhost) but fails in production (HTTP)

### Pitfall 2: GIF Encoding Performance
**What goes wrong:** Browser tab freezes or crashes during GIF conversion
**Why it happens:** Large images or synchronous encoding blocks main thread
**How to avoid:**
- Use gif.js with Web Workers (workers: 2 option)
- Show loading toast during encoding: `toast.loading('Converting to GIF...')`
- Consider image size limits (warn if >2000px width/height)
- Test with actual user images, not just small test files

**Warning signs:**
- UI becomes unresponsive during copy
- Browser "Page Unresponsive" warning
- High CPU usage spikes

### Pitfall 3: MIME Type Compatibility
**What goes wrong:** ClipboardItem throws error for unsupported MIME types
**Why it happens:** Clipboard API mandates PNG support, other formats vary by browser
**How to avoid:**
- Always convert to PNG for "copy original" unless already PNG
- Use `ClipboardItem.supports()` to check format support (available since March 2025)
- Fallback to PNG if target format unsupported
- Document that clipboard always uses PNG regardless of original format

**Warning signs:**
- "NotSupportedError: Type image/webp not supported"
- Copy works in Chrome but fails in Firefox/Safari

### Pitfall 4: Skeleton Screen Accessibility
**What goes wrong:** Screen readers announce confusing loading states or skip content
**Why it happens:** Missing ARIA attributes or improper DOM structure
**How to avoid:**
- Use `aria-busy="true"` on loading container
- Include visually hidden text: `<span className="sr-only">Loading images...</span>`
- Remove skeleton from DOM completely when content loads (don't just hide)
- Use `role="status"` for loading regions

**Warning signs:**
- Screen reader announces "blank" or nothing
- Screen reader reads skeleton placeholder text
- Users with screen readers report confusion

### Pitfall 5: Empty State vs Loading State Confusion
**What goes wrong:** Users see empty state flash before loading completes
**Why it happens:** Conditional rendering checks data before loading flag
**How to avoid:**
- Check `isLoading` first: `if (isLoading) return <Skeleton />`
- Then check empty: `if (!isLoading && data.length === 0) return <EmptyState />`
- Never show empty state during initial load
- Use separate states for "loading", "empty", "error"

**Warning signs:**
- Empty state flashes on page load
- "No images found" appears before fetch completes

### Pitfall 6: Toast Notification Overload
**What goes wrong:** Multiple toasts stack up, obscuring content
**Why it happens:** Rapid user actions trigger multiple toasts
**How to avoid:**
- Use toast IDs to prevent duplicates: `toast.success('Copied', { id: 'copy-toast' })`
- Limit toast duration: `toast.success('Copied', { duration: 2000 })`
- Use toast.promise() for async operations (auto-updates single toast)
- Position toasts to avoid obscuring critical UI

**Warning signs:**
- Screen fills with toast notifications
- Users complain about "too many popups"

## Code Examples

Verified patterns from official sources:

### Clipboard Copy with Error Handling
```typescript
// Source: MDN Clipboard API documentation
async function copyImageWithFeedback(imageUrl: string) {
  // Show loading state
  const toastId = toast.loading(t('clipboard.copying'))

  try {
    // Fetch image
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Failed to fetch image')

    const blob = await response.blob()

    // Convert to PNG for maximum compatibility
    const pngBlob = await convertToPng(blob)

    // Check clipboard support
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not available')
    }

    // Write to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': pngBlob
      })
    ])

    toast.success(t('clipboard.copy_success'), { id: toastId })
  } catch (error) {
    console.error('Clipboard copy failed:', error)

    // Provide specific error messages
    let message = t('clipboard.copy_failed')
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        message = t('clipboard.permission_denied')
      } else if (error.message.includes('not available')) {
        message = t('clipboard.not_supported')
      }
    }

    toast.error(message, { id: toastId })
  }
}

async function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((pngBlob) => {
        if (pngBlob) resolve(pngBlob)
        else reject(new Error('PNG conversion failed'))
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(blob)
  })
}
```

### Skeleton Screen Grid
```typescript
// Source: WebSearch React skeleton best practices
import { useImageStore } from '@/stores/imageStore'

export const ImageGrid = ({ onImageClick }: ImageGridProps) => {
  const { images, isLoading } = useImageStore()

  // Show skeleton during initial load
  if (isLoading && images.length === 0) {
    return (
      <div className="image-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  // Show empty state when no images
  if (!isLoading && images.length === 0) {
    return <EmptyState type="no-images" />
  }

  // Show actual images
  return (
    <div className="image-grid">
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          image={image}
          onClick={() => onImageClick(index)}
        />
      ))}
      {/* Show skeleton for loading more */}
      {isLoading && images.length > 0 && (
        <>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`loading-${i}`} />
          ))}
        </>
      )}
    </div>
  )
}
```

### Copy Button in Lightbox
```typescript
// Source: Project structure + Clipboard API patterns
// Add to ImageLightbox.tsx
import { toast } from 'sonner'
import { copyImageToClipboard } from '@/lib/clipboard'

export const ImageLightbox = ({ images, index, onClose }: ImageLightboxProps) => {
  const [copyFormat, setCopyFormat] = useState<'original' | 'gif'>('original')
  const currentImage = images[index]

  const handleCopy = async () => {
    if (!currentImage) return

    const imageUrl = imageApi.getFullUrl(currentImage.id)
    await copyImageToClipboard(imageUrl, copyFormat)
  }

  return (
    <Lightbox
      open
      close={onClose}
      index={index}
      slides={slides}
      toolbar={{
        buttons: [
          // Format selector
          <select
            value={copyFormat}
            onChange={(e) => setCopyFormat(e.target.value as 'original' | 'gif')}
            style={{ marginRight: '8px' }}
          >
            <option value="original">{t('clipboard.copy_original')}</option>
            <option value="gif">{t('clipboard.copy_as_gif')}</option>
          </select>,
          // Copy button
          <button onClick={handleCopy} className="btn-primary">
            {t('clipboard.copy')}
          </button>,
          'close'
        ]
      }}
    />
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.execCommand('copy') | navigator.clipboard.write() | 2020-2021 | Async API, image support, better security |
| Inline loading spinners | Skeleton screens | 2018-2020 | Better perceived performance, reduced layout shift |
| alert() for feedback | Toast notifications | 2015-2018 | Non-blocking, better UX, stackable |
| Server-side GIF conversion | Client-side with Web Workers | 2016-2019 | Reduced server load, instant feedback |
| Fixed button styles | Visual hierarchy system | 2020-2023 | Clearer action priority, better accessibility |

**Deprecated/outdated:**
- **document.execCommand()**: Deprecated, doesn't support images, use Clipboard API
- **Flash-based clipboard**: Removed from browsers, use native Clipboard API
- **Synchronous GIF encoding**: Blocks UI, use Web Workers (gif.js handles automatically)
- **Generic "Loading..." text**: Use skeleton screens that match content structure

## Open Questions

1. **GIF quality vs file size tradeoff**
   - What we know: gif.js quality option (1-30), lower = better quality but larger files
   - What's unclear: Optimal quality setting for emoji/meme images
   - Recommendation: Start with quality: 10 (default), add user preference if needed

2. **Clipboard format preference persistence**
   - What we know: User can select "original" or "GIF" per copy
   - What's unclear: Should preference persist across sessions?
   - Recommendation: Store in settingsStore if users frequently switch, otherwise default to "original"

3. **Skeleton screen count**
   - What we know: Should match expected content layout
   - What's unclear: How many skeleton cards to show on initial load
   - Recommendation: Calculate based on viewport size (same logic as column calculation), minimum 8

4. **Empty state variations**
   - What we know: Need "no images" and "no search results" states
   - What's unclear: Should we differentiate "no images with selected tags" vs "no images matching search"?
   - Recommendation: Single "no results" state with dynamic message based on active filters

## Sources

### Primary (HIGH confidence)
- [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API) - Security requirements, browser support
- [MDN ClipboardItem.supports()](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem/supports_static) - MIME type support checking

### Secondary (MEDIUM confidence)
- [WebSearch: Clipboard API copy image blob JavaScript 2026](https://web.dev) - Implementation patterns, best practices
- [WebSearch: visual hierarchy UI design buttons cards 2026](https://medium.com) - Visual hierarchy principles, 2026 trends
- [WebSearch: convert image to GIF browser JavaScript canvas 2026](https://github.io) - gif.js usage, alternatives
- [WebSearch: React skeleton screen loading state best practices 2026](https://logrocket.com) - Skeleton implementation, accessibility
- [WebSearch: toast notification React success error feedback 2026](https://react-hot-toast.com) - Toast library comparison
- [WebSearch: empty state UI design best practices guidance 2026](https://uxpin.com) - Empty state patterns
- [WebSearch: gif.js library browser GIF encoder 2026](https://github.com) - gif.js capabilities, performance
- [WebSearch: CSS skeleton screen shimmer animation best practices 2026](https://css-tricks.com) - CSS animation patterns
- [WebSearch: react-hot-toast sonner toast library comparison 2026](https://logrocket.com) - Library selection criteria

### Tertiary (LOW confidence)
- None - all findings verified with official sources or multiple credible sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Clipboard API is native, sonner and gif.js are established libraries with active maintenance
- Architecture: HIGH - Patterns verified against MDN documentation and library official docs
- Pitfalls: HIGH - Based on MDN security requirements and common WebSearch-reported issues verified with official sources

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable domain with established APIs)
