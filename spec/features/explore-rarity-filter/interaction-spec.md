# Interaction Spec — explore-rarity-filter

**Feature:** Rarity filter pills on the Explore screen
**Phase:** A/B
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO) and Owner approval

---

## Summary

Add a compact rarity filter group to the existing category pills row on the Explore screen. The group sits on the right side of that row, pushed with `ml-auto shrink-0`, matching the sort control pattern in My Animals. Filter values are: All · Common · Uncommon · Rare · Epic · Legendary. The rarity filter works independently of — and simultaneously with — the category filter.

---

## User need

Harry wants to browse the Explore catalogue by rarity tier so he can find all Legendary or Epic animals in one view, rather than scrolling the full grid. The `RarityBadge` already shows rarity on each card; this filter lets him browse *to* a tier instead of scanning *for* it.

---

## PageHeader slot assignment

- `below` slot — the existing row that contains `CategoryPills`.
- The rarity pills group is added to the **right side of this same row**. They do not occupy a new row and do not introduce a `centre` slot control.
- Explicit statement per CLAUDE.md requirement: the content component receives `activeRarity` as a prop (or as state managed in `ExploreScreen`). It does not render its own rarity control. There is exactly one rarity filter control in the screen.

---

## Navigation ownership

Rarity filter state lives in `ExploreScreen`. It is passed down to any component that needs it. No child component manages or duplicates this state.

---

## Filter row layout

### Structure

```
[ below slot — single scrollable row ]
┌──────────────────────────────────────────────────────────────────┐
│  All  At Home  Stables  Farm  Lost World  Wild  Sea  →→→→→→→→→  │  ← left-aligned, scrollable, CategoryPills
│                                          [ All  Com  Unc  Rare  Epic  Leg ]  │  ← right-aligned, shrink-0, fixed (no scroll)
└──────────────────────────────────────────────────────────────────┘
```

- Left side: `CategoryPills` component — horizontally scrollable, `overflow-x-auto scrollbar-hide`, `flex-1` or `min-w-0` so it does not push the rarity group off screen.
- Right side: rarity pills group — `ml-auto shrink-0`, does NOT scroll. The group stays anchored to the right edge at all breakpoints.
- The entire row is a flex container with `flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6` — matching the My Animals pattern exactly.

### Why the rarity group does not scroll

The rarity group is 6 pills. At `h-9 px-4 text-[13px]` each pill is approximately 70–90px wide. Total group width: ~480–540px. On 375px (phone) this is wider than the remaining row space after CategoryPills. See the 375px behaviour note below.

### 375px (phone) behaviour

At 375px the category pills and rarity pills together exceed the available row width. The row is already `overflow-x-auto`, so the user can scroll the row horizontally to reach the rarity group. The rarity group has `shrink-0` so its pills do not compress. This is acceptable — the pattern matches My Animals sort controls at narrow widths.

No pill label truncation. No wrapping. Horizontal row scroll is the intentional fallback.

### 768px and 1024px (iPad)

At these widths the full row — category pills plus rarity group — is likely to fit without scrolling, particularly in landscape. The layout must be verified at both breakpoints. No adjustments to pill size are needed; the standard anatomy applies at all sizes.

---

## Rarity pill values

Ordered: `All · Common · Uncommon · Rare · Epic · Legendary`

These map directly to the `Rarity` type already defined in `src/lib/db.ts` plus the `'All'` sentinel. The `RARITY_RANK` ordering in `MyAnimalsScreen` (legendary=5 down to common=1) defines the display order from least to most rare — the filter pills reverse this for a more intuitive reading order (common first, legendary last).

Display order for pills: `All → Common → Uncommon → Rare → Epic → Legendary`

---

## Pill anatomy

Must match `CategoryPills` exactly. Do not introduce a new pill variant.

```
height:        h-9 (36px)
padding:       px-4
border-radius: rounded-[var(--r-pill)]
font-size:     text-[13px]
font-weight:   font-semibold (font-600)
whitespace:    whitespace-nowrap
shrink:        shrink-0
transition:    transition-colors duration-150
```

Active state (tint-pair, per DS):
```
bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]
```

Inactive state:
```
bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]
```

These are content filter pills, not section switchers. Solid fill (`bg-[var(--blue)]`) is not permitted. The tint-pair pattern is mandatory. Cross-reference: `CategoryPills.tsx` and My Animals sort pills — both use this exact pattern.

---

## Interaction states

| Element | State | Behaviour |
|---|---|---|
| Rarity pill (inactive) | Hover | `border-[var(--border)]` — border steps up one level |
| Rarity pill (inactive) | Active tap | `scale(.97)` via `motion-safe:active:scale-[.97]` |
| Rarity pill (inactive) | Focus visible | Browser default focus ring (do not suppress) |
| Rarity pill (active) | Hover | No visible change — already visually selected |
| Rarity pill (active) | Tap | Deselects — returns to 'All' |

Touch target: `h-9` (36px). This is below the 44px WCAG touch target recommendation. This is accepted because it matches the existing `CategoryPills` height, and deviating would create visual inconsistency within the same row. The row sits in a PageHeader `below` slot where vertical space is constrained. The tap targets on both sides of the row must be identical.

Note for FE: do not increase the rarity pill height above `h-9` unless `CategoryPills` is simultaneously updated. A height mismatch within the same row is a defect.

---

## Filter behaviour

### Combining filters

Rarity and category filters are independent. Both can be active simultaneously. The combined result shows animals that match BOTH the active category AND the active rarity.

