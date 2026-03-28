# Refined User Stories — card-collection-detail

**Feature:** CollectedCardDetailSheet
**Phase:** B (PO)
**Date:** 2026-03-28
**Status:** Awaiting owner approval before Phase C begins
**Backlog entry:** Card collection detail sheet — Tier 2, queued
**Spec source:** `spec/features/card-collection-detail/interaction-spec.md`

---

## Summary

Tapping a card in the Collection grid currently has no behaviour. This feature adds a
`CollectedCardDetailSheet` bottom sheet that surfaces the full detail of a single
collected card. The sheet is entirely view-only. No actions of any kind are available.

The backlog entry notes a dependency on `stats schema`. The interaction spec treats that
schema as already present. This Phase B document assumes the schema migration is complete
before Phase C is approved. If it is not, Phase C must not begin — the developer must
write the schema migration as the first task of Phase C.

---

## Stories

---

### Story 1 — Tapping a card tile opens the detail sheet

```
As a player browsing my card collection,
I need tapping any card tile to open a full-detail bottom sheet for that card,
So that I can read its stats and flavour text without leaving the collection view.
```

**Acceptance criteria:**
- [ ] Every card tile in `CollectionGrid` has a tap handler that opens
      `CollectedCardDetailSheet` for the tapped card.
- [ ] The tap handler fires on the full tile surface (image + info strip).
- [ ] Only one sheet is open at a time. Tapping a second card while a sheet is open is
      not possible because the backdrop intercepts input.
- [ ] Card tiles implemented as `<div>` elements carry `role="button"`, `tabIndex={0}`,
      and `aria-label="View details for {card.name}"`.
- [ ] Keyboard users can reach and activate every card tile via Tab and Enter/Space.
- [ ] The hover state on card tiles matches the DS card hover pattern:
      `motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
      hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all
      duration-300`. Border colour at rest remains rarity-coded; at hover it steps up to
      `var(--border)`.
- [ ] Focus state on card tiles: `outline: 2px solid var(--blue); outline-offset: 2px`.
- [ ] The rarity-coded border colours on card tiles at rest are unchanged by this feature.

**Out of scope:**
- Any change to the card tile visual outside the hover/focus states described above.
- Any change to the Packs tab.

---

### Story 2 — Sheet open and dismiss behaviour

```
As a player viewing a card detail sheet,
I need to dismiss the sheet by tapping the backdrop or dragging the handle down,
So that I can return to the collection grid without a dedicated close button.
```

**Acceptance criteria:**
- [ ] The sheet opens with a Framer Motion spring animation:
      `{ type: "spring", stiffness: 300, damping: 30 }`, sliding up from `y: "100%"` to
      `y: 0`. No opacity fade on open.
- [ ] The sheet closes by reversing the slide (`y: 0 → "100%"`).
- [ ] When `prefers-reduced-motion: reduce` is active, the spring animation is skipped
      entirely — the sheet appears and disappears instantly.
- [ ] Tapping the backdrop (`bg-black/10`) dismisses the sheet.
- [ ] Dragging the drag handle downward dismisses the sheet.
- [ ] No explicit close button exists inside the sheet body.
- [ ] On close, focus returns to the card tile that triggered the open.
- [ ] While the sheet is open, focus is trapped inside the sheet.
- [ ] The sheet panel carries `aria-modal="true"`.
- [ ] The `BottomSheet` component is rendered via `ReactDOM.createPortal(content,
      document.body)`. If the existing component does not already do this, it must be
      fixed as part of this feature's Phase C before any other Phase C work proceeds.
- [ ] The sheet surface uses the glass treatment:
      `background: rgba(13,13,17,.80); backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,.06)` on top and sides only, no bottom border.
      Border radius: `16px 16px 0 0`.
- [ ] The backdrop is `bg-black/10`. It must never be higher opacity than this.
- [ ] The drag handle is `40×4px`, `background: rgba(255,255,255,.20)`, pill radius,
      `margin: 8px auto 0`.
- [ ] The sheet reads as the same material as `PackConfirmSheet` and `PetDetailSheet`.
- [ ] The sheet does not render when `card` is `null` or `undefined`
      (`if (!card) return null`).

**Out of scope:**
- Persisting the open sheet or selected card across navigation.
- Any swipe-to-next-card behaviour.

