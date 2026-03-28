# Interaction Spec: Loading Skeletons

> Feature: loading-states
> Author: UX Designer
> Status: Phase A complete — ready for Phase B (PO)
> Last updated: 2026-03-28

---

## Overview

Several screens flash blank content before data loads. On iPad, where content areas are wider
and more prominent, a bare empty grid is visually jarring. On a slow connection the blank
state can persist for several seconds.

This spec defines skeleton loading states for four screens:

| Screen | Component | What it replaces |
|--------|-----------|-----------------|
| HomeScreen | `HomeStatCards` | 3 stat cards during initial data load |
| ExploreScreen | Animal grid | 8 skeleton cards during animal directory load |
| MyAnimalsScreen | Pet grid | Skeleton grid during owned pets load |
| PlayHubScreen | Race cards | Skeleton cards during race data load |

Skeletons are not error states and not empty states. They communicate: "content is coming".
They have the same shape as the content they replace, so the layout does not shift on load.

---

## 1. Skeleton Design Principles

### 1.1 Shape accuracy

Every skeleton element matches the dimensions of the real element it replaces. A skeleton
stat card has the same height and border radius as a real stat card. A skeleton animal card
has the same aspect ratio and grid position as a real animal card. Layout shift on data
arrival is a defect.

### 1.2 Pulse animation

All skeleton surfaces use a single, consistent pulse animation:

```
Animation:    opacity oscillates 1.0 → 0.5 → 1.0
Duration:     1500ms per cycle
Easing:       ease-in-out
Loop:         indefinite while loading
Background:   var(--elev)  (#23262F)  — one level above the card surface
```

The `--elev` surface on a `--card` background provides visible contrast without using
hardcoded colours. It steps up exactly one level in the DS surface stack.

Reduced-motion: pulse disabled. Skeletons render at static `opacity: 1` with no animation.

Implementation: Framer Motion `animate={{ opacity: [1, 0.5, 1] }}`,
`transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}`.
Wrap the animation in a `motion-safe` guard or use `useReducedMotion` hook.

### 1.3 Colour

All skeleton bars and blocks use `background: var(--elev)` (`#23262F`).
Never hardcode `#23262F` — use the CSS variable.

### 1.4 Accessibility

Skeleton containers must have `aria-busy="true"` and `aria-label="Loading"` so screen
readers announce that content is being fetched rather than announcing garbled structure.
Individual skeleton blocks are `aria-hidden="true"`.

### 1.5 Stagger

When multiple skeleton items appear together (e.g. a grid), they animate in stagger
from left-to-right, top-to-bottom, with a 50ms delay between each. This creates a
cascading wave rather than all items pulsing in lockstep.

```
Stagger:      50ms per item
Direction:    index-based (item 0 first, item N last)
```

Stagger is disabled when `useReducedMotion` is true — all items appear simultaneously.

---

## 2. HomeScreen — Skeleton Stat Cards

### 2.1 Context

`HomeStatCards` already accepts a `loading` prop. This spec confirms the expected skeleton
output when `loading === true` and documents what the FE must implement if `loading` is
only a stub.

The stat card grid contains three cards side by side on iPad (`grid-cols-3`), one per row
on phone (`grid-cols-1`).

### 2.2 Skeleton stat card anatomy

Each skeleton card replicates the structure of a real stat card at the same dimensions:

```
Card container:
  Background:     var(--card)
  Border:         1px solid var(--border-s)
  Border-radius:  16px  (--r-lg)
  Padding:        20px
  Gap (flex-col): 8px
```

Internal skeleton blocks:

```
Label line (replaces stat label):
  Width:          60px
  Height:         12px
  Radius:         6px  (--r-xs)
  Background:     var(--elev)
  Margin-bottom:  8px

Value block (replaces numeric value):
  Width:          80px
  Height:         28px
  Radius:         8px  (--r-sm)
  Background:     var(--elev)

Delta badge (replaces delta indicator):
  Width:          48px
  Height:         20px
  Radius:         6px  (--r-xs)
  Background:     var(--elev)
```

### 2.3 Count

