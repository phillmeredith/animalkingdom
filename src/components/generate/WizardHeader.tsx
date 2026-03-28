// WizardHeader — back button + step counter + dot progress indicator

import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 7

interface WizardHeaderProps {
  step: number
  onBack: () => void
  showBack?: boolean
}

export function WizardHeader({ step, onBack, showBack = true }: WizardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 shrink-0">
      {/* Back button */}
      <button
        onClick={onBack}
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-full',
          'text-t2 hover:text-t1 hover:bg-white/[.06] transition-all duration-150',
          'active:scale-[.95]',
          !showBack && 'opacity-0 pointer-events-none',
        )}
        aria-label="Go back"
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </button>

      {/* Step counter + dots */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[11px] font-700 uppercase tracking-[1.5px] text-t3">
          Step {step} of {TOTAL_STEPS}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'rounded-pill transition-all duration-300',
                i < step
                  ? 'w-4 h-2 bg-[var(--blue)]'
                  : 'w-2 h-2 bg-[var(--border)]',
              )}
            />
          ))}
        </div>
      </div>

      {/* Right spacer — keeps dots centred */}
      <div className="w-11" />
    </div>
  )
}