---

### Story 3 — Hero area (image, name, rarity badge, subtitle)

```
As a player viewing a card detail sheet,
I need to see the card's hero image, name, rarity badge, breed, and animal type at the
top of the sheet,
So that I can immediately identify which card I am looking at.
```

**Acceptance criteria:**
- [ ] Hero image renders full width within the `max-w-xl` inner container, `aspect-ratio:
      4/3`, `object-fit: cover`, `border-radius: var(--r-lg)` (16px).
- [ ] The `AnimalImage` component (already used in `CollectionGrid` and `PetDetailSheet`)
      is used for the hero image. It is not reimplemented.
- [ ] If `imageUrl` is missing or broken, `AnimalImage` handles the fallback — no
      additional error state is needed in this component.
- [ ] The name row is `flex`, `align-items: center`, `justify-content: space-between`,
      `gap: 8px`, `margin-top: 16px`.
- [ ] Card name renders at `22px / 600 / var(--t1) / line-height: 1.35`. Long names
      truncate with ellipsis on a single line.
- [ ] The `RarityBadge` component from `src/components/ui/Badge.tsx` is imported and
      used without reimplementation. It carries `shrink-0` so a long name does not
      squeeze it.
- [ ] Subtitle row renders `{breed} · {animalType}` (middot separator) at
      `13px / 400 / var(--t3)`, `margin-top: 4px`.

**Out of scope:**
- Date collected, species, or any other metadata row (see future-requirement.md — these
  are not in the current spec).

---

### Story 4 — Stats block (five labelled progress bars)

```
As a player viewing a card detail sheet,
I need to see the card's five stats displayed as labelled progress bars,
So that I can understand the card's strengths at a glance.
```

**Acceptance criteria:**
- [ ] Five stats are displayed in this order: SPEED, STRENGTH, STAMINA, AGILITY,
      INTELLIGENCE.
- [ ] Each stat row is `flex`, `align-items: center`, `gap: 12px`,
      `margin-bottom: 10px`. The last row has no bottom margin.
- [ ] Label: `11px / 700 / uppercase / letter-spacing: 1.5px / var(--t3)`. Fixed width:
      `100px` (shrink-0), so all bars are left-aligned regardless of label length.
- [ ] Bar track: `flex-1`, `height: 6px`, `border-radius: 100px`,
      `background: var(--border-s)`.
- [ ] Bar fill: `height: 6px`, `border-radius: 100px`,
      `width: {value}%` (value 1–100 maps directly to percentage).
- [ ] Bar fill colour is the rarity-coded solid token for the card's rarity:

      | Rarity    | Token          |
      |-----------|----------------|
      | common    | `var(--t4)`    |
      | uncommon  | `var(--green)` |
      | rare      | `var(--blue)`  |
      | epic      | `var(--purple)`|
      | legendary | `var(--amber)` |

- [ ] No hardcoded hex values. All colours use the DS tokens listed above.
- [ ] Value label: `15px / 600 / var(--t1)`. Fixed width: `28px` (shrink-0),
      `text-align: right`, placed after the bar.
- [ ] The stats block has `margin-top: 20px` from the subtitle row above.
- [ ] No animation on stat bar fill. Bars render at full state immediately when the sheet
      opens — no fill sweep or entrance animation.

**Out of scope:**
- Tint-pair pattern on bars (bars are narrow data visualisation elements — solid fill
  only, per spec).
- Any bar interaction or tooltip.

---

### Story 5 — Duplicate count pill

```
As a player viewing a card detail sheet,
I need to see a pill showing how many total copies I hold when I have duplicates,
So that I know whether a card is scarce or plentiful in my collection.
```

**Acceptance criteria:**
- [ ] When `duplicateCount > 0`, a pill is rendered showing `×{duplicateCount + 1} copies`
      (e.g. `duplicateCount: 2` shows "×3 copies" because `duplicateCount` counts extra
      copies beyond the first).
- [ ] When `duplicateCount === 0`, the pill is absent entirely. No empty space, no
      placeholder.
- [ ] Pill container: `flex`, `align-items: center`, `margin-top: 16px`.
- [ ] Pill element: `inline-flex`, `align-items: center`, `gap: 6px`,
      `padding: 4px 10px`, `border-radius: 100px`, `background: var(--elev)`,
      `border: 1px solid var(--border-s)`.
