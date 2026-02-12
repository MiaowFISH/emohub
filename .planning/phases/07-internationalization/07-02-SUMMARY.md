---
phase: 07-internationalization
plan: 02
subsystem: i18n-component-conversion
tags: [useTranslation, react-i18next, component-i18n, cross-namespace, pluralization]
dependency_graph:
  requires: [i18n-config, translation-files]
  provides: [fully-internationalized-ui]
  affects: [all-routes, all-components]
tech_stack:
  added: []
  patterns: [multiple-useTranslation-hooks, cross-namespace-references, i18next-pluralization]
key_files:
  created: []
  modified:
    - apps/web/src/routes/__root.tsx
    - apps/web/src/routes/settings.tsx
    - apps/web/src/routes/index.tsx
    - apps/web/src/components/SettingsForm.tsx
    - apps/web/src/components/TagFilter.tsx
    - apps/web/src/components/SearchBar.tsx
    - apps/web/src/components/ImageToolbar.tsx
    - apps/web/src/components/ImageUpload.tsx
    - apps/web/src/components/ImageGrid.tsx
    - apps/web/src/components/TagInput.tsx
    - apps/web/src/components/BatchTagModal.tsx
    - apps/web/src/components/TagManager.tsx
decisions:
  - decision: "Multiple useTranslation hooks for cross-namespace references"
    rationale: "TypeScript strict typing doesn't support 'common:key' syntax, so use separate tCommon hook for common namespace strings"
    alternatives: ["Cross-namespace syntax with 'common:key'", "Duplicate strings in each namespace"]
  - decision: "i18next pluralization with count interpolation"
    rationale: "Automatic pluralization via _one/_other suffixes, cleaner than manual conditionals"
    alternatives: ["Manual ternary operators for pluralization", "Separate keys for singular/plural"]
metrics:
  duration_seconds: 410
  tasks_completed: 2
  files_created: 0
  files_modified: 12
  commits: 2
  completed_date: 2026-02-12
---

# Phase 07 Plan 02: Component i18n Conversion Summary

**One-liner:** All 12 components/routes converted to useTranslation hooks with zero hardcoded strings, instant language switching working

## What Was Built

Completed full internationalization by converting every component and route to use react-i18next translation hooks, replacing all hardcoded UI strings with translation keys from the appropriate namespaces.

### Task 1: Convert Routes and Settings Components
- Added `useTranslation('common')` to `__root.tsx` for app name and nav
- Added `useTranslation('settings')` to `settings.tsx` for page title
- Added `useTranslation('images')` to `index.tsx` for "Manage Tags" button and toggle menu
- Updated `SettingsForm.tsx` with:
  - `useTranslation('settings')` with destructured `i18n` object
  - `handleLanguageChange` function that calls `i18n.changeLanguage()` for instant switching
  - All appearance and language strings replaced with translation keys
- **Result:** Language selector triggers immediate UI update across entire app

### Task 2: Convert All Image Management Components
Converted 8 components to use translation keys:

**Pattern used:** Multiple `useTranslation` hooks per component
```typescript
const { t } = useTranslation('images')
const { t: tCommon } = useTranslation('common')
```

**Components converted:**
- `TagFilter.tsx` — filter title, clear button, showing count, no tags message
- `SearchBar.tsx` — placeholder and aria-label
- `ImageToolbar.tsx` — selected count, buttons (Select All, Clear, Add/Remove Tags, Delete, Convert/Download GIF), confirmation dialog
- `ImageUpload.tsx` — uploading status, drag/drop text, supported formats, duplicate label
- `ImageGrid.tsx` — loading/no images messages, "+N more" tags indicator
- `TagInput.tsx` — placeholder and no options text
- `BatchTagModal.tsx` — modal titles with count interpolation, placeholders, buttons, validation messages
- `TagManager.tsx` — modal title, input placeholder, no tags message, image count with pluralization, buttons (Add, Save, Cancel, Rename, Delete), delete confirmation dialog

**Pluralization implementation:**
- Used i18next count interpolation: `t('tag_manager.image_count', { count: tag.imageCount })`
- JSON files have `_one` and `_other` suffixes for automatic pluralization
- Cleaner than manual ternary operators

## Deviations from Plan

**Rule 3 - Auto-fix blocking issue:**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** Cross-namespace syntax `t('common:actions.cancel')` not supported by TypeScript strict typing
- **Fix:** Used multiple `useTranslation` hooks per component: `const { t: tCommon } = useTranslation('common')`
- **Files modified:** All 8 image management components + 3 routes
- **Commit:** Included in task commits

## Verification Results

All verification criteria passed:
- ✅ TypeScript compilation passes with no errors
- ✅ All 12 component/route files use `useTranslation` hook (21 total hook usages)
- ✅ Zero hardcoded user-facing strings remain in any component
- ✅ Grep for common hardcoded strings returns no matches
- ✅ Cross-namespace references work via separate `tCommon` hook
- ✅ Pluralization works via i18next count interpolation

## Technical Implementation

### Multiple useTranslation Hooks Pattern
Components needing strings from multiple namespaces use aliased hooks:
```typescript
export const ImageToolbar = () => {
  const { t } = useTranslation('images')
  const { t: tCommon } = useTranslation('common')

  return (
    <>
      <span>{t('toolbar.selected_count', { count: selectedIds.size })}</span>
      <button>{tCommon('actions.clear')}</button>
    </>
  )
}
```

### Instant Language Switching
SettingsForm triggers immediate language change:
```typescript
const handleLanguageChange = async (value: 'en' | 'zh') => {
  await i18n.changeLanguage(value)
  setLanguage(value)
}
```
Bidirectional sync from Plan 01 ensures store updates automatically.

### Pluralization
i18next automatically selects correct plural form:
```json
{
  "tag_manager": {
    "image_count_one": "{{count}} image",
    "image_count_other": "{{count}} images"
  }
}
```
Component just passes count: `t('tag_manager.image_count', { count: 5 })` → "5 images"

## Next Steps

Phase 7 internationalization is now complete. All UI text responds instantly to language changes in settings. The app is fully bilingual (Chinese/English) with:
- Infrastructure: i18next config, bidirectional store sync, Suspense loading
- Content: 6 translation files (3 namespaces × 2 languages) with complete coverage
- Components: All 12 components/routes using translation hooks

Phase 8 and 9 remain in the v1.1 UX Polish milestone.

## Self-Check: PASSED

**Modified files verified:**
- ✅ apps/web/src/routes/__root.tsx
- ✅ apps/web/src/routes/settings.tsx
- ✅ apps/web/src/routes/index.tsx
- ✅ apps/web/src/components/SettingsForm.tsx
- ✅ apps/web/src/components/TagFilter.tsx
- ✅ apps/web/src/components/SearchBar.tsx
- ✅ apps/web/src/components/ImageToolbar.tsx
- ✅ apps/web/src/components/ImageUpload.tsx
- ✅ apps/web/src/components/ImageGrid.tsx
- ✅ apps/web/src/components/TagInput.tsx
- ✅ apps/web/src/components/BatchTagModal.tsx
- ✅ apps/web/src/components/TagManager.tsx

**Commits verified:**
- ✅ 16945a6: feat(07-02): convert routes and settings to use translation keys
- ✅ c927851: feat(07-02): convert all image management components to use translation keys
