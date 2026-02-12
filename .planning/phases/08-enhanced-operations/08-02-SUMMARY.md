---
phase: 08-enhanced-operations
plan: 02
subsystem: ui-polish
tags: [skeleton-loading, empty-states, button-hierarchy, ux, accessibility]
dependency_graph:
  requires: [phase-07-internationalization]
  provides: [skeleton-components, empty-state-guidance, button-css-system]
  affects: [ImageGrid, ImageToolbar, index-route]
tech_stack:
  added: [skeleton-shimmer-animation, button-hierarchy-css]
  patterns: [contextual-empty-states, reduced-motion-support, css-class-buttons]
key_files:
  created:
    - apps/web/src/components/SkeletonCard.tsx
    - apps/web/src/components/EmptyState.tsx
    - apps/web/src/styles/skeleton.css
    - apps/web/src/styles/buttons.css
  modified:
    - apps/web/src/components/ImageGrid.tsx
    - apps/web/src/components/ImageToolbar.tsx
    - apps/web/src/routes/index.tsx
    - apps/web/public/locales/en/images.json
    - apps/web/public/locales/zh/images.json
decisions:
  - decision: Skeleton shimmer respects prefers-reduced-motion
    rationale: Accessibility requirement - users with motion sensitivity should not see animations
    alternatives: [always-show-shimmer, no-animation]
    chosen: conditional-animation-with-media-query
  - decision: EmptyState differentiates no-images vs no-results
    rationale: Contextual guidance helps users understand why they see empty state and what to do next
    alternatives: [single-generic-message, no-empty-state]
    chosen: contextual-empty-states
  - decision: Button hierarchy uses CSS classes instead of inline styles
    rationale: Maintainability, consistency, easier theming, reduced code duplication
    alternatives: [keep-inline-styles, css-in-js, styled-components]
    chosen: css-classes
metrics:
  duration_seconds: 181
  tasks_completed: 2
  files_created: 4
  files_modified: 5
  commits: 2
  completed_date: 2026-02-12
---

# Phase 08 Plan 02: Skeleton Loading & Visual Hierarchy Summary

**One-liner:** Skeleton cards with shimmer animation, contextual empty states, and CSS-based button hierarchy improve perceived performance and UI clarity.

## What Was Built

### Skeleton Loading System
- **SkeletonCard component** with shimmer animation that respects `prefers-reduced-motion`
- **skeleton.css** with `@keyframes shimmer` animation and accessibility support
- Integrated into ImageGrid for:
  - Initial load (3 rows of skeleton cards)
  - Infinite scroll (1 row at bottom during load)
- ARIA attributes: `aria-busy="true"`, `role="status"`, screen-reader text

### Empty State Guidance
- **EmptyState component** with two contextual types:
  - `no-images`: Folder/upload icon, "No images yet", "Upload some stickers to get started!"
  - `no-results`: Search icon, "No results found", "Try a different search term or adjust your tag filters."
- SVG icons (not emoji) for better rendering across platforms
- CSS variables for dark mode compatibility
- Bilingual support (EN/ZH)

### Button Hierarchy CSS
- **buttons.css** with 6 button classes:
  - `.btn-primary`: High emphasis (accent color, white text)
  - `.btn-secondary`: Medium emphasis (outlined, border)
  - `.btn-danger`: Destructive actions (red)
  - `.btn-success`: Positive actions (green)
  - `.btn-warning`: Caution actions (yellow/orange)
  - `.btn-icon`: Minimal icon-only buttons
- Applied across:
  - ImageToolbar: Select All, Clear, Add Tags, Remove Tags, Delete, Convert to GIF
  - index.tsx: Manage Tags button
  - Confirm dialog: Cancel, Delete buttons
- Removed 150+ lines of redundant inline styles

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

- ✅ `bun run build` completes without errors
- ✅ SkeletonCard component exists with shimmer animation
- ✅ EmptyState component exists with contextual types
- ✅ `@keyframes shimmer` animation in skeleton.css
- ✅ `prefers-reduced-motion` media query in skeleton.css
- ✅ Translation keys added to both EN and ZH locale files
- ✅ SkeletonCard integrated into ImageGrid (initial + infinite scroll)
- ✅ EmptyState integrated with contextual type detection
- ✅ Button hierarchy CSS created with all 6 classes
- ✅ Button classes applied to index.tsx and ImageToolbar.tsx

## Key Technical Decisions

### 1. Skeleton Shimmer Animation with Reduced Motion Support

**Decision:** Use CSS `@keyframes` with `@media (prefers-reduced-motion: reduce)` to disable animation.

**Rationale:**
- Accessibility requirement per WCAG 2.1 (2.3.3 Animation from Interactions)
- Users with vestibular disorders or motion sensitivity need static UI
- CSS media query is the standard approach for respecting user preferences

