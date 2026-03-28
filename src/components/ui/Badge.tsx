// Badge — tinted pill badges (default) + solid + delta
// NFT Dark DS: ALWAYS use tint pairs (translucent bg + light text)
// Solid ONLY for price tags on cards

import { cn } from '@/lib/utils'
import type { Rarity } from '@/lib/db'

export type BadgeVariant = 'blue' | 'pink' | 'green' | 'amber' | 'red' | 'purple' | 'grey'

const TINT_CLASSES: Record<BadgeVariant, string> = {
  blue:   'bg-[var(--blue-sub)]   text-[var(--blue-t)]',
  pink:   'bg-[var(--pink-sub)]   text-[var(--pink-t)]',
  green:  'bg-[var(--green-sub)]  text-[var(--green-t)]',
  amber:  'bg-[var(--amber-sub)]  text-[var(--amber-t)]',
  red:    'bg-[var(--red-sub)]    text-[var(--red-t)]',
  purple: 'bg-[var(--purple-sub)] text-[var(--purple-t)]',
  grey:   'bg-white/[.08]         text-t3',
}

const SOLID_CLASSES: Record<'blue' | 'pink' | 'green', string> = {
  blue:  'bg-[var(--blue)]  text-white',
  pink:  'bg-[var(--pink)]  text-white',
  green: 'bg-[var(--green)] text-white',
}

const RARITY_VARIANT: Record<Rarity, BadgeVariant> = {
  common:    'grey',
  uncommon:  'green',
  rare:      'blue',
  epic:      'purple',
  legendary: 'amber',
}

interface BadgeProps {
  variant?: BadgeVariant
  solid?: boolean
  children: React.ReactNode
  className?: string
}

/** Default tinted badge (always prefer this) */
export function Badge({ variant = 'blue', solid = false, children, className }: BadgeProps) {
  const classes = solid
    ? SOLID_CLASSES[variant as 'blue' | 'pink' | 'green'] ?? TINT_CLASSES[variant]
    : TINT_CLASSES[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-pill text-xs font-semibold',
        classes,
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Rarity badge — automatically picks colour from rarity tier */
export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  return (
    <Badge variant={RARITY_VARIANT[rarity]} className={className}>
      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
    </Badge>
  )
}

/** Delta badge for stat changes — NOT pill shape (6px radius) */
export function DeltaBadge({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const isUp = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-[2px] text-xs font-semibold',
        'rounded-xs', // 6px — intentionally NOT pill
        isUp ? 'bg-[var(--green-sub)] text-[var(--green-t)]' : 'bg-[var(--red-sub)] text-[var(--red-t)]',
        className,
      )}
    >
      {isUp ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  )
}
