---
phase: 07-internationalization
plan: 01
subsystem: i18n-infrastructure
tags: [i18next, react-i18next, translations, localization, settings-integration]
dependency_graph:
  requires: [settings-store, css-variables]
  provides: [i18n-config, translation-files, type-safe-translations]
  affects: [all-components]
tech_stack:
  added: [i18next@25.8.6, react-i18next@16.5.4, i18next-http-backend@3.0.2, i18next-browser-languagedetector@8.2.0]
  patterns: [bidirectional-sync, suspense-loading, namespace-organization]
key_files:
  created:
    - apps/web/src/i18n/config.ts
    - apps/web/src/i18n/i18next.d.ts
    - apps/web/public/locales/en/common.json
    - apps/web/public/locales/en/settings.json
    - apps/web/public/locales/en/images.json
    - apps/web/public/locales/zh/common.json
    - apps/web/public/locales/zh/settings.json
    - apps/web/public/locales/zh/images.json
  modified:
    - apps/web/package.json
    - apps/web/src/main.tsx
    - bun.lock
decisions:
  - decision: "Bidirectional sync between i18next and settingsStore without circular imports"
    rationale: "Store subscribes to i18n languageChanged event, i18n subscribes to store changes via useSettingsStore.subscribe()"
    alternatives: ["Direct import causing circular dependency", "One-way sync only"]
  - decision: "Three namespaces: common, settings, images"
    rationale: "Logical separation by feature area, enables lazy loading per namespace, matches component organization"
    alternatives: ["Single namespace", "Per-component namespaces"]
  - decision: "Suspense with useSuspense: true"
    rationale: "Prevents rendering until translations load, avoids flash of untranslated content"
    alternatives: ["useSuspense: false with loading states in components"]
metrics:
  duration_seconds: 283
  tasks_completed: 2
  files_created: 11
  files_modified: 3
  commits: 2
  completed_date: 2026-02-12
---

# Phase 07 Plan 01: i18n Infrastructure Setup Summary

**One-liner:** i18next infrastructure with bidirectional settingsStore sync, 3 namespaces, 6 translation files covering all UI strings

## What Was Built

Established complete i18n foundation for EmoHub with react-i18next integration, bidirectional language sync with existing settings store, and comprehensive translation coverage for Chinese (default) and English.

### Task 1: i18next Configuration and Store Integration
- Installed 4 i18next packages: core, react bindings, http backend, language detector
- Created `src/i18n/config.ts` with:
  - Backend loading from `/locales/{lng}/{ns}.json`
  - Language detector with localStorage + navigator fallback
  - Bidirectional sync: `i18n.on('languageChanged')` → updates store, `useSettingsStore.subscribe()` → updates i18n
  - Initial language seeded from settingsStore ('zh' default)
- Created `src/i18n/i18next.d.ts` for TypeScript autocomplete on translation keys
- Updated `main.tsx`: imported i18n config before router, wrapped app in Suspense

### Task 2: Complete Translation Files
Created 6 JSON files (3 namespaces × 2 languages):

**Namespace organization:**
- `common` — shared UI: app name, nav, generic actions (Cancel, Delete, Save, etc.), status messages
- `settings` — settings page: appearance options, language labels
- `images` — image management: toolbar, upload, grid, search, filter, tag input, tag manager, batch modal

**Coverage:** Every hardcoded string from all components mapped to translation keys with i18next interpolation support for dynamic values ({{count}}, {{error}}, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:
- ✅ TypeScript compilation passes with no errors
- ✅ All 4 i18next dependencies installed and linked
- ✅ All 6 JSON files parse without errors
- ✅ English and Chinese files have identical key structures
- ✅ i18n config imported in main.tsx before router
- ✅ Suspense wraps RouterProvider
- ✅ Bidirectional sync implemented in config.ts

## Technical Implementation

### Bidirectional Sync Pattern
Avoided circular imports by keeping all sync logic in `config.ts`:
```typescript
// i18next → store
i18n.on('languageChanged', (lng) => {
  useSettingsStore.getState().setLanguage(lng as 'en' | 'zh')
})

// store → i18next
useSettingsStore.subscribe((state) => {
  if (state.language !== i18n.language) {
    i18n.changeLanguage(state.language)
  }
})
```

### Type Safety
TypeScript augmentation provides autocomplete for all translation keys:
```typescript
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      settings: typeof settings
      images: typeof images
    }
  }
}
```

## Next Steps

Plan 02 will convert all components to use `useTranslation()` hooks, replacing hardcoded strings with translation keys. The infrastructure is ready:
- i18n initializes before any component renders
- Translations load asynchronously via http-backend
- Language changes propagate instantly to all components
- TypeScript provides autocomplete for all keys

## Self-Check: PASSED

**Created files verified:**
- ✅ apps/web/src/i18n/config.ts
- ✅ apps/web/src/i18n/i18next.d.ts
- ✅ apps/web/public/locales/en/common.json
- ✅ apps/web/public/locales/en/settings.json
- ✅ apps/web/public/locales/en/images.json
- ✅ apps/web/public/locales/zh/common.json
- ✅ apps/web/public/locales/zh/settings.json
- ✅ apps/web/public/locales/zh/images.json

**Commits verified:**
- ✅ 4f158a9: feat(07-01): install i18next and configure with store sync
- ✅ 8933182: feat(07-01): create complete translation files for Chinese and English
