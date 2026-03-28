# FE Fix Note — RaceProgressModal BLOCKER-001 + BLOCKER-002

**Date:** 2026-03-28
**Engineer:** Frontend Engineer
**Feature:** race-progress-modal
**File fixed:** `src/components/racing/RaceProgressModal.tsx`

---

## What was wrong

### BLOCKER-002 (root cause)

`RaceProgressModal` contained a hand-rolled `SheetPanel` — a `motion.div` with inline
glass styles, its own drag handle, its own scroll container (`calc(80vh - 28px)`), and
its own `Backdrop` component. The `BottomSheet` component from `Modal.tsx` was never
called. Story 9 AC explicitly requires:

> "`RaceProgressModal` passes `maxHeight="80vh"` to the `BottomSheet` component."

That AC was not met. The prop was not the mechanism — an inline style on a custom
`motion.div` was.

### BLOCKER-001 (consequence of BLOCKER-002)

Because `BottomSheet` was never used, its reference-counted `useScrollLock` was never
inherited. Instead the component called `document.body.style.overflow = 'hidden'` and
`document.body.style.overflow = ''` directly. CLAUDE.md prohibits direct body scroll
lock manipulation with no exceptions: the reference-counted mechanism must be used so
two simultaneous overlays do not fight over scroll restoration.

---

## What was changed

The fix is a shell replacement only. All inner logic is preserved exactly.

### Removed

- `SheetPanel` function component (the custom `motion.div` sheet surface)
- Local `Backdrop` component (BottomSheet brings its own)
- `import { createPortal } from 'react-dom'` (BottomSheet portals itself)
- The `useEffect` block that directly set `document.body.style.overflow`

### Added

- `import { BottomSheet } from '@/components/ui/Modal'`
- `<BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="80vh">` as the sheet shell

### Preserved exactly

- `SheetContent` (renamed from `SheetPanel`, inner JSX unchanged) — close button,
  header row, `AnimalHero`, `ParticipantsStrip`, `AnimatePresence` A/B cross-fade,
  progress bar, CTA pulse, CTA colour logic
- Focus trap (`handleKeyDown`) — moved onto a `role="dialog"` wrapper `<div>` inside
  BottomSheet's children, since BottomSheet has no built-in focus trap
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-label="Race progress"`
- Focus management `useEffect` blocks (capture trigger element on open, return focus
  on close, rAF to move focus to close button)
- `useReducedMotion` consumption across all animated sub-components
- All animation parameters from the spec (bob, A→B cross-fade, trophy pulse,
  CTA scale pulse)

### Scroll container height

`BottomSheet` computes `calc(${maxHeight} - 80px)` for its inner scroll area. With
`maxHeight="80vh"` this gives `calc(80vh - 80px)`. The previous custom implementation
used `calc(80vh - 28px)` (subtracting only the drag handle height, not the close-button
row), which would have caused the CTA to clip on shorter viewports. The BottomSheet
value is correct and is now the mechanism.

---

## Post-fix verification

- `document.body.style.overflow` — zero live assignments in the file (comments only)
- `createPortal` — zero live calls in the file (comments only); BottomSheet owns the portal
- `<BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="80vh">` — line 504
- All animations remain inside the BottomSheet content area, unaffected by the shell change

---

## Blockers resolved

- BLOCKER-001: resolved as a side effect of BLOCKER-002. `useScrollLock` is now
  inherited from `BottomSheet`. No direct body scroll manipulation remains.
- BLOCKER-002: resolved. `RaceProgressModal` uses `<BottomSheet maxHeight="80vh">`
  from `Modal.tsx`. The prop is the mechanism. Story 9 AC is satisfied.
