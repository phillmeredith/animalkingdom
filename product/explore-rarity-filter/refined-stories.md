# Refined Stories — explore-rarity-filter

**Feature:** Rarity filter pills on the Explore screen
**Phase:** B (Product Owner)
**Date:** 2026-03-28
**Status:** Awaiting owner approval before Phase C begins

**Source documents:**
- `spec/features/explore-rarity-filter/interaction-spec.md`
- `research/explore-rarity-filter/ur-findings.md`

---

## User need (evidence basis)

Harry already sees rarity on every animal card in Explore via `RarityBadge`. The gap is that he cannot browse *to* a rarity tier — he has to scroll the full grid to find, for example, all Legendary animals. The rarity sort control in My Animals confirms the rarity dimension is meaningful for collection navigation. This feature closes the equivalent gap in the Explore catalogue, directly supporting the decision of what to attempt to generate next.

The feature is additive. It shares the existing category pills row and displaces no current affordance.

---

## Stories

---

### Story 1 — Default state: no rarity filter active

```
As Harry browsing the Explore catalogue,
I need the rarity filter to default to "All" with no tier selected,
So that the Explore grid behaves exactly as it does today when I have not chosen a rarity.

Acceptance criteria:
- [ ] On mount, `activeRarity` is `'All'`.
- [ ] The "All" rarity pill renders in the active tint-pair style:
      `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`.
- [ ] All five rarity pills (Common, Uncommon, Rare, Epic, Legendary) render in the
      inactive style: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`.
- [ ] The full Explore grid is visible — no rarity filtering is applied.
- [ ] Tapping "All" when it is already active is a no-op; no state change occurs.

Out of scope:
- Persisting rarity state across navigation. On unmount the state resets.
```

---

### Story 2 — Selecting a rarity tier filters the grid

```
As Harry browsing the Explore catalogue,
I need to tap a rarity pill (Common / Uncommon / Rare / Epic / Legendary) to filter
the grid to only animals of that tier,
So that I can browse all animals of a specific rarity without scrolling the full catalogue.

Acceptance criteria:
- [ ] Six rarity pills are rendered in the filter row, right-aligned with `ml-auto shrink-0`,
      in the order: All · Common · Uncommon · Rare · Epic · Legendary.
- [ ] Tapping any inactive rarity pill sets `activeRarity` to that value and applies the
      active tint-pair style to the tapped pill; all other rarity pills return to inactive style.
- [ ] The grid immediately updates to show only animals whose `rarity` property matches
      `activeRarity`. Animals of all other rarities are removed from the visible grid.
- [ ] The category filter and search query remain unchanged — only the rarity dimension
      changes.
- [ ] The active pill renders at `h-9 px-4 rounded-[var(--r-pill)] text-[13px] font-semibold
      whitespace-nowrap shrink-0` — identical anatomy to `CategoryPills`.
- [ ] The inactive pill hover state steps the border up one level: `border-[var(--border)]`.
- [ ] The active pill hover state produces no visible change (already visually selected).
- [ ] Tapping any pill produces `motion-safe:active:scale-[.97]`.
- [ ] The colour transition on state change is `transition-colors duration-150` only.
      No entrance animation, spring, or scale transition on state change is introduced.
- [ ] Each pill is a `<button>` element with `aria-pressed="true"` (active) or
      `aria-pressed="false"` (inactive).
- [ ] Focus ring on each pill is the browser default — it is not suppressed.
- [ ] The rarity pills group does not scroll. It is anchored to the right edge of the
      filter row at all breakpoints (375px, 768px, 1024px).
- [ ] `CategoryPills` is given `flex-1 min-w-0` (or equivalent) so the rarity group is
      never displaced off-screen at any supported breakpoint.

Out of scope:
- Multiple rarity tiers selected simultaneously. Only one rarity (or All) is active at
  any time.
- Displaying a count of results per rarity tier on the pill label.
```

---

### Story 3 — Deselecting an active rarity pill returns to "All"

```
As Harry who has an active rarity filter,
I need to tap the active rarity pill again to deactivate it,
So that I can return to the full catalogue without having to tap the "All" pill separately.

