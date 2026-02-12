---
phase: 03-tag-system
plan: 04
subsystem: ui
tags: [batch-tagging, image-toolbar, human-verification, tag-system]

# Dependency graph
requires:
  - phase: 03-tag-system
    plan: 02
    provides: TagInput component, TagManager panel
  - phase: 03-tag-system
    plan: 03
    provides: TagFilter sidebar, two-column layout
provides:
  - BatchTagModal for bulk add/remove tags on selected images
  - ImageToolbar integration with "Add Tags" and "Remove Tags" buttons
  - Human-verified complete tag system (TAG-01 through TAG-04)
affects: [phase-03-complete, tag-system]

# Tech tracking
tech-stack:
  added: []
  version-notes: []

# Execution
duration: ~8 min (including bug fixes and human verification)
tasks-completed: 2/2
---

## What Was Built

BatchTagModal component for batch tag operations on selected images, integrated into ImageToolbar with "Add Tags" and "Remove Tags" buttons. Human verification confirmed all TAG requirements pass.

## Key Files

### Created
- `apps/web/src/components/BatchTagModal.tsx` — Modal with add mode (ReactTags autocomplete + inline creation) and remove mode (checkbox list with image counts)

### Modified
- `apps/web/src/components/ImageToolbar.tsx` — Added "Add Tags" (green) and "Remove Tags" (orange) buttons with BatchTagModal integration

## Decisions

- BatchTagModal add mode reuses ReactTags component pattern from TagInput for consistency
- Remove mode uses simple checkboxes showing all tags with counts (simpler than computing intersection of selected images' tags)
- Both modes refresh tagStore and imageStore on completion to update counts and grid

## Bug Fixes During Verification

1. **Lightbox infinite re-render loop** — `useState(index)` + `useEffect` sync with `on.view` callback caused infinite setState cycle. Fixed by using `useRef` for navigation tracking.
2. **New tag foreign key constraint error** — `react-tag-autocomplete` v7 `allowNew` assigns auto-generated values to new tags, making `if (newTag.value)` unreliable for distinguishing new vs existing. Fixed by checking against tag store instead.
3. **TagManager placeholder not replaced** — index.tsx still had placeholder from parallel Plan 03-03 execution. Replaced with real TagManager component.
4. **Tag pill button styling** — ReactTags delete buttons showed browser default button styles. Fixed with `all: unset` and proper border/list-style resets.

## Commits

- `daad5be` feat(03-04): add batch tag operations to ImageToolbar
- `ed595f0` fix(03-tag-system): fix new tag foreign key error and lightbox image mismatch
- `d193205` fix(03-tag-system): fix lightbox infinite loop and new tag foreign key error
- `efbbdb8` fix(03-tag-system): fix tag pill button styling in ReactTags components

## Human Verification

All TAG requirements verified and approved:
- TAG-01: Add multiple tags to a single image via lightbox ✓
- TAG-02: Create, rename, delete tags via TagManager ✓
- TAG-03: Filter image grid by tag selection in sidebar ✓
- TAG-04: Batch add/remove tags on multiple selected images ✓

## Self-Check: PASSED
