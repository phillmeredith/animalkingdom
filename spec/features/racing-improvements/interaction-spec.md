# Interaction Spec: Racing Improvements

> Feature: racing-improvements
> Author: UX Designer
> Status: Phase A — ready for Phase B (PO)
> Last updated: 2026-03-28

---

## Overview

Three targeted improvements to the existing racing feature on the Play hub (Racing tab):

1. **Race status labels** — visible, colour-coded pill badges on each race card that clearly
   communicate where a race is in its lifecycle (`upcoming`, `open`, `running`, `finished`).
2. **Pre-race countdown** — when a player has entered a race and the race is in `open` state
   (entered, waiting to be run), surface a clear and exciting visual prompt that the race is
   ready to start.
3. **Nav badge** — a dot badge on the Play tab in the BottomNav that appears when the player
   has at least one race that needs their attention (entered and ready to run, or newly
   finished with an uncollected result).

This feature is child-facing (ages 6–12). Labels must be one or two short words, plain
English, and immediately recognisable without reading. Visual language must be energetic
without creating anxiety. The countdown in particular must feel exciting, not stressful.

---

## 1. Existing Component Context

Before making any change, the FE must understand the current component structure:

| Component | File | Role |
|---|---|---|
| `RacingContent` | `PlayHubScreen.tsx:467` | Container — renders "Your races" and "Available races" sections |
| `RunningRaceCard` | `PlayHubScreen.tsx:142` | Card for an entered race (`open` status with `playerEntryPetId`, or `running` status) |
| `RaceCard` | `PlayHubScreen.tsx:188` | Card for an available race (not yet entered) |
| `BottomNav` | `BottomNav.tsx` | Fixed 5-tab nav — Play tab targets `/play` |

The existing `RunningRaceCard` already shows a text string "Entered — tap Race! to run" and "In
progress" but has no visual status badge, and the countdown appears only as a text string inside
the card header. These improvements replace or augment that text with proper designed elements.

The existing `BottomNav` has a badge stub at line 60–65 that fires on the wrong tab (Store,
not Play) and queries only `finished` races. This will be corrected as part of the nav badge
improvement.

---

## 2. Screen Inventory

No new screens or routes are introduced. All changes are in-place modifications to existing
components.

| Component modified | Change |
|---|---|
| `RaceCard` (available race) | Add `RaceStatusLabel` badge |
| `RunningRaceCard` (entered race) | Add `RaceStatusLabel` badge + `PreRaceCountdown` section |
| `BottomNav` (Play tab) | Add attention dot badge |

---

## 3. Feature 1 — Race Status Labels

### 3.1 Purpose

Each race card currently relies on context (which section of the screen it is in) and prose
text to communicate state. A player who scans quickly, or who has difficulty with reading, has
no immediate visual indicator. The label provides that at a glance.

### 3.2 Label definitions

| Race state | Display text | Colour pair | Icon (Lucide, 10px) |
|---|---|---|---|
| `upcoming` | Soon | Amber — `--amber-sub` / `--amber-t` | `Clock` |
| `open` (not entered) | Enter now | Green — `--green-sub` / `--green-t` | `Zap` |
| `open` (entered, player waiting to run) | Ready! | Blue — `--blue-sub` / `--blue-t` | `Flag` |
| `running` | Racing | Pink — `--pink-sub` / `--pink-t` | `Zap` (animated — see 3.4) |
| `finished` | Done | Neutral — `rgba(119,126,145,.12)` / `#B1B5C4` | `Trophy` |

Rationale for label choices:
- "Soon" and "Enter now" give the player an action orientation, not just a state description.
- "Ready!" for an entered-but-not-yet-run race is a positive prompt, not a timer.
- "Racing" uses pink (the reward/action accent) because the race is actively in progress.
- "Done" uses the neutral tint so it recedes visually — it is historical context, not a call
  to action.

### 3.3 RaceStatusLabel component anatomy

```
Component:   RaceStatusLabel
Type:        Inline badge (tinted pill)
Display:     inline-flex
Align:       center
Gap:         5px (DS badge gap)
Padding:     4px 10px (DS badge padding)
Radius:      100px (--r-pill)
Font:        12px / 600
Icon:        Lucide, 10px, colour matches text colour
```

