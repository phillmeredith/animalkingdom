// FeaturedPetCard — shows the most recently adopted pet
// Tapping opens the pet detail sheet (not navigate to /animals)
// Shows today's care status: feed / clean / play done or pending

import { useNavigate } from 'react-router-dom'
import { PawPrint, Utensils, Droplets, Gamepad2, CheckCircle2, Circle } from 'lucide-react'
import { RarityBorder } from '@/components/ui/RarityBorder'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCareLog } from '@/hooks/useCareLog'
import type { SavedName } from '@/lib/db'

interface FeaturedPetCardProps {
  pet: SavedName | null
  loading?: boolean
  onOpenDetail?: () => void
}

const CARE_ITEMS = [
  { key: 'feed'  as const, label: 'Fed',     Icon: Utensils  },
  { key: 'clean' as const, label: 'Cleaned', Icon: Droplets  },
  { key: 'play'  as const, label: 'Played',  Icon: Gamepad2  },
]

function SkeletonFeaturedCard() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border-s)] rounded-2xl overflow-hidden animate-pulse mb-6">
      <div className="w-full h-40 bg-[var(--elev)]" />
      <div className="p-5">
        <div className="h-6 w-32 rounded bg-[var(--elev)] mb-2" />
        <div className="h-4 w-24 rounded bg-[var(--elev)] mb-4" />
        <div className="h-8 w-full rounded-full bg-[var(--elev)]" />
      </div>
    </div>
  )
}

function CareStatusRow({ petId }: { petId: number }) {
  const { isDoneToday, allDoneToday } = useCareLog(petId)

  return (
    <div className="flex items-center gap-3 mt-3">
      {allDoneToday ? (
        <span className="text-[12px] font-600 text-[var(--green-t)] flex items-center gap-1">
          <CheckCircle2 size={14} className="text-[var(--green)]" />
          All care done today
        </span>
      ) : (
        CARE_ITEMS.map(({ key, label, Icon }) => {
          const done = isDoneToday(key)
          return (
            <span
              key={key}
              className="flex items-center gap-1 text-[11px] font-600"
              style={{ color: done ? 'var(--green-t)' : 'var(--t3)' }}
            >
              {done
                ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />
                : <Circle size={13} />
              }
              {label}
            </span>
          )
        })
      )}
    </div>
  )
}

export function FeaturedPetCard({ pet, loading, onOpenDetail }: FeaturedPetCardProps) {
  const navigate = useNavigate()

  if (loading) return <SkeletonFeaturedCard />

  if (!pet) {
    return (
      <div
        className="bg-[var(--card)] border border-[var(--border-s)] rounded-2xl mb-6 hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] transition-all duration-300 motion-safe:active:scale-[.97]"
        onClick={() => navigate('/explore')}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate('/explore')}
      >
        <EmptyState
          icon={<PawPrint />}
          title="No animals yet"
          description="Head to Explore to find your first animal"
          cta={{ label: 'Go Explore', onClick: () => navigate('/explore'), variant: 'primary' }}
        />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <RarityBorder rarity={pet.rarity}>
        <div
          className="bg-[var(--card)] cursor-pointer hover:border-[var(--border)] motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] transition-all duration-300 motion-safe:active:scale-[.97]"
          onClick={onOpenDetail}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onOpenDetail?.()}
        >
          <AnimalImage
            src={pet.imageUrl}
            alt={`${pet.name} the ${pet.breed}`}
            className="w-full h-40 object-cover"
          />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-[22px] font-semibold text-t1">{pet.name}</h3>
              <RarityBadge rarity={pet.rarity} />
            </div>
            <p className="text-[13px] text-t3">
              {pet.breed} · {pet.category}
            </p>
            {pet.id != null && <CareStatusRow petId={pet.id} />}
          </div>
        </div>
      </RarityBorder>
    </div>
  )
}
