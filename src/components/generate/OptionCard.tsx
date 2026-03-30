// OptionCard — single selectable card in the wizard option grid
// NFT DS: bg-card, border-border-s, r-lg; selected: blue-sub bg + blue border

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  emoji?: string
  icon?: React.ReactNode
  imageUrl?: string
  label: string
  description?: string
  /** Tier sub-label pill shown below the label (Step 1 category cards only).
   *  'tradeable' → green tint-pair; 'reward-only' → amber tint-pair.
   *  Non-interactive — purely informational. */
  tierPill?: 'tradeable' | 'reward-only'
  selected?: boolean
  colorHex?: string   // for colour swatches
  onClick: () => void
}

export function OptionCard({
  emoji,
  icon,
  imageUrl,
  label,
  description,
  tierPill,
  selected = false,
  colorHex,
  onClick,
}: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-lg text-center',
        'border transition-all duration-150 active:scale-[.97] cursor-pointer w-full',
        selected
          ? 'bg-[var(--blue-sub)] border-[var(--blue)]'
          : 'bg-[var(--card)] border-[var(--border-s)] hover:border-[var(--border)]',
      )}
    >
      {/* Checkmark */}
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--blue)] flex items-center justify-center">
          <Check size={12} strokeWidth={3} className="text-white" />
        </span>
      )}

      {/* Visual — emoji, image, or colour swatch */}
      {colorHex ? (
        <span
          className="w-12 h-12 rounded-full border border-white/10"
          style={{ backgroundColor: colorHex }}
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className="w-16 h-16 rounded-md object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : icon ? (
        <span className="w-12 h-12 flex items-center justify-center text-[var(--blue-t)]">{icon}</span>
      ) : emoji ? (
        <span className="text-4xl leading-none">{emoji}</span>
      ) : null}

      {/* Label */}
      <span className={cn('text-[13px] font-600 leading-tight', selected ? 'text-t1' : 'text-t1')}>
        {label}
      </span>

      {/* Tier sub-label pill (Step 1 category cards) — non-interactive, informational only */}
      {tierPill === 'tradeable' && (
        <span
          className="inline-flex items-center rounded-pill bg-[var(--green-sub)] text-[var(--green-t)] text-[10px] font-semibold leading-none pointer-events-none"
          style={{ padding: '2px 6px' }}
        >
          Tradeable
        </span>
      )}
      {tierPill === 'reward-only' && (
        <span
          className="inline-flex items-center rounded-pill bg-[var(--amber-sub)] text-[var(--amber-t)] text-[10px] font-semibold leading-none pointer-events-none"
          style={{ padding: '2px 6px' }}
        >
          Reward-only
        </span>
      )}

      {/* Description */}
      {description && (
        <span className="text-[11px] text-t3 leading-tight">{description}</span>
      )}
    </button>
  )
}
