// useExploreFilter.ts
// Implements: spec/features/explore-rarity-filter/interaction-spec.md
//
// Manages the three-dimensional filter state for the Explore screen:
//   - search query (free text)
//   - category (AnimalCategory | 'All')
//   - rarity  (Rarity | 'All')
//
// All three filters combine with AND logic. Filter order per spec:
//   1. category
//   2. rarity
//   3. search query
//
// State is session-only — resets on hook unmount. Not persisted.
//
// Self-review checklist:
// [x] No DB reads or writes — this hook is pure UI state over a static dataset
// [x] No async operations — no try/catch needed, no toast calls needed
// [x] TypeScript strict — no `any`
// [x] Does not import from components
// [x] Integration map: explore filter does not participate in any integration event
//     (read-only browse of static ANIMALS catalogue — no wallet, badge, or DB side effects)
// [x] No spend() calls — nothing to transaction-guard
// [x] No badge-eligible events — filter state change is not a badge trigger

import { useDeferredValue, useMemo, useState } from 'react'
import { ANIMALS } from '@/data/animals'
import { getSoundUrl } from '@/data/animalSounds'
import type { AnimalCategory, AnimalEntry } from '@/data/animals'
import type { Rarity } from '@/lib/db'

// ─── Types ─────────────────────────────────────────────────────────────────────

/** The sentinel 'All' plus every concrete rarity tier. */
export type RarityFilter = Rarity | 'All'

/** The sentinel 'All' plus every concrete category. */
export type CategoryFilter = AnimalCategory | 'All'

/**
 * Ordered rarity filter values — display order per spec (least → most rare).
 * `All` comes first as the default/reset value.
 */
export const RARITY_FILTER_VALUES: RarityFilter[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
]

/**
 * Human-readable label for each rarity filter value.
 * Used by RarityPills to avoid duplicating label logic in the component.
 */
export const RARITY_FILTER_LABELS: Record<RarityFilter, string> = {
  All:       'All',
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
}

export interface UseExploreFilterReturn {
  /** Current free-text search query (controlled, undeferred). */
  query: string
  /** Active category filter value. */
  activeCategory: CategoryFilter
  /** Active rarity filter value. */
  activeRarity: RarityFilter
  /** When true, only animals with a known sound file are shown. */
  hasSoundOnly: boolean
  /**
   * Animals list after all four filters are applied (deferred query).
   * Safe to render directly — never undefined.
   */
  filteredAnimals: AnimalEntry[]
  /** Set the search query. Does not reset category or rarity. */
  setQuery: (value: string) => void
  /** Set the active category. Does not reset query or rarity. */
  setActiveCategory: (value: CategoryFilter) => void
  /** Set the active rarity. Does not reset query or category. */
  setActiveRarity: (value: RarityFilter) => void
  /** Toggle the has-sound filter on/off. */
  setHasSoundOnly: (value: boolean) => void
  /**
   * Reset all filters simultaneously to their default state.
   * Called by the "Clear filters" empty-state button.
   */
  clearAllFilters: () => void
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useExploreFilter(): UseExploreFilterReturn {
  const [query, setQuery] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
  const [activeRarity, setActiveRarity] = useState<RarityFilter>('All')
  const [hasSoundOnly, setHasSoundOnly] = useState<boolean>(false)

  // Defer the query so that rapid keystrokes don't block the category/rarity
  // pill interaction. The deferred value is used only for filtering — the
  // controlled input always receives the non-deferred value.
  const deferredQuery = useDeferredValue(query)

  const filteredAnimals = useMemo<AnimalEntry[]>(() => {
    // Step 1 — category filter
    let list: AnimalEntry[] = activeCategory === 'All'
      ? ANIMALS
      : ANIMALS.filter(a => a.category === activeCategory)

    // Step 2 — rarity filter
    if (activeRarity !== 'All') {
      list = list.filter(a => a.rarity === activeRarity)
    }

    // Step 3 — search query filter
    const q = deferredQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        a.animalType.toLowerCase().includes(q),
      )
    }

    // Step 4 — sound filter
    if (hasSoundOnly) {
      list = list.filter(a => getSoundUrl(a.name) !== null)
    }

    return list
  }, [activeCategory, activeRarity, deferredQuery, hasSoundOnly])

  function clearAllFilters(): void {
    setQuery('')
    setActiveCategory('All')
    setActiveRarity('All')
    setHasSoundOnly(false)
  }

  return {
    query,
    activeCategory,
    activeRarity,
    hasSoundOnly,
    filteredAnimals,
    setQuery,
    setActiveCategory,
    setActiveRarity,
    setHasSoundOnly,
    clearAllFilters,
  }
}
