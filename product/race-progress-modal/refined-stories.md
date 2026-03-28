# Refined User Stories — RaceProgressModal

**Feature:** race-progress-modal
**Phase:** B (Product Owner)
**Author:** Product Owner agent
**Date:** 2026-03-28
**Status:** Awaiting [OWNER] approval before Phase C begins

---

## Phase B open questions — resolved

These were listed in `spec/features/race-progress-modal/interaction-spec.md` section 15.

1. **Can the modal open when the race is already "ready"?**
   YES. The modal always opens, regardless of whether `finishesAt` has elapsed. When opened
   against a ready race, the modal renders directly in state B (the "Ready to reveal!" state).
   There is no scenario where the card bypasses the modal and triggers the reveal directly.
   Rationale: the modal provides the Reveal Result CTA; removing it for the ready state would
   create an inconsistent tap target — sometimes tapping the card opens the modal, sometimes it
   resolves the race. Consistency wins.

2. **Should NPC breeds show in the participants strip?**
   YES. Breed is shown as secondary text per the spec. It adds contextual detail without
   increasing cognitive load. If post-launch UR finds it reads as noise for the target user,
   this is a candidate for a follow-up scope decision, not a pre-emptive removal.

3. **BottomSheet `maxHeight`:**
   Add a `maxHeight` prop to the existing `BottomSheet` component (`src/components/ui/Modal.tsx`).
   This is a minor targeted change, not a bespoke implementation. The prop defaults to `85vh`
   (preserving current behaviour) and `RaceProgressModal` passes `80vh`. This work is in
   scope for Phase C. FE must not hard-code the override with a `className` workaround —
   the prop must be the mechanism.

---

## Stories

---

### Story 1 — Opening the modal by tapping the RunningRaceCard body

```
As a player who has entered a race,
I need to be able to tap the RunningRaceCard body to open a race progress sheet,
So that I can see more detail about my race and reach the Reveal Result action.
```

**Acceptance criteria:**

- [ ] Tapping anywhere on the `RunningRaceCard` body (the outer card div) opens the
      `RaceProgressModal` as a BottomSheet sliding up from the bottom.
- [ ] The "Reveal Result" button on the `RunningRaceCard` calls `e.stopPropagation()` so that
      tapping it triggers the resolve flow directly and does not also open the modal.
- [ ] The modal is rendered via `ReactDOM.createPortal(content, document.body)` — it must not
      be rendered inside the `RacingContent` component tree (Framer Motion ancestors break
      fixed/absolute stacking context).
- [ ] The sheet panel animates in using `y: "100%" → 0` with a spring
      (`stiffness: 300, damping: 30`).
- [ ] The backdrop fades in at 200ms ease-out (`bg-black/30`, fixed inset-0, `z-[1000]`).
- [ ] With `prefers-reduced-motion` active, the sheet and backdrop appear instantly with no
      animation.
- [ ] The sheet has `maxHeight: 80vh` (via the new `maxHeight` prop on `BottomSheet`) rather
      than the default 85vh.
- [ ] The sheet panel uses the glass surface treatment: `rgba(13,13,17,.80)`,
      `backdrop-filter: blur(24px)`, `border-top: 1px solid rgba(255,255,255,.06)`,
      `border-left/right: 1px solid rgba(255,255,255,.04)`.
- [ ] The drag handle renders at the top of the sheet: 40×4px, `background: rgba(255,255,255,.2)`,
      `border-radius: 9999px`, centred, `margin: 8px auto 0`.
- [ ] On open, focus moves to the close button inside the modal.
- [ ] The sheet panel has `role="dialog"`, `aria-modal="true"`, `aria-label="Race progress"`.

**Out of scope:**

- Swipe-to-dismiss gesture (drag handle is visual only in this build).
- Opening the modal from any context other than the RunningRaceCard body tap.

---

### Story 2 — Viewing the player's entered animal in the hero section

```
As a player who has opened the race progress modal,
I need to see my entered animal displayed prominently at the top of the sheet,
So that I feel a personal connection to the race and can confirm which animal I entered.
```

**Acceptance criteria:**

- [ ] The animal hero section renders the pet identified by `race.playerEntryPetId`, looked up
      from `useSavedNames` by the parent component and passed as the `pet` prop.
- [ ] The `AnimalImage` component renders at 96×96px (`w-24 h-24`), `border-radius: 16px`
      (`--r-lg`), `border: 2px solid var(--blue)`, `box-shadow: var(--glow-blue)`.
