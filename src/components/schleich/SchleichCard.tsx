// SchleichCard — individual figurine grid card
//
// Spec reference: interaction-spec.md section 6, refined-stories.md Story 6
//
// Card anatomy:
//   - Image: 1:1 aspect ratio, object-fit: contain, bg var(--elev)
//   - Name strip: 12px/600/var(--t1), 1-line clamp
//   - Category badge: absolute bottom-left of image (bottom-8 left-8 in px)
//   - Owned indicator: absolute top-right of image (top-8 right-8 in px),
//     24×24 circle, bg var(--green), Lucide Check 14px white
//   - Retired badge: absolute bottom-right of image, "Retired" label,
//     --red-sub bg, --red border, --red-t text
//   - showOwnedBadge prop: false in My Collection tab (redundant there)
//
// Owned badge entrance animation: scale 0→1, opacity 0→1, 200ms,
// cubic-bezier(0.16,1,0.3,1). Disappears instantly (no exit animation).
//
// DS hover pattern (mandatory per CLAUDE.md):
//   motion-safe:hover:-translate-y-0.5
//   hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]
//   hover:border-[var(--border)]
//   motion-safe:active:scale-[.97]
//   transition-all duration-300
//
// Image fallback: var(--elev) background + centred Lucide Package icon 48px var(--t4)

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CATEGORY_COLOURS,
  CATEGORY_SHORT_LABEL,
  type SchleichAnimal,
} from '@/data/schleich'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SchleichCardProps {
  item: SchleichAnimal
  isOwned: boolean
  /** Whether to render the owned checkmark badge.
   *  false in My Collection tab — every card there is already owned,
   *  badge is redundant per spec section 7 and Story 9 AC. */
  showOwnedBadge?: boolean
  onClick: () => void
}

export function SchleichCard({
  item,
  isOwned,
  showOwnedBadge = true,
  onClick,
}: SchleichCardProps) {
  const reducedMotion = useReducedMotion()
  const [imgError, setImgError] = useState(false)

  const categoryColour = CATEGORY_COLOURS[item.category]
  const categoryLabel = CATEGORY_SHORT_LABEL[item.category]

  const ownedLabel = isOwned ? `, owned` : ''

  return (
    <button
      type="button"
      aria-label={`View ${item.name}${ownedLabel}`}
      onClick={onClick}
      className={cn(
        // Surface — DS card tokens
        'relative w-full text-left',
        'bg-[var(--card)] border border-[var(--border-s)]',
        'rounded-[var(--r-lg)] overflow-hidden',
        // DS hover/active pattern (mandatory per CLAUDE.md and spec section 6)
        'motion-safe:hover:-translate-y-0.5',
        'hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
        'hover:border-[var(--border)]',
        'motion-safe:active:scale-[.97]',
        'transition-all duration-300',
        // Focus ring
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
      )}
    >
      {/* Image area — 1:1 aspect ratio, contain not cover */}
      <div className="relative aspect-square w-full bg-[var(--elev)]">
        {!imgError ? (
          <img
            src={item.image_url}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          /* Fallback: centred Package icon on --elev background */
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-[var(--t4)]" />
          </div>
        )}

        {/* Category badge — bottom-left of image */}
        {categoryColour && (
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-2 rounded-[var(--r-pill)] text-[10px] font-semibold leading-none"
            style={{
              background: categoryColour.sub,
              color: categoryColour.text,
              padding: '3px 8px',
            }}
          >
            {categoryLabel}
          </span>
        )}

        {/* Retired badge — bottom-right of image (Story 5 AC)
            Tint pair: --red-sub bg, 1px solid --red border, --red-t text
            Must not overlap with owned badge (top-right) */}
        {item.discontinued && (
          <span
            aria-label="Retired figurine"
            className="absolute bottom-2 right-2 rounded-[var(--r-pill)] text-[10px] font-semibold leading-none"
            style={{
              background: 'var(--red-sub)',
              border: '1px solid var(--red)',
              color: 'var(--red-t)',
              padding: '3px 8px',
            }}
          >
            Retired
          </span>
        )}

        {/* Owned indicator — top-right of image, All tab only
            Tint-pair pill badge: green-sub bg + green border + green-t text.
            Per DS: badges never use solid colour with white text. */}
        {showOwnedBadge && (
          <AnimatePresence>
            {isOwned && (
              <motion.div
                key="owned-badge"
                aria-hidden="true"
                className="absolute top-2 right-2 rounded-[var(--r-pill)] flex items-center gap-0.5"
                style={{
                  background: 'var(--green-sub)',
                  border: '1px solid var(--green)',
                  padding: '2px 6px',
                }}
                initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Check size={10} strokeWidth={2.5} color="var(--green-t)" />
                <span
                  className="text-[10px] font-bold uppercase leading-none"
                  style={{ letterSpacing: '0.5px', color: 'var(--green-t)' }}
                >
                  Owned
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Name strip */}
      <div className="px-[10px] py-2">
        <p
          className="text-[12px] font-semibold text-[var(--t1)] leading-tight truncate"
          title={item.name}
        >
          {item.name}
        </p>
      </div>
    </button>
  )
}