- [ ] Pill text: `13px / 500 / var(--t3)`.
- [ ] The Lucide icon referenced in the page structure diagram is not part of this pill
      per the spec text — no icon inside the pill unless explicitly contradicted by a
      future spec update.

**Out of scope:**
- Any action associated with the duplicate count (selling extras, etc.).

---

### Story 6 — Description (flavour text)

```
As a player viewing a card detail sheet,
I need to read the card's description text,
So that each card has flavour and personality beyond its stats.
```

**Acceptance criteria:**
- [ ] The `description` field from `CollectedCard` is rendered as a `<p>` element.
- [ ] Typography: `13px / 400 / var(--t2) / italic / line-height: 1.5`.
- [ ] Full text is shown — no truncation.
- [ ] `margin-top: 16px` from the section above.
- [ ] When `description` is an empty string, a `<p>` tag still renders (empty). This is
      acceptable — it signals a data gap, not a UI error. No placeholder copy is shown.
- [ ] No "coming soon" label, no stub text, no conditional hide based on empty string
      for this field.

**Out of scope:**
- Rich text or markdown rendering.
- Expandable/collapsible behaviour.

---

### Story 7 — Ability section (conditional)

```
As a player viewing a card detail sheet for a card with a special ability,
I need to see the ability name and description highlighted clearly,
So that I understand what makes this card distinctive.
```

**Acceptance criteria:**
- [ ] The ability section renders only when `ability` is a non-empty string. When
      `ability` is `undefined`, `null`, or an empty string, the section is entirely
      absent — no placeholder, no "no ability" label.
- [ ] A full-width `1px solid var(--border-s)` separator is rendered above the ability
      section, with `margin-bottom: 16px`. The separator and section together have
      `margin-top: 20px` from the description section above.
- [ ] Header row: `flex`, `align-items: center`, `gap: 8px`.
- [ ] Lucide `Zap` icon: `size: 16`, `stroke-width: 2`. Colour: the same rarity-coded
      solid token used for the stat bar fill (e.g. `var(--amber)` for legendary). No
      emoji. No other icon.
- [ ] Ability name: `15px / 600 / var(--t1)`, placed after the Zap icon.
- [ ] Ability description: `margin-top: 4px`, `13px / 400 / var(--t2)`, full text, no
      truncation.
- [ ] The conditional logic is implemented correctly so future data populates the section
      without a code change.
- [ ] In the initial build, `ability` and `abilityDescription` are always undefined.
      The section therefore never renders in practice — but the conditional must still be
      present and correct.

**Out of scope:**
- Any action tied to the ability.
- Ability icon other than Lucide Zap.

---

### Story 8 — Sheet inner container and iPad layout

```
As a player on iPad,
I need the sheet content to be constrained to a readable column width,
So that the hero image and stat bars are not uncomfortably wide on a large screen.
```

**Acceptance criteria:**
- [ ] The inner content container uses the full class string:
      `px-6 pt-2 pb-10 max-w-xl mx-auto w-full`.
- [ ] The sheet panel itself extends to the full viewport width. The `max-w-xl`
      constraint applies to the inner container only, not the sheet panel.
- [ ] At 1024px (iPad landscape), the hero image is constrained to the `max-w-xl` column
      (576px) — it does not span full screen width.
- [ ] At 1024px, the stat bars are proportionate — not excessively long.
- [ ] At 375px (phone), the layout is not cramped — `px-6` provides 24px padding on each
      side.
- [ ] The sheet content is internally scrollable when it overflows the sheet's `85vh`
      max height: `overflow-y: auto` with `-webkit-overflow-scrolling: touch` on the
      scroll container.
- [ ] `pb-10` (40px) bottom padding ensures content clears the safe area and provides
      visual breathing room.

**Out of scope:**
- Any landscape-specific layout change beyond what max-w-xl provides.
- A separate desktop breakpoint beyond 1024px verification.

---

## Out of scope — full feature list

The following are explicitly excluded from this feature. They must not be built,
stubbed, or hinted at with placeholder UI.

