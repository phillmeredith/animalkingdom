# Refined Stories: Racing Improvements

> Output from the Product Owner agent.
> Produced during Phase B after UR findings and interaction spec are complete.
> Feature: racing-improvements
> Date: 2026-03-28
> Phase B status: APPROVED — Phase C may begin after [OWNER] confirms approval.

---

## Feature context

The racing feature on the Play hub has three observable gaps that prevent Harry (age 8–12,
ADHD and autism) from understanding what is happening with his entered races and from
returning to collect results. Currently: race cards have no visual status badge (state is
implied by context and prose); any entered race shows a text countdown framed as a deadline
("Ends in Xm Ys") with no visual representation; and there is no indicator anywhere outside
the Play tab that a race result is waiting.

These three improvements address those gaps in a way that is exciting rather than pressuring,
and legible at a glance without reading. No new screens, routes, or data model fields are
introduced. All changes are in-place modifications to `RaceCard`, `RunningRaceCard`, and
`BottomNav`.

The UR finding with highest relevance to this feature: deadline framing ("Ends in") is
anxiety-inducing for ADHD children; anticipation framing ("Racing" / progress toward reward)
is motivating. Every decision about copy, colour, and animation in this feature is made in
service of that distinction.

---

## Scope decisions

**In scope:**

- `RaceStatusLabel` component — tinted pill badge on every race card for states: `open`
  (not entered), `open` (entered, ready to run), `running`, `finished`
- `PreRaceCountdown` section — inner section on `RunningRaceCard` when `isWaiting` is true,
  replacing the flat button layout with a visual progress bar and energetic CTA
- Nav badge on the Play tab in `BottomNav` — pink dot, derived from a live Dexie query,
  appearing when an entered open race is waiting OR when a fresh finished race has not yet
  been seen; clears on Play tab visit

**Out of scope (this iteration):**

- `upcoming` status label ("Soon") — the current data model does not surface upcoming races
  in the `openRaces` query. Scoping out avoids building UI for a state that is not reachable.
  Revisit when the data layer exposes upcoming races.
- 24-hour badge persistence for finished races — the badge clears on Play tab visit (simpler;
  avoids a stale badge if the player never returns). The 24-hour window in the existing
  BottomNav stub is removed.
- Push notifications / out-of-app alerts — no evidence Harry's usage pattern requires them.
  The in-app nav badge is sufficient for now; revisit after usability testing.
- Race name language changes (e.g. replacing "Endurance") — separate UX and copy task;
  not addressed here.
- Any changes to `RaceResultOverlay`, `EntrySheet`, or the existing countdown text in the
  `running` (not `isWaiting`) card state — these are not broken; scope is additive only.
- Runner count display changes — UR flags this as a potential cognitive load issue but it
  is a separate concern and unvalidated. Do not touch.

---

## Scope decision record — open question resolutions

| Question (from spec section 13) | Decision | Rationale |
|---|---|---|
| Finished race badge: 24-hour window or clear on Play tab visit? | Clear on Play tab visit | Simpler; avoids stale badge if player never visits. No time window to reason about or test. |
| "Upcoming" label: in scope? | Out of scope | State is not currently reachable in the data model. Do not build UI for it. |
| Progress bar: fill-once or loop? | Fill once and hold | UR confirms deadline-style animation (loop → drain → loop) risks anxiety. Fill-once reads as "ready"; it does not create urgency. Spec already states fill-once-and-hold — no change needed. |

---

## Mandatory AC blocks

The following mandatory blocks apply to this feature. NAV-1 through NAV-6 apply because
this feature modifies the BottomNav tab badge (navigation element). ANIM-1 through ANIM-6
apply because this feature introduces animation on the progress bar fill and nav badge enter/exit.

The TRANS blocks do not apply — no coin spend, pack opening, or marketplace transaction is
introduced or modified by this feature.

---

## Refined user stories

---

### Story 1 — Race status labels

