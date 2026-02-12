# Phase 5: Settings Foundation - Research

**Researched:** 2026-02-12
**Domain:** React settings page architecture, state persistence, theme infrastructure
**Confidence:** HIGH

## Summary

Phase 5 establishes the foundational infrastructure for user preferences management in EmoHub. This phase creates a centralized settings store using Zustand's persist middleware, implements a settings page with TanStack Router, and prepares CSS variable infrastructure for theme switching (Phase 6) and i18n integration (Phase 7).

The research confirms that the existing stack (Zustand 5.0.11, TanStack Router 1.159.5, Vite + React 19) provides all necessary capabilities without additional dependencies. The architecture follows React best practices for immediate feedback, accessibility, and state persistence.

**Primary recommendation:** Build a minimal settings store with persist middleware, create a settings route with nested navigation, and implement immediate-feedback form patterns using controlled components.

## Standard Stack

### Core (Already in Stack)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Zustand | 5.0.11 | State management + persistence | Already used for imageStore/tagStore, persist middleware built-in |
| TanStack Router | 1.159.5 | Type-safe routing | Already used, file-based routing with nested routes |
| React | 19.2.4 | UI framework | Latest stable, includes useOptimistic for instant feedback |
| TypeScript | 5.8.3 | Type safety | Full type inference for stores and routes |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | Native API | Settings persistence | Default storage for Zustand persist middleware |
| CSS Variables | Native | Theme infrastructure | Prepare for Phase 6 dark mode implementation |

### No New Dependencies Required
Phase 5 requires **zero new npm packages**. All functionality is achievable with existing stack.

**Installation:**
```bash
# No installation needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── stores/
│   ├── imageStore.ts          # Existing
│   ├── tagStore.ts             # Existing
│   └── settingsStore.ts        # NEW: Settings with persist middleware
├── routes/
│   ├── __root.tsx              # Existing: Add settings nav link
│   ├── index.tsx               # Existing
│   └── settings.tsx            # NEW: Settings page route
├── components/
│   └── SettingsForm.tsx        # NEW: Settings form with immediate feedback
└── styles/
    └── theme-variables.css     # NEW: CSS variables for Phase 6 prep
```

### Pattern 1: Settings Store with Persist Middleware
**What:** Zustand store with persist middleware for automatic localStorage synchronization
**When to use:** All user preferences that should survive page refresh
**Example:**
```typescript
// Source: https://pmnd.rs (Zustand official docs)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'zh'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: 'en' | 'zh') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'emohub-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language
      })
    }
  )
)
```

### Pattern 2: TanStack Router Settings Route
**What:** File-based route for settings page with type-safe navigation
**When to use:** Creating the /settings page
**Example:**
```typescript
// Source: https://tanstack.com (TanStack Router docs)
// apps/web/src/routes/settings.tsx
import { createFileRoute } from '@tanstack/react-router'
import { SettingsForm } from '@/components/SettingsForm'

export const Route = createFileRoute('/settings')({
  component: () => (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>Settings</h1>
      <SettingsForm />
    </div>
  )
})
```

### Pattern 3: Immediate Feedback Form
**What:** Controlled components with instant state updates (no submit button)
**When to use:** Settings that should apply immediately on change
**Example:**
```typescript
// Source: React best practices for settings forms
import { useSettingsStore } from '@/stores/settingsStore'

export function SettingsForm() {
  const { theme, language, setTheme, setLanguage } = useSettingsStore()

  return (
    <form>
      <fieldset>
        <legend>Theme</legend>
        <label>
          <input
            type="radio"
            name="theme"
            value="light"
            checked={theme === 'light'}
            onChange={(e) => setTheme(e.target.value as 'light')}
          />
          Light
        </label>
        <label>
          <input
            type="radio"
            name="theme"
            value="dark"
            checked={theme === 'dark'}
            onChange={(e) => setTheme(e.target.value as 'dark')}
          />
          Dark
        </label>
        <label>
          <input
            type="radio"
            name="theme"
            value="system"
            checked={theme === 'system'}
            onChange={(e) => setTheme(e.target.value as 'system')}
          />
          System
        </label>
      </fieldset>

      <fieldset>
        <legend>Language</legend>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </fieldset>
    </form>
  )
}
```

