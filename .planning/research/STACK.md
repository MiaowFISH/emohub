# Technology Stack

**Project:** EmoHub UX Polish Milestone
**Researched:** 2026-02-12

## Recommended Stack Additions

### Internationalization (i18n)
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-i18next | ^16.5.4 | Multi-language support | Most flexible for React apps, excellent TypeScript support, 22KB bundle, rich plugin ecosystem for dynamic translations |
| i18next | ^25.4.0 | i18n framework core | Required peer dependency, v25.4+ has enhanced TypeScript with `enableSelector` |

**Rationale:** For a Vite + React app (not Next.js), `react-i18next` is the optimal choice over `next-intl` (Next.js-specific) or FormatJS. It provides hooks-first API (`useTranslation`), namespace organization, lazy loading, and works seamlessly with TanStack Router. The 22KB bundle is acceptable for the feature value.

### Dark Mode
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| None (CSS-only) | N/A | Theme switching | Native CSS variables + `prefers-color-scheme` media query is sufficient, zero dependencies, optimal performance |

**Rationale:** No library needed. Use CSS custom properties in `:root` and `[data-theme='dark']` selector. Zustand already in stack can manage theme state. This approach avoids 10-20KB library overhead, prevents FOUC with inline script, and leverages browser-native features for best performance.

### Clipboard API
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| None (Native API) | N/A | Copy images to clipboard | Modern `navigator.clipboard.write()` with `ClipboardItem` is natively supported in all target browsers (2026), zero dependencies |

**Rationale:** The Async Clipboard API is mature and well-supported. No polyfill needed for image blob copying. Requires HTTPS (already standard) and user gesture (already part of UX flow).

### Batch Download
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| client-zip | ^14.0.0 | ZIP file generation | Lightweight (6.4KB), 40% faster than JSZip for uncompressed ZIPs, dependency-free, optimized for browser batch downloads |

**Rationale:** For EmoHub's use case (batch download of images without compression), `client-zip` outperforms JSZip. It streams directly to ZIP format, has no memory limits (supports Zip64), and is significantly smaller than JSZip's 22KB bundle. JSZip's compression features are unnecessary for already-compressed images (PNG/JPG/GIF).

### Settings Persistence
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zustand/middleware | ^5.0.11 | State persistence | Already in stack, `persist` middleware provides localStorage integration with TypeScript support, versioning, and partial state selection |

**Rationale:** Zustand is already the state management solution. Its built-in `persist` middleware handles localStorage synchronization, hydration, and state migrations. No additional library needed.

### Visual Polish / Animations
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| None (CSS-only) | N/A | Micro-interactions | CSS transitions/animations sufficient for hover states, theme transitions, modal animations. Avoid library overhead for simple polish |

**Optional (if complex animations needed):**
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| framer-motion | ^12.0.0 | Advanced animations | Industry standard, declarative API, layout animations, gesture support. Only add if requirements expand beyond CSS capabilities |

**Rationale:** Current codebase uses inline CSS transitions (see ImageGrid hover effects). Continue this pattern for consistency. Only introduce Framer Motion if requirements include complex orchestrated animations, spring physics, or gesture-based interactions. For theme transitions, modal enter/exit, and button hovers, CSS is sufficient and performs better.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| i18n | react-i18next | next-intl | Next.js-specific, not compatible with Vite + TanStack Router |
| i18n | react-i18next | FormatJS (react-intl) | More verbose API, 17KB bundle, message-first approach less flexible |
| i18n | react-i18next | LinguiJS | Smaller community, less mature TypeScript support |
| Batch Download | client-zip | JSZip | 3.4x larger bundle (22KB), slower for uncompressed ZIPs, unnecessary compression features |
| Dark Mode | CSS Variables | styled-components/emotion | Runtime CSS-in-JS overhead, larger bundle, unnecessary for theme switching |
| Dark Mode | CSS Variables | Tailwind dark mode | Would require full Tailwind migration, current codebase uses vanilla CSS |
| Animations | CSS-only | Framer Motion | 50KB+ bundle overhead for features not yet needed |
| Animations | CSS-only | React Spring | Physics-based animations overkill for current requirements |

## Installation

```bash
# i18n
bun add react-i18next i18next

# Batch download
bun add client-zip

# Dark mode, clipboard, settings persistence - no new dependencies needed
# (Use native APIs + existing Zustand)
```

## Integration Points

### Dark Mode + Zustand
```typescript
// Create theme store with persist middleware
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme })
    }),
    {
      name: 'emohub-theme',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
```

### i18n + TanStack Router
```typescript
// Initialize i18next in main.tsx before router
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { /* ... */ } },
      zh: { translation: { /* ... */ } }
    },
    lng: localStorage.getItem('emohub-language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })
```

### Clipboard API (Native)
```typescript
// Copy image blob to clipboard
async function copyImageToClipboard(imageUrl: string) {
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob })
  ])
}
```