This is a standard DS tinted badge. It does not deviate from the badge pattern.

The FE must not use solid colour backgrounds for this badge. Only the `--*-sub` translucent
backgrounds are permitted.

### 3.4 Animated "Racing" state

The `Zap` icon on the "Racing" label pulses at a gentle opacity rhythm to signal that something
is happening in the background.

```
Animation:      opacity oscillates 1.0 → 0.5 → 1.0
Duration:       1200ms per cycle (one inhale-exhale)
Easing:         ease-in-out (sinusoidal feel)
Loop:           indefinite while status === 'running'
Reduced-motion: pulse disabled; icon renders at full opacity, static
Implementation: Framer Motion `animate={{ opacity: [1, 0.5, 1] }}`, `transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}`
               Wrap in `{!reducedMotion && ...}` — static icon rendered when reducedMotion is true
```

The pulse is on the icon only, not the badge background. Background remains static.

### 3.5 Placement on cards

**RaceCard (available, not entered):**
The `RaceStatusLabel` is placed in the top-right of the card header row, aligned to the right
of the card name/icon block and left of the prize pool block. It sits on the same row as the
race name.

```
Before (row structure):
  [ Type icon ] [ Race name / runner count ]    [ Prize pool ]

After:
  [ Type icon ] [ Race name / runner count ]    [ StatusLabel ][ Prize pool ]
```

The prize pool stays trailing/rightmost. The status label sits to its left with `gap: 8px`.

**RunningRaceCard (entered race):**
The `RaceStatusLabel` is placed at the top-right of the card header, replacing the current
text "Entered — tap Race! to run" / "In progress" which appears below the race name. That
prose line is removed from the header. The status badge is now the visual signal; the prose
text is moved into the countdown section (see Feature 2).

```
Before (header):
  [ Type icon ] [ Race name ]
                [ "Entered — tap Race! to run" or "In progress" text ]

After:
  [ Type icon ] [ Race name ]             [ StatusLabel ]
```

### 3.6 Interaction states for RaceStatusLabel

This is a display-only badge. It is not interactive.

| State | Treatment |
|---|---|
| Default | Tinted pill as specified in 3.3 |
| Hover | No change — not interactive |
| Focus | Not focusable (no `tabIndex`, no keyboard role) |
| Reduced-motion | "Racing" icon static at full opacity; all other states unchanged |

Accessibility: The badge text is visible and readable. It is not the only indicator of state —
the card section ("Your races" vs "Available races") and button label also communicate state.
No additional `aria-label` is needed on the badge itself.

---

## 4. Feature 2 — Pre-race Countdown

### 4.1 Purpose

When a player enters a race, they land back on the racing screen with no clear signal of what
to do next. The "Run Race!" button exists on the `RunningRaceCard` but it receives little
visual emphasis relative to how important this moment is. The player may miss it, especially
on a busy screen with multiple races.

The pre-race countdown is a visually distinct section inside the `RunningRaceCard` that appears
only when a race is in `open` state with the player entered (`isWaiting === true`). It
replaces the existing flat button layout with an energetic, purpose-built section that makes
the "Run Race!" action feel like an event.

### 4.2 What "imminent" means

The countdown applies whenever `race.status === 'open'` and `race.playerEntryPetId !== null`.
This is what the existing code calls the `isWaiting` condition (line 148 of PlayHubScreen).

There is no separate "launch imminent" timer threshold. Any entered, not-yet-run race is
"ready". The visual treatment is the same whether the player entered the race 10 seconds ago
or 10 minutes ago.

### 4.3 PreRaceCountdown section anatomy

This section replaces the existing button-only layout in `RunningRaceCard` when `isWaiting`
is true.

```
Section container:
  Padding:      16px (DS card body padding)
  Background:   var(--blue-sub)
  Border-radius: var(--r-md) = 12px
  Border:       1px solid var(--blue) (matches the existing card border treatment for entered races)
  Gap between elements: 12px (DS grid gap)
```

**Section content (top to bottom):**