Render exactly 3 skeleton stat cards — the same count as the real stat card grid. Do not
render 4 or use a variable count.

### 2.4 Layout diagram

```
┌──────────┐  ┌──────────┐  ┌──────────┐   grid-cols-3 on md+, grid-cols-1 on sm
│ ▓▓▓▓     │  │ ▓▓▓▓     │  │ ▓▓▓▓     │   label line: 60px × 12px, --elev
│ ▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓ │   value block: 80px × 28px, --elev
│ ▓▓▓▓▓    │  │ ▓▓▓▓▓    │  │ ▓▓▓▓▓    │   delta: 48px × 20px, --elev
└──────────┘  └──────────┘  └──────────┘
```

### 2.5 Transition

When data loads, the skeleton cards are replaced by real stat cards. The transition must
not cause layout shift — card dimensions are identical. No entrance animation on the real
cards is required; the pulse simply stops.

### 2.6 Verification of existing `loading` prop

Before building new skeleton UI, FE must confirm:
1. `HomeStatCards` receives `loading` prop correctly from its parent.
2. When `loading === true`, the component renders skeleton output (not an empty div or null).
3. When `loading` transitions false → true → false, the skeleton appears and disappears without
   mounting/unmounting the parent grid container.

If the `loading` prop is currently a stub returning null or an empty fragment, build the
skeleton output as specified above.

---

## 3. ExploreScreen — Animal Grid Skeletons

### 3.1 Context

The ExploreScreen animal grid loads animals from the database on mount. Until the query
resolves, the grid is empty. On iPad at 1024px, the empty grid is a wide blank area
below the PageHeader filter pills.

### 3.2 Skeleton animal card anatomy

The skeleton replicates the `AnimalCard` dimensions:

```
Card container:
  Background:     var(--card)
  Border:         1px solid var(--border-s)
  Border-radius:  16px  (--r-lg)
  Overflow:       hidden
```

Internal skeleton blocks:

```
Image area (replaces aspect-video image):
  Width:          100%
  Aspect-ratio:   16/9
  Background:     var(--elev)
  Radius:         0  (flush to card edges, like the real image)

Card body (replaces name + rarity badge + stats):
  Padding:        16px
  Gap (flex-col): 8px

  Name line:
    Width:        70%
    Height:       16px
    Radius:       6px
    Background:   var(--elev)

  Badge + sub-line (one block):
    Width:        50%
    Height:       12px
    Radius:       6px
    Background:   var(--elev)

  Button row (replaces action button):
    Width:        100%
    Height:       36px
    Radius:       100px  (pill — matches button pill radius)
    Background:   var(--elev)
    Margin-top:   4px
```

### 3.3 Count

Render 8 skeleton cards. This is the number of cards visible above the fold on iPad portrait
(two columns × four rows). The number is fixed — do not derive it from the expected data count,
as data count is unknown at load time. On phone (one column) 8 cards extends below the fold,
which is correct — the user sees a full, scrollable grid of skeletons.

### 3.4 Grid layout

The skeleton grid uses the same grid classes as the real animal grid:
`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`

This ensures the skeleton and real grid are identical in structure, preventing any layout
shift on data load.

### 3.5 Layout diagram (2-column view, phone)

```
┌──────────────┐  ┌──────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓│  │▓▓▓▓▓▓▓▓▓▓▓▓▓│  image area: aspect-video, --elev
│▓▓▓▓▓▓▓▓▓▓▓▓▓│  │▓▓▓▓▓▓▓▓▓▓▓▓▓│
├──────────────┤  ├──────────────┤
│ ▓▓▓▓▓▓▓▓    │  │ ▓▓▓▓▓▓▓▓    │  name: 70% × 16px
│ ▓▓▓▓▓       │  │ ▓▓▓▓▓       │  badge: 50% × 12px
│ ▓▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓▓ │  button: 100% × 36px, pill
└──────────────┘  └──────────────┘
  × 8 cards total across the grid
```

---

## 4. MyAnimalsScreen — Skeleton Pet Grid

### 4.1 Context

