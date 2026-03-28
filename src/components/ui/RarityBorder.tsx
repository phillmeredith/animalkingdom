// RarityBorder — left-border accent + optional tint bg wrapper

import { cn } from '@/lib/utils'
import type { Rarity } from '@/lib/db'

const STYLES: Record<Rarity, { border: string; bg: string; shimmer: boolean }> = {
  common:    { border: 'border-l-[3px] border-l-t3',                        bg: '',                        shimmer: false },
  uncommon:  { border: 'border-l-[3px] border-l-[var(--green)]',            bg: 'bg-[var(--green-sub)]',   shimmer: false },
  rare:      { border: 'border-l-[3px] border-l-[var(--blue)]',             bg: 'bg-[var(--blue-sub)]',    shimmer: false },
  epic:      { border: 'ring-2 ring-[var(--purple)] ring-inset',             bg: 'bg-[var(--purple-sub)]',  shimmer: false },
  legendary: { border: 'ring-2 ring-[var(--amber)] ring-inset',             bg: 'bg-[var(--amber-sub)]',   shimmer: true  },
}

interface RarityBorderProps {
  rarity: Rarity
  children: React.ReactNode
  className?: string
}

export function RarityBorder({ rarity, children, className }: RarityBorderProps) {
  const { border, bg, shimmer } = STYLES[rarity]
  return (
    <div className={cn('rounded-lg overflow-hidden', border, bg, shimmer && 'shimmer', className)}>
      {children}
    </div>
  )
}