1. **Starter line** (text row):
   ```
   Icon:   Flag (Lucide, 14px, colour: --blue-t)
   Text:   "Your animal is on the starting line!"
   Size:   13px / 600
   Colour: var(--blue-t)
   ```
   This is the warm, child-friendly prose that replaces "Entered — tap Race! to run".

2. **Progress bar**:
   See 4.4 below.

3. **Run Race! button**:
   Same `variant="primary" size="md"` as the current button. The button is `w-full`. Text
   reads "Run Race!" with a Lucide `Flag` icon at 14px to the right of the label (trailing
   icon, not leading). The trailing icon reinforces directionality — the race is ahead.

   The button is the primary call to action. It must not be visually buried. The blue-sub
   background of the section provides contrast; the `--blue` primary button sits on top.

### 4.4 Progress bar

The progress bar is a visual "tension builder" — it fills from left to right as a simulated
pre-race build-up. It is not connected to a real timer. Its purpose is aesthetic and
motivational.

```
Container:
  Height:       8px
  Radius:       100px (pill)
  Background:   var(--border-s) = #2C2F3A  (empty track)
  Width:        100%

Fill:
  Height:       8px
  Radius:       100px (pill)
  Background:   linear-gradient(to right, var(--blue), var(--pink))  (var(--grad-hero), reversed direction)
  Animation:    see below
```

**Animation — standard motion:**
```
Behaviour:      The bar fills to 100% once, then holds at 100% (it does not drain back)
Duration:       2000ms (2 seconds) to reach 100%
Easing:         ease-out (cubic-bezier(0.16, 1, 0.3, 1))
Initial:        width: 0%
Final:          width: 100%
Implementation: Framer Motion `initial={{ width: '0%' }}` `animate={{ width: '100%' }}` `transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}`
Trigger:        Runs once on mount of the PreRaceCountdown section
```

The bar is decorative. When it reaches 100% it simply holds — there is no timeout, no
automatic action, no pulsing at full. The player sees a full bar as a "ready" signal and taps
the button at their own pace. This is intentional — no time pressure.

**Animation — reduced-motion:**
```
Behaviour:      Bar is immediately rendered at 100% fill, no animation
Duration:       0ms
Implementation: Use `useReducedMotion` hook. When true, render fill at `width: '100%'` with no Framer Motion animation applied.
```

**Animation — "Racing" state (running, not waiting):**
The progress bar is not shown when `isWaiting` is false. The `RunningRaceCard` in running state
uses the existing countdown text (time remaining) which should be preserved as-is.

### 4.5 Running race card layout — full annotated structure

For the `isWaiting === true` case:

