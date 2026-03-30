// CategoryPills — horizontal scrollable category filter row

import { cn } from '@/lib/utils'
import { ALL_CATEGORIES } from '@/data/animals'
import type { AnimalCategory } from '@/data/animals'

const ALL = 'All'
type FilterValue = AnimalCategory | typeof ALL

interface CategoryPillsProps {
  active: FilterValue
  onSelect: (cat: FilterValue) => void
  /** Categories to hide from the pill row (e.g. 'Lost World' when on Animals tab). */
  exclude?: AnimalCategory[]
}

const PILLS: FilterValue[] = [ALL, ...ALL_CATEGORIES]

export function CategoryPills({ active, onSelect, exclude }: CategoryPillsProps) {
  const pills = exclude?.length
    ? PILLS.filter(c => c === ALL || !exclude.includes(c as AnimalCategory))
    : PILLS
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {pills.map(cat => {
        const isActive = active === cat
        return (
          <button
            key={cat}
            onClick={() => onSelect(isActive && cat !== ALL ? ALL : cat)}
            aria-pressed={isActive}
            className={cn(
              'flex-shrink-0 px-4 h-9 rounded-[var(--r-pill)]',
              'text-[13px] font-semibold transition-colors duration-150',
              isActive
                ? 'bg-[var(--blue-sub)] border border-[var(--blue)] text-[var(--blue-t)]'
                : 'bg-[var(--card)] border border-[var(--border-s)] text-[var(--t2)]',
            )}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
