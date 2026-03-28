// AnimalConservationStatus — EAD-6
// Always renders. Resolves IUCN code to a tint-pair pill + human-readable label.
// When status is null: shows "Not Assessed" neutral pill + placeholder sentence.
// When status is non-null but detail is null: shows pill only, no sentence.
// Icon: Lucide Globe, tint pair determined by IUCN status.

import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

// ── IUCN lookup table ───────────────────────────────────────────────────────
// Source: interaction-spec.md Section 7.4b
// All colour values reference DS CSS variables — no hardcoded hex.

type IucnCode = NonNullable<AnimalEntry['conservationStatus']>

interface IucnConfig {
  label: string
  iconCircleBg: string
  iconColor: string
  pillBg: string
  pillText: string
  pillBorder: string
}

// DEF-004 fix: pillBorder must use the solid token, not the -sub translucent bg.
// DS tint-pair rule: border = var(--X), bg = var(--X-sub), text = var(--X-t).
// Using var(--X-sub) for both bg and border produces an invisible border because
// the border colour matches the background exactly.
const IUCN_CONFIG: Record<IucnCode | 'NA', IucnConfig> = {
  LC: {
    label: 'Least Concern',
    iconCircleBg: 'var(--green-sub)',
    iconColor: 'var(--green-t)',
    pillBg: 'var(--green-sub)',
    pillText: 'var(--green-t)',
    pillBorder: 'var(--green)',
  },
  NT: {
    label: 'Near Threatened',
    iconCircleBg: 'var(--amber-sub)',
    iconColor: 'var(--amber-t)',
    pillBg: 'var(--amber-sub)',
    pillText: 'var(--amber-t)',
    pillBorder: 'var(--amber)',
  },
  VU: {
    label: 'Vulnerable',
    iconCircleBg: 'var(--amber-sub)',
    iconColor: 'var(--amber-t)',
    pillBg: 'var(--amber-sub)',
    pillText: 'var(--amber-t)',
    pillBorder: 'var(--amber)',
  },
  EN: {
    label: 'Endangered',
    iconCircleBg: 'var(--red-sub)',
    iconColor: 'var(--red-t)',
    pillBg: 'var(--red-sub)',
    pillText: 'var(--red-t)',
    pillBorder: 'var(--red)',
  },
  CR: {
    label: 'Critically Endangered',
    iconCircleBg: 'var(--red-sub)',
    iconColor: 'var(--red-t)',
    pillBg: 'var(--red-sub)',
    pillText: 'var(--red-t)',
    pillBorder: 'var(--red)',
  },
  EW: {
    label: 'Extinct in the Wild',
    iconCircleBg: 'var(--purple-sub)',
    iconColor: 'var(--purple-t)',
    pillBg: 'var(--purple-sub)',
    pillText: 'var(--purple-t)',
    pillBorder: 'var(--purple)',
  },
  EX: {
    label: 'Extinct',
    iconCircleBg: 'var(--purple-sub)',
    iconColor: 'var(--purple-t)',
    pillBg: 'var(--purple-sub)',
    pillText: 'var(--purple-t)',
    pillBorder: 'var(--purple)',
  },
  DD: {
    label: 'Data Deficient',
    iconCircleBg: 'var(--elev)',
    iconColor: 'var(--t3)',
    pillBg: 'var(--elev)',
    pillText: 'var(--t3)',
    pillBorder: 'var(--border-s)',
  },
  NA: {
    label: 'Not Assessed',
    iconCircleBg: 'var(--elev)',
    iconColor: 'var(--t3)',
    pillBg: 'var(--elev)',
    pillText: 'var(--t3)',
    pillBorder: 'var(--border-s)',
  },
}

// ────────────────────────────────────────────────────────────────────────────

interface AnimalConservationStatusProps {
  animal: AnimalEntry
  className?: string
}

export function AnimalConservationStatus({
  animal,
  className,
}: AnimalConservationStatusProps) {
  const code = animal.conservationStatus ?? 'NA'
  const config = IUCN_CONFIG[code]

  // Null state: when both status and detail are null — show "Not Assessed" pill
  // + placeholder sentence (EAD-10 policy).
  const showPlaceholder = animal.conservationStatus == null && animal.conservationStatusDetail == null
  const showDetailSentence = animal.conservationStatusDetail != null

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
        {/* Icon circle — colour driven by IUCN status */}
        <span
          className="flex items-center justify-center shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '100px',
            background: config.iconCircleBg,
          }}
        >
          <Globe size={16} strokeWidth={2} style={{ color: config.iconColor }} />
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
          CONSERVATION STATUS
        </p>
      </div>

      {/* Status pill — tint-pair, NOT solid fill. 12px / 600. Not interactive. */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: '100px',
          fontSize: '12px',
          fontWeight: 600,
          background: config.pillBg,
          color: config.pillText,
          border: `1px solid ${config.pillBorder}`,
          lineHeight: '1.4',
        }}
      >
        {config.label}
      </span>

      {/* Detail sentence — only when conservationStatusDetail is non-null */}
      {showDetailSentence && (
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--t2)',
            marginTop: '8px',
            lineHeight: '1.5',
          }}
        >
          {animal.conservationStatusDetail}
        </p>
      )}

      {/* Placeholder sentence — only when both status and detail are null (EAD-10) */}
      {showPlaceholder && (
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--t3)',
            marginTop: '8px',
            lineHeight: '1.5',
          }}
        >
          This animal hasn't been formally assessed yet.
        </p>
      )}
    </div>
  )
}
