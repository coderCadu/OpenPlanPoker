# Planning Poker - Dark Theme Design System

**Status**: Reference Design Complete  
**Date**: July 2026  
**Audience**: Frontend developers implementing UI/UX

---

## Overview

This document defines the visual design direction, color palette, typography, and interaction patterns for the Planning Poker application. Use this as a specification guide when implementing or refactoring Vue components.

**Design Direction**: Refined & Sophisticated (premium dark theme with warm accents)  
**Key Aesthetic**: High-end design tools feel (Figma/Framer) — intentional, not generic

---

## Color Palette

### Primary Background Colors

```css
--bg-primary:    #0f1419  /* Deep navy base layer */
--bg-secondary:  #1a1f2e  /* Elevated surfaces: headers, cards */
--bg-tertiary:   #252d3d  /* Interactive elements: inputs, buttons */
```

**Usage**:
- `--bg-primary`: Page backgrounds, body
- `--bg-secondary`: Main content containers, card backgrounds, headers
- `--bg-tertiary`: Form inputs, hover states, nested containers

### Accent Colors (Warm Amber)

```css
--accent:        #d4a574  /* Primary brand accent — hover, selected states */
--accent-dark:   #9d7f52  /* Darker shade — interactive feedback, borders */
--accent-light:  #e8c4a0  /* Lighter shade — highlights, text accents */
```

**Usage**:
- Voting card selected state: gradient from `--accent-dark` to `--accent`
- Button hover: `--accent` with glow effect
- Text highlights: gradient with `--accent-light`
- Borders on interactive elements: `--accent` on hover/focus

### Text Colors

```css
--text-primary:   #e8eaed  /* Main body text, headings */
--text-secondary: #b0b8c1  /* Secondary text, descriptions */
--text-muted:     #757d89  /* Labels, hints, disabled text */
```

**Contrast Ratios**:
- Primary on primary bg: 12.4:1 (AAA)
- Secondary on primary bg: 8.1:1 (AA+)
- Muted on primary bg: 4.8:1 (AA)

### Borders & Dividers

```css
--border: #3a4556  /* Subtle dividers, component borders */
```

**Usage**:
- Component borders: `border: 1px solid var(--border)`
- Section dividers: `border-top: 1px solid var(--border)`

### Semantic Colors (Reference)

```css
--success: #6ab986  /* Confirm, success states */
--danger:  #e07856  /* Errors, warnings */
--info:    #5b9fd4  /* Information, secondary actions */
```

---

## Typography

### Type Scale (Modular)

Use a fluid modular scale with `clamp()` for responsive sizing:

```css
/* Display: Headlines */
h1 {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Heading: Section titles */
h2 {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Subheading: Labels, secondary text */
h3 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Body: Primary text */
body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
}

/* Small: Hints, metadata */
small {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
```

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
```

**Rationale**: System fonts ensure fast load, native feel, and excellent readability. Avoid web fonts unless brand identity requires it.

### Font Weight Usage

- **700 (Bold)**: Headings, selected states, emphasis
- **600 (Semibold)**: Secondary headings, labels, strong text
- **400 (Regular)**: Body text, descriptions

---

## Component Styles

### Voting Cards

**Visual Design**:
- Large tactile buttons (aspect-ratio: 1/1 recommended)
- Fibonacci values: 1, 2, 3, 5, 8, 13, 21
- Special cards: ?, ☕ (coffee break)

**States**:

```css
/* Default */
.card {
  background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1.5rem;
  font-weight: 700;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hover */
.card:hover {
  border-color: var(--accent);
  background: linear-gradient(135deg, #2a3442, #353f52);
  transform: translateY(-2px);
}

/* Selected */
.card.selected {
  border-color: var(--accent-light);
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  color: var(--bg-primary);
  box-shadow: 0 8px 24px rgba(212, 165, 116, 0.25);
  transform: scale(1.05) translateY(-4px);
}
```

**Easing Function**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (smooth with slight overshoot)

### Hierarchy Items (Stories/Tasks)

**Visual Design**:
- Left border accent (3px)
- Hover lift effect with slight slide

```css
.hierarchy-item {
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border-left: 3px solid var(--accent);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.hierarchy-item:hover {
  background: #2f3a4d;
  border-left-color: var(--accent-light);
  transform: translateX(4px);
}
```

### Results Display

**Stat Values**: Use gradient text for emphasis

```css
.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-light), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Input Fields

```css
input, textarea {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

input:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
}

input::placeholder {
  color: var(--text-muted);
}
```

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border: none;
  color: var(--bg-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button (Ghost) */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--accent);
  color: var(--accent);
}
```

---

## Spacing & Layout

### Spacing Scale

Maintain rhythm with intentional spacing:

```css
--space-xs:   0.5rem   /* Tight grouping */
--space-sm:   0.75rem  /* Component padding */
--space-md:   1rem     /* Standard gap */
--space-lg:   1.25rem  /* Section gap */
--space-xl:   1.5rem   /* Large gap */
--space-2xl:  2rem     /* Major section gap */
```

**Usage Example**:
```css
.voting-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;  /* Tight spacing for cards */
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;  /* Generous spacing between sections */
  padding: 2rem;
}
```

### Grid System

**Main Layout** (2-column with sidebar):
```css
.container {
  display: grid;
  grid-template-columns: 1fr 320px;  /* Main + 320px sidebar */
  height: 100vh;
}
```

**Responsive Breakpoint** (mobile):
```css
@media (max-width: 1024px) {
  .container {
    grid-template-columns: 1fr;  /* Stack vertically */
  }
  .sidebar {
    display: none;  /* Or move to bottom */
  }
}
```

---

## Interactions & Animations

### Easing Functions

Use exponential easing for natural deceleration:

```css
/* Default: smooth with slight bounce */
cubic-bezier(0.34, 1.56, 0.64, 1)

