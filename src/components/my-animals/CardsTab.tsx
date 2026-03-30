// CardsTab — reusable collected card grid.
// Used in MyAnimalsScreen (My Animals → Cards tab) and ExploreScreen (Cards tab).
// Renders a responsive grid of collected cards; tapping one fires onTap.
// Empty state prompts the player to open packs from the Store.

import { ShoppingBag } from 'lucide-react'
import { RarityBadge } from '@/components/ui/Badge'
import { useCardPacks } from '@/hooks/useCardPacks'
import type { CollectedCard } from '@/lib/db'

interface CardsTabProps {
  onTap: (card: CollectedCard) => void
}

export function CardsTab({ onTap }: CardsTabProps) {
  const { cards } = useCardPacks()

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--r-lg)',
            background: 'var(--blue-sub)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShoppingBag size={28} strokeWidth={2} style={{ color: 'var(--blue-t)' }} />
        </div>
        <div className="text-center">
          <p className="text-[17px] font-semibold text-[var(--t1)] mb-1">No cards yet</p>
          <p className="text-[14px] text-[var(--t2)]">
            Open packs from the Store to start your collection.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
      {cards.map(card => (
        <button
          key={card.id}
          onClick={() => onTap(card)}
          className="text-left w-full transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] motion-safe:active:scale-[.97]"
          style={{ borderRadius: 'var(--r-lg)' }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border-s)',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Card image */}
            <div style={{ aspectRatio: '3/4', position: 'relative', background: 'var(--elev)', overflow: 'hidden' }}>
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={32} strokeWidth={2} style={{ color: 'var(--t4)' }} />
                </div>
              )}
              {/* Duplicate count badge */}
              {card.duplicateCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: 'rgba(13,13,17,.80)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    color: 'var(--t2)',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 100,
                  }}
                >
                  ×{card.duplicateCount + 1}
                </span>
              )}
            </div>

            {/* Card info */}
            <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.name}
                </p>
                <RarityBadge rarity={card.rarity} className="shrink-0" />
              </div>
              <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.3 }}>
                {card.breed || card.animalType}
              </p>
              {/* Stats bar row */}
              {card.stats && (
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  {(['speed', 'strength', 'stamina', 'agility', 'intelligence'] as const).map(stat => (
                    <div key={stat} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                      <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--elev)', overflow: 'hidden' }}>
                        <div style={{ width: `${card.stats[stat]}%`, height: '100%', background: 'var(--blue)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {stat.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