As Harry (age 8–12, ADHD),
I need to see a clear colour-coded label on every race card that tells me at a glance
what state each race is in,
So that I can understand what each race needs from me without reading a full sentence or
inferring state from the absence of a button.

**Acceptance criteria:**

- [ ] A `RaceStatusLabel` component is created. It is a self-contained pill badge component,
      not inline JSX. It accepts a `status` prop and an `isEntered` boolean to distinguish
      entered-open from not-entered-open.
- [ ] The label renders for every `status` value in scope:

  | Race state | Display text | Background token | Text/icon token | Icon (Lucide 10px) |
  |---|---|---|---|---|
  | `open`, not entered | "Enter now" | `var(--green-sub)` | `var(--green-t)` | `Zap` |
  | `open`, entered (`isWaiting`) | "Ready!" | `var(--blue-sub)` | `var(--blue-t)` | `Flag` |
  | `running` | "Racing" | `var(--pink-sub)` | `var(--pink-t)` | `Zap` (animated) |
  | `finished` | "Done" | `rgba(119,126,145,.12)` | `#B1B5C4` | `Trophy` |

- [ ] The badge anatomy matches the DS tinted badge pattern exactly: `inline-flex`,
      `align-items: center`, `gap: 5px`, `padding: 4px 10px`, `border-radius: 100px`,
      `font-size: 12px`, `font-weight: 600`. No deviation is permitted.
- [ ] No solid colour backgrounds are used on the badge. Only `--*-sub` translucent
      backgrounds are permitted per spec section 3.3.
- [ ] The badge visual matches the sizing of the existing `RarityBadge` component (12px/600,
      4px 10px padding, pill radius). Tester to compare side-by-side.
- [ ] On `RaceCard` (available, not entered): the `RaceStatusLabel` is placed in the top-right
      of the card header row, to the left of the prize pool block, with `gap: 8px` between
      the label and prize pool. The prize pool remains trailing-rightmost.
- [ ] On `RunningRaceCard` (entered): the `RaceStatusLabel` is placed in the top-right of the
      card header row, replacing the existing prose text "Entered — tap Race! to run" / "In
      progress" from the header. That prose line is removed from the header.
- [ ] The "Racing" state `Zap` icon pulses: `opacity: [1, 0.5, 1]`, `duration: 1200ms`,
      `ease-in-out`, `repeat: Infinity`. Pulse is on the icon only — badge background is static.
- [ ] When `prefers-reduced-motion` is active, the "Racing" icon renders at full opacity with
      no animation. All other states are unaffected by reduced motion.
- [ ] The badge is not interactive: no `tabIndex`, no click handler, no keyboard role. It does
      not affect the card's touch target.
- [ ] Accessibility: colour is not the sole state indicator. Every label combines colour, icon,
      and text. This is verified by Tester by disabling CSS colour and confirming state is
      still distinguishable.
- [ ] The badge text does not wrap or truncate at any breakpoint within the card grid:
      375px (single column), 768px (single column), 1024px (two-column grid, approximately
      440px per card). Tester verifies at all three breakpoints.

**NAV block (navigation element — BottomNav badge):**

These apply to Story 3 (nav badge). Included here for completeness; full AC in Story 3.

**ANIM block:**

- [ ] ANIM-1 — "Racing" animation contains: `Zap` icon, `opacity` oscillation `1.0 → 0.5 → 1.0`.
      No other element animates in the label.
- [ ] ANIM-2 — Animation parameters defined in interaction spec section 8. FE must not choose
      values independently.
- [ ] ANIM-3 — Reduced motion: "Racing" icon renders at `opacity: 1`, static. No pulse.
- [ ] ANIM-4 — Duration cap: the label's "Racing" pulse is infinite background animation and
      does not gate any CTA. No action is blocked by the animation.
- [ ] ANIM-5 — Not applicable (label is not an overlay; no CTA is obscured).
- [ ] ANIM-6 — Not applicable (no rarity tier system in this component).

**Out of scope for this story:**

