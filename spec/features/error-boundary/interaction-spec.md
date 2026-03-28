# Interaction Spec: Error Boundary Recovery Screen

> Feature: error-boundary
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-28

---

## Overview

The app currently has no error boundary. When an unhandled JavaScript error is thrown inside
the React tree, the user sees a blank white screen or a browser error message. Neither is
recoverable without a manual page reload, and neither communicates anything useful to a child.

This spec defines a recovery screen rendered by a React `ErrorBoundary` class component. The
screen replaces the crashed subtree with a designed, accessible, child-friendly surface that:

- Reassures the user (something happened, nothing is permanently broken)
- Gives them exactly one action (Reload App)
- Matches the DS surface and typography standards

This is not a page route. It is a fallback UI rendered by a React error boundary wrapping
the root `<App />` component.

---

## 1. When This Screen Appears

The recovery screen is shown when:
- A React rendering error propagates to the root `ErrorBoundary` (`componentDidCatch`)
- An unhandled `Promise` rejection causes the React tree to unmount (if caught by the boundary)

It is NOT shown for:
- Expected network errors (handled at component level with toast notifications)
- Empty data states (handled with empty state components per DS)
- Form validation errors (handled inline)

The boundary catches errors thrown during rendering, in lifecycle methods, and in constructors
of child components. It does not catch errors in event handlers (those are handled separately
at each call site via try/catch + toast).

---

## 2. Screen Anatomy

The recovery screen is centred on the `--bg` surface. It consists of a single card containing
an icon, heading, body copy, and one button.

### 2.1 Page container

```
Background:     var(--bg)  (#0D0D11)
Display:        flex
Align:          center (vertical)
Justify:        center (horizontal)
Min-height:     100dvh
Padding:        24px  (px-6)
```

No PageHeader. No BottomNav. The boundary has replaced the entire React tree — navigation
components may themselves be the source of the error. The recovery screen is self-contained.

### 2.2 Card

```
Background:     var(--card)  (#18181D)
Border:         1px solid var(--border-s)  (#2C2F3A)
Border-radius:  var(--r-xl)  (20px)
Padding:        40px 32px   (py-10 px-8)
Max-width:      384px        (max-w-sm)
Width:          100%
Margin:         0 auto       (mx-auto)
Text-align:     center
Display:        flex
Flex-direction: column
Align-items:    center
Gap:            16px
```

The card steps up one level from `--bg`, matching the DS surface stack rule.

### 2.3 Icon

```
Element:        Lucide AlertTriangle
Size:           48px  (w-12 h-12)
Colour:         var(--amber)  (#F5A623)
Stroke-width:   2
Margin-bottom:  4px  (additional gap beyond the card's 16px gap)
```

Rationale: `AlertTriangle` is the DS warning icon. Amber communicates "something unexpected
happened" without the alarm of red (`--red`). Red is reserved for destructive or data-loss
errors. A crashed app needs attention but is not a data failure.

### 2.4 Heading

```
Text:           "Something went wrong"
Style:          H3 — 28px, weight 600, line-height 1.3, letter-spacing -0.3px
Colour:         var(--t1)  (#FCFCFD)
Element:        h1 (semantically the page title, despite H3 visual size)
```

Plain English. No technical language. Active-voice equivalent — the heading names the
situation without assigning blame to the user or the system.

### 2.5 Body copy

```
Text:           "An unexpected error occurred. Tap below to reload the app."
Style:          Body — 15px, weight 400, line-height 1.6
Colour:         var(--t2)  (#B1B5C4)
Max-width:      280px
Margin:         0 auto
Element:        p
```

Two sentences. First acknowledges the problem. Second gives the action. On iPad the copy reads
easily at this width. On phone (375px) the max-width is narrower than the card and the copy
wraps naturally.

### 2.6 Button

```
Text:           "Reload App"
Variant:        primary
Size:           md  (44px height, 0 20px padding)
Icon:           Lucide RefreshCw, 16px, leading position (left of label)
Width:          auto  (not full-width — centred on the card)
Action:         window.location.reload()
Margin-top:     8px  (additional gap above button; total visual gap from body ~24px)
```

`RefreshCw` is the universal "reload" metaphor. It pairs with the label so colour is not the
only indicator of the action type.

Primary variant is correct here: this is the single most important action on the screen. There
is no competing CTA.

The button calls `window.location.reload()` directly. This is the correct recovery path — a
full page reload clears React state and re-initialises from a clean browser context. It does
not attempt to call `this.setState` or reset the error boundary, because the error source may
be in the boundary's own child subtree.

---

## 3. Full Layout Diagram

