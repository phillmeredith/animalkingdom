// OptionGrid — reusable option card grid
// 2-col default; escalates to 3/4 cols on tablet/desktop
// columns prop overrides the default logic (used for breed step: 2/3/4 responsive)

import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OptionCard } from './OptionCard'

interface Option {
  value: string
  emoji?: string
  icon?: React.ReactNode
  imageUrl?: string
  label: string
  description?: string
  hex?: string
  locked?: boolean
  /** Tier sub-label pill for Step 1 category cards. Passed through to OptionCard. */
  tierPill?: 'tradeable' | 'reward-only'
}

interface OptionGridProps {
  options: Option[]
  selected: string | null
  onSelect: (value: string) => void
  /** Override default column count. When set, uses responsive Tailwind classes. */
  columns?: 'responsive-breed'
}

// ─── Locked breed card ────────────────────────────────────────────────────────

function LockedBreedCard({ imageUrl, label }: { imageUrl?: string; label: string }) {
  return (
    <div
      className="flex flex-col items-center gap-2 p-4 rounded-lg text-center w-full
                 border bg-[var(--card)] border-[var(--border-s)] cursor-default pointer-events-none"
      aria-hidden="true"
    >
      {/* Image with lock overlay */}
      <div className="relative w-16 h-16">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="w-16 h-16 rounded-md object-cover opacity-40"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-[var(--elev)] opacity-40" />
        )}
        {/* Lock icon — centered over the image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Lock size={24} className="text-[var(--t3)]" />
        </div>
      </div>

      {/* Breed name — dimmed */}
      <span className="text-[14px] font-600 text-[var(--t3)] leading-tight">{label}</span>

      {/* Sub-label */}
      <span className="text-[11px] text-[var(--t3)] mt-0.5 leading-tight">
        Rare+ · Find in Marketplace
      </span>
    </div>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function OptionGrid({ options, selected, onSelect, columns }: OptionGridProps) {
  const defaultCols = options.length === 2 ? 1 : 2

  // Responsive breed grid uses Tailwind classes; default uses inline style
  if (columns === 'responsive-breed') {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-1">
        <div className="max-w-3xl mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {options.map(opt =>
              opt.locked ? (
                <LockedBreedCard key={opt.value} imageUrl={opt.imageUrl} label={opt.label} />
              ) : (
                <OptionCard
                  key={opt.value}
                  emoji={opt.emoji}
                  icon={opt.icon}
                  imageUrl={opt.imageUrl}
                  label={opt.label}
                  description={opt.description}
                  tierPill={opt.tierPill}
                  colorHex={opt.hex}
                  selected={selected === opt.value}
                  onClick={() => onSelect(opt.value)}
                />
              ),
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-24">
      <div
        className={cn(
          'max-w-3xl mx-auto w-full content-start',
          defaultCols === 1
            ? 'grid grid-cols-2 max-w-lg gap-3'
            : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3',
        )}
      >
        {options.map(opt => (
          <OptionCard
            key={opt.value}
            emoji={opt.emoji}
            icon={opt.icon}
            imageUrl={opt.imageUrl}
            label={opt.label}
            description={opt.description}
            tierPill={opt.tierPill}
            colorHex={opt.hex}
            selected={selected === opt.value}
            onClick={() => onSelect(opt.value)}
          />
        ))}
      </div>
    </div>
  )
}
