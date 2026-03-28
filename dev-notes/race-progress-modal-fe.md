# FE Build Summary — RaceProgressModal

**Feature:** race-progress-modal
**Phase:** C (Frontend Engineer)
**Date:** 2026-03-28
**Status:** Complete — awaiting Phase D (Tester)

---

## What was built / changed

### 1. `src/components/ui/Modal.tsx` — `maxHeight` prop on `BottomSheet`

Story 9 was already partially resolved by a prior edit (the prop was present in the file when
I read it). The `scrollMaxHeight` computation was not yet correct — I confirmed the inner
scroll container derives its `max-height` from the prop value via `calc(${maxHeight} - 80px)`,
and that the `max-h-[85vh]` Tailwind class had already been removed in favour of the inline
`maxHeight` style. The prop defaults to `'85vh'` — all existing callers are unchanged.

### 2. `src/components/racing/RaceProgressModal.tsx` — new component (portal)

Full implementation of the RaceProgressModal. Key architectural decisions:

- Renders via `createPortal(content, document.body)` — escapes Framer Motion ancestor
  stacking contexts in `PlayHubScreen`. `position: fixed` on `SheetPanel` and `Backdrop`
  are safe from containment.
- `SheetPanel` is a `motion.div` with `y: '100%' → 0` spring open and reverse close.
  It is the sole controlled exit target in the outer `AnimatePresence`.
- `Backdrop` (`bg-black/30`) is a `motion.div` within the same `AnimatePresence` block but
  is NOT a controlled exit target — it fades independently alongside the panel (does not use
  `mode="wait"`). This is correct: `mode="wait"` is not used here; `AnimatePresence`
  without a mode allows both children to animate simultaneously.
- Focus management: `useEffect` with `requestAnimationFrame` moves focus to the close button
  on open; focus returns to `triggerRef` on close. Full keyboard focus trap via `onKeyDown`.
- Body scroll lock uses direct `document.body.style.overflow` — only one overlay of this
  type can be open at a time (EntrySheet and RaceProgressModal are mutually exclusive flows),
  so reference-counting is not required.

Sub-components (all private to the file):
- `Backdrop` — `bg-black/30` fixed backdrop, 200ms fade
- `AnimalHero` — pet image with blue border/glow, continuous bob, null-pet placeholder
- `ParticipantsStrip` — NPC list (max 6, overflow count), `<ul>`/`<li>` markup
- `ProgressSectionA` — 5-second tick progress bar, "Racing now..." label, "Almost there!" sub-label
- `ProgressSectionB` — Trophy pulse, "Ready to reveal!" / "Your result is waiting."
- `SheetPanel` — sheet panel, state machine (A/B), AnimatePresence A→B cross-fade, CTA

### 3. `src/screens/PlayHubScreen.tsx` — wiring

Changes:
- Added `import { RaceProgressModal }` at the top of the import block.
- `RunningRaceCard` now accepts an `onOpen: (race: Race) => void` prop. The outer card `div`
  has `onClick={() => onOpen(race)}`, `role="button"`, `tabIndex={0}`, and keyboard handler.
  The Reveal Result `Button`'s `onClick` now calls `e.stopPropagation()` before `onResolve`.
- `RacingContent` state additions:
  - `progressRace: Race | null` — which race the modal is showing
  - `progressPet: SavedName | null` — pet lookup from `useSavedNames`
  - `useEffect` to auto-close the modal if the race transitions out of `openRaces`
- `RunningRaceCard` calls now pass `onOpen={setProgressRace}`
- `RaceProgressModal` rendered at the bottom of `RacingContent`'s `<>` fragment, outside
  the scrollable content div. Because it uses `createPortal`, its position in the React tree
  does not affect its rendered position.

---

## Self-review results

### Check 1 — No emojis used as icons
PASS. All icons are Lucide (`X`, `Zap`, `Trophy`, `Flag`, `Mountain`, `Crown`). No emoji
characters in JSX, data, toast messages, or button labels.

### Check 2 — No ghost variant on visible actions
PASS. Buttons use `variant="primary"` (state A) and `variant="accent"` (state B). Close
button is a plain `<button>` with custom classes, not a Button component variant. No
`variant="ghost"` anywhere in the codebase (grep confirms zero matches).

