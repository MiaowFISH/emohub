# Phase 9: Visual Polish - Research

**Researched:** 2026-02-12
**Domain:** CSS animations, transitions, accessibility (prefers-reduced-motion)
**Confidence:** HIGH

## Summary

Phase 9 adds smooth transitions to interactive elements while respecting user motion preferences. The project already has a solid foundation: CSS variables for theming, button hierarchy classes, skeleton loading with reduced-motion support, and inline theme switching. The focus is on enhancing existing hover states, adding modal fade-in animations, and ensuring theme transitions are smooth.

Modern CSS provides GPU-accelerated `transform` and `opacity` animations that achieve 60fps performance. The `prefers-reduced-motion` media query is widely supported (all major browsers since 2020) and is critical for accessibility compliance with WCAG 2.2 Level AA standards.

**Current state analysis:**
- Button hover transitions already exist (0.15s-0.2s durations)
- Image card hover uses inline `transform: scale(1.02)`
- Skeleton shimmer respects `prefers-reduced-motion` (Phase 8)
- Theme switching is instant (no transition)
- yet-another-react-lightbox provides built-in fade animations
- No modal components exist yet (lightbox is the only "modal-like" element)

**Primary recommendation:** Consolidate transitions into CSS classes, add smooth theme switching with CSS transitions on CSS variables, ensure all hover states respect `prefers-reduced-motion`, and leverage lightbox's built-in animation controls.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Transitions | Native | Smooth property changes | GPU-accelerated, hardware-optimized, zero dependencies |
| CSS Animations | Native | Keyframe-based effects | Compositor thread execution, better than JS for UI |
| `prefers-reduced-motion` | Native | Accessibility compliance | WCAG 2.2 Level AA requirement, universal browser support |
| CSS Variables | Native | Theme transition targets | Already implemented, enables smooth theme switching |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| yet-another-react-lightbox | ^3.28.0 | Lightbox animations | Already installed, provides fade/swipe animations |
| N/A | - | No additional libraries needed | Pure CSS solution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transitions | Framer Motion | 50KB+ bundle, overkill for simple transitions |
| CSS transitions | React Spring | Physics-based animations unnecessary for UI polish |
| CSS animations | GSAP | 30KB+, framework-agnostic but adds complexity |
| Pure CSS | JavaScript animations | Worse performance, blocks main thread |

**Installation:**
```bash
# No new dependencies required
# All features use native CSS and existing libraries
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/src/
├── styles/
│   ├── theme-variables.css      # ✅ Already complete
│   ├── buttons.css               # ✅ Already has transitions
│   ├── skeleton.css              # ✅ Already respects reduced-motion
│   ├── transitions.css           # NEW: Centralized transition utilities
│   └── animations.css            # NEW: Keyframe animations
└── components/
    ├── ImageGrid.tsx             # UPDATE: Move inline transitions to CSS
    ├── ImageLightbox.tsx         # UPDATE: Configure animation settings
    └── SettingsForm.tsx          # UPDATE: Add hover transitions
```

### Pattern 1: GPU-Accelerated Hover Effects
**What:** Use `transform` and `opacity` for smooth 60fps animations
**When to use:** All interactive elements (buttons, cards, icons)

**Example:**
```css
/* Source: Web.dev performance best practices */
.image-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform; /* Hint for GPU optimization */
}

.image-card:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px var(--color-shadow);
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .image-card {
    transition: none;
  }

  .image-card:hover {
    transform: none;
    /* Keep non-motion feedback like box-shadow */
    box-shadow: 0 4px 6px -1px var(--color-shadow);
  }
}
```

### Pattern 2: Smooth Theme Switching
**What:** Transition CSS variables for smooth color changes
**When to use:** Theme toggle in settings

