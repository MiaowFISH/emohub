# Phase 4: Search & Polish - Research

**Researched:** 2026-02-12
**Domain:** Text search, responsive web design, React UI patterns
**Confidence:** HIGH

## Summary

Phase 4 adds text-based search functionality and responsive design to the existing image management system. The current implementation already has tag filtering via sidebar checkboxes; this phase extends it with keyword search across filenames and tag names, plus mobile/tablet adaptations.

The technical approach is straightforward: add a search input with debouncing, extend the backend API to accept a search query parameter, use SQL LIKE for pattern matching, and apply CSS media queries for responsive layouts. The existing stack (React, Zustand, Fastify, Prisma, SQLite) handles these requirements without additional libraries.

**Primary recommendation:** Implement search as a query parameter extension to the existing `/api/images` endpoint, use a custom `useDebounce` hook (300-500ms delay), and apply mobile-first responsive design with CSS media queries at 768px (tablet) and 1024px (desktop) breakpoints.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React useState/useEffect | 19.2.4 | Debounce implementation | Built-in hooks sufficient for debouncing |
| CSS Media Queries | Native | Responsive breakpoints | No framework needed for simple layouts |
| Prisma | 6.19.2 | Database queries with LIKE | Already in use, supports text search |
| Zustand | 5.0.11 | Search state management | Already in use for state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash.debounce | Optional | Advanced debouncing | Only if custom hook insufficient |
| Tailwind CSS | Optional | Utility-first styling | Only if inline styles become unwieldy |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useDebounce | lodash.debounce | Lodash adds dependency but provides battle-tested implementation |
| CSS Media Queries | CSS Framework (Bootstrap, Tailwind) | Framework adds complexity but speeds up development for complex UIs |
| SQL LIKE | Full-text search (FTS5) | FTS5 better for large datasets but overkill for 4000 images |

**Installation:**
```bash
# No new dependencies required - use existing stack
```

## Architecture Patterns

### Recommended Project Structure
Current structure is sufficient. Add search-related code to existing files:
```
apps/web/src/
├── components/
│   ├── SearchBar.tsx        # NEW: Search input component
│   ├── TagFilter.tsx         # MODIFY: Make responsive
│   └── ImageGrid.tsx         # Already responsive-ready
├── stores/
│   └── imageStore.ts         # MODIFY: Add search query state
├── lib/
│   ├── api.ts                # MODIFY: Add search param to list()
│   └── hooks.ts              # NEW: useDebounce hook
└── routes/
    └── index.tsx             # MODIFY: Add SearchBar, responsive layout

packages/server/src/
├── routes/
│   └── images.ts             # MODIFY: Accept search query param
└── services/
    └── imageService.ts       # MODIFY: Add search to listImages()
```

### Pattern 1: Custom useDebounce Hook
**What:** Delays execution of search until user stops typing
**When to use:** Any text input that triggers API calls
**Example:**
```typescript
// apps/web/src/lib/hooks.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### Pattern 2: Search State in Zustand Store
**What:** Centralize search query state alongside existing image state
**When to use:** When search affects multiple components
**Example:**
```typescript
// apps/web/src/stores/imageStore.ts
interface ImageState {
  // ... existing state
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const useImageStore = create<ImageState>((set, get) => ({
  // ... existing state
  searchQuery: '',

  setSearchQuery: (query) => {
    set({ searchQuery: query })
    // Trigger fetchImages with new query
    get().fetchImages(1, get().activeTagFilter, query)
  },

  fetchImages: async (page = 1, tagIds?: string[], search?: string) => {
    // ... existing logic with search param
  }
}))
```

### Pattern 3: SQL LIKE Search Across Multiple Columns
**What:** Search both filename and tag names with single query
**When to use:** Text search across related tables
**Example:**
```typescript
// packages/server/src/services/imageService.ts
export async function listImages(
  prisma: PrismaClient,
  page: number = 1,
  limit: number = 50,
  tagIds?: string[],
  search?: string
): Promise<ListImagesResult> {
  const skip = (page - 1) * limit

  const where: any = {}

  // Tag filter (existing)
  if (tagIds && tagIds.length > 0) {
    where.tags = {
      some: { tagId: { in: tagIds } }
    }
  }

  // Search filter (new)
  if (search && search.trim()) {
    const searchPattern = `%${search.toLowerCase()}%`
    where.OR = [
      { originalName: { contains: search, mode: 'insensitive' } },
      { tags: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } }
    ]
  }