- [ ] The pet name renders below the image at `text-[18px] font-700 text-t1`, centred.
- [ ] The breed renders below the name at `text-[13px] text-t3`, centred.
- [ ] The image performs a continuous vertical bob animation: `y: 0 → -6px → 0`,
      duration 2400ms, looping, easing `easeInOut`. The bob uses a `motion.div` wrapper with
      `display: inline-flex` — no layout shift.
- [ ] With `prefers-reduced-motion` active, the image renders statically with no bob.
- [ ] If `pet` is `null` (pet cannot be resolved), a placeholder renders:
      `w-24 h-24 rounded-2xl bg-[var(--elev)] border-2 border-[var(--blue)]` with a `Zap` icon
      (28px, `var(--blue-t)`) centred inside. The bob animation still plays on the placeholder.
- [ ] The hero section layout is `flex flex-col items-center gap-3 py-5`.

**Out of scope:**

- Displaying the pet's stats, rarity, or card count in this section.
- Navigation to the pet's detail screen from within this modal.

---

### Story 3 — Viewing NPC participants without position or ranking

```
As a player who has opened the race progress modal,
I need to see the other animals entered in this race,
So that I have a sense of the competition without being shown a position order that the
system has not yet revealed.
```

**Acceptance criteria:**

- [ ] The participants strip renders all entries in `race.participants` except the player's own
      entry (identified by `race.playerEntryPetId`). The player's animal is shown in the hero
      section above; it must not appear again in the strip.
- [ ] Participants render in their stored array order. The FE must not re-sort them.
- [ ] Each row renders: a 28px circular avatar (`bg-[var(--elev)]`, Zap icon 14px
      `var(--t4)` centred), participant name (`text-[13px] font-500 text-t2`), and breed
      (`text-[12px] text-t3`, `ml-auto`).
- [ ] The section label "RACING ALONGSIDE" renders above the rows:
      `text-[11px] font-700 uppercase tracking-widest text-t3 mb-2`.
- [ ] If there are more than 6 NPC participants, the first 6 render and a footer line
      `+N more runners` appears (`text-[12px] text-t3`), where N is the remaining count.
- [ ] If `race.participants` is empty (or after filtering out the player's entry there are no
      NPCs), the section label still renders and a single line "No other runners found"
      displays in `text-t3`.
- [ ] The strip is rendered as `<ul>` with `<li>` elements for assistive technology.
- [ ] No position numbers, rank indicators, speed indicators, or any relative ordering signals
      are shown. No language implying one participant is ahead of another.

**Out of scope:**

- Actual animal images for NPC participants (they have no `imageUrl`).
- Tapping a participant row to view that animal's details.
- Showing breed for NPCs that have no breed value (render nothing in the breed slot).

---

### Story 4 — Seeing the "Racing now..." progress bar during an active countdown

```
As a player who has opened the race progress modal while the countdown is still active,
I need to see a filling progress bar with reward-framed language,
So that I experience the wait as anticipation building rather than time running out.
```

**Acceptance criteria:**

- [ ] When `race.finishesAt` is in the future at the time the modal opens, the progress section
      renders in state A.
- [ ] The label "Racing now..." renders with a `Zap` icon (14px, `var(--blue-t)`) inline before
      the text, at `text-[13px] font-600 text-[var(--blue-t)]`.
- [ ] The progress bar track renders at `h-2 w-full rounded-full bg-[var(--elev)]`.
- [ ] The fill renders at `h-full rounded-full` with
      `background: linear-gradient(to right, var(--blue), var(--pink))`.
- [ ] The fill width is computed as:
      `((now - race.startsAt) / (race.finishesAt - race.startsAt)) × 100`, clamped to a
      minimum of 5% and a maximum of 95%.
- [ ] The fill updates every 5 seconds. It does not update every second.
- [ ] Between 5-second updates, the width transitions smoothly using `transition: width ease-out 4s`.
- [ ] The progress bar has `role="progressbar"`, `aria-valuenow` bound to the computed fill
      percentage (0–100), `aria-valuemin="0"`, `aria-valuemax="100"`,
      `aria-label="Race progress"`.
- [ ] When the computed fill is 80% or above, a sub-label "Almost there!" renders at
      `text-[12px] text-t3 text-right`. Below 80%, no sub-label renders.
- [ ] There is no raw `finishesAt` time displayed. No "Ends in", "Expires", "Time remaining",
      "Closes in", or deadline-framed language anywhere in the modal.
