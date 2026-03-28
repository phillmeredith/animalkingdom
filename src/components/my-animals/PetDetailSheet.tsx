// PetDetailSheet — full pet detail bottom sheet
//
// player-listings integration (PL-01–04):
//   - active pet: shows "List for Sale" button (primary/blue) which opens ListForSaleSheet
//   - for_sale pet: shows amber "Listed for sale" badge (non-interactive) instead
//   - for_sale pet: Rename button is hidden; Dress Up button is hidden
//   - for_sale pet: Release button is visible but opens ForSaleReleaseBlockModal (not release flow)
//   - for_sale pet: CarePanel shows inline amber message on button tap (aria-disabled)
//   - for_sale pet: header shows RarityBadge + amber "Listed for sale" badge side by side

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet } from '@/components/ui/Modal'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RenameInput } from './RenameInput'
import { ReleaseConfirm } from './ReleaseConfirm'
import { CarePanel } from './CarePanel'
import { ListForSaleSheet } from '@/components/player-listings/ListForSaleSheet'
import { ForSaleReleaseBlockModal } from '@/components/player-listings/ForSaleReleaseBlockModal'
import { Disc } from 'lucide-react'
import { SoundButton } from '@/components/ui/SoundButton'
import { getSoundUrl } from '@/data/animalSounds'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useItemShop } from '@/hooks/useItemShop'
import { useToast } from '@/components/ui/Toast'
import { usePlayerListings } from '@/hooks/usePlayerListings'
import { getColours } from '@/data/generateOptions'
import { cn } from '@/lib/utils'
import type { SavedName } from '@/lib/db'
import type { BadgeVariant } from '@/components/ui/Badge'

const CATEGORY_BADGE: Record<string, BadgeVariant> = {
  'At Home':    'blue',
  'Stables':    'amber',
  'Farm':       'green',
  'Lost World': 'purple',
  'Wild':       'green',
  'Sea':        'blue',
}

function resolveColourHex(animalType: string, colourValue: string): string {
  const colours = getColours(animalType)
  return colours.find(c => c.value === colourValue)?.hex ?? 'var(--elev)'
}

interface PetDetailSheetProps {
  pet: SavedName | null
  open: boolean
  onClose: () => void
  onRenamed: () => void
  onReleased: () => void
}

