// TierBadge — non-interactive pill badge indicating animal trade tier
//
// Tradeable (At Home, Stables, Farm):
//   green tint-pair — var(--green-sub) bg, 1px solid var(--green) border,
//   var(--green-t) text, ArrowLeftRight icon 12px
//
// Reward-only (Wild, Sea, Lost World):
//   amber tint-pair — var(--amber-sub) bg, 1px solid var(--amber) border,
//   var(--amber-t) text, Award icon 12px
//
// Non-interactive: no hover, focus, or tap behaviour. aria-hidden is not set
// because the text label carries meaning. Purely decorative icon is aria-hidden.

import { ArrowLeftRight, Award } from 'lucide-react'
import { isTradeable } from '@/lib/animalTiers'
import { cn } from '@/lib/utils'

interface TierBadgeProps {
  category: string
  className?: string
}

export function TierBadge({ category, className }: TierBadgeProps) {
  const tradeable = isTradeable(category)

  return tradeable ? (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border',
        'bg-[var(--green-sub)] border-[var(--green)] text-[var(--green-t)]',
        'text-[12px] font-semibold leading-none pointer-events-none select-none',
        className,
      )}
      style={{ padding: '4px 10px' }}
    >
      <ArrowLeftRight size={12} strokeWidth={2} aria-hidden="true" />
      Tradeable
    </span>
  ) : (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border',
        'bg-[var(--amber-sub)] border-[var(--amber)] text-[var(--amber-t)]',
        'text-[12px] font-semibold leading-none pointer-events-none select-none',
        className,
      )}
      style={{ padding: '4px 10px' }}
    >
      <Award size={12} strokeWidth={2} aria-hidden="true" />
      Reward-only
    </span>
  )
}