- [ ] With `prefers-reduced-motion` active, the fill jumps instantly to the computed value with
      no `transition` property applied. The 5-second tick still runs; only the animated
      transition is removed.

**Out of scope:**

- Showing the exact countdown in seconds or minutes.
- Displaying the `finishesAt` timestamp in any format.
- Per-second tick updates.

---

### Story 5 — Automatic transition to "Ready to reveal!" when countdown elapses

```
As a player who has the race progress modal open when the race becomes ready,
I need the modal to update in place to reflect that my result is available,
So that I do not need to close and reopen to see that the race has finished.
```

**Acceptance criteria:**

- [ ] The parent component polls or subscribes such that when `race.finishesAt` elapses while
      the modal is open, the progress section transitions from state A to state B without the
      player closing and reopening the modal.
- [ ] State A exit animation: `opacity: 1 → 0`, `y: 0 → -8px`, duration 200ms, easing ease-in.
- [ ] State B entrance animation: `opacity: 0 → 1`, `y: 8px → 0`, duration 300ms, easing
      ease-out, delayed 200ms (after state A has exited).
- [ ] State B renders: a `Trophy` icon at 32px `var(--amber-t)` with a scale pulse
      (`scale: 1.0 → 1.08 → 1.0`, 1500ms loop, ease-in-out); the text "Ready to reveal!" at
      `text-[20px] font-700 text-t1 text-center`; and sub-text "Your result is waiting." at
      `text-[13px] text-t3 text-center`.
- [ ] The `role="progressbar"` element is removed when the state transitions to B. The Trophy
      and text state requires no ARIA progressbar override.
- [ ] The CTA button simultaneously transitions from `variant="primary"` to `variant="accent"`
      with a single scale pulse: `scale: 1.0 → 1.03 → 1.0`, 300ms ease-out (once, not looping).
- [ ] No toast or additional notification fires alongside this transition — the modal content
      itself communicates the state change.
- [ ] With `prefers-reduced-motion` active: state A content disappears instantly, state B
      content appears instantly, the Trophy renders statically, and the CTA variant changes
      without a scale pulse.

**Out of scope:**

- Audio cues or haptic feedback on state transition.
- Automatic modal close when the race becomes ready (the player must tap the CTA).

---

### Story 6 — Revealing the result via the primary CTA

```
As a player viewing the race progress modal,
I need a clearly labelled "Reveal Result" button that works regardless of countdown state,
So that I can see my race outcome whenever I am ready, even before the countdown has elapsed.
```

**Acceptance criteria:**

- [ ] The "Reveal Result" button is always visible in the modal. It is never hidden or removed
      regardless of state.
- [ ] In state A (racing), the button uses `variant="primary"` (blue), `size="lg"`, `w-full`,
      with a `Trophy` icon (16px, `aria-hidden="true"`) inline before the label text.
- [ ] In state B (ready), the button uses `variant="accent"` (pink), `size="lg"`, `w-full`,
      same icon.
- [ ] Hover states per spec section 7: state A hover → `bg: var(--blue-h)` +
      `box-shadow: var(--glow-blue)`; state B hover → `bg: var(--pink-h)` +
      `box-shadow: var(--glow-pink)`.
- [ ] Active (pressed) state: `transform: scale(.97)` in both states.
- [ ] Focus state: `outline: 2px solid var(--blue); outline-offset: 2px` in both states.
- [ ] On tap: the modal closes (exit animation plays) and `onResolve(race)` fires, triggering
      the existing `handleResolve` flow. The player arrives at `RaceResultOverlay` with no
      extra steps.
- [ ] If `resolving === race.id` (a resolve is already in flight), the button is disabled
      (`opacity: .4; pointer-events: none`) and its label changes to "Revealing...". The modal
      does not auto-close in this state.
- [ ] The button has a visible text label at all times — it is never icon-only.

**Out of scope:**

- A confirmation step before revealing (the button reveals immediately on tap).
- Separate "early reveal" vs "normal reveal" flows — the button behaves identically in both
  states; the variant change is purely visual.

---

### Story 7 — Dismissing the modal without revealing

```
As a player who has opened the race progress modal,
I need to be able to dismiss it without triggering the result reveal,
So that I can check the progress view and return to it later without being forced into the
result flow.
```

**Acceptance criteria:**

- [ ] Tapping the backdrop (outside the sheet panel) closes the modal. `onResolve` does not
      fire. The `RunningRaceCard` remains in place on the Racing tab.