- "Soon" / `upcoming` label — scoped out; data model does not surface this state.
- Changes to the card hover pattern — specified separately per card anatomy in spec section 7.
  `RaceCard` retains hover lift; `RunningRaceCard` does not receive hover lift. This is
  enforced by the interaction spec, not by this label.

**Notes from UX / UR:**

- UR finding 1 (high confidence): children with ADHD scan rather than read. Redundant signals
  (colour + icon + text) are essential, not decorative.
- UR finding 3 (medium confidence): "Running", "In progress" are adult-register terms. "Racing"
  is more accessible and energetic. Label copy approved by PO.
- UX spec section 3.2 rationale: "Done" uses a neutral tint to visually recede — it is
  historical context, not a call to action.

---

### Story 2 — Pre-race countdown section

As Harry (age 8–12, ADHD),
I need to see an energetic visual section on my entered race card that makes it obvious
my animal is ready to run and that something exciting is about to happen,
So that I feel motivated to tap "Run Race!" and do not miss or overlook the action at a
moment when it matters most.

**Acceptance criteria:**

- [ ] A `PreRaceCountdown` section renders inside `RunningRaceCard` when and only when
      `isWaiting` is true (`race.status === 'open'` and `race.playerEntryPetId !== null`).
- [ ] The section does not render when `isWaiting` is false (i.e. `status === 'running'`).
      The existing countdown text and "Reveal Result" button continue to render in that state
      unchanged.
- [ ] The section container uses: `background: var(--blue-sub)`, `border: 1px solid var(--blue)`,
      `border-radius: var(--r-md)` (12px), `padding: 16px`, `gap: 12px` between children.
- [ ] The section contains exactly three children in order, top to bottom:
  1. Starter line: `Flag` icon at 14px, `color: var(--blue-t)`, followed by text
     "Your animal is on the starting line!" at `13px / 600 / var(--blue-t)`.
  2. Progress bar (see below).
  3. "Run Race!" button: `variant="primary" size="md"`, `width: 100%`, with a trailing
     `Flag` icon at 14px. No other content appears in the section.
- [ ] The starter line text reads exactly "Your animal is on the starting line!" — not
      "Entered — tap Race! to run" (which is removed) and not any other paraphrase.
- [ ] The "Run Race!" button uses `variant="primary"`, not `variant="accent"` or
      `variant="ghost"`. The trailing icon is `Flag` at 14px, placed after the label text.
- [ ] The existing prose text "Entered — tap Race! to run" is removed from the `RunningRaceCard`
      header. The `RaceStatusLabel` ("Ready!") is the new header-level visual signal.
- [ ] Progress bar track: `height: 8px`, `border-radius: 100px`, `background: var(--border-s)`,
      `width: 100%`.
- [ ] Progress bar fill: `height: 8px`, `border-radius: 100px`,
      `background: linear-gradient(to right, var(--blue), var(--pink))`.
- [ ] Progress bar animation (standard motion): fill animates from `width: 0%` to `width: 100%`
      over `2000ms` with easing `cubic-bezier(0.16, 1, 0.3, 1)`. Animation runs once on mount.
      The fill holds at 100% — it does not drain back, loop, or trigger any automatic action.
- [ ] Progress bar animation (reduced motion): when `prefers-reduced-motion` is active, the
      fill renders immediately at `width: 100%` with no animation. The `useReducedMotion` hook
      is used. No Framer Motion animation is applied in reduced motion mode.
- [ ] The progress bar is `aria-hidden="true"`. It is not labelled as a timer or progress
      indicator. It must not imply a deadline — it is decorative.
- [ ] The "Run Race!" button is visible and tappable at 375px, 768px, and 1024px. It is not
      obscured by the progress bar fill or any other element in the section.
- [ ] The complete `RunningRaceCard` layout in the `isWaiting` state matches spec section 4.5
      diagram exactly: header row (type icon, race name, "Ready!" StatusLabel), then
      pre-race section (starter line, progress bar, Run Race! button). No other elements appear.
