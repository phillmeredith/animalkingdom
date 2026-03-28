// AnimalFunFacts — EAD-7
// Always renders — facts[]: [string, string, string] is a required field, never null.
// Icon: Lucide Sparkles, purple tint pair.
// Bullet marker: same 6x6px blue circle as Daily Life and Care Needs.

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

interface AnimalFunFactsProps {
  animal: AnimalEntry
  className?: string
}

export function AnimalFunFacts({ animal, className }: AnimalFunFactsProps) {
  // Generated catalog entries have no curated facts — render nothing
  if (!animal.facts || animal.facts.length === 0) return null

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
        {/* Purple tint icon circle */}
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '100px',
            background: 'var(--purple-sub)',
          }}
        >
          <Sparkles size={16} strokeWidth={2} style={{ color: 'var(--purple-t)' }} />
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
          FUN FACTS
        </p>
      </div>

      {/* Bullet list — all 3 facts from the required facts tuple */}
      <ul className="flex flex-col gap-3">
        {animal.facts.map((fact, i) => (
          <li key={i} className="flex items-start gap-3">
            {/* 6x6px blue bullet dot — consistent with Daily Life / Care Needs */}
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
              {fact}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