```
┌─────────────────────────────────────────────────────┐  card: bg --card, border --blue, rounded-2xl, p-5
│  [ Type icon 40×40 ]   [ Race name 15px/700 ]  [StatusLabel "Ready!"] │  header row: flex items-center, gap 12px, mb-4
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │  pre-race section: bg --blue-sub, rounded-xl, border --blue, p-4, gap 12px
│  │  [Flag 14px]  "Your animal is on the starting   │ │  starter line: 13px/600, --blue-t
│  │               line!"                            │ │
│  │  ──────────────────────────────────────────▓▓▓▓ │ │  progress bar: 8px, pill, grad-hero fill
│  │  [ Run Race!                          Flag  ]   │ │  primary button, w-full, trailing Flag icon
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

For the `isWaiting === false` (running/timing out) case:

```
┌─────────────────────────────────────────────────────┐
│  [ Type icon ]   [ Race name ]             [StatusLabel "Racing"] │  header row
│                  [ Countdown text ]                  │  existing countdown, preserved
│                                                      │
│  [ Reveal Result                        Trophy ]     │  primary button, w-full
└─────────────────────────────────────────────────────┘
```

### 4.6 Interaction states for PreRaceCountdown

| Element | Hover | Active | Disabled | Reduced-motion |
|---|---|---|---|---|
| Run Race! button | `--blue-h` bg + `--glow-blue` shadow | `scale(.97)` | `opacity .4` | Same, no transform |
| Progress bar fill | N/A (not interactive) | N/A | N/A | Instant full fill |
| Starter line text | N/A (not interactive) | N/A | N/A | No change |

---

## 5. Feature 3 — Nav Badge (Play Tab)

### 5.1 Purpose

The player enters a race, navigates away to care for animals or browse the shop, and then
forgets they have a race waiting. Currently there is no signal anywhere outside the Play screen
that a race needs their attention. The nav badge solves this by placing a persistent attention
indicator on the Play tab icon.

### 5.2 When the badge appears and disappears

The badge appears when EITHER condition is true:

- **Condition A — Entered race ready to run:** The player has at least one race where
  `status === 'open'` and `playerEntryPetId !== null`. (The race is entered and waiting for
  the player to tap "Run Race!".)
- **Condition B — Fresh result to view:** The player has at least one race where
  `status === 'finished'` and `updatedAt` is within the last 24 hours AND the player
  participated (has a `participants` entry where `isPlayer === true`).

The badge disappears when BOTH conditions become false:
- No entered open races remain.
- No fresh finished races with player participation remain.

The badge must update reactively via `useLiveQuery` (the existing pattern used in
`BottomNav.tsx`). It does not require a manual refresh.

The existing stub in `BottomNav.tsx` (lines 60–65) queries `finished` races on the Store tab.
This must be replaced: the query moves to the Play tab (`/play`), expands to include both
`open` (entered) and `finished` conditions, and is limited to races the player entered.

### 5.3 Visual treatment — dot badge

The badge is a dot, not a number. Rationale: the player does not need to know they have "3
races" — they need to know "something in Play needs me". A dot is sufficient. A number adds
visual noise and is not meaningful in this context (maximum daily races is small).

```
Shape:         Circle (w-2 h-2 = 8px diameter)
Colour:        var(--pink)   ← The reward/action accent; signals "something for you here"
Position:      absolute, top-0 right-0 of the icon wrapper div
Offset:        No negative offset — flush with the icon bounding box edge
z-index:       inherits from BottomNav (z-[900])
aria-hidden:   true (decorative; the tab label "Play" is already the accessible name)
```

Pink is chosen over blue because blue is the "active tab" colour. A blue dot on the active
tab would be invisible. Pink is visually distinct from both the active and inactive icon
colours.

### 5.4 Entrance and exit animation

```
Enter:
  Animation:     scale from 0 to 1
  Duration:      150ms (DS "fast")
  Easing:        ease-out (cubic-bezier(0.16, 1, 0.3, 1))
  Implementation: Framer Motion `initial={{ scale: 0 }} animate={{ scale: 1 }}`

Exit:
  Animation:     scale from 1 to 0
  Duration:      150ms (DS "fast")
  Easing:        ease-in (cubic-bezier(0.7, 0, 0.84, 0))
  Implementation: Framer Motion `exit={{ scale: 0 }}` inside `AnimatePresence`

Reduced-motion:
  Both enter and exit are instant (duration 0ms). Scale does not animate.
  Implementation: When `reducedMotion` is true, render the dot statically (no Framer Motion wrapper).