Logic:
```
animals
  .filter(a => activeCategory === 'All' || a.category === activeCategory)
  .filter(a => activeRarity  === 'All' || a.rarity  === activeRarity)
```

All three filters combine with AND logic. Application order: category → rarity → search. The functional result is identical regardless of order (all are AND-combined), but the implementation follows: category first, rarity second, search (deferred query) last.

### Default state

On mount: `activeRarity = 'All'`. The `All` pill is active. All animals are visible (subject to category and search filters).

### Toggling

Tapping an active rarity pill (other than `All`) deactivates it and returns to `All`. This mirrors the behaviour already in `CategoryPills` (`onClick={() => onSelect(isActive && cat !== ALL ? ALL : cat)`). Apply the same toggle pattern.

Tapping `All` when already active: no-op (already at default).

---

## Empty state

When the combined filters (search + category + rarity) produce zero results, show the existing empty state. The current button label is "Clear search" — this must be updated to "Clear filters" to accurately describe the action, since the cause may be a rarity filter rather than a search query.

The "Clear filters" button resets ALL three filters simultaneously:
- `setQuery('')`
- `setActiveCategory('All')`
- `setActiveRarity('All')`

The supporting copy ("Try a different search or clear filters") remains appropriate and does not need to change.

---

## Content container

The content grid container immediately below the PageHeader uses:

```
px-6 pt-4 pb-24
```

This is unchanged. The `pt-4` (16px) clearance below the PageHeader glass border is mandatory. Do not increase or remove it.

The rarity filter adds height to the `below` slot of PageHeader. The `pt-4` on the content container handles clearance regardless of how tall the `below` slot is — no adjustment needed.

---

## Animation

No special animation. Colour transition on pill state change: `transition-colors duration-150`. This matches the existing `CategoryPills` transition exactly. Do not introduce any entrance animation, spring, or scale transition on state change.

Reduced motion: `transition-colors` respects `prefers-reduced-motion` natively (colour transitions are not motion-sensitive under WCAG). No additional reduced-motion handling is required.

---

## Accessibility

- Each pill is a `<button>` element — keyboard focusable, activatable with Enter/Space.
- Rarity label text is always visible — colour is secondary reinforcement only. Meets WCAG 2.1 AA SC 1.4.1 (Use of Colour).
- Active state is conveyed by both colour change (tint-pair) and the visual border weight change (from `--border-s` to `--blue`). Not colour alone.
- Focus ring: do not suppress the browser default focus ring. The dark surface makes focus rings visible without custom styling.
- `aria-pressed` is recommended on each pill to communicate selected state to screen readers:
  - Active: `aria-pressed="true"`
  - Inactive: `aria-pressed="false"`

---

## Overlay surface treatment

This feature does not introduce any BottomSheet, Modal, Toast, or overlay. The glass rule does not apply to this feature.

---

## Consistency check

This feature reuses the exact pill anatomy, active style, and row layout pattern established in:
- `src/components/explore/CategoryPills.tsx` — pill anatomy and tint-pair colours
- `src/screens/MyAnimalsScreen.tsx` — `ml-auto shrink-0` right-aligned group within a scrollable row

No new patterns are introduced. No deviation from existing patterns is permitted without explicit documentation here.

---

## What this spec does not cover

- Persisting the active rarity filter across navigation (not in scope — session state only, resets on unmount)
- Animating the filter result count change (not in scope)
- A rarity filter in any screen other than Explore (not in scope for this feature)

---

## Page structure diagram

```
┌─ ExploreScreen ──────────────────────────────────────────────────┐
│                                                                    │
│  ┌─ PageHeader ──────────────────────────────────────────────┐   │
│  │  title: "Explore"              trailing: CoinDisplay       │   │
│  │  ─────────────────────────────────────────────────────    │   │
│  │  [below slot]                                              │   │
│  │  ┌─ SearchBar (full width) ──────────────────────────┐   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  │  ┌─ Filter row (flex, overflow-x-auto) ──────────────┐   │   │
│  │  │  [All] [At Home] [Stables] [Farm] … →scroll→      │   │   │
│  │  │                     [All][Com][Unc][Rare][Epic][Leg]│   │   │
│  │  │                     ↑ ml-auto shrink-0, no scroll  │   │   │
│  │  └───────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─ Content grid (px-6 pt-4 pb-24) ────────────────────────┐    │
│  │  grid-cols-4 md:grid-cols-5 lg:grid-cols-6               │    │
│  │  [AnimalCard] [AnimalCard] [AnimalCard] …                 │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  AZRail (fixed right column, unchanged)                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## FE implementation notes

1. Add `activeRarity` state to `ExploreScreen` (`useState<RarityFilter>('All')` where `type RarityFilter = Rarity | 'All'`).
2. The `Rarity` type is already imported from `src/lib/db.ts` — reuse it. Do not redefine it inline.
3. Extend the `filteredAnimals` `useMemo` to add the rarity filter step after the existing category and search steps.
4. Render the rarity pills inline in the `below` slot alongside `CategoryPills`, inside the same flex row wrapper used in My Animals (`flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6`). The `CategoryPills` component must be given `flex-1 min-w-0` (or equivalent) so it does not displace the rarity group.
5. Update the empty state button label from "Clear search" to "Clear filters" and ensure the `onClick` resets all three filters.
6. Check `CategoryPills` scroll container does not clip the rarity group — the right-side group sits outside the `CategoryPills` scroll, not inside it.
7. Verify at 375px, 768px, and 1024px before marking Phase C complete.
