# Phase 3: Tag System - Research

**Researched:** 2026-02-12
**Domain:** Tag management system with many-to-many relationships
**Confidence:** HIGH

## Summary

Phase 3 implements a comprehensive tag system for organizing 4000+ stickers. The database schema already exists (Tag, ImageTag junction table) with proper many-to-many relationships via Prisma. The implementation requires:

1. **Backend**: Tag CRUD operations, batch tagging endpoints, and filtering logic
2. **Frontend**: Tag input component with autocomplete, tag management UI, filtering interface, and batch operations integration

The existing selection system (Set-based selectedIds, ImageToolbar) provides a solid foundation for batch tagging operations. The schema uses explicit many-to-many relationships which is correct for this use case, as we may want to add metadata like `createdAt` on the ImageTag junction table.

**Primary recommendation:** Use react-tag-autocomplete for dedicated tag input with strong accessibility, implement tag filtering via a collapsible sidebar on desktop (transforms to modal on mobile), and leverage Prisma's existing many-to-many relationship patterns for efficient queries.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.x | Database ORM with many-to-many support | Already in use, excellent TypeScript support, handles junction tables |
| react-tag-autocomplete | 7.x | Tag input with autocomplete | Purpose-built for tagging, strong accessibility (ARIA), customizable |
| Zustand | 4.x | State management for tags | Already in use for image store, lightweight |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.x | Server state caching for tags | Optional - for optimistic updates and cache invalidation |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-tag-autocomplete | react-select | More versatile but heavier, better for complex multi-select scenarios beyond tagging |
| Sidebar filtering | Dropdown filtering | Saves space but hides options, worse discoverability for many tags |
| Explicit many-to-many | Implicit many-to-many | Simpler schema but can't add metadata to relationships later |

**Installation:**
```bash
# Frontend
cd apps/web
bun add react-tag-autocomplete

# Optional: for advanced caching
bun add @tanstack/react-query
```

## Architecture Patterns

### Recommended Project Structure

```
packages/server/src/
├── routes/
│   ├── images.ts          # Existing - add tag filtering
│   └── tags.ts            # NEW - tag CRUD and batch operations
├── services/
│   ├── imageService.ts    # Existing - add tag queries
│   └── tagService.ts      # NEW - tag business logic

apps/web/src/
├── components/
│   ├── ImageToolbar.tsx   # Existing - add batch tag operations
│   ├── TagInput.tsx       # NEW - tag autocomplete input
│   ├── TagFilter.tsx      # NEW - sidebar/modal filter UI
│   └── TagManager.tsx     # NEW - tag CRUD interface
├── stores/
│   ├── imageStore.ts      # Existing - add tag filtering state
│   └── tagStore.ts        # NEW - tag list and operations
└── lib/
    └── api.ts             # Existing - add tag endpoints

packages/shared/src/
├── image.ts               # Existing - already has ImageWithTags
└── tag.ts                 # NEW - tag types and DTOs
```

### Pattern 1: Explicit Many-to-Many with Prisma

**What:** Use explicit junction table (ImageTag) for many-to-many relationships
**When to use:** When you need metadata on relationships (createdAt, order, etc.)
**Example:**
```typescript
// Already implemented in schema.prisma
model ImageTag {
  imageId   String
  tagId     String
  createdAt DateTime @default(now())
  image     Image    @relation(fields: [imageId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([imageId, tagId])
  @@index([tagId])
}

// Query images with tags
const images = await prisma.image.findMany({
  include: {
    tags: {
      include: {
        tag: true
      }
    }
  }
})

// Filter images by tag IDs
const filtered = await prisma.image.findMany({
  where: {
    tags: {
      some: {
        tagId: { in: tagIds }
      }
    }
  }
})
```

### Pattern 2: Batch Tag Operations

**What:** Apply/remove tags to multiple images in a single transaction
**When to use:** User selects multiple images and adds/removes tags
**Example:**
```typescript
// Batch add tags
async function batchAddTags(imageIds: string[], tagIds: string[]) {
  const operations = imageIds.flatMap(imageId =>
    tagIds.map(tagId => ({ imageId, tagId }))
  )

  await prisma.imageTag.createMany({
    data: operations,
    skipDuplicates: true // Ignore if already tagged
  })
}

// Batch remove tags
async function batchRemoveTags(imageIds: string[], tagIds: string[]) {
  await prisma.imageTag.deleteMany({
    where: {
      imageId: { in: imageIds },
      tagId: { in: tagIds }
    }
  })
}
```

### Pattern 3: Tag Autocomplete with react-tag-autocomplete

**What:** Reusable tag input component with suggestions
**When to use:** Single image tagging, batch tagging modal
**Example:**
```typescript
import { ReactTags } from 'react-tag-autocomplete'

interface TagInputProps {
  selected: Array<{ value: string; label: string }>
  suggestions: Array<{ value: string; label: string }>
  onAdd: (tag: { value: string; label: string }) => void
  onDelete: (index: number) => void
}

export function TagInput({ selected, suggestions, onAdd, onDelete }: TagInputProps) {
  return (
    <ReactTags
      selected={selected}
      suggestions={suggestions}
      onAdd={onAdd}
      onDelete={onDelete}
      placeholderText="Add tags..."
      allowNew={true} // Allow creating new tags
      noOptionsText="No matching tags"
    />
  )
}
```