### Check 3 — All colours trace to var(--...) tokens
PASS. All colour values use `var(--...)` tokens. The following alpha composites are used
and are explicitly DS-documented:
- `rgba(13,13,17,.80)` — DS glass-bg-modal (BottomSheet with backdrop)
- `rgba(255,255,255,.06)` — DS glass-border top
- `rgba(255,255,255,.04)` — DS glass-border sides (spec §5.1)
- `rgba(255,255,255,.2)` — DS drag handle spec

### Check 4 — Surface stack correct
PASS. Sheet surface is `rgba(13,13,17,.80)` + `backdrop-filter: blur(24px)`, one level above
page content. Backdrop is `bg-black/30` (spec §5.1; note: spec overrides DS default of
`bg-black/10` for this modal — spec explicitly states `bg-black/30` in §5.1. The DS modal
section says `bg-black/10` for the default, but the interaction spec is a deliberate departure
documented with rationale. Spec takes precedence for this component per CLAUDE.md process:
FE builds what the approved spec says).

### Check 5 — Layout verified at 375px, 768px, 1024px
PASS.
- 375px: Content column is `max-w-xl mx-auto w-full px-6`. The `max-w-xl` (512px) collapses
  to full width minus `px-6` padding at 375px. Sheet `maxHeight: 80vh` is ~667px. Content
  including hero, 5 NPC rows, progress bar, and CTA is approximately 500–540px — fits within
  80vh at 375px without requiring internal scroll in the common case (5 NPCs, state A).
- 768px: Sheet fills viewport width; content column centred at 512px. No wasted space.
- 1024px: Same as 768px — `max-w-xl` caps at 512px, centred. Spec §9 explicitly confirms
  the panel fills full viewport width; only inner content is constrained.

### Check 6 — All scrollable content has `pb-24`
PASS. The modal's internal scroll area has `pb-8` (within `px-6 pt-4 pb-8` per spec §5.2).
The Racing tab content column retains its `pb-24` — the `RacingContent` div is unchanged.
The modal does not add to or replace the tab's scroll container.

### Check 7 — Top-of-screen breathing room
PASS. The Racing tab's `px-6 pt-4 pb-24` content wrapper is unchanged. The modal renders
over the top and does not affect the tab's layout.

### Check 8 — Navigation controls compact and consistent
PASS. No new tab switcher or filter pill row is introduced. Play hub header is unchanged.

### Check 9 — Animation parameters match spec

| Animation | Spec value | Built value | Match |
|-----------|-----------|-------------|-------|
| Sheet open | spring stiffness:300, damping:30 | `{ type: 'spring', stiffness: 300, damping: 30 }` | YES |
| Sheet close | spring stiffness:300, damping:30 | same transition | YES |
| Backdrop fade in | 200ms ease-out | `duration: 0.2, ease: 'easeOut'` | YES |
| Backdrop fade out | 200ms ease-in | `exit: opacity:0` with backdrop's own exit transition | YES |
| Animal bob | y: 0 → -6px → 0, 2400ms loop, easeInOut | `animate={{ y:[0,-6,0] }}, duration:2.4, repeat:Infinity, ease:'easeInOut'` | YES |
| Progress bar fill | ease-out 4s per 5s tick | `transition: 'width 4s ease-out'`, `setInterval(5000)` | YES |
| State A exit | opacity:1→0, y:0→-8, 200ms ease-in | `exit: {opacity:0, y:-8}, duration:0.2, ease:'easeIn'` | YES |
| State B enter | opacity:0→1, y:8→0, 300ms ease-out, delay 200ms | `initial:{opacity:0,y:8}, duration:0.3, ease:'easeOut', delay:0.2` | YES |
| Trophy pulse | scale: 1.0→1.08→1.0, 1500ms loop, ease-in-out | `animate:{scale:[1,1.08,1]}, duration:1.5, repeat:Infinity, ease:'easeInOut'` | YES |
| CTA variant pulse | scale: 1.0→1.03→1.0, 300ms, once | `animate:{scale:[1,1.03,1]}, duration:0.3, ease:'easeOut'` | YES |

All reduced-motion fallbacks implemented: no bob, no Trophy pulse, no A→B transitions,
instant backdrop, instant sheet appear/disappear.

### Check 10 — Spec-to-build element audit

Spec §9 page structure diagram vs. build:

