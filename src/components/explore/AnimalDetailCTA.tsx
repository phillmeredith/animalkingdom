// AnimalDetailCTA — EAD-8
// CTA block at the bottom of the scroll (mt-8, in document flow — not fixed).
//
// Gating logic:
//   Ungated (common, uncommon) → "Generate this animal" button, variant accent, size lg.
//   Gated (rare, epic, legendary) → availability check against live marketplace offers:
//     - Offer found for this breed today → "Find in Marketplace" button → navigates to
//       filtered marketplace results (/shop?tab=marketplace&search=[name]).
//     - No offer today → informational note only — no button, no dead-end navigation.
//
// Availability is checked via useMarketplace().offers — the same live query that drives
// the marketplace browse tab. This avoids sending the player to an empty filtered result.

import { ShoppingBag, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useMarketplace } from '@/hooks/useMarketplace'
import type { AnimalEntry } from '@/data/animals'

// ── Shared gating constant ────────────────────────────────────────────────────
// Kept here rather than imported from AnimalProfileSheet to avoid a cross-component
// dependency. If this list changes, update both files — a future refactor can
// extract this to src/lib/animalUtils.ts.
const GATED_RARITIES = new Set<AnimalEntry['rarity']>(['rare', 'epic', 'legendary'])

export function isGated(animal: AnimalEntry): boolean {
  return GATED_RARITIES.has(animal.rarity)
}

// ─────────────────────────────────────────────────────────────────────────────

interface AnimalDetailCTAProps {
  animal: AnimalEntry
  onGenerate: () => void
  onMarketplace: () => void
  className?: string
}

export function AnimalDetailCTA({
  animal,
  onGenerate,
  onMarketplace,
  className,
}: AnimalDetailCTAProps) {
  const gated = isGated(animal)
  const { offers } = useMarketplace()

  // Check whether this specific animal is currently for sale in the marketplace.
  // We match on breed (most specific) or animalType (fallback) against sell offers only.
  const availableInMarketplace = gated && offers.some(
    o =>
      o.type === 'sell' &&
      (
        o.breed.toLowerCase() === animal.breed.toLowerCase() ||
        o.animalType.toLowerCase() === animal.animalType.toLowerCase()
      ),
  )

  return (
    <div className={cn(className)}>
      {gated ? (
        availableInMarketplace ? (
          <>
            {/* Available today: show "Find in Marketplace" — takes them to filtered results */}
            <Button
              variant="accent"
              size="md"
              className="w-full"
              icon={<ShoppingBag size={16} />}
              onClick={onMarketplace}
            >
              Find in Marketplace
            </Button>

            {/* Supporting text */}
            <p
              className="text-center mt-3"
              style={{ fontSize: '13px', fontWeight: 400, color: 'var(--t3)', lineHeight: '1.5' }}
            >
              Rare and above are only available from the marketplace
            </p>
          </>
        ) : (
          <>
            {/* Not available today: informational note — no button, no dead-end */}
            <div
              className="flex items-start gap-3 rounded-[var(--r-md)] px-4 py-3"
              style={{ background: 'var(--elev)', border: '1px solid var(--border-s)' }}
            >
              <Clock
                size={16}
                strokeWidth={2}
                style={{ color: 'var(--t3)', flexShrink: 0, marginTop: 2 }}
                aria-hidden="true"
              />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t2)', lineHeight: '1.4' }}>
                  Not in the marketplace today
                </p>
                <p style={{ fontSize: '12px', fontWeight: 400, color: 'var(--t3)', lineHeight: '1.5', marginTop: 2 }}>
                  New offers arrive daily — check back tomorrow
                </p>
              </div>
            </div>
          </>
        )
      ) : (
        /* Ungated: "Generate this animal" — accent lg, full width */
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={onGenerate}
        >
          Generate this animal
        </Button>
      )}
    </div>
  )
}