### Pattern 4: Optimistic UI Updates

**What:** Update UI immediately, rollback on error
**When to use:** Tag operations that should feel instant
**Example:**
```typescript
// In tagStore
addTagToImages: async (imageIds: string[], tag: Tag) => {
  // Optimistic update
  set(state => ({
    images: state.images.map(img =>
      imageIds.includes(img.id)
        ? { ...img, tags: [...img.tags, tag] }
        : img
    )
  }))

  try {
    await tagApi.batchAdd(imageIds, [tag.id])
  } catch (error) {
    // Rollback on error
    set(state => ({
      images: state.images.map(img =>
        imageIds.includes(img.id)
          ? { ...img, tags: img.tags.filter(t => t.id !== tag.id) }
          : img
      )
    }))
    throw error
  }
}
```

### Anti-Patterns to Avoid

- **N+1 queries:** Don't fetch tags separately for each image. Use Prisma's `include` to fetch relationships in one query.
- **Client-side filtering only:** Don't load all images and filter in browser. Filter on server for scalability.
- **Unindexed foreign keys:** The schema already has `@@index([tagId])` on ImageTag - critical for performance.
- **Mutation without transactions:** Use Prisma transactions for operations affecting multiple tables.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tag input with autocomplete | Custom input + dropdown | react-tag-autocomplete | Handles keyboard nav, accessibility, edge cases (duplicate prevention, custom rendering) |
| Tag filtering UI | Custom checkbox tree | Collapsible sections with checkboxes | Standard pattern, users understand it immediately |
| Debounced search | Custom setTimeout logic | Built-in debounce from react-tag-autocomplete | Already handles cleanup, race conditions |
| Many-to-many queries | Manual JOIN queries | Prisma's include/where | Type-safe, optimized, handles cascading deletes |

**Key insight:** Tag systems have complex UX requirements (keyboard navigation, accessibility, duplicate handling, case-insensitive matching). Libraries like react-tag-autocomplete have solved these problems through years of real-world usage and bug reports.

## Common Pitfalls

### Pitfall 1: Case-Sensitive Tag Matching

**What goes wrong:** Users create duplicate tags with different casing ("React", "react", "REACT")
**Why it happens:** Default string comparison is case-sensitive
**How to avoid:**
- Store tags in lowercase or normalized form
- Use case-insensitive unique constraint: `name String @unique` with normalization in service layer
- Search with case-insensitive matching: `where: { name: { equals: input, mode: 'insensitive' } }`
**Warning signs:** Multiple similar tags appearing in autocomplete

### Pitfall 2: Unbounded Tag Lists

**What goes wrong:** Loading all tags into memory for autocomplete becomes slow with 1000+ tags
**Why it happens:** Fetching entire tag list on component mount
**How to avoid:**
- Implement server-side search: only return tags matching current input
- Limit autocomplete suggestions to top 20-50 results
- Use debounced search to reduce API calls
**Warning signs:** Slow autocomplete response, high memory usage

### Pitfall 3: Race Conditions in Batch Operations

**What goes wrong:** User rapidly adds/removes tags, operations complete out of order, final state is wrong
**Why it happens:** Async operations without proper sequencing
**How to avoid:**
- Use optimistic updates with rollback
- Queue operations or use request cancellation
- Show loading state to prevent rapid clicks
**Warning signs:** Tags appearing/disappearing unexpectedly, inconsistent state

### Pitfall 4: Missing Cascade Deletes

**What goes wrong:** Deleting a tag leaves orphaned ImageTag records
**Why it happens:** No cascade delete configured
**How to avoid:** Schema already has `onDelete: Cascade` - verify it works in tests
**Warning signs:** Growing ImageTag table, foreign key constraint errors

### Pitfall 5: Poor Filter Performance

**What goes wrong:** Filtering by multiple tags becomes slow with large image collections
**Why it happens:** Inefficient queries, missing indexes
**How to avoid:**
- Use indexed foreign keys (already in schema: `@@index([tagId])`)
- For "AND" filtering (images with ALL selected tags), use subqueries or aggregation
- Consider adding composite index if filtering by multiple tags is common
**Warning signs:** Slow filter response, database CPU spikes

## Code Examples

Verified patterns from official sources:

### Prisma: Query Images by Tags

```typescript
// Find images with ANY of the selected tags (OR)
const images = await prisma.image.findMany({
  where: {
    tags: {
      some: {
        tagId: { in: selectedTagIds }
      }
    }
  },
  include: {
    tags: {
      include: {
        tag: true
      }
    }
  }
})

// Find images with ALL selected tags (AND)
const images = await prisma.image.findMany({
  where: {
    AND: selectedTagIds.map(tagId => ({
      tags: {
        some: { tagId }
      }
    }))
  },
  include: {
    tags: {
      include: {
        tag: true
      }
    }
  }
})
```