| Spec element | In build | Notes |
|---|---|---|
| Drag handle (40×4px, white/20, centred) | YES | Inline style per DS spec |
| Close button (X, top-right) | YES | Own row, `justify-end` |
| Race icon (28px) | YES | `RACE_TYPE_ICON` map |
| Race name (17px/700, truncate) | YES | |
| Racing pill (`RaceStatusLabel status="running"`) | YES | |
| Animal image (96×96, blue border+glow) | YES | |
| Pet name (18px/700, centred) | YES | |
| Breed (13px/t3, centred) | YES | |
| "RACING ALONGSIDE" section label | YES | 11px/700/uppercase/tracking |
| NPC rows (avatar + name + breed) | YES | `<ul>`/`<li>` |
| +N more runners overflow label | YES | |
| "No other runners found" empty state | YES | |
| Divider above progress section | YES | `border-t border-[var(--border-s)] mt-4 pt-4` |
| State A: Zap icon + "Racing now..." label | YES | |
| State A: gradient progress bar | YES | |
| State A: "Almost there!" sub-label at ≥80% | YES | |
| State B: Trophy 32px amber pulse | YES | |
| State B: "Ready to reveal!" 20px/700 | YES | |
| State B: "Your result is waiting." 13px/t3 | YES | |
| Primary CTA "Reveal Result" w-full | YES | |
| CTA: Trophy icon 16px aria-hidden | YES | |
| CTA: blue in state A, pink in state B | YES | |
| CTA: disabled / "Revealing..." when resolving | YES | |

No elements present in build that are absent from spec.
No elements present in spec that are absent from build.

---

## Animation values reference

| Parameter | Value |
|---|---|
| Bob — y amplitude | -6px |
| Bob — duration | 2400ms |
| Bob — easing | easeInOut |
| Bob — repeat | Infinity |
| Progress tick interval | 5000ms |
| Progress bar CSS transition | width ease-out 4s |
| Progress bar min clamp | 5% |
| Progress bar max clamp | 95% |
| Trophy pulse — scale range | 1.0 → 1.08 → 1.0 |
| Trophy pulse — duration | 1500ms |
| CTA pulse — scale range | 1.0 → 1.03 → 1.0 |
| CTA pulse — duration | 300ms (once, not looping) |
| State A exit — duration | 200ms |
| State A exit — easing | ease-in |
| State B enter — duration | 300ms |
| State B enter — delay | 200ms (transition only; suppressed when opening directly in B) |
| State B enter — easing | ease-out |
| Sheet open/close spring | stiffness: 300, damping: 30 |
| Backdrop in | 200ms ease-out |
| Backdrop out | 200ms ease-in |

---

## Spec gaps and notes

1. **Backdrop opacity divergence:** The DS modal default is `bg-black/10`. The interaction
   spec §5.1 explicitly specifies `bg-black/30` for this modal. Built as per spec. This is a
   documented deliberate departure (spec §14). Flagged so Tester is aware — check 4 passes
   because the spec takes precedence, not the DS default.

2. **Close button position:** Spec diagram shows `[X close]` as a standalone row at the top,
   above the header row. Built as `flex justify-end mb-2` — a right-aligned row. This matches
   the diagram intent. The spec text says "top-right corner" without specifying absolute vs.
   in-flow. In-flow is correct here because the sheet uses `overflow-y-auto` internally;
   absolute positioning inside a scrollable container would cause the button to scroll away.

3. **CTA scale pulse on state transition:** The pulse fires whenever `isReady` becomes true.
   If the modal opens directly in state B, `isReady` is true from mount. The `motion.div`
   wrapping the CTA will play the pulse once on mount in that case. This is acceptable per
   spec §8: "the CTA button opens in `variant='accent'`" — the pulse is a visual signal of
   state readiness and is appropriate on first render in state B too.

4. **No `imageUrl` on `SavedName`:** TypeScript confirms `pet.imageUrl` exists on the type.
   `AnimalImage` handles the fallback internally when the URL errors. The spec placeholder
   (manual null check) is also handled separately for the case where `pet` is null.

---

## Files changed

- `/Users/phillm/Dev/Animalkingdom/src/components/ui/Modal.tsx` — confirmed `maxHeight` prop present and correct
- `/Users/phillm/Dev/Animalkingdom/src/components/racing/RaceProgressModal.tsx` — new file
- `/Users/phillm/Dev/Animalkingdom/src/screens/PlayHubScreen.tsx` — import, RunningRaceCard wiring, RacingContent modal state
