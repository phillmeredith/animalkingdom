// SchleichCategoryPills — horizontal scrollable filter pill row for SchleichScreen
//
// Does NOT import from src/components/explore/CategoryPills.tsx — that component
// is typed against AnimalCategory. This component is a fresh implementation that
// replicates the exact anatomy (h-9, px-4, rounded-pill, tint-pair active state)
// per Story 3 AC and interaction-spec.md section 8.
//
// Active state:   bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]
// Inactive state: bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]
// No solid fill on any pill.
//
// Toggle behaviour: tapping the active category pill (other than All) deactivates
// it and returns to All — mirrors CategoryPills.tsx toggle pattern exactly.

import { cn } from '@/lib/utils'
import {
  SCHLEICH_CATEGORIES,
  SCHLEICH_CATEGORY_LABELS,
  type SchleichCategoryFilter,
} from '@/data/schleich'

interface SchleichCategoryPillsProps {
  active: SchleichCategoryFilter
  onSelect: (filter: SchleichCategoryFilter) => void
}

export function SchleichCategoryPills({ active, onSelect }: SchleichCategoryPillsProps) {
  return (
    // -mx-6 px-6 bleeds to screen edges, matching ExploreScreen CategoryPills pattern
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6">
      {SCHLEICH_CATEGORIES.map(filter => {
        const isActive = active === filter
        return (
          <button
            key={filter}
            aria-pressed={isActive}
            onClick={() => {
              // Toggle behaviour: tapping the active non-All pill returns to All
              // Tapping All when already active is a no-op (returns same value)
              if (isActive && filter !== 'all') {
                onSelect('all')
              } else {
                onSelect(filter)
              }
            }}
            className={cn(
              // Anatomy per spec section 5 and Story 3 AC
              'h-9 px-4 rounded-[var(--r-pill)]',
              'text-[13px] font-semibold whitespace-nowrap shrink-0',
              'transition-colors duration-150',
              'motion-safe:active:scale-[.97]',
              isActive
                ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)] hover:border-[var(--border)]',
            )}
          >
            {SCHLEICH_CATEGORY_LABELS[filter]}
          </button>
        )
      })}
    </div>
  )
}
