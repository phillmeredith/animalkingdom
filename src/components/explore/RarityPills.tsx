// RarityPills — rarity filter group for the Explore filter row
// Right-aligned (ml-auto shrink-0), does not scroll.
// Pill anatomy matches CategoryPills exactly per interaction spec.
// Values and labels sourced from useExploreFilter to avoid duplication.

import { cn } from '@/lib/utils'
import {
  RARITY_FILTER_VALUES,
  RARITY_FILTER_LABELS,
} from '@/hooks/useExploreFilter'
import type { RarityFilter } from '@/hooks/useExploreFilter'

export type { RarityFilter }

interface RarityPillsProps {
  active: RarityFilter
  onSelect: (rarity: RarityFilter) => void
}

export function RarityPills({ active, onSelect }: RarityPillsProps) {
  return (
    // shrink-0 + ml-auto: anchors this group to the right edge of the flex row at all breakpoints.
    // Does not scroll — the parent row's overflow-x-auto handles narrow-width overflow.
    <div className="flex gap-2 shrink-0 ml-auto">
      {RARITY_FILTER_VALUES.map(value => {
        const isActive = active === value
        return (
          <button
            key={value}
            aria-pressed={isActive}
            // Toggle: tapping an active non-All pill deselects it and returns to 'All'.
            // Matches the CategoryPills toggle pattern exactly.
            onClick={() => onSelect(isActive && value !== 'All' ? 'All' : value)}
            className={cn(
              'shrink-0 px-4 h-9 rounded-[var(--r-pill)]',
              'text-[13px] font-semibold whitespace-nowrap',
              'transition-colors duration-150',
              'motion-safe:active:scale-[.97]',
              isActive
                ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)]',
            )}
          >
            {RARITY_FILTER_LABELS[value]}
          </button>
        )
      })}
    </div>
  )
}