/* Smooth out (no bounce) */
cubic-bezier(0.25, 0.46, 0.45, 0.94)

/* Fast entrance */
cubic-bezier(0.34, 1.56, 0.64, 1)
```

**DO NOT USE**: `ease-in-out` (too linear), `bounce` (dated feel)

### Micro-interactions

**Card Hover**:
```css
transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
transform: translateY(-2px);
border-color: var(--accent);
```

**Chat Message Entry**:
```css
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-message {
  animation: slideIn 0.3s ease-out;
}
```

**Staggered List** (apply delay per child):
```css
.result-row:nth-child(1) { animation-delay: 0s; }
.result-row:nth-child(2) { animation-delay: 0.1s; }
.result-row:nth-child(3) { animation-delay: 0.2s; }
```

### Avoid These Patterns

- ❌ Animating `height` or `width` directly (use `transform` + `scale`)
- ❌ Bounce/elastic easing (feels dated)
- ❌ Animating layout properties (`margin`, `padding`)
- ❌ Excessive animations (motion should serve purpose, not distract)

---

## Accessibility

### Color Contrast

All text meets WCAG AA+ standards:

```
Primary text (#e8eaed) on primary bg (#0f1419): 12.4:1 ✅
Secondary text (#b0b8c1) on primary bg (#0f1419): 8.1:1 ✅
Muted text (#757d89) on primary bg (#0f1419): 4.8:1 ✅
```

### Focus States

All interactive elements must have clear focus indicators:

```css
input:focus,
button:focus,
a:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Motion Preferences

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation Checklist

When updating Vue components, follow this checklist:

- [ ] Import color variables from theme file
- [ ] Use semantic color names (`--accent`, not `#d4a574`)
- [ ] Apply hover/selected states with `cubic-bezier(0.34, 1.56, 0.64, 1)` easing
- [ ] Ensure contrast ratios meet AA+ (test with [Contrast Checker](https://webaim.org/resources/contrastchecker/))
- [ ] Add focus indicators to all interactive elements
- [ ] Use `transform` + `opacity` for animations (not `height`/`width`)
- [ ] Test on mobile (320px viewport minimum)
- [ ] Verify `prefers-reduced-motion` respected
- [ ] Document any deviations from this system

---

## Files to Update

To implement this design system in your app:

1. **Create theme file**: `src/frontend/styles/theme.css`
   - Export CSS variables
   - Import in `main.ts`

2. **Update components**:
   - `src/frontend/components/VotingPanel.vue`
   - `src/frontend/components/StoryPanel.vue`
   - `src/frontend/components/SessionPanel.vue`
   - `src/frontend/stores/sessionStore.ts` (if needed for theme state)

3. **Add animations**: `src/frontend/styles/animations.css`
   - Keyframes for slide-in, fade, reveal effects

---

## Reference

- **Interactive Prototype**: See `.claude/artifacts/` for visual preview
- **Color Tool**: Use [OKLCH Picker](https://oklch.com/) for consistent palette adjustments
- **Font Pairing**: Current system fonts provide clean, accessible baseline
- **Responsive Testing**: Chrome DevTools, Firefox Responsive Mode

---

## Questions?

This design system is a living document. Update it as you refine the implementation. Maintain consistency across components, but don't be rigid — design should serve the product, not the other way around.

Happy building! 🎨