- [ ] Tapping the close button (X, top-right of the sheet) closes the modal. `onResolve` does
      not fire.
- [ ] The close button is 32px circle, `bg: var(--elev)`, `color: var(--t3)`. Hover:
      `bg: var(--border)`, `color: var(--t1)`. Active: `transform: scale(.97)`. Focus:
      `outline: 2px solid var(--blue); outline-offset: 2px`.
- [ ] The close button has `aria-label="Close race progress"`.
- [ ] Tapping anywhere on the modal panel (other than the backdrop) does not close the modal.
      The panel uses `e.stopPropagation()` or equivalent.
- [ ] The sheet panel exits with `y: 0 → "100%"`, spring `stiffness: 300, damping: 30`.
- [ ] The backdrop fades out at 200ms ease-in.
- [ ] On close, focus returns to the `RunningRaceCard` that triggered the open.
- [ ] With `prefers-reduced-motion` active, the sheet and backdrop disappear instantly.
- [ ] If the race is resolved externally while the modal is open (e.g. the `RunningRaceCard`
      unmounts because the race record transitions to `finished`), the parent sets `isOpen`
      to `false` and the modal closes. `onResolve` does not fire from the modal in this case.

**Out of scope:**

- Swipe-to-dismiss gesture.
- Confirmation prompt before dismiss ("Are you sure you want to leave?").

---

### Story 8 — Opening the modal when the race is already in the ready state

```
As a player whose race countdown has already elapsed but who has not yet tapped
"Reveal Result",
I need tapping the RunningRaceCard body to open the modal directly in the ready state,
So that I reach the prominent "Reveal Result" CTA without an intermediate racing-state view
that is no longer accurate.
```

**Acceptance criteria:**

- [ ] When `race.finishesAt` has already elapsed at the time the modal opens, the modal renders
      directly and exclusively in state B — "Ready to reveal!". State A (progress bar) is
      never shown, not even briefly.
- [ ] State B content on immediate open: `Trophy` icon 32px `var(--amber-t)` with scale pulse
      loop active; "Ready to reveal!" at `text-[20px] font-700 text-t1 text-center`;
      "Your result is waiting." at `text-[13px] text-t3 text-center`.
- [ ] The CTA button opens in `variant="accent"` (pink) — not blue — when the modal opens in
      state B directly.
- [ ] The state A → B transition animation does not play when the modal opens directly in
      state B. There is nothing to transition from.
- [ ] The sheet open animation still plays normally (spring slide-up).
- [ ] All other acceptance criteria from Story 6 (CTA behaviour) apply when the modal opens
      in state B.

**Out of scope:**

- Auto-opening the modal when the countdown elapses while the modal is closed (the player
  must tap the card to open it).

---

### Story 9 — BottomSheet `maxHeight` prop (component change)

```
As a developer implementing the race progress modal,
I need the BottomSheet component to accept a configurable maxHeight prop,
So that RaceProgressModal can use 80vh without a workaround and without affecting the
default 85vh used by all other sheets.
```

**Acceptance criteria:**

- [ ] `BottomSheet` in `src/components/ui/Modal.tsx` accepts a `maxHeight` prop of type
      `string` (e.g. `"80vh"`, `"85vh"`).
- [ ] The prop defaults to `"85vh"` — all existing BottomSheet usages are unchanged.
- [ ] `RaceProgressModal` passes `maxHeight="80vh"` to the `BottomSheet` component.
- [ ] No other component passes an explicit `maxHeight` prop (no unintended side-effects).
- [ ] On a 375px viewport with the modal open, the Reveal Result CTA is visible without
      internal scroll in the most common case (5 NPC participants, state A). If it clips,
      the internal scroll container is the fallback — not a maxHeight increase.

**Out of scope:**

- Dynamic maxHeight calculation based on content height.
- A `minHeight` prop (not required by this feature).

---

## Out of scope for this feature

The following are explicitly excluded from all stories in this feature. Any request to include
these during Phase C constitutes scope creep and requires a PO scope decision before build.

- **Simulated live race positions** — no numbered positions (1st, 2nd, 3rd), no horse-race
  bars, no relative position indicators, no staggered name reveals, at any point during or
  after the race countdown.
- **Movement implying relative speed** — no animation that suggests one participant is
  advancing faster than another.
- **Language implying the outcome is known** — no "your animal is leading", "looks good!",
  "neck and neck", or similar.