### Batch Download with client-zip
```typescript
import { downloadZip } from 'client-zip'

async function downloadSelectedImages(imageUrls: string[]) {
  const files = await Promise.all(
    imageUrls.map(async (url) => {
      const response = await fetch(url)
      const blob = await response.blob()
      const filename = url.split('/').pop() || 'image'
      return { name: filename, input: blob }
    })
  )

  const blob = await downloadZip(files).blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `emohub-export-${Date.now()}.zip`
  link.click()
}
```

## What NOT to Add

### Avoid These Libraries
- **Tailwind CSS**: Current codebase uses vanilla CSS with CSS variables. Migration would be disruptive and unnecessary.
- **styled-components/emotion**: Runtime CSS-in-JS adds bundle size and performance overhead. Current inline styles + CSS files work well.
- **JSZip**: Overkill for uncompressed batch downloads. client-zip is faster and smaller.
- **clipboard.js/copy-to-clipboard**: Deprecated patterns. Native Clipboard API is sufficient.
- **react-toastify/sonner**: Not in requirements. If toast notifications needed later, add then.
- **Framer Motion** (initially): Defer until complex animations are actually needed. CSS transitions handle current requirements.

### Keep Existing Patterns
- **Inline styles for component-specific styling**: Already used in ImageGrid, TagFilter, etc. Maintain consistency.
- **CSS files for layout/responsive**: `responsive.css` handles breakpoints well.
- **Zustand for state**: Don't introduce Redux, Jotai, or other state libraries.
- **TanStack Router**: Don't switch to React Router or other routing solutions.

## Bundle Size Impact

| Feature | Library | Size | Impact |
|---------|---------|------|--------|
| i18n | react-i18next + i18next | ~22KB | Acceptable for multi-language support |
| Batch Download | client-zip | 6.4KB | Minimal |
| Dark Mode | CSS-only | 0KB | Zero impact |
| Clipboard | Native API | 0KB | Zero impact |
| Settings | Zustand persist (existing) | 0KB | Already in bundle |
| **Total New** | | **~28KB** | **Minimal impact** |

## Performance Considerations

### Dark Mode
- Use inline `<script>` in `index.html` to set theme before React hydration (prevents FOUC)
- CSS variable updates trigger paint only, not layout (optimal performance)
- `prefers-color-scheme` media query for system preference detection

### i18n
- Lazy load translation files per language (don't bundle all languages)
- Use namespaces to split translations by feature
- Cache translations in localStorage to avoid re-fetching

### Batch Download
- Stream files to ZIP (client-zip handles this automatically)
- Show progress indicator for large batches
- Limit concurrent fetch requests (e.g., 5 at a time) to avoid overwhelming browser

### Clipboard
- Requires user gesture (button click) - already part of UX
- HTTPS required (standard for production)
- Fallback message for unsupported browsers (rare in 2026)

## TypeScript Support

All recommended libraries have excellent TypeScript support:
- **react-i18next**: Full type inference for translation keys with v25.4+ `enableSelector`
- **client-zip**: TypeScript definitions included
- **Zustand persist**: Native TypeScript support with proper generics
- **Native APIs**: TypeScript DOM types already available

## Browser Compatibility (2026)

All recommended technologies are well-supported:
- **CSS Variables**: Universal support
- **prefers-color-scheme**: Universal support
- **Clipboard API**: Chrome 76+, Firefox 87+, Safari 13.1+, Edge 79+
- **localStorage**: Universal support
- **client-zip**: Uses standard Blob/File APIs, universal support

## Sources

### i18n Research
- [react-i18next vs next-intl vs FormatJS comparison](https://intlpull.com)
- [react-i18next TypeScript support](https://npmjs.com)
- [i18next v25.4 TypeScript enhancements](https://i18next.com)

### Dark Mode Research
- [CSS variables dark mode best practices](https://namastedev.com)
- [Dark mode performance optimization](https://medium.com)
- [WCAG contrast guidelines for dark mode](https://css-tricks.com)

### Clipboard API Research
- [Clipboard API image blob copying](https://sentry.io)
- [navigator.clipboard.write() documentation](https://mozilla.org)
- [ClipboardItem browser support](https://web.dev)

### Batch Download Research
- [JSZip vs client-zip performance](https://github.com)
- [client-zip documentation](https://npmjs.com)
- [Browser ZIP generation best practices](https://transloadit.com)

### State Persistence Research
- [Zustand persist middleware](https://pmnd.rs)
- [localStorage best practices React 2026](https://medium.com)
- [React settings page patterns](https://dev.to)

### Animation Research
- [React animation libraries 2026](https://logrocket.com)
- [Framer Motion vs CSS transitions](https://dev.to)
- [Performance-first animation approach](https://syncfusion.com)