export function PetDetailSheet({ pet, open, onClose, onRenamed, onReleased }: PetDetailSheetProps) {
  const { renamePet, releasePet } = useSavedNames()
  const { ownedItems, equipItem, unequipItem } = useItemShop()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { listPet } = usePlayerListings()
  const [isRenaming, setIsRenaming] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [listForSaleOpen, setListForSaleOpen] = useState(false)
  const [releaseBlockOpen, setReleaseBlockOpen] = useState(false)

  const isForSale = pet?.status === 'for_sale'

  // Reset sub-states when pet or open changes
  useEffect(() => {
    setIsRenaming(false)
    setReleaseOpen(false)
    setListForSaleOpen(false)
    setReleaseBlockOpen(false)
  }, [pet, open])

  if (!pet) return null

  const colourHex = resolveColourHex(pet.animalType, pet.colour)

  async function handleRename(newName: string) {
    if (!pet?.id) return
    try {
      await renamePet(pet.id, newName)
      setIsRenaming(false)
      onRenamed()
    } catch {
      toast({ type: 'error', title: 'Failed to rename — please try again' })
      throw new Error('rename failed')
    }
  }

  async function handleRelease() {
    if (!pet?.id) return
    try {
      await releasePet(pet.id)
      setReleaseOpen(false)
      onReleased()
    } catch {
      toast({ type: 'error', title: 'Failed to release — please try again' })
      throw new Error('release failed')
    }
  }

  const statGrid = [
    { label: 'BREED',       value: pet.breed },
    { label: 'GENDER',      value: pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) },
    { label: 'AGE',         value: pet.age },
    { label: 'PERSONALITY', value: pet.personality },
  ]

  return (
    <>
      <BottomSheet isOpen={open} onClose={onClose}>
        <div className="px-6 pb-10">
          {/* Hero row — thumbnail + name/meta */}
          <div className="flex items-center gap-4 mb-4">
            <AnimalImage
              src={pet.imageUrl}
              alt={pet.name}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              {isRenaming ? (
                <RenameInput
                  currentName={pet.name}
                  onConfirm={handleRename}
                  onCancel={() => setIsRenaming(false)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-[20px] font-700 text-t1 leading-tight truncate">{pet.name}</h2>
                    {/* PL-2: for_sale pets show RarityBadge + amber "Listed for sale" badge side by side */}
                    <div className="flex items-center gap-2 shrink-0">
                      <SoundButton soundUrl={getSoundUrl(pet.animalType)} />
                      <RarityBadge rarity={pet.rarity} />
                      {isForSale && (
                        <Badge variant="amber">Listed for sale</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={CATEGORY_BADGE[pet.category] ?? 'blue'}>
                    {pet.category}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {statGrid.map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[10px] font-700 uppercase tracking-wide text-t3">{label}</span>
                <span className="text-[13px] font-600 text-t1">{value}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-700 uppercase tracking-wide text-t3">COLOUR</span>
              <span
                className="w-3 h-3 rounded-full border border-white/10 shrink-0"
                style={{ background: colourHex }}
              />
              <span className="text-[13px] font-600 text-t1">{pet.colour}</span>
            </div>
          </div>

          {/* Daily care — PL-3: pass petStatus so CarePanel can show inline amber message */}
          {pet.id && (
            <CarePanel
              petId={pet.id}
              careStreak={pet.careStreak ?? 0}
              petName={pet.name}
              petStatus={pet.status}
            />
          )}

          {/* Discovery narrative */}
          {pet.discoveryNarrative && (
            <p className="text-[13px] text-t2 italic leading-relaxed mb-4">
              {pet.discoveryNarrative}
            </p>
          )}

          {/* Equipment — saddles */}
          {pet.id && (() => {
            const ownedSaddles = ownedItems.filter(i => i.category === 'saddle')
            return (
              <div className="mt-2 mb-4">
                <p className="text-[11px] font-700 uppercase tracking-widest text-t3 mb-2">Equipment</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ownedSaddles.map(item => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.equippedToPetId === pet.id
                          ? unequipItem(item.id!, pet.id!)
                          : equipItem(item.id!, pet.id!)
                      }
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl border min-w-[64px] transition-colors',
                        item.equippedToPetId === pet.id
                          ? 'border-[var(--blue)] bg-[var(--blue-sub)]'
                          : 'border-[var(--border-s)] bg-[var(--elev)]',
                      )}
                    >
                      <Disc
                        size={20}
                        className={item.equippedToPetId === pet.id ? 'text-[var(--blue-t)]' : 'text-t3'}
                      />
                      <span className="text-[10px] font-600 text-t2">{item.name}</span>
                      {item.equippedToPetId === pet.id && (
                        <span className="text-[9px] text-[var(--blue-t)] font-700">Equipped</span>
                      )}
                    </button>
                  ))}
                  {ownedSaddles.length === 0 && (
                    <p className="text-[12px] text-t3">No saddles owned — buy one in the Shop</p>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Actions */}
          {!isRenaming && (
            <div className="grid grid-cols-2 gap-2">
              {/* PL-2: Rename hidden when for_sale */}
              {!isForSale && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsRenaming(true)}
                >
                  Rename
                </Button>
              )}

              {/* PL-4: Release always visible but opens ForSaleReleaseBlockModal when for_sale */}
              <Button
                variant="outline"
                size="md"
                className="border-[var(--red)] text-[var(--red-t)] hover:bg-[var(--red-sub)]"
                onClick={() => {
                  if (isForSale) {
                    setReleaseBlockOpen(true)
                  } else {
                    setReleaseOpen(true)
                  }
                }}
              >
                Release
              </Button>

              {/* PL-2: Dress up hidden when for_sale (only for Stables horses) */}
              {pet.category === 'Stables' && pet.id != null && !isForSale && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onClose()
                    navigate(`/equip/${pet.id}`)
                  }}
                >
                  Dress up
                </Button>
              )}

              {/* PL-01: "List for Sale" when active; amber badge when for_sale */}
              {!isForSale ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setListForSaleOpen(true)}
                >
                  List for Sale
                </Button>
              ) : (
                // Non-interactive amber "Listed for sale" badge replaces the button
                <div className="flex items-center justify-center">
                  <Badge variant="amber">Listed for sale</Badge>
                </div>
              )}

              <Button
                variant="outline"
                size="md"
                disabled
                className="opacity-40 cursor-not-allowed"
              >
                Compare
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>

      <ReleaseConfirm
        petName={pet.name}
        open={releaseOpen}
        onConfirm={handleRelease}
        onCancel={() => setReleaseOpen(false)}
      />

      {/* PL-01–02: ListForSaleSheet — opens above PetDetailSheet */}
      <ListForSaleSheet
        pet={pet}
        open={listForSaleOpen}
        onClose={() => setListForSaleOpen(false)}
        onConfirm={async (petId, price) => {
          await listPet(petId, price)
          // On success: close both sheets per spec
          setListForSaleOpen(false)
          onClose()
        }}
      />

      {/* PL-4: ForSaleReleaseBlockModal — blocks release when pet is for_sale */}
      <ForSaleReleaseBlockModal
        petName={pet.name}
        open={releaseBlockOpen}
        onClose={() => setReleaseBlockOpen(false)}
        onGoToListings={() => {
          setReleaseBlockOpen(false)
          onClose()
          navigate('/marketplace', { state: { tab: 'listings' } })
        }}
      />
    </>
  )
}