Acceptance criteria:
- [ ] Tapping the currently active rarity pill (any value other than "All") sets
      `activeRarity` back to `'All'`.
- [ ] The "All" pill immediately renders in the active tint-pair style.
- [ ] The previously active rarity pill immediately renders in the inactive style.
- [ ] The grid updates to show all animals (subject to the current category and search filters).
- [ ] The toggle logic matches the pattern already in `CategoryPills`:
      `onClick={() => onSelect(isActive && value !== 'All' ? 'All' : value)}`.

Out of scope:
- Any animation or transition other than `transition-colors duration-150` on the pill
  colour change.
```

---

### Story 4 — Rarity filter combines with category filter

```
As Harry who has both a category and a rarity filter active,
I need the grid to show only animals that match BOTH filters simultaneously,
So that I can narrow my browse to, for example, all Legendary animals in the Stables
category.

Acceptance criteria:
- [ ] When both `activeCategory` and `activeRarity` are non-"All" values, the grid shows
      only animals where `a.category === activeCategory AND a.rarity === activeRarity`.
- [ ] Changing the rarity filter while a category filter is active does not reset the
      category filter, and vice versa.
- [ ] The filter logic applies in this order (matching the spec):
      1. Category filter
      2. Rarity filter
      3. Search query filter
      All three combine with AND logic.
- [ ] Category pills and rarity pills are visually independent — each shows its own active
      state. Both can be active simultaneously.

Out of scope:
- OR logic between category and rarity (not in scope for this release).
- Displaying how many active filters are currently set.
```

---

### Story 5 — Rarity filter combines with search query

```
As Harry who has typed a search query,
I need any active rarity filter to apply on top of the search results,
So that I can find, for example, all Rare animals whose name contains "fox".

Acceptance criteria:
- [ ] When a search query is active and a rarity pill is tapped, the grid shows only animals
      that match BOTH the search query AND the selected rarity.
- [ ] Typing into the search bar while a rarity filter is active does not reset `activeRarity`.
- [ ] The filter logic order is: category → rarity → search (all AND combined), consistent
      with Story 4 acceptance criteria.

Out of scope:
- Displaying the active query and active rarity as separate filter chips or tags.
```

---

### Story 6 — Empty state when combined filters produce no results

```
As Harry whose combined filters (search + category + rarity) return no animals,
I need to see a clear empty state with a "Clear filters" button that resets all three
filters at once,
So that I can recover from a no-results state without manually toggling each filter off.

Acceptance criteria:
- [ ] When the filtered animal list is empty, the existing empty state component renders.
- [ ] The empty state button label reads "Clear filters" (was previously "Clear search").
- [ ] The supporting copy ("Try a different search or clear filters") is retained unchanged.
- [ ] Tapping "Clear filters" simultaneously executes:
      - `setQuery('')`
      - `setActiveCategory('All')`
      - `setActiveRarity('All')`
- [ ] After "Clear filters" is tapped, the full unfiltered grid is restored, all three
      filter controls return to their default/All state, and the search input is empty.
- [ ] The empty state renders when any combination of filters produces zero results —
      not only when there is a search query.

Out of scope:
- Resetting individual filters independently from within the empty state (a per-filter
  dismiss control is not in scope).