**Example:**
```css
/* Source: CSS-Tricks dark mode transitions */
/* Apply transition to all theme-dependent properties */
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    fill 0.3s ease;
}

/* Disable during initial page load to prevent flash */
.no-transitions * {
  transition: none !important;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

**JavaScript integration:**
```typescript
// Source: Medium - smooth theme transitions
function setTheme(theme: Theme) {
  // Remove no-transitions class to enable animations
  document.documentElement.classList.remove('no-transitions')

  // Apply theme
  document.documentElement.setAttribute('data-theme', resolveTheme(theme))

  // Re-add no-transitions after theme change completes
  setTimeout(() => {
    document.documentElement.classList.add('no-transitions')
  }, 300)
}
```

### Pattern 3: Lightbox Animation Configuration
**What:** Configure yet-another-react-lightbox animation settings
**When to use:** ImageLightbox component

**Example:**
```typescript
// Source: yet-another-react-lightbox documentation
<Lightbox
  open
  close={onClose}
  index={index}
  slides={slides}
  animation={{
    fade: 300,      // Fade-in/out duration (ms)
    swipe: 250,     // Slide swipe duration (ms)
    navigation: 250 // Keyboard/button navigation duration (ms)
  }}
  controller={{
    closeOnBackdropClick: true
  }}
/>
```

### Pattern 4: Accessible Focus States
**What:** Ensure keyboard focus has same visual feedback as hover
**When to use:** All interactive elements

**Example:**
```css
/* Source: WCAG 2.2 focus visible guidelines */
.btn-primary:hover,
.btn-primary:focus-visible {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
}

.btn-icon:hover,
.btn-icon:focus-visible {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

/* Remove default outline, add custom focus ring */
.btn-primary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .btn-primary:hover,
  .btn-primary:focus-visible {
    transform: none;
  }
}
```

### Pattern 5: Transition Utility Classes
**What:** Reusable transition classes for consistent timing
**When to use:** Apply to components needing standard transitions

**Example:**
```css
/* Source: Tailwind CSS transition utilities */
.transition-fast {
  transition-duration: 150ms;
  transition-timing-function: ease;
}

