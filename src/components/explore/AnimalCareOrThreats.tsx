// AnimalCareOrThreats — EAD-7
// Single component, two variants driven by animal.category:
//   Domestic (At Home / Stables / Farm) → "CARE NEEDS" (pink tint, Heart icon)
//   Wild/Sea/Lost World               → "THREATS"    (amber tint, AlertTriangle icon)
//
// Hidden entirely when the relevant field is null.
// A single animal NEVER renders both variants simultaneously — category routing
// is mutually exclusive by design (DOMESTIC_CATEGORIES / WILD_CATEGORIES).

import { Heart, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'
import { DOMESTIC_CATEGORIES } from '@/data/animals'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isDomestic(animal: AnimalEntry): boolean {
  // Cast is safe: DOMESTIC_CATEGORIES is a readonly tuple of AnimalCategory literals.
  return (DOMESTIC_CATEGORIES as readonly string[]).includes(animal.category)
}

// ── Care difficulty indicator row ────────────────────────────────────────────

interface DifficultyIndicatorProps {
  level: 1 | 2 | 3
}

const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Demanding',
}

function DifficultyIndicator({ level }: DifficultyIndicatorProps) {
  return (
    <div
      className="flex items-center"
      aria-label={`Care difficulty: ${level} out of 3`}
      style={{ marginBottom: '8px', gap: '4px' }}
    >
      {/* 3 circles: first `level` filled, remainder empty */}
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '100px',
            background: i <= level ? 'var(--pink)' : 'var(--elev)',
            border: i <= level ? 'none' : '1px solid var(--border)',
          }}
        />
      ))}

      {/* Inline level text */}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: 'var(--t3)',
          marginLeft: '8px',
          lineHeight: '1.4',
        }}
      >
        {DIFFICULTY_LABELS[level]}
      </span>
    </div>
  )
}

// ── Bullet list (shared pattern with Daily Life) ─────────────────────────────

interface BulletListProps {
  items: string[]
  max: number
}

function BulletList({ items, max }: BulletListProps) {
  const visible = items.slice(0, max)
  return (
    <ul className="flex flex-col gap-3">
      {visible.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
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
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AnimalCareOrThreatsProps {
  animal: AnimalEntry
  className?: string
}

export function AnimalCareOrThreats({ animal, className }: AnimalCareOrThreatsProps) {
  const domestic = isDomestic(animal)

  // Hidden entirely when relevant field is null — no placeholder per EAD-10 / OQ-4.
  if (domestic) {
    if (animal.careNeeds == null) return null
  } else {
    if (animal.habitatThreats == null) return null
  }

  // ── Domestic variant ────────────────────────────────────────────────────────
  if (domestic && animal.careNeeds != null) {
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
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: '32px', height: '32px', borderRadius: '100px', background: 'var(--pink-sub)' }}
          >
            <Heart size={16} strokeWidth={2} style={{ color: 'var(--pink-t)' }} />
          </span>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--t3)', lineHeight: '1.3' }}>
            CARE NEEDS
          </p>
        </div>

        {/* Care difficulty indicator — omitted when careDifficulty is null */}
        {animal.careDifficulty != null && (
          <DifficultyIndicator level={animal.careDifficulty} />
        )}

        {/* Bullet list — max 4 items per spec */}
        <BulletList items={animal.careNeeds} max={4} />
      </div>
    )
  }

  // ── Wild/Sea/Lost World variant ─────────────────────────────────────────────
  if (!domestic && animal.habitatThreats != null) {
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
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: '32px', height: '32px', borderRadius: '100px', background: 'var(--amber-sub)' }}
          >
            <AlertTriangle size={16} strokeWidth={2} style={{ color: 'var(--amber-t)' }} />
          </span>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--t3)', lineHeight: '1.3' }}>
            THREATS
          </p>
        </div>

        {/* Bullet list — max 3 items per spec */}
        <BulletList items={animal.habitatThreats} max={3} />
      </div>
    )
  }

  // Should not reach here — both branches are guarded above.
  return null
}
