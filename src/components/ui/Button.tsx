// Button — 7 variants × 3 sizes, always pill-shaped (100px radius)
// NFT Dark DS: buttons are ALWAYS pill. No exceptions.

import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant =
  | 'primary'    // blue solid
  | 'accent'     // pink solid
  | 'outline'    // transparent + border
  | 'ghost'      // subtle filled
  | 'flat-blue'  // tinted bg, blue text
  | 'flat-pink'  // tinted bg, pink text
  | 'flat-green' // tinted bg, green text

export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--blue)] text-white hover:bg-[var(--blue-h)] hover:shadow-[var(--glow-blue)]',
  accent:
    'bg-[var(--pink)] text-white hover:bg-[var(--pink-h)] hover:shadow-[var(--glow-pink)]',
  outline:
    'bg-transparent border border-[var(--border)] text-t1 hover:border-t3 hover:bg-white/[.03]',
  ghost:
    'bg-white/[.06] text-t1 hover:bg-white/10',
  'flat-blue':
    'bg-[var(--blue-sub)] text-[var(--blue-t)]',
  'flat-pink':
    'bg-[var(--pink-sub)] text-[var(--pink-t)]',
  'flat-green':
    'bg-[var(--green-sub)] text-[var(--green-t)]',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[14px]',  // 44px — minimum touch target
  lg: 'h-12 px-7 text-[15px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          'inline-flex items-center justify-center gap-2 font-semibold',
          'rounded-pill cursor-pointer transition-all duration-150',
          'whitespace-nowrap select-none',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
          'active:scale-[.97]',
          // Variant
          VARIANT_CLASSES[variant],
          // Size
          SIZE_CLASSES[size],
          // Disabled
          isDisabled && 'opacity-40 pointer-events-none cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : icon}
        {children}
        {!loading && iconRight}
      </button>
    )
  },
)

Button.displayName = 'Button'