- Displaying which filter(s) caused the empty result.
```

---

## Out of scope (feature-level)

The following are explicitly excluded from this feature. They must not be built as part of
this story set even if technically convenient to include.

- Persisting the active rarity filter to local storage or across navigation. State is
  session-only and resets on component unmount.
- A rarity filter on any screen other than Explore (My Animals, Marketplace, etc.).
- Displaying a result count on pill labels or anywhere adjacent to the filter row.
- Any animation beyond `transition-colors duration-150` on pill state change. No spring,
  no scale transition, no entrance animation on filter apply.
- Filter chips or active-filter summary UI showing which filters are currently set.

---

## Definition of Done

This feature is not `complete` until every item below is checked and a Tester sign-off
exists in `tests/explore-rarity-filter/test-results.md`.

### Functional gates

- [ ] All six stories above have been built and pass their acceptance criteria.
- [ ] Tester sign-off exists in `tests/explore-rarity-filter/test-results.md`.
- [ ] `spec/features/explore-rarity-filter/done-check.md` has been completed.

### Interaction spec compliance

- [ ] Rarity pills render in the filter row right-aligned with `ml-auto shrink-0`.
- [ ] Row layout matches the spec diagram: `CategoryPills` left / scrollable, rarity group
      right / fixed.
- [ ] Row container uses `flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6`.
- [ ] `CategoryPills` receives `flex-1 min-w-0` (or equivalent) so the rarity group is
      never displaced.
- [ ] Rarity group does not scroll at any breakpoint. Horizontal row scroll is the
      fallback at 375px.
- [ ] Pill anatomy exactly matches `CategoryPills`: `h-9 px-4 rounded-[var(--r-pill)]
      text-[13px] font-semibold whitespace-nowrap shrink-0`.
- [ ] Active state: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`.
- [ ] Inactive state: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`.
- [ ] No solid fill (`bg-[var(--blue)]`) on any filter pill — tint-pair only.
- [ ] Transition: `transition-colors duration-150` only. No other animation introduced.
- [ ] Toggle logic matches `CategoryPills` pattern (tap active pill to return to All).
- [ ] `aria-pressed` is set correctly on every pill.
- [ ] Focus ring is not suppressed.
- [ ] Empty state button label updated from "Clear search" to "Clear filters".
- [ ] "Clear filters" resets all three filters simultaneously.
- [ ] `activeRarity` state lives in `ExploreScreen` only — no child component manages or
      duplicates it.

### DS 10-point checklist (mandatory in test-results.md)

These ten checks must be explicitly listed and passed in `tests/explore-rarity-filter/test-results.md`
before Tester sign-off is valid. Checks 7–10 are app-wide, not scoped to this feature batch.

1. **No emojis used as icons** — Lucide only, everywhere in JSX, data files, toast
   messages, and button labels.
2. **No `ghost` variant on visible actions** — search the entire codebase for
   `variant="ghost"`. Any pre-existing ghost button found must be logged as a defect
   against the screen that owns it.
3. **All colours trace to `var(--...)` tokens** — no hardcoded hex values. Alpha
   composites of DS tokens are permitted only where documented in the DS glass rule.
4. **Surface stack is correct** — component steps up exactly one level from its
   container; glass rule applies to all fixed/absolute overlays.
5. **Layout verified at 375px, 768px, and 1024px** — no wasted space, no cut-off
   content. Resize the browser window to each breakpoint; do not rely on CSS
   inspection alone.
6. **All scrollable content has `pb-24` minimum** — no content hidden behind the
   fixed nav.
7. **Top-of-screen breathing room** — on every screen with a sticky glass header,
   scroll to the top and confirm the first content element has at least `pt-4`
   clearance below the header bottom edge.
8. **Navigation controls are compact and consistent** — compare the rarity pills and
   the existing category pills against the Explore screen canonical reference. Controls
   must not span full width when compact/centred is specified. Filter pills must use
   the tint-pair active style, never a solid fill.
9. **Animation parameters match the spec** — only `transition-colors duration-150` is
   present on pill state change. No additional animation observed.
10. **Spec-to-build element audit** — scroll the Explore screen top to bottom and list
    every visible element. Compare against the interaction spec layout diagram. Any
    element present in the build but absent from the spec, or absent from the build
    but present in the spec, is a defect.

### Backlog

- [ ] Backlog status updated to `complete` in `spec/backlog/BACKLOG.md` only after all
      items above are checked.

---

## Phase gate

**Phase C must not begin until the owner has explicitly approved this document.**

No source file should be opened, no component written, and no hook modified until
owner approval is confirmed.
