// Card — surface container, 16px radius, hover lift
// NFT Dark DS: cards are ALWAYS 16px radius, no shadow at rest

import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, padding = 'md', children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-[var(--card)] border border-[var(--border-s)] rounded-lg overflow-hidden',
        hoverable &&
          'cursor-pointer transition-all duration-300 hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] motion-safe:active:scale-[.97]',
        padding === 'md' && 'p-5',
        padding === 'sm' && 'p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)

Card.displayName = 'Card'

/** Card section separator */
export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-[var(--border-s)] px-4 py-3', className)}>
      {children}
    </div>
  )
}