- **Deadline or urgency framing** — no "Ends in", "Expires", "Time running out", "Closes in",
  "Hurry", or any raw `finishesAt` countdown string.
- **Prize pool display in the modal** — this is an in-race anticipation moment, not a decision
  moment. Prize information belongs on the `RaceCard` and `EntrySheet`.
- **Navigation to pet detail screen from within the modal** — tapping the animal image does
  nothing.
- **NPC actual animal images** — NPC participants have no `imageUrl`; the generic silhouette
  avatar is the correct treatment and is not a gap to be filled.
- **Audio or haptic feedback** on any modal state change.
- **Swipe-to-dismiss gesture** on the bottom sheet.
- **Per-second tick updates** on the progress bar — 5-second ticks are intentional.

---

## Definition of Done

All conditions below must be true before this feature's backlog status is set to `complete`.

### Functional

- [ ] Stories 1–9 have been built and all acceptance criteria pass.
- [ ] `tests/race-progress-modal/test-results.md` exists and contains Tester sign-off.
- [ ] `spec/features/race-progress-modal/done-check.md` has been completed (Phase E).

### Design system — 10-point checklist

All ten checks must be explicitly listed and passed in `tests/race-progress-modal/test-results.md`.

Checks 1–6 are scoped to this feature's files. Checks 7–10 are app-wide.

1. **No emojis used as icons** — Lucide only everywhere in JSX, data files, toast messages,
   and button labels. Applies to all files changed in this feature.
2. **No `ghost` variant on visible actions** — search the entire codebase for
   `variant="ghost"`. Any pre-existing ghost button found must be logged as a defect against
   the screen that owns it.
3. **All colours trace to `var(--...)` tokens** — no hardcoded hex values. Alpha composites
   of DS tokens (e.g. `rgba(13,13,17,.80)`) are permitted only where documented in the DS
   glass rule.
4. **Surface stack is correct** — the sheet steps up one level from page content; the glass
   rule applies. The backdrop is `bg-black/30`, not a higher opacity.
5. **Layout verified at 375px, 768px, and 1024px** — no wasted space, no cut-off content,
   no CTA clipping. Resized in browser; not confirmed by CSS inspection alone.
6. **All scrollable content has `pb-24` minimum** — not applicable to the modal's internal
   scroll, but the Racing tab content below the modal must retain its `pb-24`.
7. **Top-of-screen breathing room** — every screen with a sticky glass header must have at
   least `pt-4` clearance below the header. Confirm the Racing tab is unaffected by this
   build.
8. **Navigation controls are compact and consistent** — no new tab switcher or filter pill
   row is introduced by this feature. Confirm no regressions in the Play hub header.
9. **Animation parameters match the spec** — for every animation in section 10 of the
   interaction spec, record observed values (duration, easing, amplitude) and confirm they
   match. Any deviation is a defect.
10. **Spec-to-build element audit** — scroll the modal from top to bottom and list every
    visible element. Compare against the page structure diagram in section 9 of the
    interaction spec. Any element present in the build but absent from the spec, or absent
    from the build but present in the spec, is a defect.

### Accessibility

- [ ] `role="dialog"`, `aria-modal="true"`, `aria-label="Race progress"` on the sheet panel.
- [ ] Focus trapped inside the sheet when open. Focus moves to close button on open; returns
      to `RunningRaceCard` on close.
- [ ] `aria-label="Close race progress"` on the close button.
- [ ] Progress bar has `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`,
      `aria-label` in state A.
- [ ] Trophy icon is `aria-hidden="true"`. "Reveal Result" button has a visible text label.
- [ ] Participants strip uses `<ul>` / `<li>` markup.
- [ ] `prefers-reduced-motion` respected for all animations listed in interaction spec
      section 10.

### Regression

- [ ] No existing BottomSheet usages are broken by the `maxHeight` prop addition (all default
      to `85vh`).
- [ ] The `RunningRaceCard` "Reveal Result" button still triggers resolve correctly when tapped
      directly (without opening the modal).
- [ ] The `EntrySheet` and all other bottom sheets open and close correctly.

---

## Spec reference

- Interaction spec: `spec/features/race-progress-modal/interaction-spec.md`
- UR findings (applied): `research/racing-improvements/ur-findings.md`
- Design system: `design-system/DESIGN_SYSTEM.md`
- Backlog entry: `spec/backlog/BACKLOG.md` — "Race progress modal", Tier 2, `queued`

---

_Phase C must not begin until [OWNER] has explicitly approved this document._
