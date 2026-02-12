---
phase: 08-enhanced-operations
plan: 01
subsystem: ui
tags: [sonner, clipboard-api, toast-notifications, i18n, react]

# Dependency graph
requires:
  - phase: 07-internationalization
    provides: i18n infrastructure with react-i18next and translation files
provides:
  - Clipboard copy utility with PNG conversion and GIF support
  - Toast notification system integrated app-wide via sonner
  - Copy button in lightbox with format selector (Original/GIF)
  - Server-side GIF conversion integration for clipboard
affects: [09-visual-polish, future-clipboard-features]

# Tech tracking
tech-stack:
  added: [sonner@2.0.7]
  patterns: [clipboard-api-with-format-conversion, toast-feedback-pattern, server-side-image-conversion]

key-files:
  created:
    - apps/web/src/lib/clipboard.ts
  modified:
    - apps/web/src/routes/__root.tsx
    - apps/web/src/components/ImageLightbox.tsx
    - apps/web/src/components/ImageToolbar.tsx
    - apps/web/public/locales/en/images.json
    - apps/web/public/locales/zh/images.json
    - apps/web/public/locales/en/common.json
    - apps/web/public/locales/zh/common.json

key-decisions:
  - "Used sonner for toast notifications - lightweight (22KB), rich colors, system theme support"
  - "Clipboard API requires PNG format - convert all images to PNG before copying"
  - "Server-side GIF conversion via existing imageApi.convertToGif endpoint - no client-side gif.js needed"
  - "Replaced all alert() calls with toast.error() for consistent UX"

patterns-established:
  - "Toast feedback pattern: loading toast with ID, update on success/error"
  - "Clipboard utility returns {success, error} result object for consistent error handling"
  - "Format selector in lightbox positioned above tag input (bottom: 100px vs 40px)"

# Metrics
duration: 6min
completed: 2026-02-12
---

# Phase 08 Plan 01: Clipboard Copy with Format Selection Summary

**Lightbox copy button with PNG/GIF format selector, toast notifications via sonner, and server-side GIF conversion**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-12T14:47:14Z
- **Completed:** 2026-02-12T14:53:43Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Clipboard copy utility with automatic PNG conversion (Clipboard API requirement)
- Copy button in lightbox with format dropdown (Copy Original / Copy as GIF)
- Toast notification system integrated app-wide with system theme support
- All alert() calls replaced with toast.error() for consistent feedback
- Full bilingual support for clipboard operations (English/Chinese)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install sonner, create clipboard utility, add Toaster provider** - (completed in previous session)
2. **Task 2: Add copy button with format selector to ImageLightbox** - `d021b7e` (feat)

## Files Created/Modified
- `apps/web/src/lib/clipboard.ts` - Clipboard utility with PNG conversion, GIF support, and comprehensive error handling
- `apps/web/src/routes/__root.tsx` - Added Toaster component with system theme
- `apps/web/src/components/ImageLightbox.tsx` - Copy button with format selector and toast feedback
- `apps/web/src/components/ImageToolbar.tsx` - Replaced alert() with toast.error()
- `apps/web/public/locales/en/images.json` - Added clipboard section with 8 translation keys
- `apps/web/public/locales/zh/images.json` - Added clipboard section with Chinese translations
- `apps/web/public/locales/en/common.json` - Added status.copying key
- `apps/web/public/locales/zh/common.json` - Added status.copying key
- `apps/web/package.json` - Added sonner@2.0.7 dependency

## Decisions Made
- **Sonner over react-hot-toast**: Better theme integration, rich colors support, smaller bundle
- **PNG conversion mandatory**: Clipboard API only accepts PNG format, so all images converted via canvas
- **Server-side GIF conversion**: Leveraged existing `imageApi.convertToGif()` endpoint instead of client-side processing
- **Format selector positioning**: Placed at bottom: 100px (above TagInput at 40px) for clear visual hierarchy
- **Toast ID pattern**: Loading toast with ID, then update same toast on success/error for smooth UX

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. Build passed with no TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Clipboard functionality complete and ready for user testing
- Toast notification system available for all future features
- Phase 08 Plan 02 (Visual Polish) can proceed with skeleton loading and visual hierarchy improvements
- All must-haves verified:
  - ✓ User can click copy button in lightbox
  - ✓ User can choose between Original (PNG) and GIF formats
  - ✓ Toast notifications show for copy success/failure
  - ✓ All alert() calls replaced with toast notifications
  - ✓ Bilingual support for all clipboard text

## Self-Check: PASSED

All claims verified:
- ✓ Commit d021b7e exists
- ✓ sonner dependency in package.json
- ✓ apps/web/src/routes/__root.tsx exists
- ✓ apps/web/src/lib/clipboard.ts exists

---
*Phase: 08-enhanced-operations*
*Completed: 2026-02-12*