### Pattern 4: Navigation Link in Root Layout
**What:** Add settings link to existing header navigation
**When to use:** Making settings accessible from all pages
**Example:**
```typescript
// apps/web/src/routes/__root.tsx (modify existing)
import { createRootRoute, Outlet, Link } from '@tanstack/react-router'

const RootLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            <Link to="/">EmoHub</Link>
          </h1>
          <Link to="/settings">Settings</Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
```

### Pattern 5: CSS Variables Preparation (Phase 6 Dependency)
**What:** Define CSS custom properties structure for theme switching
**When to use:** Phase 5 prepares infrastructure, Phase 6 implements switching logic
**Example:**
```css
/* apps/web/src/styles/theme-variables.css */
:root {
  /* Light theme (default) */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
}

[data-theme='dark'] {
  /* Dark theme - Phase 6 will apply this class */
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #111827;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-border: #374151;
}

@media (prefers-color-scheme: dark) {
  /* System preference - Phase 6 will handle 'system' option */
  :root:not([data-theme]) {
    --color-bg-primary: #1f2937;
    --color-bg-secondary: #111827;
    --color-text-primary: #f9fafb;
    --color-text-secondary: #d1d5db;
    --color-border: #374151;
  }
}
```

### Anti-Patterns to Avoid
- **Submit button for settings:** Settings should apply immediately on change (SET-02 requirement)
- **Separate theme/language stores:** Consolidate all settings in one store for consistency
- **External form libraries:** React Hook Form/Formik unnecessary for simple settings form
- **Redux/Context for settings:** Zustand already in stack, don't introduce new state management
- **Inline localStorage calls:** Always use Zustand persist middleware for automatic sync

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence | Custom localStorage wrapper with hydration logic | Zustand persist middleware | Handles hydration, versioning, migrations, SSR edge cases automatically |
| Form validation | Custom validation logic | TypeScript + controlled components | Settings are simple enums, TS type guards sufficient |
| Route type safety | Manual route string constants | TanStack Router createFileRoute | Automatic type inference, compile-time route validation |
| Theme FOUC prevention | React-based theme loader | Inline script in index.html | Executes before React hydration, prevents flash (Phase 6) |

**Key insight:** Settings pages are deceptively simple but have hidden complexity in persistence hydration, SSR compatibility, and FOUC prevention. Use battle-tested middleware rather than custom solutions.

## Common Pitfalls

### Pitfall 1: localStorage Quota Exceeded
**What goes wrong:** Writing to localStorage can throw QuotaExceededError (5-10MB limit per origin)
**Why it happens:** No error handling around localStorage.setItem calls
**How to avoid:** Zustand persist middleware handles this automatically, but add try-catch for custom storage
**Warning signs:** Users report settings not saving, console errors in production
**Prevention:**
```typescript
// Zustand persist middleware handles this, but for custom storage:
try {
  localStorage.setItem('key', value)
} catch (e) {
  if (e.name === 'QuotaExceededError' || e.code === 22) {
    console.warn('localStorage quota exceeded')
    // Fallback: clear old data or use in-memory storage
  }
}
```

### Pitfall 2: SSR Hydration Mismatch
**What goes wrong:** Server renders default theme, client hydrates with persisted theme, React throws hydration error
**Why it happens:** localStorage only available on client, server doesn't know user's saved preference
**How to avoid:** Use skipHydration option and manually rehydrate after mount
**Warning signs:** Console warnings about hydration mismatch, brief flash of wrong theme
**Prevention:**
```typescript
// For SSR environments (not needed for Vite SPA, but good to know):
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'emohub-settings',
      skipHydration: true, // Skip automatic hydration
    }
  )
)

// In component:
useEffect(() => {
  useSettingsStore.persist.rehydrate() // Manual rehydration after mount
}, [])
```