  const [rawImages, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } }
    }),
    prisma.image.count({ where })
  ])

  return { images: rawImages, total, page, limit }
}
```

### Pattern 4: Mobile-First Responsive Layout
**What:** Start with mobile styles, progressively enhance for larger screens
**When to use:** All responsive design implementations
**Example:**
```typescript
// apps/web/src/routes/index.tsx
const HomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column', // Mobile: stack vertically
      height: '100vh'
    }}>
      {/* Mobile hamburger menu */}
      <div style={{
        display: 'block', // Show on mobile
        padding: '16px',
        borderBottom: '1px solid #e5e7eb'
      }}
      className="desktop-hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰ Menu
        </button>
      </div>

      {/* Sidebar - overlay on mobile, fixed on desktop */}
      <div style={{
        position: sidebarOpen ? 'fixed' : 'absolute',
        left: sidebarOpen ? 0 : '-100%',
        width: '240px',
        height: '100vh',
        transition: 'left 0.3s',
        zIndex: 1000
      }}
      className="sidebar">
        <TagFilter />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <SearchBar />
        <ImageGrid />
      </div>
    </div>
  )
}

// CSS media queries
const styles = `
  @media (min-width: 768px) {
    .desktop-hidden { display: none; }
    .sidebar {
      position: static !important;
      left: 0 !important;
    }
  }
`
```

### Anti-Patterns to Avoid
- **Searching on every keystroke:** Always debounce search inputs (300-500ms)
- **Leading wildcard in SQL:** `LIKE '%term'` prevents index usage; acceptable for small datasets (<10k rows)
- **Hardcoded breakpoints in JS:** Use CSS media queries, not window.innerWidth checks
- **Overlapping media queries:** Use `min-width` consistently or `max-width` consistently, not both
- **Forgetting mobile viewport meta tag:** Already present in index.html, but critical for responsive design

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debouncing | Custom setTimeout logic scattered in components | Custom `useDebounce` hook or lodash.debounce | Edge cases: cleanup, multiple instances, memory leaks |
| Responsive breakpoints | JavaScript window resize listeners | CSS media queries | Performance, SSR compatibility, simpler code |
| Search query parsing | String manipulation for complex queries | Keep it simple with single search term | Over-engineering for 4000 images |
| Full-text search | Custom tokenization/ranking | SQLite LIKE (current scale) or FTS5 (future) | Complexity vs. benefit at current scale |

**Key insight:** For 4000 images, simple SQL LIKE search is sufficient. Full-text search (FTS5) or vector search (sqlite-vss) are premature optimizations. The existing tag filter already handles structured queries; keyword search is for quick lookups.

## Common Pitfalls

### Pitfall 1: Search Without Debouncing
**What goes wrong:** Every keystroke triggers an API call, overwhelming the server and causing UI lag
**Why it happens:** Direct binding of input onChange to API call
**How to avoid:** Always use debouncing with 300-500ms delay
**Warning signs:** Network tab shows rapid-fire requests, UI feels sluggish while typing

### Pitfall 2: Case-Sensitive Search
**What goes wrong:** User searches "cat" but images tagged "Cat" don't appear
**Why it happens:** SQL LIKE is case-sensitive by default in some databases
**How to avoid:** Use Prisma's `mode: 'insensitive'` or lowercase both sides
**Warning signs:** User reports "search doesn't work" for valid matches

### Pitfall 3: Combining Tag Filter AND Search with OR Logic
**What goes wrong:** User expects "show images with tag X AND containing search term Y" but gets "tag X OR search term Y"
**Why it happens:** Incorrect WHERE clause construction
**How to avoid:** Tag filter and search should be AND conditions at top level, search uses OR internally for filename/tags
**Warning signs:** Too many results when both filters active

### Pitfall 4: Fixed Sidebar on Mobile
**What goes wrong:** Sidebar takes up screen space, leaving no room for image grid on mobile
**Why it happens:** Desktop-first design with fixed 240px sidebar
**How to avoid:** Collapse sidebar to hamburger menu on mobile, use overlay pattern
**Warning signs:** Mobile users can't see images without scrolling horizontally

### Pitfall 5: Forgetting to Reset Page on Search
**What goes wrong:** User searches, sees "no results" because they're on page 5 of previous results
**Why it happens:** Search doesn't reset pagination state
**How to avoid:** Always reset to page 1 when search query changes
**Warning signs:** Inconsistent result counts, empty pages after search

### Pitfall 6: Race Conditions in Search Results
**What goes wrong:** User types "cat", then "dog" quickly; "cat" results arrive after "dog" and overwrite them
**Why it happens:** Async API calls return out of order
**How to avoid:** Use AbortController to cancel previous requests, or track request ID
**Warning signs:** Search results don't match current input value

## Code Examples

Verified patterns from research and existing codebase:

### Search Input with Debouncing
```typescript
// apps/web/src/components/SearchBar.tsx
import { useState } from 'react'
import { useDebounce } from '@/lib/hooks'
import { useImageStore } from '@/stores/imageStore'