- [ ] The progress bar fill does not overflow the card's horizontal padding at any breakpoint.
      Tester verifies at 375px, 768px, and 1024px.

**ANIM block:**

- [ ] ANIM-1 — Progress bar animation contains: fill track expanding from `0%` to `100%` width
      over 2 seconds. No other animated element in this section.
- [ ] ANIM-2 — Animation parameters defined in interaction spec section 4.4 and section 8.
      FE must not choose duration, easing, or trigger independently.
- [ ] ANIM-3 — Reduced motion: fill renders at `width: 100%` instantly. No Framer Motion
      animation applied. `useReducedMotion` hook drives the decision.
- [ ] ANIM-4 — Duration cap: the progress bar is decorative and does not gate the CTA. The
      "Run Race!" button is visible and tappable from the moment the section mounts, before the
      bar animation completes.
- [ ] ANIM-5 — "Run Race!" button is not obscured by the progress bar at any point during
      animation (bar is above the button in the layout; it does not overlap). Tester verifies
      by watching the animation play at 375px and 1024px.
- [ ] ANIM-6 — Not applicable.

**Out of scope for this story:**

- Changes to the `running` (not `isWaiting`) card layout — the existing countdown text
  ("Ends in Xm Ys") and "Reveal Result" button are preserved. Reframing the countdown copy
  is out of scope for this iteration; the UR finding notes the deadline framing but fixing
  it requires copy decision and scope agreement.
- Automatic race resolution — the player still taps "Run Race!" manually. No autoplay.
- Any changes to `EntrySheet`, `RaceResultOverlay`, or the race entry flow.

**Notes from UX / UR:**

- UR finding 4 (high confidence): deadline framing increases anxiety. The pre-race section
  uses zero deadline language. "Your animal is on the starting line!" is an anticipation frame.
- UR finding 5 (high confidence): visual progress is more legible than numeric time for
  children aged 8–12. The bar replaces the text countdown in the `isWaiting` state.
- UR finding 6 (high confidence): no countdown must appear on the available race card. The
  `PreRaceCountdown` section is limited strictly to entered races (`isWaiting === true`).
- UR finding 7 (high confidence): when the bar reaches 100% the card state is fully "ready".
  The CTA must already be visible and prominent — no dead-end state.
- The `isWaiting` condition (`status === 'open'` + `playerEntryPetId !== null`) is a narrow
  timing window per UR finding (see R-04 in ur-findings.md). The Developer must confirm with
  the PO if this state becomes unreachable in practice after code review — if so, the story
  scope is adjusted.

---

### Story 3 — Nav badge on Play tab

As Harry (age 8–12, ADHD),
I need to see a small indicator on the Play tab when one of my races needs my attention,
So that I know something good is waiting for me in racing even when I am on a different
part of the app, without having to check the Play tab manually.

**Acceptance criteria:**

**Badge visibility logic:**

- [ ] The badge appears on the Play tab (`/play`) when at least one of the following conditions
      is true:
  - Condition A — An entered open race: at least one race where `status === 'open'` and
    `playerEntryPetId !== null` (race is entered, waiting for player to tap "Run Race!").
  - Condition B — A fresh finished race: at least one race where `status === 'finished'`
    and the player participated (`participants` entry where `isPlayer === true`) and the
    result has not yet been seen (see "clear" condition below).
- [ ] The badge disappears (and does not reappear) when BOTH conditions are false.
- [ ] The badge clears for Condition B races when the player visits the Play tab (`/play`).
      There is no 24-hour window. The existing `BottomNav` stub's time-window query is removed
      and replaced with this logic.
- [ ] The badge clears for Condition A races automatically when no entered open races remain
      (because the race status has moved to `running` or `finished`).
- [ ] Badge visibility updates reactively via `useLiveQuery`. It does not require manual
      refresh or a page reload.

**Badge ownership and implementation:**

- [ ] The badge logic (the `useLiveQuery` call) lives entirely in `BottomNav.tsx`. No prop
      controlling badge visibility is passed from `PlayHubScreen` or any parent component.
      `BottomNav` derives its own badge state from the database.