```
┌──────────────────────────────────────┐   bg: var(--bg), full viewport
│                                      │
│   ┌──────────────────────────────┐   │   card: var(--card), border-s, r-xl, p-10/8
│   │                              │   │   max-w-sm, mx-auto, text-center
│   │      [AlertTriangle 48px]    │   │   amber, w-12 h-12
│   │                              │   │
│   │   Something went wrong       │   │   H3 (h1 element), --t1
│   │                              │   │
│   │  An unexpected error         │   │   Body 15px, --t2
│   │  occurred. Tap below to      │   │   max-w-280px
│   │  reload the app.             │   │
│   │                              │   │
│   │   [ RefreshCw  Reload App ]  │   │   btn-md btn-primary, auto width
│   │                              │   │
│   └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

---

## 4. Interaction States

### 4.1 "Reload App" button

| State    | Treatment |
|----------|-----------|
| Default  | `background: var(--blue)`, `color: #fff`, `border-radius: 100px` |
| Hover    | `background: var(--blue-h)`, `box-shadow: var(--glow-blue)` |
| Active   | `transform: scale(.97)` |
| Focus    | `outline: 2px solid var(--blue); outline-offset: 2px` |
| Disabled | Not applicable — the button is always enabled on this screen |

### 4.2 Card

The card is not interactive. No hover state. No pointer-events on the card itself.

### 4.3 Icon

Not interactive. `aria-hidden="true"` — the heading is the accessible label for this screen.

---

## 5. Accessibility

- The `h1` element ensures screen readers announce the page correctly even without a
  document `<title>` update (which may not fire if the router is part of the crashed tree).
- The button has a visible label ("Reload App") — no icon-only button.
- Focus is not manually managed on mount. The user can tab to the button from the top of the
  document; there is only one focusable element.
- Minimum touch target: button `md` size is 44px height. The horizontal auto-width still
  produces a touch width well above 44px for a two-word label.
- Colour contrast: `--t1` (#FCFCFD) on `--card` (#18181D) = high contrast (passes WCAG AA).
  `--t2` (#B1B5C4) on `--card` (#18181D) = 7.4:1 (passes WCAG AA).
  `--amber` (#F5A623) on `--card` (#18181D) = sufficient for a large icon (decorative).
- No animation on this screen. The user has just experienced an error — no celebration or
  entrance animation is appropriate. The screen renders statically.

---

## 6. Implementation Notes for Developer

### 6.1 ErrorBoundary class component

React error boundaries must be class components. The `ErrorBoundary` is the only class
component in the project; all others are functional. It should live at
`src/components/ErrorBoundary.tsx`.

```
State:    { hasError: boolean }
Static:   getDerivedStateFromError(error) — returns { hasError: true }
Method:   componentDidCatch(error, info) — log error to console (no external service)
Render:   When hasError → render ErrorRecoveryScreen. Otherwise render children.
```

### 6.2 Wrapping point

The `ErrorBoundary` wraps the root `<App />` in `main.tsx` or `index.tsx`, outside the
router. This ensures it catches errors thrown by any route, including the router itself.

```tsx
// main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 6.3 No portal required

The recovery screen replaces the entire tree — there is no parent motion component that
could trap stacking context. `createPortal` is not needed here.

### 6.4 No DS token drift

All values in this spec come directly from the DS. FE must not introduce any hardcoded
hex values. Every token reference above maps to a variable in `DESIGN_SYSTEM.md`.

---

## 7. Overlay Surface Treatment

This screen does not introduce a BottomSheet, Modal, or Toast. It is a full-page recovery
surface. The glass rule does not apply — the card uses the standard opaque card surface
(`var(--card)`) on `var(--bg)`. Glass treatment is only for fixed/floating overlays.

---

## 8. Card Anatomy Summary

| Element | Spec |
|---------|------|
| Card surface | `var(--card)`, `1px solid var(--border-s)`, `border-radius: 20px`, `padding: 40px 32px` |
| Icon | Lucide `AlertTriangle`, 48px, `var(--amber)`, stroke-width 2, `aria-hidden` |
| Heading | H3 style on `h1` element, `var(--t1)`, "Something went wrong" |
| Body | 15px/400, `var(--t2)`, max-width 280px |
| Button | Primary variant, md size, leading `RefreshCw` icon, `window.location.reload()` |
| Empty state | Not applicable — this IS the fallback state |
| Hover/focus | Button only — see section 4.1 |

---

## 9. Consistency Check

| Element | Existing pattern it must match |
|---------|-------------------------------|
| Card surface | All existing card components — `var(--card)`, `border-s`, `r-lg` or `r-xl` |
| Icon size 48px | Empty state pattern in DS (also 48px for empty state icons) |
| Primary button | All existing primary buttons — pill radius, `--blue`, `--blue-h` hover |
| Body copy max-width 280px | Empty state description max-width in DS (also 280px) |

The recovery screen deliberately matches the DS Empty State pattern in structure
(icon → heading → description → CTA), because from a user's perspective a crashed app
is a kind of empty state: the content they expected is not there.

---

*This spec is complete and ready for Phase B. One component, one action, no ambiguity.*