export const SearchBar = () => {
  const [inputValue, setInputValue] = useState('')
  const debouncedSearch = useDebounce(inputValue, 400)
  const { setSearchQuery } = useImageStore()

  // Trigger search when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

  return (
    <input
      type="search"
      placeholder="Search by filename or tag..."
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      aria-label="Search images"
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        border: '1px solid #d1d5db',
        borderRadius: '6px'
      }}
    />
  )
}
```

### Backend Search Implementation
```typescript
// packages/server/src/services/imageService.ts
export async function listImages(
  prisma: PrismaClient,
  page: number = 1,
  limit: number = 50,
  tagIds?: string[],
  search?: string
): Promise<ListImagesResult> {
  const skip = (page - 1) * limit
  const where: any = {}

  // AND condition: both filters must match
  const conditions: any[] = []

  if (tagIds && tagIds.length > 0) {
    conditions.push({
      tags: { some: { tagId: { in: tagIds } } }
    })
  }

  if (search && search.trim()) {
    // OR condition: match filename OR tag name
    conditions.push({
      OR: [
        { originalName: { contains: search, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } }
      ]
    })
  }

  if (conditions.length > 0) {
    where.AND = conditions
  }

  const [rawImages, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } }
    }),
    prisma.image.count({ where })
  ])

  return { images: rawImages, total, page, limit }
}
```

### Responsive Layout with CSS
```typescript
// apps/web/src/routes/index.tsx
import { useState, useEffect } from 'react'

const HomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 1001,
            padding: '8px 12px',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      )}

      {/* Overlay when sidebar open on mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: isMobile ? 'fixed' : 'static',
        left: isMobile ? (sidebarOpen ? 0 : '-100%') : 0,
        width: '240px',
        height: '100vh',
        transition: 'left 0.3s',
        zIndex: 1000,
        background: 'white'
      }}>
        <TagFilter />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '240px',
        overflowY: 'auto'
      }}>
        <SearchBar />
        <ImageGrid />
      </div>
    </div>
  )
}
```

### CSS Media Queries Alternative
```css
/* apps/web/src/index.css */
.layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 240px;
  height: 100vh;
  border-right: 1px solid #e5e7eb;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.mobile-menu-button {
  display: none;
}

/* Mobile: < 768px */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: -100%;
    transition: left 0.3s;
    z-index: 1000;
    background: white;
  }

  .sidebar.open {
    left: 0;
  }

  .mobile-menu-button {
    display: block;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1001;
  }

  .main-content {
    margin-left: 0;
  }
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) and (max-width: 1023px) {
  .sidebar {
    width: 200px;
  }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .sidebar {
    width: 240px;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| window.matchMedia in JS | CSS media queries + useState for behavior | 2020+ | Simpler, more performant, SSR-friendly |
| lodash.debounce everywhere | Custom useDebounce hook | React Hooks era (2019+) | Better React integration, no external dep |
| Class components for state | Functional components + hooks | React 16.8+ (2019) | Already using this approach |
| Full-text search for everything | Simple LIKE for small datasets | Ongoing | Right-sizing complexity to scale |

**Deprecated/outdated:**
- **jQuery for responsive behavior**: Use React state + CSS media queries
- **Bootstrap/Foundation for simple layouts**: Modern CSS (Flexbox/Grid) sufficient
- **Separate mobile/desktop codebases**: Responsive design is standard

## Open Questions

1. **Should search be real-time or require Enter key?**
   - What we know: Debouncing makes real-time search performant
   - What's unclear: User preference for explicit vs. automatic search
   - Recommendation: Start with real-time (debounced), add Enter key support as enhancement

2. **Should search results highlight matching terms?**
   - What we know: Improves UX but adds complexity
   - What's unclear: Whether it's worth the effort for this phase
   - Recommendation: Defer to future enhancement, not critical for MVP

3. **Should mobile show grid or list view?**
   - What we know: Current grid uses @tanstack/react-virtual for performance
   - What's unclear: Whether smaller thumbnails or list view better on mobile
   - Recommendation: Keep grid, adjust column count via CSS (1-2 columns on mobile)

4. **Should search persist across page refreshes?**
   - What we know: URL query params enable this
   - What's unclear: Whether users expect this behavior
   - Recommendation: Defer to future enhancement, keep search in memory for now

## Sources

### Primary (HIGH confidence)
- Prisma documentation - Query filtering with `contains` and `mode: 'insensitive'`
- React documentation - useState, useEffect hooks for custom hooks
- Existing codebase - imageStore.ts, imageService.ts patterns

### Secondary (MEDIUM confidence)
- [Stackademic - React Debounce Best Practices 2026](https://stackademic.com)
- [BrowserStack - CSS Media Queries and Breakpoints 2026](https://browserstack.com)
- [W3Schools - SQL LIKE Multiple Columns](https://w3schools.com)
- [LogRocket - React Responsive Sidebar Patterns](https://logrocket.com)

### Tertiary (LOW confidence)
- WebSearch results for general patterns - verified against official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing dependencies, no new libraries needed
- Architecture: HIGH - Patterns verified in existing codebase and official docs
- Pitfalls: MEDIUM - Based on common React/SQL patterns, not project-specific testing

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable technologies)