- [ ] The existing stub in `BottomNav.tsx` (lines 60–65) that fires on the `/shop` tab and
      queries only `finished` races is removed and replaced. The new query targets the
      `/play` tab exclusively.
- [ ] The badge does not appear on any tab other than the Play tab (`/play`).

**Badge visual treatment:**

- [ ] Badge shape: circle, `width: 8px`, `height: 8px` (`w-2 h-2`).
- [ ] Badge colour: `background: var(--pink)`. No other colour is used.
- [ ] Badge position: `position: absolute`, `top: 0`, `right: 0` of the icon wrapper `div`.
      No negative offset — flush with the icon bounding box edge.
- [ ] Badge is `aria-hidden="true"`. No ARIA role or label is added to the badge element.
      The Play tab's accessible name ("Play") is sufficient; screen reader users navigate to
      the tab and discover races on screen.
- [ ] The badge does not cause layout shift in the BottomNav. Tab items do not move or resize
      when the badge appears or disappears. Tester verifies by toggling the badge condition
      and observing tab layout at 375px and 1024px.

**Badge animation:**

- [ ] Enter animation: `scale` from `0` to `1`, `duration: 150ms`,
      easing `cubic-bezier(0.16, 1, 0.3, 1)`. Implemented via Framer Motion
      `initial={{ scale: 0 }} animate={{ scale: 1 }}`.
- [ ] Exit animation: `scale` from `1` to `0`, `duration: 150ms`,
      easing `cubic-bezier(0.7, 0, 0.84, 0)`. Implemented via Framer Motion
      `exit={{ scale: 0 }}` inside `AnimatePresence`.
- [ ] `AnimatePresence` is scoped to the dot element only. It does not wrap the tab item or
      any sibling element. Tab items must not animate or shift when the badge appears/disappears.
- [ ] When `prefers-reduced-motion` is active, the dot renders and removes instantly (duration
      0ms). No scale animation. The `useReducedMotion` hook drives this — when true, the dot
      is rendered as a static element without Framer Motion animation.

**NAV block:**

- [ ] NAV-1 — Host component and slot: the badge renders inside `BottomNav.tsx`, on the
      Play tab item (`to === '/play'`). It is positioned `absolute top-0 right-0` inside the
      icon wrapper `div`. No other slot is used.
- [ ] NAV-2 — Match existing pattern: the badge dot matches the visual character of the
      existing stub on the Store tab (same `bg-[var(--pink)]`, same `w-2 h-2` sizing, same
      `absolute top-0 right-0` placement). The stub is the reference; the new implementation
      must match it visually while correcting the tab target and query logic.
- [ ] NAV-3 — Default state on first render: if no races meet Condition A or Condition B,
      the badge is not rendered. On first app load with no entered races, the badge is absent.
      `useLiveQuery` initialises to the computed state without a loading flash.
- [ ] NAV-4 — Active indicator: the badge is a pink dot (`var(--pink)`). Pink is chosen
      specifically because it is visually distinct from both the active tab colour (`var(--blue)`)
      and the inactive tab colour (`var(--t3)`). No other colour is acceptable.
- [ ] NAV-5 — Empty state: the Play tab has no "empty state" in the navigation sense. The
      badge's absence is the signal that no attention is needed. No placeholder dot or muted
      indicator is shown.
- [ ] NAV-6 — Spacing from header: not applicable to the nav badge itself. The existing
      `pt-4` on `RacingContent` (spec section 6) is unchanged and confirmed correct.
      Tester verifies `pt-4` is present at 375px and 1024px.

**ANIM block:**

- [ ] ANIM-1 — Badge animation contains: `scale` enter (0 → 1) and exit (1 → 0) on the
      dot element. No other element animates as part of the badge.
- [ ] ANIM-2 — Animation parameters defined in interaction spec section 5.4 and section 8.
      FE must not choose duration or easing independently.
