// FeaturedPetCard — shows the most recently adopted pet
// Entire card is tappable → /animals

import { useNavigate } from 'react-router-dom'
import { PawPrint } from 'lucide-react'
import { RarityBorder } from '@/components/ui/RarityBorder'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import type { SavedName } from '@/lib/db'

interface FeaturedPetCardProps {
  pet: SavedName | null
  loading?: boolean
}

function SkeletonFeaturedCard() {
  return (
    <div className="bg-[var(--card)] border border-[var(--border-s)] rounded-2xl overflow-hidden animate-pulse mb-6">
      <div className="w-full h-40 bg-[var(--elev)]" />
      <div className="p-5">
        <div className="h-6 w-32 rounded bg-[var(--elev)] mb-2" />
        <div className="h-4 w-24 rounded bg-[var(--elev)] mb-4" />
        <div className="h-10 w-full rounded-full bg-[var(--elev)]" />
      </div>
    </div>
  )
}

export function FeaturedPetCard({ pet, loading }: FeaturedPetCardProps) {
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
          onClick={() => navigate('/animals')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/animals')}
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
            <p className="text-[13px] text-t3 mb-4">
              {pet.breed} · {pet.category}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={e => {
                e.stopPropagation()
                navigate('/animals')
              }}
            >
              View my animals
            </Button>
          </div>
        </div>
      </RarityBorder>
    </div>
  )
}
