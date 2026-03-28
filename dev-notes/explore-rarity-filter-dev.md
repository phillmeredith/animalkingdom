# Dev Handoff — explore-rarity-filter

**Phase C — Developer**
**Date:** 2026-03-28
**Author:** Developer agent

---

## What was built

### New hook: `src/hooks/useExploreFilter.ts`

A single hook that owns all three Explore filter dimensions — search query, category, and rarity — plus the derived `filteredAnimals` list.

**Exported interface:**

```ts
useExploreFilter(): {
  query: string
  activeCategory: CategoryFilter       // AnimalCategory | 'All'
  activeRarity: RarityFilter           // Rarity | 'All'
  filteredAnimals: AnimalEntry[]       // derived, memoized
  setQuery(value: string): void
  setActiveCategory(value: CategoryFilter): void
  setActiveRarity(value: RarityFilter): void
  clearAllFilters(): void              // resets all three simultaneously
}
```

**Also exported (for pill rendering):**

```ts
RARITY_FILTER_VALUES: RarityFilter[]
// ['All', 'common', 'uncommon', 'rare', 'epic', 'legendary']

RARITY_FILTER_LABELS: Record<RarityFilter, string>
// { All: 'All', common: 'Common', uncommon: 'Uncommon', ... }
```

The labels object is intentional — it keeps label strings out of the component and avoids a capitalise-on-render pattern that would scatter label logic across files.

**Filter order (per spec):** category → rarity → search query. All three AND-combined.

**Query handling:** `useDeferredValue` wraps the raw query before it enters the filter `useMemo`. This preserves the existing ExploreScreen optimisation — rapid typing does not block pill interaction.

### Updated: `src/hooks/index.ts`

`useExploreFilter`, its types (`RarityFilter`, `CategoryFilter`, `UseExploreFilterReturn`), and the two constants (`RARITY_FILTER_VALUES`, `RARITY_FILTER_LABELS`) are re-exported from the barrel.

---

## Schema gaps / data issues — none

- `AnimalEntry.rarity` is already present on every record in `src/data/animals.ts`.
- `Rarity` type is exported from `src/lib/db.ts`.
- `RarityFilter = Rarity | 'All'` is defined in the hook file and re-exported from the index.

No data migration, no schema change, no new DB table.

---

## Integration events

This feature does not participate in any event in `spec/foundation/INTEGRATION_MAP.md`.

- No wallet reads or writes.
- No DB reads or writes — operates entirely over the static `ANIMALS` array.
- No badge eligibility checks.
- No toast calls — the hook has no async operations and no failure states.
- No `spend()` calls.

---

## FE implementation notes

### Replacing the existing inline filter state in ExploreScreen

The existing `ExploreScreen` manages `query`, `activeCategory`, and `deferredQuery` directly with `useState`/`useDeferredValue` and an inline `useMemo`. The FE should replace all of this with a single `useExploreFilter()` call:

```tsx
const {
  query,
  activeCategory,
  activeRarity,
  filteredAnimals,
  setQuery,
  setActiveCategory,
  setActiveRarity,
  clearAllFilters,
} = useExploreFilter()
```

The `deferredQuery` and the `filteredAnimals` `useMemo` can both be deleted from `ExploreScreen` — they are now inside the hook.

The `letterFirstIndex` and `availableLetters` memos that derive from `filteredAnimals` remain in `ExploreScreen` — they depend on `filteredAnimals` from the hook and are UI-rendering concerns not appropriate for the hook.

### Empty state button

The current button reads `Clear search` and calls `setQuery(''); setActiveCategory('All')`. Replace with:

```tsx
<Button variant="outline" size="md" onClick={clearAllFilters}>
  Clear filters
</Button>
```

### CategoryPills — flex constraint

The spec requires `CategoryPills` to receive `flex-1 min-w-0` (or equivalent class) so it does not push the rarity group off screen. This is a FE concern — nothing to change in the hook.

### RarityPills component

The FE needs to build a `RarityPills` component (or inline equivalent) that maps `RARITY_FILTER_VALUES` to buttons. The toggle logic per spec:

```tsx
onClick={() => setActiveRarity(isActive && value !== 'All' ? 'All' : value)}
// where isActive = value === activeRarity
```

This matches the CategoryPills toggle pattern exactly.

---

## Self-review: integration map compliance

Checked every event in `INTEGRATION_MAP.md`. None are triggered by this feature. Explore filter is a read-only, in-memory operation. No event, consequence, transaction boundary, or badge check applies. Confirmed.
