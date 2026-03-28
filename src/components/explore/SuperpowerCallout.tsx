// SuperpowerCallout — EAD-5
// Aurora gradient callout block shown immediately below the category/region row.
// Renders ONLY when animal.superpower is non-null; absent entirely otherwise.
//
// Background note: The aurora gradient is NOT a DS token — it is derived from
// the DS --grad-aurora colours (purple #9757D7, blue #3772FF, green #45B26B)
// rendered at 12% opacity to sit as a translucent tint over the modal background.
// This is documented here as the only permitted exception to the "all colours from
// DS tokens" rule in CLAUDE.md. The parent DS token --grad-aurora exists, but
// rgba decomposition at .12 opacity is required because CSS gradients cannot be
// made translucent via a single variable reference.

import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuperpowerCalloutProps {
  superpower: string
  className?: string
}

export function SuperpowerCallout({ superpower, className }: SuperpowerCalloutProps) {
  return (
    <div
      className={cn('rounded-lg', className)}
      style={{
        // Aurora gradient at 12% opacity — see file-level comment for rationale.
        background: 'linear-gradient(135deg, rgba(151,87,215,.12), rgba(55,114,255,.12) 50%, rgba(69,178,107,.12))',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 'var(--r-lg)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      {/* Icon circle — amber tint pair. flex-shrink: 0 so it never wraps under text. */}
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '100px',
          background: 'var(--amber-sub)',
        }}
      >
        <Zap size={20} strokeWidth={2} style={{ color: 'var(--amber-t)' }} />
      </span>

      {/* Label + content text */}
      <div className="min-w-0">
        {/* Hairline label: 11px / 700 / uppercase / tracking-[1.5px] */}
        <p
          className="mb-1"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--amber-t)',
            lineHeight: '1.3',
          }}
        >
          SUPERPOWER
        </p>

        {/* Content: Body Md — spec calls for 16px / 500, leading-snug */}
        <p
          style={{
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--t1)',
            lineHeight: '1.35', // leading-snug
          }}
        >
          {superpower}
        </p>
      </div>
    </div>
  )
}
