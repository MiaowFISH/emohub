---
phase: 04-search-polish
plan: 01
subsystem: search
tags: [search, filtering, debounce, ui]
dependency_graph:
  requires: [03-tag-system]
  provides: [text-search, filename-search, tag-name-search]
  affects: [image-listing, tag-filtering]
tech_stack:
  added: [useDebounce-hook]
  patterns: [debounced-input, combined-filters]
key_files:
  created:
    - apps/web/src/lib/hooks.ts
    - apps/web/src/components/SearchBar.tsx
  modified:
    - packages/server/src/services/imageService.ts
    - packages/server/src/routes/images.ts
    - apps/web/src/lib/api.ts
    - apps/web/src/stores/imageStore.ts
    - apps/web/src/routes/index.tsx
    - apps/web/src/components/TagFilter.tsx
decisions:
  - decision: Use 400ms debounce delay for search input
    rationale: Balances responsiveness with API call frequency
  - decision: Search uses OR logic internally (filename OR tag name), AND logic with tag filter at top level
    rationale: Matches user expectation - search finds images matching either filename or tag, but respects active tag filters
  - decision: Reset to page 1 on search query change
    rationale: New search results should start from beginning
  - decision: Store searchQuery in imageStore for infinite scroll continuity
    rationale: fetchMore needs access to current search to maintain filtered results
metrics:
  duration: 149
  tasks_completed: 2
  files_created: 2
  files_modified: 6
  commits: 2
  completed_date: 2026-02-12
---

# Phase 04 Plan 01: Text Search Implementation Summary

**One-liner:** Text-based search across filenames and tag names with 400ms debounced input, combining with tag filters using AND logic.

## What Was Built

Implemented full-text search functionality that allows users to filter images by typing keywords that match either filenames or tag names. The search integrates seamlessly with the existing tag filter system, using AND logic at the top level (search AND tag filter) while internally using OR logic for the search itself (filename OR tag name).

### Backend Changes

**imageService.ts:**
- Added `search?: string` parameter to `listImages()` function
- Built dynamic Prisma where clause with AND logic at top level
- Search condition uses OR internally: `originalName contains` OR `tag.name contains`
- Used `mode: 'insensitive'` for case-insensitive matching
- Properly combines tag filter and search filter when both are present

**images.ts route:**
- Extract `search` query parameter from request
- Pass search parameter to `imageService.listImages()`

### Frontend Changes

**useDebounce hook (new):**
- Generic hook that debounces any value with configurable delay
- Uses useState + useEffect with setTimeout/clearTimeout pattern
- Returns debounced value after specified delay

**SearchBar component (new):**
- Local `inputValue` state for immediate input feedback
- Uses `useDebounce(inputValue, 400)` for 400ms delay
- `useEffect` watches debounced value and calls `setSearchQuery`
- Styled search input with focus states
- Placeholder: "Search by filename or tag..."

**imageStore updates:**
- Added `searchQuery: string` state (default: empty string)
- Added `setSearchQuery(query: string)` action that resets to page 1
- Updated `fetchImages` to accept optional `search` parameter
- Updated `fetchMore` to pass current `searchQuery` for pagination continuity
- Store searchQuery in state for access by fetchMore

**api.ts updates:**
- Added optional `search?: string` parameter to `imageApi.list()`
- Append search to URLSearchParams when provided and non-empty

**index.tsx updates:**
- Import and render `<SearchBar />` between header and toolbar
- Proper spacing for visual hierarchy

**TagFilter.tsx updates:**
- Access `searchQuery` from imageStore
- Pass searchQuery to `fetchImages()` when tag filter changes
- Ensures search persists when toggling tag filters

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ Server builds without TypeScript errors (bunx tsc --noEmit)
✅ Web app builds successfully (bun run build)
✅ SearchBar component created with debounced input
✅ Backend search parameter integrated into listImages
✅ Search and tag filter combine with AND logic
✅ Pagination resets to page 1 on search change
✅ Infinite scroll maintains search query

## Success Criteria Met

✅ **SRCH-01:** User can search images by typing tag names and see filtered results
✅ **SRCH-02:** User can search images by typing keywords that match filenames or tag names
✅ Both search and tag filter work simultaneously with AND logic
✅ No regressions in existing image grid, upload, or tag functionality

## Technical Notes

### Search Logic Structure

```
Top level: AND
├─ Tag Filter: images with tagId IN [selected tags]
└─ Search: OR
   ├─ originalName contains search (case-insensitive)
   └─ tag.name contains search (case-insensitive)
```

### Debounce Pattern

The useDebounce hook prevents excessive API calls by waiting 400ms after the user stops typing before triggering the search. This provides a smooth UX while minimizing server load.

### State Management Flow

1. User types in SearchBar → updates local `inputValue`
2. useDebounce delays for 400ms → produces `debouncedSearch`
3. useEffect detects change → calls `setSearchQuery(debouncedSearch)`
4. setSearchQuery → calls `fetchImages(1, activeTagFilter, query)`
5. fetchImages → calls `imageApi.list(page, limit, tagIds, search)`
6. API request → server filters with Prisma where clause
7. Results update imageStore → grid re-renders

### Integration Points

- **Tag Filter:** When user toggles tags, TagFilter passes current searchQuery to maintain search context
- **Infinite Scroll:** fetchMore accesses searchQuery from state to maintain filtered results across pages
- **Pagination:** Search query change resets to page 1 for fresh results

## Commits

- `230d31f`: feat(04-search-polish): add backend search by filename and tag name
- `0637a10`: feat(04-search-polish): add frontend search with debounced input

## Self-Check: PASSED

**Created files exist:**
✅ apps/web/src/lib/hooks.ts
✅ apps/web/src/components/SearchBar.tsx

**Modified files exist:**
✅ packages/server/src/services/imageService.ts
✅ packages/server/src/routes/images.ts
✅ apps/web/src/lib/api.ts
✅ apps/web/src/stores/imageStore.ts
✅ apps/web/src/routes/index.tsx
✅ apps/web/src/components/TagFilter.tsx

**Commits exist:**
✅ 230d31f: feat(04-search-polish): add backend search by filename and tag name
✅ 0637a10: feat(04-search-polish): add frontend search with debounced input