MyAnimalsScreen loads the player's owned pets. Before this resolves, the grid is empty.
The screen uses the same grid classes as ExploreScreen.

### 4.2 Skeleton pet card anatomy

MyAnimalsScreen pet cards are distinct from ExploreScreen animal directory cards. Pet cards
include a pet name, a species label, care status, and an action button. The skeleton must
match these proportions.

```
Card container:
  Background:     var(--card)
  Border:         1px solid var(--border-s)
  Border-radius:  16px
  Overflow:       hidden

Image area (replaces square pet image):
  Width:          100%
  Aspect-ratio:   1/1  (square — pet cards use square images, not 16/9)
  Background:     var(--elev)
  Radius:         0

Card body:
  Padding:        16px
  Gap (flex-col): 8px

  Name line:
    Width:        65%
    Height:       16px
    Radius:       6px
    Background:   var(--elev)

  Species/status line:
    Width:        45%
    Height:       12px
    Radius:       6px
    Background:   var(--elev)

  Care status badge:
    Width:        80px
    Height:       24px
    Radius:       100px  (pill — matches badge pill shape)
    Background:   var(--elev)

  Action button row:
    Width:        100%
    Height:       36px
    Radius:       100px  (pill)
    Background:   var(--elev)
    Margin-top:   4px
```

### 4.3 Count

Render 6 skeleton cards. On iPad at 1024px, the pet grid is `grid-cols-2 md:grid-cols-3`,
so 6 fills two rows of three. On phone (grid-cols-2) this is three rows of two, extending
comfortably below the fold.

### 4.4 Conditional skeleton vs empty state

The skeleton is shown only while the data query is in a `loading` state. Once the query
resolves:
- If the player has pets: render the real pet grid.
- If the player has no pets: render the DS empty state (icon + heading + CTA), not the
  skeleton.

These are three distinct UI states: loading, empty, and populated. They must not be merged.

---

## 5. PlayHubScreen — Skeleton Race Cards

### 5.1 Context

PlayHubScreen fetches race data via a live query. The Racing tab content can take a moment
to populate, particularly if the player navigates directly to /play from a cold start.

The skeleton applies only to the Racing tab (`RacingContent` component), not the Games tab.
Games load independently and have no list that would require a skeleton.

### 5.2 Skeleton race card anatomy

Race cards have a more complex layout than stat or animal cards. The skeleton must represent
the header row (icon + name + status badge), the prize pool line, and the action button.

```
Card container:
  Background:     var(--card)
  Border:         1px solid var(--border-s)
  Border-radius:  16px
  Padding:        20px
  Gap (flex-col): 12px

Header row (replaces icon + race name + status label):
  Display:        flex
  Align:          center
  Gap:            12px

  Icon circle skeleton:
    Width:        40px
    Height:       40px
    Radius:       100px  (circle — matches icon circle shape)
    Background:   var(--elev)
    Flex-shrink:  0

  Name block:
    Width:        120px
    Height:       16px
    Radius:       6px
    Background:   var(--elev)

  Status badge skeleton (right-aligned, ml-auto):
    Width:        60px
    Height:       22px
    Radius:       100px  (pill)
    Background:   var(--elev)

Sub-row (replaces runner count / duration):
  Width:          80px
  Height:         12px
  Radius:         6px
  Background:     var(--elev)

Prize pool line:
  Width:          100px
  Height:         16px
  Radius:         6px
  Background:     var(--elev)

Action button row:
  Width:          100%
  Height:         44px  (md button height)
  Radius:         100px  (pill)
  Background:     var(--elev)
```

### 5.3 Count and structure

