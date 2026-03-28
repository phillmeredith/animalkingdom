// AnimalDailyLife — EAD-6
// Always renders. Shows animal.dailyLife as a bullet list (max 3 items).
// When dailyLife is null: renders the section card with italic placeholder text.
// Icon: Lucide Sun, amber tint pair.
// Bullet marker: 6x6px circle, background: var(--blue).

import { Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

interface AnimalDailyLifeProps {
  animal: AnimalEntry
  className?: string
}

export function AnimalDailyLife({ animal, className }: AnimalDailyLifeProps) {
  // Clamp to first 3 bullets per spec
  const bullets = animal.dailyLife?.slice(0, 3) ?? null

  return (
    <div
      className={cn(className)}
      style={{
        padding: '20px',
        background: 'var(--card)',
        border: '1px solid var(--border-s)',
        borderRadius: 'var(--r-lg)',
      }}
    >
      {/* Section header: icon circle + hairline heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
        }}
      >
        {/* Amber tint icon circle */}
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '100px',
            background: 'var(--amber-sub)',
          }}
        >
          <Sun size={16} strokeWidth={2} style={{ color: 'var(--amber-t)' }} />
        </span>

        {/* Hairline heading */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--t3)',
            lineHeight: '1.3',
          }}
        >
          DAILY LIFE
        </p>
      </div>

      {/* Section content */}
      {bullets != null ? (
        <ul className="flex flex-col gap-3">
          {bullets.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              {/* 6x6px blue bullet dot — mt-[6px] to optically align with first text line */}
              <span
                className="shrink-0"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '100px',
                  background: 'var(--blue)',
                  marginTop: '6px',
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 400,
                  color: 'var(--t2)',
                  lineHeight: '1.5',
                }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        // EAD-10 null placeholder: italic Body Sm, var(--t3). No bullet markers.
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--t3)',
            lineHeight: '1.5',
          }}
        >
          Not enough is known about this animal's daily habits yet.
        </p>
      )}
    </div>
  )
}