.transition-base {
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.transition-slow {
  transition-duration: 300ms;
  transition-timing-function: ease;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill;
}

.transition-transform {
  transition-property: transform;
}

.transition-opacity {
  transition-property: opacity;
}

/* Disable all transitions for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .transition-fast,
  .transition-base,
  .transition-slow {
    transition-duration: 0ms !important;
  }
}
```

### Anti-Patterns to Avoid
- **Animating layout properties:** Never animate `width`, `height`, `margin`, `padding`, `top`, `left` - causes reflows
- **Long animation durations:** Keep under 300ms for UI feedback, longer feels sluggish
- **Ignoring reduced motion:** Always provide `@media (prefers-reduced-motion: reduce)` fallback
- **Transition on all properties:** Use `transition: all` sparingly, specify properties for performance
- **Missing focus states:** Hover effects without equivalent focus states fail WCAG 2.1 SC 2.4.7

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation library | Custom animation system | Native CSS transitions/animations | GPU-accelerated, better performance, zero dependencies |
| Easing functions | Custom cubic-bezier calculations | CSS named easings (ease, ease-in-out) | Browser-optimized, sufficient for 95% of cases |
| Reduced motion detection | JavaScript matchMedia polling | CSS `@media (prefers-reduced-motion)` | Declarative, automatic, no JS needed |
| Theme transition timing | Manual setTimeout coordination | CSS transition-duration | Browser handles timing, respects frame rate |
| Lightbox animations | Custom modal animations | yet-another-react-lightbox built-in | Already installed, tested, accessible |

**Key insight:** Modern CSS handles 95% of UI animation needs without JavaScript. Reserve JS animations for complex physics-based effects or coordinated multi-element sequences. For Phase 9's requirements (hover, modal fade, theme switch), pure CSS is optimal.

## Common Pitfalls

### Pitfall 1: Animating Non-Composited Properties
**What goes wrong:** Animations feel janky, drop below 60fps, cause layout thrashing
**Why it happens:** Properties like `width`, `height`, `margin` trigger layout recalculation on every frame
**How to avoid:**
- Only animate `transform` (scale, translate, rotate) and `opacity`
- Use `transform: scale()` instead of animating `width`/`height`
- Use `transform: translateY()` instead of animating `top`/`margin-top`
- Check Chrome DevTools Performance tab for "Forced Reflow" warnings

**Warning signs:**
- Animations stutter on lower-end devices
- DevTools shows purple "Layout" bars during animation
- CPU usage spikes during simple hover effects

**Current status:** ImageGrid uses inline `transform: scale(1.02)` ✅ but also animates `box-shadow` ⚠️ (acceptable, minor paint cost)

### Pitfall 2: Missing prefers-reduced-motion Support
**What goes wrong:** Users with vestibular disorders experience nausea, dizziness, or discomfort
**Why it happens:** Animations trigger without checking user's OS-level motion preference
**How to avoid:**
- Add `@media (prefers-reduced-motion: reduce)` to ALL animations
- Disable or simplify animations (e.g., instant state change or simple fade)
- Test with OS setting enabled (macOS: System Settings > Accessibility > Display > Reduce motion)
- WCAG 2.2 Level AA requires this for SC 2.3.3 (Animation from Interactions)

**Warning signs:**
- Accessibility audit failures
- User complaints about motion sickness
- No `@media (prefers-reduced-motion)` in CSS files

**Current status:** skeleton.css already implements this ✅, but other transitions need coverage

### Pitfall 3: Theme Transition Flash
**What goes wrong:** Colors flash or flicker during theme switch, elements animate on page load
**Why it happens:** Transitions apply during initial render before theme is set
**How to avoid:**
- Add `.no-transitions` class to `<html>` on page load
- Remove class after theme is applied (in inline script)
- Re-add class during theme changes, remove after transition completes
- Use `transition: none !important` in `.no-transitions` to override all transitions

**Warning signs:**
- Colors animate when page first loads
- Theme switch causes jarring color changes
- Elements "slide in" on initial render

**Solution:**
```html
<!-- index.html inline script -->
<script>
  // ... theme detection code ...
  document.documentElement.classList.add('no-transitions');
  setTimeout(() => {
    document.documentElement.classList.remove('no-transitions');
  }, 0);
</script>
```

### Pitfall 4: Hover Without Focus Equivalent
**What goes wrong:** Keyboard users can't see which element is focused
**Why it happens:** Styles applied only to `:hover`, not `:focus` or `:focus-visible`
**How to avoid:**
- Always pair `:hover` with `:focus-visible`
- Use same visual feedback for both states
- Test with keyboard navigation (Tab key)
- WCAG 2.1 SC 2.4.7 requires visible focus indicators

**Warning signs:**
- Accessibility audit failures for "Focus Visible"
- Keyboard users report difficulty navigating
- No visible outline or highlight when tabbing through UI

**Current status:** Buttons use `:hover` but need `:focus-visible` equivalents

### Pitfall 5: Transition Timing Inconsistency
**What goes wrong:** UI feels unpolished, some elements animate fast, others slow
**Why it happens:** No standardized transition durations across components
**How to avoid:**
- Define standard durations: fast (150ms), base (200ms), slow (300ms)
- Use consistent easing functions (ease, ease-in-out)
- Document timing decisions in style guide
- Apply same timing to related interactions (all button hovers use same duration)

**Warning signs:**
- Some buttons animate in 100ms, others in 500ms
- Inconsistent "feel" across the application
- Designers complain about lack of polish

**Recommendation:** Audit existing transitions, standardize to 150-200ms for hover, 250-300ms for theme/modal

### Pitfall 6: Lightbox Animation Conflicts
**What goes wrong:** Custom animations conflict with lightbox's built-in animations
**Why it happens:** Applying CSS transitions to lightbox elements that already animate
**How to avoid:**
- Use lightbox's `animation` prop to configure durations
- Don't apply custom transitions to `.yarl__*` classes
- Let library handle slide transitions, focus on toolbar/overlay customization
- Test with keyboard navigation (arrow keys) and swipe gestures

**Warning signs:**
- Slides animate twice (once from library, once from custom CSS)
- Jerky or stuttering slide transitions
- Animation timing feels off

**Current status:** ImageLightbox uses default animations, should configure explicitly

## Code Examples

Verified patterns from official sources:

### Consolidated Transition Classes
```css
/* transitions.css - Source: Tailwind CSS utilities + Web.dev performance */

/* Base transition utilities */
.transition-colors {
  transition-property: background-color, border-color, color, fill;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.transition-transform {
  transition-property: transform;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.transition-opacity {
  transition-property: opacity;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

.transition-shadow {
  transition-property: box-shadow;
  transition-duration: 200ms;
  transition-timing-function: ease;
}

/* Combined transitions for common patterns */
.transition-interactive {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Disable all transitions for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Disable transitions during page load */
.no-transitions *,
.no-transitions *::before,
.no-transitions *::after {
  transition: none !important;
}
```

### Image Card Hover (Refactored)
```css
/* Replace inline styles in ImageGrid.tsx with CSS class */
.image-card {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.image-card:hover,
.image-card:focus-within {
  transform: scale(1.02);
  box-shadow: 0 4px 6px -1px var(--color-shadow);
  border-color: var(--color-accent);
}

.image-card.selected {
  border: 3px solid var(--color-accent);
}

@media (prefers-reduced-motion: reduce) {
  .image-card {
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }

  .image-card:hover,
  .image-card:focus-within {
    transform: none;
  }
}
```

### Button Focus States
```css
/* Add to buttons.css - Source: WCAG 2.2 focus guidelines */

/* Primary button */
.btn-primary:hover,
.btn-primary:focus-visible {
  background: var(--color-accent-hover);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Secondary button */
.btn-secondary:hover,
.btn-secondary:focus-visible {
  background: var(--color-bg-tertiary);
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Icon button */
.btn-icon:hover,
.btn-icon:focus-visible {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.btn-icon:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Remove default focus outline */
button:focus {
  outline: none;
}

/* Ensure focus-visible works */
button:focus:not(:focus-visible) {
  outline: none;
}
```

### Theme Transition Setup
```typescript
// settingsStore.ts - Source: Medium smooth theme transitions
function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  const html = document.documentElement

  // Enable transitions for theme change
  html.classList.remove('no-transitions')

  // Apply theme
  html.setAttribute('data-theme', resolved)

  // Disable transitions after change completes (300ms)
  setTimeout(() => {
    html.classList.add('no-transitions')
  }, 300)
}
```

```css
/* theme-variables.css - Add transition support */
/* Transition theme-dependent properties */
:root,
[data-theme='dark'] {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

/* Apply to all elements using CSS variables */
* {
  transition-property: background-color, color, border-color, fill;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}

/* Disable during page load */
.no-transitions * {
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  :root,
  [data-theme='dark'],
  * {
    transition: none !important;
  }
}
```

### Lightbox Animation Configuration
```typescript
// ImageLightbox.tsx - Source: yet-another-react-lightbox docs
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

export const ImageLightbox = ({ images, index, onClose }: ImageLightboxProps) => {
  // ... existing code ...

  return (
    <Lightbox
      open
      close={onClose}
      index={index}
      slides={slides}
      animation={{
        fade: 250,       // Fade-in/out duration
        swipe: 250,      // Slide swipe duration
        navigation: 250, // Keyboard navigation duration
        easing: {
          fade: 'ease',
          swipe: 'ease',
          navigation: 'ease'
        }
      }}
      carousel={{ finite: false }}
      controller={{ closeOnBackdropClick: true }}
      on={{ view: handleView }}
    />
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JavaScript animations | CSS transitions/animations | 2015-2018 | GPU acceleration, better performance, declarative |
| `transition: all` | Specific properties | 2019-2021 | Reduced paint/layout costs, better performance |
| Ignoring motion preferences | `prefers-reduced-motion` | 2020-2022 | WCAG 2.2 compliance, accessibility requirement |
| `:focus` only | `:focus-visible` | 2021-2023 | Better UX, no outline on mouse click, visible for keyboard |
| Instant theme switching | Smooth transitions | 2022-2024 | Better perceived quality, less jarring |
| Fixed animation timing | Respects system settings | 2023-2025 | Accessibility, user preference respect |

**Deprecated/outdated:**
- **jQuery animations:** Replaced by CSS transitions, better performance
- **`transition: all`:** Too broad, specify properties for performance
- **`:focus` without `:focus-visible`:** Shows outline on mouse click, poor UX
- **Ignoring `prefers-reduced-motion`:** WCAG 2.2 Level AA violation

## Open Questions

1. **Should theme transition be instant or animated?**
   - What we know: Current implementation is instant, Phase 9 can add smooth transition
   - What's unclear: User preference - some prefer instant feedback, others like smooth transition
   - Recommendation: Add 300ms transition, respect `prefers-reduced-motion` (instant for reduced motion users)

2. **Should image card scale be 1.02 or 1.05?**
   - What we know: Current implementation uses 1.02 (subtle), common practice is 1.05 (more noticeable)
   - What's unclear: User preference for subtlety vs visibility
   - Recommendation: Keep 1.02 for subtlety, matches existing implementation

3. **Should we add loading animations to buttons?**
   - What we know: Async operations (copy, delete) could show loading state
   - What's unclear: Whether button loading states are in scope for Phase 9
   - Recommendation: Out of scope - focus on hover/modal/theme transitions per requirements

4. **Should sidebar slide animation respect reduced motion?**
   - What we know: responsive.css has sidebar slide transition (0.3s)
   - What's unclear: Whether sidebar is considered "interactive animation" under WCAG
   - Recommendation: Add `prefers-reduced-motion` support to sidebar transition for consistency

## Sources

### Primary (HIGH confidence)
- [MDN CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions) - Transition properties, timing functions
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) - Media query syntax, browser support
- [Web.dev Animations Performance](https://web.dev/animations/) - GPU acceleration, composited properties
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/) - SC 2.3.3 Animation from Interactions, SC 2.4.7 Focus Visible
- [yet-another-react-lightbox Documentation](https://yet-another-react-lightbox.com) - Animation configuration API
- Existing codebase analysis:
  - `/apps/web/src/styles/buttons.css` - Current transition implementation
  - `/apps/web/src/styles/skeleton.css` - Reduced motion pattern
  - `/apps/web/src/components/ImageGrid.tsx` - Inline hover transitions
  - `/apps/web/index.html` - Theme initialization script

### Secondary (MEDIUM confidence)
- [WebSearch: React smooth animations best practices performance 2026](https://prateeksha.com) - Motion library comparison, best practices
- [WebSearch: CSS transitions prefers-reduced-motion accessibility 2026](https://mozilla.org) - WCAG compliance, implementation patterns
- [WebSearch: CSS modal fade-in animation best practices 2026](https://dev.to) - Modal animation patterns, accessibility
- [WebSearch: CSS theme switching smooth transition dark mode 2026](https://dev.to) - Theme transition techniques, OKLCH color space
- [WebSearch: CSS hover effects image cards performance 2026](https://mozilla.org) - GPU-accelerated properties, performance optimization
- [WebSearch: CSS transform scale hover performance 2026](https://web.dev) - Transform performance, will-change usage
- [WebSearch: CSS button hover transitions accessibility 2026](https://browserstack.com) - Focus states, WCAG compliance

### Tertiary (LOW confidence)
- None - all findings verified with official sources or multiple credible sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native CSS features, well-established patterns, existing library support
- Architecture: HIGH - Patterns verified against MDN, Web.dev, WCAG guidelines, existing codebase
- Pitfalls: HIGH - Based on performance profiling best practices, WCAG requirements, common issues

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days - stable technology, CSS standards)

**Current implementation status:**
- ✅ Button transitions exist (0.15s-0.2s)
- ✅ Skeleton respects `prefers-reduced-motion`
- ✅ CSS variables enable theme transitions
- ✅ Lightbox library provides animations
- ⚠️ Image card hover uses inline styles (should move to CSS)
- ⚠️ No `prefers-reduced-motion` for most transitions
- ⚠️ No `:focus-visible` states for keyboard users
- ⚠️ Theme switching is instant (no transition)
- ⚠️ Sidebar transition doesn't respect reduced motion

**Phase 9 scope:**
1. Add `prefers-reduced-motion` support to all transitions
2. Add `:focus-visible` states matching `:hover` states
3. Consolidate transitions into CSS classes (remove inline styles)
4. Add smooth theme switching with transition
5. Configure lightbox animation settings explicitly
6. Ensure all animations work in both light and dark themes
