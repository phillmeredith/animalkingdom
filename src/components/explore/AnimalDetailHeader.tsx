// AnimalDetailHeader — EAD-4
// Glass header strip for the full-screen animal detail modal.
// Sticky within the modal scroll container (position: sticky, top: 0).
// Three-zone layout: close button | animal name | rarity badge.
// Uses modal-variant glass: rgba(13,13,17,.80) + blur(24px).

import { X } from 'lucide-react'
import { RarityBadge } from '@/components/ui/Badge'
import { SoundButton } from '@/components/ui/SoundButton'
import { cn } from '@/lib/utils'
import type { AnimalEntry } from '@/data/animals'

interface AnimalDetailHeaderProps {
  animal: AnimalEntry
  /** When true, heading reads "Your [Name]" — EAD-9 owned-state personalisation. */
  isOwned: boolean
  /** URL of the animal's sound file, or null if no sound exists. */
  soundUrl?: string | null
  onClose: () => void
  className?: string
}

export function AnimalDetailHeader({
  animal,
  isOwned,
  soundUrl,
  onClose,
  className,
}: AnimalDetailHeaderProps) {
  // EAD-9: owned framing — full template literal, no separate "Your" span.
  const headingText = isOwned ? `Your ${animal.name}` : animal.name

  return (
    <div
      className={cn('sticky top-0 z-10', className)}
      style={{
        background: 'rgba(13,13,17,.80)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left zone — close button.
          Visual: 32px circle on --elev. Touch target padded to 44x44px via negative margin
          trick: the button itself is 44x44 with the circle as an inner visual element. */}
      <button
        type="button"
        aria-label="Close animal profile"
        onClick={onClose}
        className={cn(
          // 44x44 touch target
          'flex items-center justify-center w-11 h-11 shrink-0',
          // Inner visual circle via ring trick — we use a wrapper div approach instead
          'group',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
          'rounded-full',
          'active:scale-[.97] transition-transform duration-100',
        )}
      >
        <span
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full',
            'bg-[var(--elev)]',
            'group-hover:bg-[var(--border)]',
            'transition-colors duration-150',
          )}
        >
          <X
            size={18}
            strokeWidth={2}
            className="text-[var(--t3)] group-hover:text-[var(--t1)] transition-colors duration-150"
          />
        </span>
      </button>

      {/* Centre zone — animal name.
          Takes remaining space between the two fixed-width flanking zones.
          H4: 22px / 600. Truncates with ellipsis on overflow. */}
      {/* h2 — not h1. Inside role="dialog", the document already has an h1 on the page
          behind it. A second h1 violates WCAG 2.1 SC 1.3.1 (heading structure). */}
      <h2
        className="flex-1 min-w-0 px-3 text-center text-[22px] font-semibold text-[var(--t1)] truncate"
        style={{ lineHeight: '1.35' }}
      >
        {headingText}
      </h2>

      {/* Right zone — sound button (if available) + rarity badge. */}
      <div className="flex items-center gap-2 shrink-0">
        <SoundButton soundUrl={soundUrl ?? null} />
        <RarityBadge rarity={animal.rarity} />
      </div>
    </div>
  )
}