```

The `AnimatePresence` wrapper must be applied around the dot only, not around the entire tab
item. Tab items must not animate or shift layout when the badge appears/disappears.

### 5.5 Portal requirement

The badge is a child of the `BottomNav` component which is already `position: fixed`. The dot
badge is `position: absolute` within the icon wrapper — it does not need its own portal. The
existing BottomNav portal strategy (already fixed to viewport) covers it.

If the BottomNav is ever wrapped in a Framer Motion animated parent in future, the dot must
be re-evaluated for portal extraction. For now, no portal is needed.

### 5.6 Navigation ownership

The badge is owned by `BottomNav.tsx`. It must not be duplicated in `PlayHubScreen` or any
sub-component. The badge logic (the `useLiveQuery` call) lives entirely in `BottomNav.tsx`.

No prop is passed from `PlayHubScreen` to `BottomNav` to control the badge. `BottomNav`
derives its own badge visibility from the database, the same way it currently handles
`freshRaceCount`. This maintains separation of concerns.

### 5.7 Interaction states

| State | Treatment |
|---|---|
| Badge visible, Play tab inactive | Pink dot visible at top-right of Gamepad2 icon |
| Badge visible, Play tab active | Pink dot visible at top-right of Gamepad2 icon (blue active colour on icon; dot remains pink, still visible) |
| Badge not visible | Dot is not rendered (AnimatePresence handles exit) |
| Hover on Play tab (pointer device, iPad with keyboard) | Tab item colour shifts per existing BottomNav hover pattern; dot is unaffected |

---

## 6. PageHeader Slot Assignment

No new controls are added to the PageHeader for this feature. The existing Games/Racing
segmented control in the `centre` slot is unchanged. No new `below` slot content is
introduced.

Content top padding is unchanged: `pt-4` on the `RacingContent` container (already correct
at line 516 of PlayHubScreen, `px-6 pt-4 pb-24`).

---

## 7. Card Anatomy Summary (mandatory per CLAUDE.md)

### RaceCard (available, not entered)

| Element | Spec |
|---|---|
| Surface | `var(--card)`, `border: 1px solid var(--border-s)`, `border-radius: 16px`, `padding: 20px` |
| Icon circle | 40×40px, `background: var(--*-sub)` matching race type; icon at 28px matching tint |
| Race name | 16px / 700 / `var(--t1)` |
| Sub-row (runners, duration) | 12px / 400 / `var(--t3)`, `Clock` icon at 11px |
| Status label | NEW — tinted pill, top-right of header row. See 3.3 |
| Prize pool | `var(--amber-t)`, 15px / 700, `Coins` icon at 13px |
| Enter button | `variant="accent" size="md"`, full width |
| Hover state | `border: 1px solid var(--border)`, `translateY(-2px)`, `shadow: var(--sh-card)`, `transition: all 300ms` |
| Active state | `scale(.97)` |
| Empty state | Not applicable — card is only rendered when race exists |
| Owned/active state | N/A for this card type |

### RunningRaceCard (entered race)

| Element | Spec |
|---|---|
| Surface | `var(--blue-sub)`, `border: 1px solid var(--blue)`, `border-radius: 16px`, `padding: 20px` |
| Icon circle | 40×40px, same as RaceCard |
| Race name | 15px / 700 / `var(--t1)` |
| Status label | NEW — tinted pill, top-right of header row. "Ready!" (blue) or "Racing" (pink). See 3.3 |
| Pre-race section (isWaiting) | NEW — inner container, `var(--blue-sub)`, `border: 1px solid var(--blue)`, `border-radius: 12px`, `padding: 16px`, `gap: 12px`. See 4.3–4.4 |
| Starter line text | 13px / 600 / `var(--blue-t)`, `Flag` icon at 14px |
| Progress bar | 8px height, pill, `var(--border-s)` track, gradient fill. See 4.4 |
| Run Race! button | `variant="primary" size="md"`, full width, trailing `Flag` icon |
| Reveal Result button | `variant="primary" size="md"`, full width, trailing `Trophy` icon (existing, unchanged) |
| Countdown text (running) | 13px / 600 / `var(--blue-t)` (existing, unchanged) |
| Hover state | No hover lift on RunningRaceCard — it is an active/entered card, not a browse card. It must NOT receive the hover-lift pattern. The blue border already communicates selection. |

Note on hover: `RaceCard` (browseable) gets hover lift. `RunningRaceCard` (already committed)
does not. This is an intentional distinction — hover-lift communicates "you can tap this to
do something new". For an entered race the action is already committed; the card communicates
a status, not an invitation.

---

## 8. Animation Parameters (full reference)

| Animation | Element | Duration | Easing | Reduced-motion |
|---|---|---|---|---|
| Racing icon pulse | `Zap` icon in "Racing" status label | 1200ms / cycle, infinite | `ease-in-out` | Static, no pulse |
| Progress bar fill | Fill track in PreRaceCountdown | 2000ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Instant, 100% fill |
| Nav badge enter | Pink dot on Play tab | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Instant |
| Nav badge exit | Pink dot on Play tab | 150ms | `cubic-bezier(0.7, 0, 0.84, 0)` | Instant |

All animations use the `useReducedMotion` hook (already imported in `PlayHubScreen.tsx` and
available for `BottomNav.tsx`). The hook must be added to `BottomNav.tsx` if it does not
already exist there.

---

## 9. Overlay Surface Treatment

This feature introduces no new BottomSheets, Modals, or Toast variants. The existing
`EntrySheet` (BottomSheet) and `RaceResultOverlay` are unchanged. The glass rule does not
require re-specification here.

---

## 10. Consistency Check

| New element | Existing pattern it must match |
|---|---|
| `RaceStatusLabel` badge | DS tinted badge pattern (Badges / Pills section). Must match `RarityBadge` sizing (12px/600, 4px 10px padding, pill radius). |
| Progress bar fill gradient | Uses `var(--grad-hero)` direction reversed (`to right, --blue → --pink`). Consistent with RaceResultOverlay score bars which use `var(--blue)` fill. The gradient signals "race energy" rather than utility. |
| Nav badge dot | Must match the visual character of the existing `freshRaceCount` stub on the Store tab (same `bg-[var(--pink)]`, same `w-2 h-2` sizing, same `absolute top-0 right-0` placement). |
| RunningRaceCard hover (none) | Consistent with the Auction Detail bid row, which also does not hover-lift because it represents a committed action, not a browse item. |

---

## 11. Accessibility Notes

- **Status labels** pair colour with text and icon — colour is never the sole indicator.
- **Progress bar** is decorative and aria-hidden. It does not represent a real timer or
  deadline. It must not be labelled as a timer or progress indicator in ARIA terms.
- **Nav badge dot** is `aria-hidden="true"`. The Play tab's accessible name ("Play") is
  sufficient — screen readers will announce the tab and the user can navigate there to
  discover active races.
- **No time pressure** is created by any of these elements. The progress bar fills once
  and stops. There is no countdown that demands an action before time runs out. This is
  consistent with the DS accessibility rule: "No timers in educational games" and the
  broader intent to avoid anxiety-inducing UI.
- Minimum touch target of 44×44px is maintained. The status badge is not interactive and
  does not affect touch targets.
- The "Run Race!" button remains the primary call to action and must always be reachable
  via keyboard tab order after the card.

---

## 12. iPad Layout Notes (primary target: 1024px)

The racing content grid is `grid-cols-1 md:grid-cols-2` (already correct). At 1024px wide,
race cards render two per row. Status labels must not wrap or truncate at any card width
within this grid. At the minimum card width in a two-column grid on 1024px canvas
(approximately 440px per card after gutters), all label text is short enough (1–2 words) to
render inline without wrapping.

The PreRaceCountdown section is fully contained inside the card. It does not require
additional width to render correctly at any breakpoint.

The nav badge dot (8px) is small enough that it does not cause layout shift or overlap with
the Gamepad2 icon at any screen size.

FE must verify the following at 375px, 768px, and 1024px:
- Status labels are visible and not clipped on cards in single-column and two-column layouts.
- Progress bar fills correctly and does not overflow the card padding.
- Nav badge dot is visible and correctly positioned relative to the Gamepad2 icon at all sizes.

---

## 13. Open Questions for Phase B (PO)

1. **Finished race badge persistence:** Currently the badge condition for "fresh finished
   results" uses a 24-hour window (matching the existing `BottomNav` stub). Is 24 hours the
   right window, or should it clear as soon as the player visits the Play tab (regardless of
   how long ago the race finished)?
2. **"Upcoming" races:** The status label spec includes an `upcoming` state with "Soon" label.
   The current data model does not appear to surface `upcoming` races in the UI (they are not
   in `openRaces` or `finishedRaces`). PO to confirm: should upcoming races be shown in
   a new section, or does "upcoming" only apply to races that are not yet queryable?
3. **Progress bar realism:** The bar fills once in 2 seconds and holds. An alternative is
   to loop it slowly (fill → drain → fill) to sustain energy. UR finding on whether
   indefinite animation is calming or agitating for this user would inform this decision.
   Currently specified as fill-once-and-hold to avoid anxiety.

---

*This spec is complete and ready for Phase B. The PO can write acceptance criteria directly
from sections 2–7. The FE can build from sections 3–9 without making independent visual
decisions. All DS token values are explicit. All animation parameters are named. No values
are left to interpretation.*
