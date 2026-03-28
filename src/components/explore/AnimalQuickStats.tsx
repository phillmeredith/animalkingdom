// AnimalQuickStats — EAD-5
// Three-column grid: Habitat | Diet | Lifespan.
// Each stat card shows the headline value plus an optional expansion sentence
// from habitatDetail / dietDetail / lifespanDetail when non-null.
//
// Grid breakpoints per spec:
//   820px and above: grid-cols-3
//   375px and below: grid-cols-1
// (Tailwind: default single-col, md:grid-cols-3 — md = 768px in Tailwind,
//  which is the closest breakpoint to the 820px spec value and covers it.)

import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

interface AnimalQuickStatsProps {
  animal: AnimalEntry
  className?: string
}

interface StatCardProps {
  label: string
  value: string
  detail?: string | null
}

function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border-s)',
        borderRadius: 'var(--r-lg)',
        padding: '16px',
      }}
    >
      {/* Hairline label: 11px / 700 / uppercase / tracking-[1.5px] */}
      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--t3)',
          marginBottom: '4px',
          lineHeight: '1.3',
        }}
      >
        {label}
      </p>

      {/* Body Lg value: 18px / 600 */}
      <p
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--t1)',
          lineHeight: '1.4',
        }}
      >
        {value}
      </p>

      {/* Expansion sentence: Body Sm, only when detail is non-null.
          No placeholder text when null — card height adjusts naturally. */}
      {detail != null && (
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--t3)',
            marginTop: '8px',
            lineHeight: '1.5',
          }}
        >
          {detail}
        </p>
      )}
    </div>
  )
}

export function AnimalQuickStats({ animal, className }: AnimalQuickStatsProps) {
  return (
    <div
      className={cn(
        // Single column by default (375px), three-col at md (≥768px covers 820px target).
        'grid grid-cols-1 md:grid-cols-3 gap-3',
        className,
      )}
    >
      <StatCard
        label="HABITAT"
        value={animal.habitat}
        detail={animal.habitatDetail}
      />
      <StatCard
        label="DIET"
        value={animal.diet}
        detail={animal.dietDetail}
      />
      <StatCard
        label="LIFESPAN"
        value={animal.lifespan}
        detail={animal.lifespanDetail}
      />
    </div>
  )
}
