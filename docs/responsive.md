# Responsive Design System

This document explains the fluid responsive approach used throughout the project.

## Overview

The responsive system uses CSS `clamp()` for fluid scaling, eliminating abrupt breakpoint changes. Typography, spacing, and components scale smoothly across all viewport widths.

## Breakpoints

| Name    | Range             | Use Case                    |
|---------|-------------------|-----------------------------|
| Mobile  | up to 640px       | Phones, small devices       |
| Tablet  | 641px — 1024px    | Tablets, small laptops      |
| Laptop  | 1025px — 1440px   | Standard laptops            |
| Desktop | 1441px and above  | Large monitors, desktops    |

## Fluid Typography

Typography scales smoothly using CSS variables defined in `src/index.css`:

```css
--text-body: clamp(0.875rem, 0.8rem + 0.4vw, 1.125rem);  /* 14px → 18px */
--text-sm: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);    /* 12px → 14px */
--text-h1: clamp(1.75rem, 1rem + 4vw, 4.5rem);           /* 28px → 72px */
--text-h2: clamp(1.5rem, 1rem + 2.5vw, 3rem);            /* 24px → 48px */
--text-h3: clamp(1.25rem, 1rem + 1.25vw, 2rem);          /* 20px → 32px */
```

### Tailwind Fluid Classes

Use these classes for responsive text:

- `text-fluid-xs` — Extra small text (10px → 12px)
- `text-fluid-sm` — Small text (12px → 14px)
- `text-fluid-base` — Body text (14px → 18px)
- `text-fluid-lg` — Large text (16px → 20px)
- `text-fluid-xl` — Extra large (18px → 24px)
- `text-fluid-2xl` to `text-fluid-6xl` — Heading sizes

## Fluid Spacing

Spacing scales proportionally using CSS variables:

```css
--space-xs: clamp(4px, 0.5vw, 8px);
--space-sm: clamp(8px, 1vw, 12px);
--space-md: clamp(12px, 1.5vw, 20px);
--space-lg: clamp(16px, 2vw, 32px);
--space-xl: clamp(24px, 3vw, 48px);
--space-2xl: clamp(32px, 4vw, 64px);
--space-section: clamp(48px, 6vw, 96px);
```

### Tailwind Spacing Classes

- `p-fluid-sm`, `m-fluid-md`, `gap-fluid-lg`, etc.
- Or use inline styles: `style={{ padding: "var(--space-md)" }}`

## Responsive Grids

Use `auto-fit` with `minmax()` for fluid grids:

```css
grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
```

This ensures:
- Cards wrap gracefully on narrow screens
- `min(280px, 100%)` prevents cards from overflowing on mobile
- No explicit breakpoints needed

## Component Patterns

### Buttons

Buttons use fluid padding and maintain 44px minimum touch targets:

```css
.btn-primary {
  padding: var(--btn-padding-y) var(--btn-padding-x);
  min-height: 44px;
}
```

### Containers

Max-width container with fluid padding:

```css
.responsive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-md);
  padding-right: var(--space-md);
}
```

### Text Wrapping

Prevent text overflow with these utilities:

- `.text-wrap-balance` — Balances line lengths
- `.text-break` — Breaks long words/URLs

## Accessibility

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Touch Targets

All interactive elements maintain 44px minimum touch area on mobile.

## Testing Checklist

Test at these widths:
- [ ] 360px (small mobile)
- [ ] 412px (standard mobile)
- [ ] 768px (tablet portrait)
- [ ] 1024px (tablet landscape / small laptop)
- [ ] 1280px (laptop)
- [ ] 1440px (desktop)
- [ ] 1920px (large desktop)

Verify:
- [ ] No text overlap
- [ ] No horizontal scrolling
- [ ] No content clipped
- [ ] Hero text readable at all widths
- [ ] CTAs visible and tappable
- [ ] Navigation accessible on mobile
- [ ] Images scale properly

## Changing Global Scale

To adjust the global responsive scale:

1. Edit `--space-*` variables in `src/index.css` to change spacing
2. Edit `--text-*` variables to change typography scale
3. Update `clamp()` values in individual components for fine-tuning

Example: To make everything slightly larger on mobile, increase the minimum values in the `clamp()` functions.