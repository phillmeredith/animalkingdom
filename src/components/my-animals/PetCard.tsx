// PetCard — collection grid card

import { CheckCircle, AlertCircle } from 'lucide-react'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { SavedName } from '@/lib/db'

type CareState = 'cared-today' | 'needs-care' | 'unknown'

interface PetCardProps {
  pet: SavedName
  onClick: () => void
  careState?: CareState
}

export function PetCard({ pet, onClick, careState = 'unknown' }: PetCardProps) {
  const isForSale = pet.status === 'for_sale'

  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left w-full rounded-lg border border-[var(--border-s)] bg-[var(--card)]',
        'transition-all duration-300 motion-safe:active:scale-[.97] cursor-pointer overflow-hidden',
        'hover:border-[var(--border)] hover:shadow-[0_4px_24px_rgba(0,0,0,.25)] motion-safe:hover:-translate-y-0.5',
      )}
      // PL-2: update aria-label when for_sale so screen readers announce correct state
      aria-label={
        isForSale
          ? `${pet.name} is listed for sale`
          : `${pet.name}, ${pet.rarity} ${pet.breed}`
      }
    >
      {/* Image — 1:1 aspect ratio */}
      <div className="relative aspect-square overflow-hidden">
        <AnimalImage
          src={pet.imageUrl}
          alt={pet.name}
          className="w-full h-full"
        />
        {/* For-sale badge — amber tint pair WITH border per spec PL-2 */}
        {isForSale && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="amber"
              className="border border-[var(--amber)]"
            >
              For Sale
            </Badge>
          </div>
        )}
        {/* Care state indicator — hidden when for_sale (PL-2: never show both simultaneously) */}
        {!isForSale && careState === 'cared-today' && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--green-sub)] flex items-center justify-center">
            <CheckCircle size={12} className="text-[var(--green-t)]" />
          </div>
        )}
        {!isForSale && careState === 'needs-care' && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--amber-sub)] flex items-center justify-center animate-[pulse_1s_ease-out_1]">
            <AlertCircle size={12} className="text-[var(--amber-t)]" />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[15px] font-600 text-t1 truncate leading-tight">
            {pet.name}
          </span>
          <RarityBadge rarity={pet.rarity} className="shrink-0" />
        </div>
        <p className="text-[13px] text-t3 truncate">
          {pet.breed} · {pet.category}
        </p>
      </div>
    </button>
  )
}