- Sell button (Tier 3 — Player Listings)
- Trade button (Tier 3)
- Release button (Tier 3 — noted in future-requirement.md; deliberately deferred)
- Any action button or footer row of any kind
- Confirm/destructive action overlay triggered from this sheet
- Info row (species, date collected) — present in future-requirement.md but absent from
  the finalised interaction spec; do not add
- Sort or filter controls within the sheet
- Swipe to view the next/previous card
- Persisting the selected card or sheet open state across navigation
- Stats animation (fill sweep, entrance animation)
- Any "ability coming soon" or placeholder ability row

---

## Definition of Done

This feature is not marked `complete` until every item below is checked.

### Functional

- [ ] All 8 stories have passed acceptance criteria verification by the Tester.
- [ ] `tests/card-collection-detail/test-results.md` exists and carries Tester sign-off.
- [ ] `spec/features/card-collection-detail/done-check.md` has been run and all items
      are checked.
- [ ] The backlog entry for `card-collection-detail` is updated to `complete` only after
      the above two are true.

### 10-point DS checklist (mandatory in test-results.md)

The Tester must explicitly list and verify all ten checks in `test-results.md`. Checks
1–6 are scoped to this feature's files. Checks 7–10 are app-wide.

1. **No emojis used as icons** — Lucide only, in all JSX, data files, toast messages,
   and button labels introduced by this feature.
2. **No `ghost` variant on visible actions** — search the entire codebase for
   `variant="ghost"`. Any pre-existing ghost button found during this Phase D must be
   logged as a defect against the screen that owns it.
3. **All colours trace to `var(--...)` tokens** — no hardcoded hex values. Alpha
   composites of DS tokens (e.g. `rgba(13,13,17,.80)`) are permitted only where
   documented in the DS glass rule.
4. **Surface stack is correct** — sheet glass rule applied correctly; sheet reads as the
   same material as `PackConfirmSheet` and `PetDetailSheet`.
5. **Layout verified at 375px, 768px, and 1024px** — no wasted space, no cut-off
   content. Tester must physically resize the browser to each breakpoint.
6. **All scrollable content has `pb-24` minimum** (app-wide) — the sheet itself uses
   `pb-10` inside its own scroll container; this check verifies no other screen's
   scrollable content is missing `pb-24`.
7. **Top-of-screen breathing room** — on every screen with a sticky glass header, the
   first content element has at least `pt-4` clearance below the header bottom edge.
8. **Navigation controls are compact and consistent** — compare any tab switcher or
   filter pill row against the Explore screen canonical reference.
9. **Animation parameters match the spec** — sheet open/close spring verified as
   `stiffness: 300, damping: 30`. Reduced motion: sheet appears/disappears instantly
   with no transition. Stat bars have no fill animation.
10. **Spec-to-build element audit** — Tester scrolls the built sheet top to bottom and
    lists every visible element. Any element present in the build but absent from the
    spec, or absent from the build but present in the spec, is a defect.

### Additional DoD items

- [ ] `BottomSheet` is confirmed to use `ReactDOM.createPortal(content, document.body)`.
      If it did not before this feature, it was fixed during Phase C and the fix is
      noted in `test-results.md`.
- [ ] Card tiles carry `role="button"`, `tabIndex={0}`,
      `aria-label="View details for {card.name}"`.
- [ ] Focus trap is confirmed: focus moves into the sheet on open; returns to the
      triggering tile on close.
- [ ] The sheet carries `aria-modal="true"`.
- [ ] `CollectionGrid` rarity-coded border colours at rest are unchanged.
- [ ] No action buttons exist anywhere in the sheet.
- [ ] No placeholder or "coming soon" ability row exists.
- [ ] The `ability` conditional renders correctly with both present and absent data
      (verified in test via a mock card that has ability data).
- [ ] `duplicateCount === 0` hides the pill entirely (no empty space).
- [ ] `duplicateCount > 0` shows the correct `×{duplicateCount + 1} copies` string.
- [ ] `card === null` renders nothing — sheet body is absent.

---

## Dependency note

The `collectedCards` schema must include `stats`, `description`, `ability`, and
`abilityDescription` fields before Phase C is approved. If the schema migration has not
been written and approved, Phase C must not begin. The developer must confirm schema
readiness to the owner before picking up this feature.

---

*Phase B complete. Awaiting owner approval before Phase C is dispatched.*
