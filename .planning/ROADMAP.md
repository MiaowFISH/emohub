# Roadmap: EmoHub

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-12)
- 🚧 **v1.1 UX Polish** — Phases 5-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-12</summary>

- [x] Phase 1: Project Setup & Backend Foundation (2/2 plans) — completed 2026-02-12
- [x] Phase 2: Image Management (5/5 plans) — completed 2026-02-12
- [x] Phase 3: Tag System (4/4 plans) — completed 2026-02-12
- [x] Phase 4: Search & Polish (2/2 plans) — completed 2026-02-12

</details>

### v1.1 UX Polish (Phases 5-9)

#### Phase 5: Settings Foundation

**Goal:** Users can manage UI preferences through a centralized settings page

**Dependencies:** None (builds on v1.0 architecture)

**Requirements:**
- SET-01: User can manage theme and language preferences through settings page
- SET-02: Setting changes take effect immediately without page refresh

**Plans:** 1 plan

Plans:
- [x] 05-01-PLAN.md — Settings store, settings page, navigation link, CSS variables

**Success Criteria:**
1. User can navigate to settings page from main navigation
2. User can change settings and see immediate visual feedback
3. User's settings persist across browser sessions
4. Settings page is accessible on mobile and desktop layouts

**Status:** Complete — 2026-02-12

---

#### Phase 6: Dark Mode

**Goal:** Users can switch between light, dark, and system-matched themes

**Dependencies:** Phase 5 (settings store and CSS variable system)

**Requirements:**
- THEME-01: User can switch between light/dark/system themes
- THEME-02: User's theme preference persists across page refreshes
- THEME-03: System theme option automatically follows OS theme changes

**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md — FOUC prevention script and expanded CSS variable palette
- [x] 06-02-PLAN.md — Convert all component hardcoded colors to CSS variables

**Success Criteria:**
1. User can select light, dark, or system theme from settings
2. Theme changes apply instantly to all UI components
3. User's theme choice persists after closing and reopening browser
4. When system theme is selected, UI automatically updates when OS theme changes
5. No white flash occurs when loading page in dark mode

**Status:** Complete — 2026-02-12

---

#### Phase 7: Internationalization

**Goal:** Users can switch between Chinese and English interface languages

**Dependencies:** Phase 5 (settings store for language preference)

**Requirements:**
- I18N-01: User can switch between Chinese and English languages
- I18N-02: User's language preference persists across page refreshes
- I18N-03: All UI text renders through translation keys (no hardcoded strings)

**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — i18next setup, translation files, settings store sync
- [x] 07-02-PLAN.md — Convert all components to use translation keys

**Success Criteria:**
1. User can select language from settings page
2. All UI text updates immediately when language changes
3. User's language choice persists after closing and reopening browser
4. No untranslated text appears in either language
5. Pluralization and date formatting work correctly in both languages

**Status:** Complete — 2026-02-12

---

#### Phase 8: Enhanced Operations

**Goal:** Users can copy images to clipboard with format options and see clear visual hierarchy

**Dependencies:** None (extends existing features)

**Requirements:**
- IMG-01: User can copy image to system clipboard with one click
- IMG-02: User can choose to copy original format or convert to GIF
- IMG-03: User receives success/failure feedback after copy operation
- VISUAL-01: Buttons, cards, and sidebar have clear visual hierarchy
- VISUAL-02: Loading states show skeleton screens, empty states show guidance

**Plans:** 2 plans

Plans:
- [x] 08-01-PLAN.md — Clipboard copy with format selection and toast notifications
- [x] 08-02-PLAN.md — Skeleton loading screens, empty states, and button hierarchy

**Success Criteria:**
1. User can click copy button in lightbox to copy image to clipboard
2. User can select "Copy Original" or "Copy as GIF" from format menu
3. User sees toast notification confirming successful copy or explaining failure
4. User can distinguish primary from secondary buttons by visual weight
5. User sees skeleton screens while images load
6. User sees helpful empty state message when no images match search

**Status:** Complete — 2026-02-12

---

#### Phase 9: Visual Polish

**Goal:** Interactive elements have smooth transitions that respect user motion preferences

**Dependencies:** Phase 6 (must test animations in both themes)

**Requirements:**
- VISUAL-03: Interactive elements have smooth transitions (hover, modal, theme switch)
- VISUAL-04: Animations respect user's prefers-reduced-motion setting

**Success Criteria:**
1. User sees smooth hover effects on buttons and image cards
2. User sees smooth fade-in when modals open
3. User sees smooth transition when switching themes
4. User with reduced motion preference sees instant state changes without animation
5. All animations work correctly in both light and dark themes

**Plans:** 2 plans

Plans:
- [ ] 09-01-PLAN.md — CSS transition foundation: utilities, focus-visible, reduced-motion, FOUC prevention
- [ ] 09-02-PLAN.md — Apply transitions to components: ImageGrid CSS classes, smooth theme switch, lightbox animations

**Status:** Pending

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Setup & Backend Foundation | v1.0 | 2/2 | Complete | 2026-02-12 |
| 2. Image Management | v1.0 | 5/5 | Complete | 2026-02-12 |
| 3. Tag System | v1.0 | 4/4 | Complete | 2026-02-12 |
| 4. Search & Polish | v1.0 | 2/2 | Complete | 2026-02-12 |
| 5. Settings Foundation | v1.1 | 1/1 | Complete | 2026-02-12 |
| 6. Dark Mode | v1.1 | 2/2 | Complete | 2026-02-12 |
| 7. Internationalization | v1.1 | 2/2 | Complete | 2026-02-12 |
| 8. Enhanced Operations | v1.1 | 2/2 | Complete | 2026-02-12 |
| 9. Visual Polish | v1.1 | 0/2 | Pending | — |

---

*Last updated: 2026-02-12*