- [ ] ANIM-3 — Reduced motion: dot renders and removes instantly. No scale animation.
      `useReducedMotion` hook drives this decision.
- [ ] ANIM-4 — Duration cap: badge animation is 150ms. It does not gate any action. The
      player can tap the Play tab before, during, or after the animation.
- [ ] ANIM-5 — Not applicable (badge is a dot, not an overlay; no CTA is obscured).
- [ ] ANIM-6 — Not applicable.

**Out of scope for this story:**

- Number badge (count of pending races) — a dot is sufficient and avoids quantitative
  obligation. A number badge is a separate decision requiring product review.
- Pulsing animation on the badge — UR finding 3d recommends a pulse but the interaction
  spec does not include one. Scoping out to match the spec; add in a future iteration if
  usability testing shows the dot is missed.
- Out-of-app notifications — out of scope (see global out of scope section).
- Badge on any tab other than Play.

**Notes from UX / UR:**

- UR finding 8 (high confidence): no nav badge currently exists. The gap is directly
  observable from the code. This is the highest-priority improvement in the feature set.
- UR finding 9 (medium confidence): negative-valence badges (red, "alert") can trigger
  avoidance in ADHD children. Pink is chosen as a reward-associated colour, not an alarm.
- UR finding 10 (high confidence): the badge must disappear once results are collected. A
  lingering badge erodes trust in the signalling system.
- UX spec section 5.3: pink over blue rationale — blue is the active tab colour; a blue dot
  on the active Play tab would be invisible. Pink is always visible on both active and
  inactive states.

---

## Definition of Done (confirmed)

This feature is complete when:

- [ ] All three stories pass all acceptance criteria above
- [ ] Every applicable mandatory AC block is checked and passed:
  - ANIM-1 through ANIM-5 for Story 1 (racing icon pulse)
  - ANIM-1 through ANIM-5 for Story 2 (progress bar animation)
  - ANIM-1 through ANIM-5 for Story 3 (nav badge animation)
  - NAV-1 through NAV-6 for Story 3 (nav badge)
- [ ] `RaceStatusLabel` is a standalone component, not inline JSX, and is used in both
      `RaceCard` and `RunningRaceCard`
- [ ] `PreRaceCountdown` section is a clearly identifiable block (component or named section)
      within `RunningRaceCard`, not scattered inline styles
- [ ] The `BottomNav` badge stub on `/shop` is removed. No dead badge code remains.
- [ ] `useReducedMotion` is applied to every animation in this feature:
      racing icon pulse, progress bar fill, nav badge enter/exit
- [ ] Every screen state in the interaction spec (sections 4.5, 5.7) is built and verified
- [ ] Tester has run the 10-point DS checklist in `tests/racing-improvements/test-results.md`
      and all ten checks pass
- [ ] Tester has verified all layouts at 375px, 768px, and 1024px
- [ ] Tester has verified NAV-6 (content spacing from header) at 375px and 1024px
- [ ] Tester sign-off received in `tests/racing-improvements/test-results.md`
- [ ] No ghost button variants introduced (DS checklist item 2 — verified per-file during
      build, not deferred to Phase D)
- [ ] No emojis in JSX, data files, or toast messages
- [ ] No hardcoded hex values outside the `Done` label's approved `#B1B5C4` value (which is
      the `--t3` token value; FE must verify this matches the current token definition)

---

## Sign-off

Phase B: APPROVED — refined stories complete. Phase C may begin after [OWNER] confirms approval.

> PO note: The Developer should review UR finding R-04 (the `isWaiting` state may be a very
> narrow or unreachable timing window in practice) before beginning Phase C. If `enterRace()`
> immediately transitions `status` to `running` as the UR notes, the `isWaiting === true`
> branch (and therefore the `PreRaceCountdown` section) may never render in the current
> flow. This must be confirmed before building Story 2. If the state is unreachable, the
> Developer raises a scope question with [OWNER] — do not build a section that can never be
> shown, and do not silently change the data model to make it reachable.