**Implementation:**
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
    opacity: 0;
  }
}
```

### 2. Contextual Empty States

**Decision:** Differentiate between "no images uploaded" and "no search results" scenarios.

**Rationale:**
- Different user contexts require different guidance
- "No images" → encourage upload action
- "No results" → suggest adjusting search/filters
- Reduces user confusion and provides actionable next steps

**Implementation:**
```tsx
const hasActiveFilters = searchQuery || activeTagFilter.length > 0
<EmptyState type={hasActiveFilters ? 'no-results' : 'no-images'} />
```

### 3. CSS Classes for Button Hierarchy

**Decision:** Replace inline styles with CSS classes for all buttons.

**Rationale:**
- **Maintainability:** Single source of truth for button styles
- **Consistency:** All buttons follow same visual hierarchy
- **Theming:** CSS variables enable dark mode without per-button logic
- **Code reduction:** Removed 150+ lines of redundant inline styles
- **Performance:** CSS classes are more efficient than inline styles

**Before (inline styles):**
```tsx
<button style={{
  padding: '6px 12px',
  backgroundColor: 'var(--color-danger)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  color: 'white'
}}>Delete</button>
```

**After (CSS class):**
```tsx
<button className="btn-danger">Delete</button>
```

## Translation Keys Added

### English (en/images.json)
```json
"grid.loading_image": "Loading image..."
"empty.no_images_title": "No images yet"
"empty.no_images_description": "Upload some stickers to get started!"
"empty.no_results_title": "No results found"
"empty.no_results_description": "Try a different search term or adjust your tag filters."
```

### Chinese (zh/images.json)
```json
"grid.loading_image": "加载图片中..."
"empty.no_images_title": "还没有图片"
"empty.no_images_description": "上传一些表情包开始使用吧！"
"empty.no_results_title": "未找到结果"
"empty.no_results_description": "试试其他搜索词或调整标签筛选条件。"
```

## Commits

| Commit | Type | Description | Files |
|--------|------|-------------|-------|
| 2f5f073 | feat | Add skeleton loading and empty state components | SkeletonCard.tsx, EmptyState.tsx, skeleton.css, locale files |
| 030e74f | feat | Integrate skeleton/empty states and add button hierarchy | ImageGrid.tsx, ImageToolbar.tsx, index.tsx, buttons.css |

## Impact Assessment

### User Experience Improvements
- **Perceived performance:** Skeleton cards make loading feel faster than "Loading..." text
- **Guidance:** Empty states provide clear next steps instead of dead-end "No images" message
- **Visual clarity:** Button hierarchy makes primary actions (Convert to GIF) stand out from secondary actions (Select All)
- **Accessibility:** Reduced motion support respects user preferences

### Code Quality Improvements
- **Maintainability:** Button styles centralized in buttons.css
- **Consistency:** All buttons follow same visual hierarchy
- **Reduction:** 150+ lines of inline styles removed
- **Theming:** CSS variables enable dark mode without per-component logic

### Performance
- **CSS efficiency:** Class-based styles more efficient than inline styles
- **Bundle size:** Minimal increase (~2KB for skeleton.css + buttons.css)
- **Animation performance:** CSS transforms (translateX) use GPU acceleration

## Testing Recommendations

1. **Skeleton Loading:**
   - Open app with empty database → verify skeleton cards appear briefly
   - Scroll to bottom of long image list → verify skeleton cards appear during infinite scroll
   - Enable "prefers-reduced-motion: reduce" in DevTools → verify shimmer stops

2. **Empty States:**
   - Empty database → verify "No images yet" with upload guidance
   - Search for nonexistent term → verify "No results found" with filter guidance
   - Clear search → verify images reappear

3. **Button Hierarchy:**
   - Visual inspection: "Add Tags" (green) and "Delete" (red) should have higher visual weight than "Select All" (outlined)
   - Hover states: verify all buttons have hover effects
   - Disabled states: verify opacity reduction and cursor change

4. **Dark Mode:**
   - Switch to dark theme → verify skeleton cards, empty states, and buttons use CSS variables correctly

5. **Mobile:**
   - Test on mobile viewport → verify skeleton grid adapts to column count

6. **Internationalization:**
   - Switch language → verify empty state text translates

## Self-Check: PASSED

### Files Created
- ✅ FOUND: apps/web/src/components/SkeletonCard.tsx
- ✅ FOUND: apps/web/src/components/EmptyState.tsx
- ✅ FOUND: apps/web/src/styles/skeleton.css
- ✅ FOUND: apps/web/src/styles/buttons.css

### Commits Exist
- ✅ FOUND: 2f5f073 (Task 1: skeleton/empty components)
- ✅ FOUND: 030e74f (Task 2: integration + button hierarchy)

### Build Status
- ✅ PASSED: `bun run build` completed without errors

### Integration Verified
- ✅ SkeletonCard imported and used in ImageGrid
- ✅ EmptyState imported and used in ImageGrid with contextual type
- ✅ buttons.css imported in index.tsx and ImageToolbar.tsx
- ✅ Button classes applied to all toolbar buttons
- ✅ Translation keys present in both locale files

## Next Steps

Plan 08-02 complete. Ready for:
- Phase 08 Plan 01 completion (clipboard operations - running in parallel)
- Phase 09: Visual Polish (animations, transitions, micro-interactions)
- User acceptance testing of skeleton loading and empty states
