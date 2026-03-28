# FE Build Notes — explore-rarity-filter

**Phase C — Frontend Engineer**
**Date:** 2026-03-28
**Author:** FE agent

---

## What was built

### New component: `src/components/explore/RarityPills.tsx`

A right-aligned rarity filter group for the Explore filter row.

Key decisions:
- `RARITY_FILTER_VALUES` and `RARITY_FILTER_LABELS` consumed from `@/hooks/useExploreFilter`
  rather than redefined inline — avoids duplication and follows dev handoff notes.
- `RarityFilter` type re-exported from the component so consumers can import from either
  the component or the hook without confusion.
- Pill anatomy matches `CategoryPills` exactly: `h-9 px-4 rounded-[var(--r-pill)]
  text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-150`.
- Active tint-pair: `bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]`.
- Inactive: `bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]`
  with hover stepping border: `hover:border-[var(--border)]`.
- Active pill hover: no additional class — already visually selected, per spec.
- Toggle: `onClick={() => onSelect(isActive && value !== 'All' ? 'All' : value)}` —
  matches `CategoryPills` pattern exactly.
- `aria-pressed={isActive}` on every button.
- `motion-safe:active:scale-[.97]` for tap feedback.
- No emoji, no ghost variant, no hardcoded hex.

### Updated: `src/screens/ExploreScreen.tsx`

Changes:
1. Replaced inline `useState`/`useDeferredValue`/`useMemo` filter state with
   `useExploreFilter()` hook call — single source of truth per dev handoff notes.
   `useDeferredValue` and the `filteredAnimals` useMemo are now inside the hook.
2. Added `RarityPills` to the `below` slot filter row alongside `CategoryPills`.
3. Filter row wrapper: `flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6`
   per spec — matches My Animals pattern.
4. `CategoryPills` wrapped in `<div className="flex-1 min-w-0">` so it cannot
   displace the rarity group off-screen.
5. `RarityPills` has `ml-auto shrink-0` via its own container — anchored right at
   all breakpoints.
6. Empty state button: label updated from "Clear search" to "Clear filters".
   `onClick` now calls `clearAllFilters()` from the hook, which simultaneously resets
   `query`, `activeCategory`, and `activeRarity`.

---

## Self-review results

### Check 1 — No emojis used as icons
PASS. Only `Search` from lucide-react used. No emoji in JSX, data files, or labels.

### Check 2 — No ghost variant on visible actions
PASS. Searched entire codebase: `grep -rn 'variant="ghost"' src/` — no matches.
`Button` in empty state uses `variant="outline"` as before.

### Check 3 — All colours trace to var(--...) tokens
PASS. Every colour value in both files is a CSS variable token:
`--blue-sub`, `--blue`, `--blue-t`, `--card`, `--border-s`, `--t2`, `--border`, `--bg`.
No hardcoded hex values.

### Check 4 — Surface stack correct
PASS. `RarityPills` renders at the same surface level as `CategoryPills` inside the
PageHeader `below` slot. No overlay introduced. Glass rule does not apply (confirmed in
spec: "This feature does not introduce any BottomSheet, Modal, Toast, or overlay.").

### Check 5 — Layout verified at 375px, 768px, and 1024px
PASS (code analysis — device test by Tester required in Phase D).
- 375px: overflow-x-auto row allows horizontal scroll to reach rarity group. `flex-1 min-w-0`
  on CategoryPills wrapper prevents rarity group being pushed off-screen.
- 768px: full row (8 category pills + 6 rarity pills) fits horizontally; no scroll expected.
- 1024px: same — full row visible without scroll.
Content grid: `grid-cols-4 md:grid-cols-5 lg:grid-cols-6` unchanged. `max-w-3xl` not
explicitly present on the content column — this was pre-existing before this feature and
is a pre-existing gap to flag (the grid uses `px-6` direct on the screen). Not introduced
by this feature; not changed by this feature.

### Check 6 — All scrollable content has pb-24
PASS. Content grid: `pb-24`. Empty state: `py-16 px-6` — no pb-24, but this is
pre-existing (the empty state is a flex-centred view, not a scrollable list). Not
introduced by this feature.

### Check 7 — Top breathing room (pt-4 below PageHeader)
PASS. Content grid has `pt-4` (`px-6 pt-4 pb-24`) unchanged from pre-existing build.

### Check 8 — Navigation controls compact and consistent
PASS. Rarity pills use identical anatomy and tint-pair active style as CategoryPills.
Both sit in the same filter row. No full-width span. No solid-fill active state.

### Check 9 — Animation parameters match spec
PASS. `transition-colors duration-150` only on pill state change. No entrance animation,
spring, or scale transition introduced. `motion-safe:active:scale-[.97]` is a press
affordance, not a state-change animation — matches spec AC for Story 2.

### Check 10 — Spec-to-build element audit
Elements present in spec layout diagram vs build:
- PageHeader title "Explore": present
- PageHeader trailing CoinDisplay: present
- SearchBar (full width): present
- Filter row with CategoryPills (left, scrollable): present
- Filter row with rarity group (right, ml-auto shrink-0, no scroll): present
- Six rarity pills in order All/Common/Uncommon/Rare/Epic/Legendary: present
- Content grid (grid-cols-4 md:5 lg:6): present
- AZRail (fixed right column): present
- AnimalProfileSheet overlay: present
- Empty state with "Clear filters" button: present

No elements present in build but absent from spec.
No elements absent from build but present in spec.
PASS.

### Framer Motion checks
No Framer Motion used in this feature. Not applicable.

---

## Spec gaps / deferred items

1. **Pre-existing: content column lacks max-w-3xl mx-auto**
   The Explore content grid uses `px-6` directly on the screen without a centred
   `max-w-3xl mx-auto w-full` column wrapper. This was pre-existing before this
   feature and is not introduced by it. Logging as a pre-existing defect for
   the Tester to note separately. Not blocking Phase C sign-off for this feature.

2. **Device testing required**
   Breakpoint layout (Check 5) verified by code analysis. Physical device
   testing at 375px, 768px, and 1024px is required in Phase D. Specifically:
   - Confirm rarity group stays anchored right and does not scroll at 768px+ .
   - Confirm horizontal row scroll works at 375px without clipping.
   - Hover cards to confirm lift does not clip (pre-existing check, not new).

3. **Empty state pb-24 (pre-existing)**
   Empty state container uses `py-16 px-6` without `pb-24`. Pre-existing.
   Not introduced by this feature.
