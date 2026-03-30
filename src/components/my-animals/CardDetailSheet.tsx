// CardDetailSheet — BottomSheet showing collected card stats + ability

import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { BottomSheet } from '@/components/ui/Modal'
import type { CollectedCard } from '@/lib/db'

const STATS = ['speed', 'strength', 'stamina', 'agility', 'intelligence'] as const

const STAT_COLORS: Record<typeof STATS[number], string> = {
  speed:        'var(--blue)',
  strength:     'var(--pink)',
  stamina:      'var(--green)',
  agility:      'var(--amber)',
  intelligence: 'var(--purple)',
}

interface CardDetailSheetProps {
  card: CollectedCard | null
  onClose: () => void
}

export function CardDetailSheet({ card, onClose }: CardDetailSheetProps) {
  return (
    <BottomSheet isOpen={!!card} onClose={onClose}>
      {card && (
        <div className="pb-8">
          <div className="px-6 pt-4">
            {/* Hero row — image + name/rarity */}
            <div className="flex items-center gap-4 mb-5">
              <AnimalImage
                src={card.imageUrl}
                alt={card.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-[20px] font-700 text-[var(--t1)] leading-tight truncate">{card.name}</h2>
                  <RarityBadge rarity={card.rarity} className="shrink-0" />
                </div>
                <p className="text-[12px] text-[var(--t3)] uppercase tracking-wide font-600">
                  {card.breed || card.animalType}
                </p>
                {card.duplicateCount > 0 && (
                  <p className="text-[11px] text-[var(--t4)] mt-1">
                    ×{card.duplicateCount + 1} collected
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            {card.description && (
              <p className="text-[13px] text-[var(--t2)] leading-relaxed mb-6">
                {card.description}
              </p>
            )}

            {/* Stats */}
            <div className="mb-6">
              <p className="text-[11px] font-700 uppercase tracking-[1.5px] text-[var(--t3)] mb-3">
                Stats
              </p>
              <div className="flex flex-col gap-3">
                {STATS.map(stat => (
                  <div key={stat} className="flex items-center gap-3">
                    <span
                      className="text-[11px] font-700 uppercase tracking-wide w-20 shrink-0"
                      style={{ color: STAT_COLORS[stat] }}
                    >
                      {stat}
                    </span>
                    <div
                      className="flex-1 rounded-full overflow-hidden"
                      style={{ height: 6, background: 'var(--elev)' }}
                    >
                      <div
                        style={{
                          width: `${card.stats[stat]}%`,
                          height: '100%',
                          background: STAT_COLORS[stat],
                          borderRadius: 'inherit',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <span
                      className="text-[13px] font-700 w-8 text-right shrink-0"
                      style={{ color: 'var(--t1)' }}
                    >
                      {card.stats[stat]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ability */}
            {card.ability && (
              <div
                className="rounded-[var(--r-md)] px-4 py-3"
                style={{ background: 'var(--elev)', border: '1px solid var(--border-s)' }}
              >
                <p className="text-[11px] font-700 uppercase tracking-[1.5px] text-[var(--t3)] mb-1">
                  Ability
                </p>
                <p className="text-[14px] font-700 text-[var(--t1)] mb-1">{card.ability}</p>
                {card.abilityDescription && (
                  <p className="text-[13px] text-[var(--t2)] leading-snug">{card.abilityDescription}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
