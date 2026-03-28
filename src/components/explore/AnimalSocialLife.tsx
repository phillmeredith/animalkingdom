// AnimalSocialLife — EAD-7
// Conditional section: only renders when animal.socialBehaviour is non-null.
// When null: component returns null — no gap, no placeholder.
// Icon: Lucide Users, blue tint pair.
// Content: prose (not a list), max 2 sentences.

import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

interface AnimalSocialLifeProps {
  animal: AnimalEntry
  className?: string
}

export function AnimalSocialLife({ animal, className }: AnimalSocialLifeProps) {
  // Hidden entirely when null — no placeholder per EAD-10 / OQ-4 policy.
  if (animal.socialBehaviour == null) return null

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
        {/* Blue tint icon circle */}
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '100px',
            background: 'var(--blue-sub)',
          }}
        >
          <Users size={16} strokeWidth={2} style={{ color: 'var(--blue-t)' }} />
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
          SOCIAL LIFE
        </p>
      </div>

      {/* Prose content — max 2 sentences, Body Sm */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--t2)',
          lineHeight: '1.5',
        }}
      >
        {animal.socialBehaviour}
      </p>
    </div>
  )
}