### Prisma: Create Tag with Duplicate Prevention

```typescript
// Upsert: create if doesn't exist, return existing if it does
async function getOrCreateTag(name: string, category?: string) {
  const normalized = name.toLowerCase().trim()

  return await prisma.tag.upsert({
    where: { name: normalized },
    update: {}, // No updates if exists
    create: {
      name: normalized,
      category: category || 'keyword'
    }
  })
}
```

### Prisma: Batch Tag Operations in Transaction

```typescript
async function batchTagImages(imageIds: string[], tagNames: string[]) {
  return await prisma.$transaction(async (tx) => {
    // Get or create all tags
    const tags = await Promise.all(
      tagNames.map(name =>
        tx.tag.upsert({
          where: { name: name.toLowerCase() },
          update: {},
          create: { name: name.toLowerCase() }
        })
      )
    )

    // Create all image-tag relationships
    const operations = imageIds.flatMap(imageId =>
      tags.map(tag => ({ imageId, tagId: tag.id }))
    )

    await tx.imageTag.createMany({
      data: operations,
      skipDuplicates: true
    })

    return tags
  })
}
```

### React: Tag Filter Sidebar Component

```typescript
interface TagFilterProps {
  tags: Array<{ id: string; name: string; count: number }>
  selectedTagIds: Set<string>
  onToggle: (tagId: string) => void
  onClear: () => void
}

export function TagFilter({ tags, selectedTagIds, onToggle, onClear }: TagFilterProps) {
  return (
    <div style={{ width: '240px', borderRight: '1px solid #e5e7eb', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Filter by Tags</h3>
        {selectedTagIds.size > 0 && (
          <button onClick={onClear} style={{ fontSize: '12px', color: '#3b82f6' }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tags.map(tag => (
          <label key={tag.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectedTagIds.has(tag.id)}
              onChange={() => onToggle(tag.id)}
            />
            <span style={{ fontSize: '14px' }}>{tag.name}</span>
            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
              {tag.count}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit many-to-many | Explicit junction table | Prisma 2.x+ | More control, can add metadata to relationships |
| Client-side tag filtering | Server-side filtering with pagination | 2024+ | Scales to large collections, reduces client memory |
| Custom tag input | react-tag-autocomplete v7 | 2025 | Better accessibility, keyboard nav, ARIA support |
| Separate tag queries | Include in image query | Prisma best practice | Eliminates N+1 queries, better performance |

**Deprecated/outdated:**
- **react-tag-input v6:** Replaced by react-tag-autocomplete v7 with better TypeScript support and accessibility
- **Storing tags as comma-separated strings:** Use proper many-to-many relationships for queryability
- **Global tag state without filtering:** Use filtered queries to avoid loading all data

## Open Questions

1. **Tag Categories**
   - What we know: Schema has `category` field with default "keyword"
   - What's unclear: Are categories used for organization or just metadata?
   - Recommendation: Start with single category, add UI for categories in Phase 4 if needed

2. **Tag Ordering**
   - What we know: No explicit order field in ImageTag
   - What's unclear: Should tags on an image have a specific order?
   - Recommendation: Display alphabetically for now, add order field if users request it

3. **Tag Deletion Behavior**
   - What we know: Cascade delete removes ImageTag entries
   - What's unclear: Should we prevent deleting tags that are in use?
   - Recommendation: Allow deletion (cascade handles cleanup), show warning with count

4. **Autocomplete Threshold**
   - What we know: Need to limit suggestions for performance
   - What's unclear: Optimal number of suggestions to show
   - Recommendation: Start with 20, adjust based on user feedback

## Sources

### Primary (HIGH confidence)
- [Prisma Documentation - Many-to-many relations](https://prisma.io) - Explicit vs implicit patterns, query examples
- [react-tag-autocomplete GitHub](https://github.com) - Component API, accessibility features
- [Prisma Best Practices](https://prisma.io) - Transaction patterns, indexing strategies

### Secondary (MEDIUM confidence)
- [DataCamp - Many-to-many relationships](https://datacamp.com) - Junction table patterns
- [Medium - Tag system design](https://medium.com) - Scalability considerations
- [LogRocket - React filtering patterns](https://logrocket.com) - UI patterns for filtering

### Tertiary (LOW confidence - general trends)
- [Pencil and Paper - Filter UI patterns](https://pencilandpaper.io) - Sidebar vs dropdown comparison
- [npm-compare - React tag libraries](https://npm-compare.com) - Library comparisons

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Prisma already in use, react-tag-autocomplete is well-established
- Architecture: HIGH - Patterns verified from Prisma docs and existing codebase
- Pitfalls: MEDIUM - Based on common issues in tag systems, not project-specific

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable domain)