### Pitfall 3: Immediate Feedback Without Debouncing
**What goes wrong:** Rapid setting changes (e.g., slider) trigger excessive re-renders and localStorage writes
**Why it happens:** onChange fires on every input event
**How to avoid:** For Phase 5 simple radio/select inputs, no debouncing needed. For future complex inputs, use debounce
**Warning signs:** Performance lag when changing settings, excessive localStorage writes
**Prevention:** Not applicable for Phase 5 (radio buttons and select dropdowns don't need debouncing)

### Pitfall 4: Missing Accessibility Attributes
**What goes wrong:** Screen readers can't announce setting changes, keyboard navigation broken
**Why it happens:** Using divs instead of semantic HTML, missing ARIA labels
**How to avoid:** Use native form elements (radio, select), add aria-label for icon buttons
**Warning signs:** Fails accessibility audit, keyboard users can't navigate settings
**Prevention:**
```typescript
// Use semantic HTML
<fieldset>
  <legend>Theme Preference</legend> {/* Screen reader announces group */}
  <label>
    <input type="radio" name="theme" value="light" />
    Light
  </label>
</fieldset>

// For icon-only buttons (future phases):
<button aria-label="Open settings">
  <SettingsIcon />
</button>
```

### Pitfall 5: Not Partializing Persisted State
**What goes wrong:** Entire store (including derived state, functions) gets stringified to localStorage
**Why it happens:** Forgetting to use partialize option in persist middleware
**How to avoid:** Always specify which fields to persist
**Warning signs:** localStorage contains "[object Object]" or function serialization errors
**Prevention:**
```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'emohub-settings',
    partialize: (state) => ({
      theme: state.theme,
      language: state.language
      // Don't persist functions like setTheme, setLanguage
    })
  }
)
```

### Pitfall 6: FOUC (Flash of Unstyled Content) During Theme Load
**What goes wrong:** Page briefly shows light theme before switching to dark theme
**Why it happens:** Theme class applied after React hydration
**How to avoid:** Inline script in index.html reads localStorage and sets theme before React loads (Phase 6)
**Warning signs:** Visible flash when page loads, especially on slow connections
**Prevention:** Phase 6 will implement inline script, Phase 5 prepares CSS variables

## Code Examples

Verified patterns from official sources:

### Settings Store with Persist
```typescript
// Source: https://pmnd.rs (Zustand persist middleware docs)
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'zh'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: 'en' | 'zh') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'emohub-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language
      })
    }
  )
)
```

### Settings Form Component
```typescript
// Source: React best practices for immediate feedback forms
import { useSettingsStore } from '@/stores/settingsStore'

export function SettingsForm() {
  const { theme, language, setTheme, setLanguage } = useSettingsStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <h2>Appearance</h2>
        <fieldset style={{ border: 'none', padding: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            Theme
          </legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={(e) => setTheme(e.target.value as 'light')}
              />
              Light
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.value as 'dark')}
              />
              Dark
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === 'system'}
                onChange={(e) => setTheme(e.target.value as 'system')}
              />
              System
            </label>
          </div>
        </fieldset>
      </section>

      <section>
        <h2>Language</h2>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Interface Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
            style={{ padding: '0.5rem', fontSize: '1rem' }}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
      </section>
    </div>
  )
}
```

### Settings Route
```typescript
// Source: https://tanstack.com (TanStack Router file-based routing)
// apps/web/src/routes/settings.tsx
import { createFileRoute } from '@tanstack/react-router'
import { SettingsForm } from '@/components/SettingsForm'

export const Route = createFileRoute('/settings')({
  component: SettingsPage
})

function SettingsPage() {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <h1 style={{ marginBottom: '2rem' }}>Settings</h1>
      <SettingsForm />
    </div>
  )
}
```

### Navigation Link Addition
```typescript
// apps/web/src/routes/__root.tsx (modify existing)
import { createRootRoute, Outlet, Link } from '@tanstack/react-router'

const RootLayout = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--color-border, #e5e7eb)',
        backgroundColor: 'var(--color-bg-secondary, #f9fafb)'
      }}>
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              EmoHub
            </Link>
          </h1>
          <Link
            to="/settings"
            style={{ textDecoration: 'none', color: 'var(--color-text-secondary, #6b7280)' }}
          >
            Settings
          </Link>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for settings | Zustand with persist middleware | 2021-2022 | 90% less boilerplate, built-in persistence |
| React Context + localStorage | Zustand persist | 2021-2022 | Automatic hydration, no manual sync logic |
| Submit button for settings | Immediate feedback (onChange) | 2020+ | Better UX, aligns with modern settings patterns |
| CSS-in-JS for themes | CSS variables | 2023+ | Zero runtime cost, better performance |
| React Router | TanStack Router | 2023+ | Full type safety, file-based routing |

**Deprecated/outdated:**
- **Redux for simple settings:** Overkill, Zustand sufficient for settings state
- **localStorage wrapper libraries:** Zustand persist middleware handles all edge cases
- **Styled-components for theming:** CSS variables are native, faster, zero runtime cost
- **Form libraries for settings:** React Hook Form unnecessary for simple radio/select inputs

## Open Questions

1. **Should settings have a "reset to defaults" button?**
   - What we know: Not in requirements, but common UX pattern
   - What's unclear: User expectation for personal tool
   - Recommendation: Defer to Phase 6/7 implementation, add if user feedback requests it

2. **Should settings show "saved" confirmation feedback?**
   - What we know: SET-02 requires immediate effect, no page refresh
   - What's unclear: Whether visual confirmation (toast/checkmark) improves UX
   - Recommendation: Start without confirmation (settings apply instantly), add if user testing shows confusion

3. **Should language setting affect date/number formatting?**
   - What we know: I18N-01 requires language switching
   - What's unclear: Scope of localization (UI text only vs. full i18n)
   - Recommendation: Phase 5 stores preference, Phase 7 implements full i18n with react-i18next

## Sources

### Primary (HIGH confidence)
- [Zustand persist middleware documentation](https://pmnd.rs) - Official docs for persist configuration
- [TanStack Router file-based routing](https://tanstack.com) - Official docs for route creation
- [React 19 features](https://reactjs.org) - useOptimistic hook for instant feedback
- [MDN localStorage API](https://mozilla.org) - Browser storage API reference
- [MDN prefers-reduced-motion](https://mozilla.org) - Accessibility media query

### Secondary (MEDIUM confidence)
- [React settings page architecture patterns 2026](https://medium.com) - Component organization best practices
- [React settings form immediate feedback patterns](https://react-hook-form.com) - Form validation patterns
- [Zustand persist localStorage best practices](https://dev.to) - Hydration and error handling
- [TanStack Router settings navigation patterns](https://openreplay.com) - Nested route patterns
- [CSS variables theme switching FOUC prevention](https://dev.to) - Inline script technique
- [localStorage quota exceeded error handling](https://logrocket.com) - Error handling strategies
- [React settings accessibility ARIA patterns](https://adobe.com) - WCAG compliance for forms
- [prefers-reduced-motion CSS animations](https://web.dev) - Accessibility for motion

### Tertiary (LOW confidence)
- None - all findings verified with official documentation or multiple sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in package.json, versions verified
- Architecture: HIGH - Patterns verified against official Zustand and TanStack Router docs
- Pitfalls: HIGH - Common issues documented in official docs and community resources

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable ecosystem, no breaking changes expected)