Render 3 skeleton cards. The Racing tab has two sections ("Your Races" and "Available
Races"). Show the section headings ("YOUR RACES", "AVAILABLE RACES" — hairline style) as
static text even during load. Show 1 skeleton card under "Your Races" and 2 under
"Available Races". This communicates the screen structure before data arrives.

Section heading skeletons are not needed — the headings are a structural scaffold, not
data-driven. They are always present.

### 5.4 Layout diagram

```
YOUR RACES
┌────────────────────────────────────────────────────┐
│  [●●●●]  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓       [▓▓▓▓▓▓▓▓▓▓]  ml-auto │
│  ▓▓▓▓▓▓▓▓▓▓▓                                      │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓                                    │
│  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] btn │
└────────────────────────────────────────────────────┘

AVAILABLE RACES
┌───────────────────────────────────┐ ┌────────────────────────────────────┐
│  [●●] ▓▓▓▓▓▓  [▓▓▓▓▓▓] ml-auto   │ │  [●●] ▓▓▓▓▓▓  [▓▓▓▓▓▓] ml-auto    │
│  ▓▓▓▓▓▓▓▓▓▓▓▓                    │ │  ▓▓▓▓▓▓▓▓▓▓▓▓                     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                │ │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                 │
│  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] btn │ │  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] btn     │
└───────────────────────────────────┘ └────────────────────────────────────┘
  grid-cols-1 md:grid-cols-2 (race card grid, canonical)
```

---

## 6. Shared SkeletonBlock Component

All skeleton bars and circles across all four screens use the same underlying visual — a
pulsing `--elev` surface. A shared `SkeletonBlock` component prevents duplication.

```
Component:    SkeletonBlock
Props:        width (string | number), height (number), radius (number | string)
Default:      radius = 6 (--r-xs), width = '100%'
Behaviour:    Renders a div with the pulse animation. When useReducedMotion is true,
              renders without animation at full opacity.
Location:     src/components/common/SkeletonBlock.tsx
```

This is a structural building block — it has no DS colour token inputs beyond `--elev`,
no semantic meaning, and no variants. Complex skeleton shapes (like the stat card with
multiple internal blocks) are composed in their own `*Skeleton` components using
`SkeletonBlock` primitives.

---

## 7. Interaction States

Skeletons are not interactive.

| State | Treatment |
|-------|-----------|
| Default (loading) | Pulse animation active (--elev background) |
| Reduced-motion | Static, no pulse, full opacity |
| Hover | No change — skeletons are not interactive |
| Focus | Not focusable |
| Error (data fetch fails) | Skeleton replaced by error toast + empty state. Skeleton does not persist on error. |

---

## 8. Accessibility

- All skeleton containers carry `aria-busy="true"` and `aria-label="Loading"`.
- Individual `SkeletonBlock` elements carry `aria-hidden="true"`.
- No announcement is made when skeletons transition to real content — the content itself
  becomes the announced region.
- Section headings in the PlayHub skeleton ("YOUR RACES", "AVAILABLE RACES") are rendered as
  real `h2` elements with the correct DS hairline style. They are not skeletonised.

---

## 9. Overlay Surface Treatment

Skeleton screens do not introduce any BottomSheet, Modal, or Toast. The glass rule does not
apply to skeleton surfaces — they are inline, not floating.

---

## 10. Card Anatomy Summary — SkeletonBlock

| Property | Value |
|----------|-------|
| Background | `var(--elev)` (#23262F) |
| Animation | Opacity 1 → 0.5 → 1, 1500ms, ease-in-out, infinite |
| Radius | 6px default; pill (100px) for buttons and badges; 0 for image areas |
| Reduced-motion | Static, no animation |
| Accessibility | `aria-hidden="true"` on each block; `aria-busy="true"` on container |

---

## 11. Consistency Check

| Skeleton element | Real element it must match |
|-----------------|---------------------------|
| Stat card dimensions | `HomeStatCards` card height and padding |
| Animal grid layout | `AnimalCard` grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3`) |
| Animal card image aspect ratio | `AnimalCard` image (`aspect-video`) |
| Pet card image aspect ratio | Pet card image (`aspect-square`) |
| Race card button height | `btn-md` (44px) |
| Race card icon circle | 40×40 circle (matched to icon wrapper in RaceCard) |
| All card borders | `1px solid var(--border-s)`, `border-radius: 16px` |

---

*This spec is complete and ready for Phase B. The PO can write acceptance criteria directly
from sections 2–5. The FE can build from sections 2–6. All skeleton dimensions are explicit.
No visual value is left to FE discretion.*
