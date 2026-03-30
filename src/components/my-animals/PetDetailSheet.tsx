// PetDetailSheet — full pet detail bottom sheet
//
// player-listings integration (PL-01–04):
//   - active pet: shows "List for Sale" button (primary/blue) which opens ListForSaleSheet
//   - for_sale pet: shows amber "Listed for sale" badge (non-interactive) instead
//   - for_sale pet: Rename button is hidden; Dress Up button is hidden
//   - for_sale pet: Release button is visible but opens ForSaleReleaseBlockModal (not release flow)
//   - for_sale pet: CarePanel shows inline amber message on button tap (aria-disabled)
//   - for_sale pet: header shows RarityBadge + amber "Listed for sale" badge side by side

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet, Modal } from '@/components/ui/Modal'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge, Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RenameInput } from './RenameInput'
import { ReleaseConfirm } from './ReleaseConfirm'
import { CarePanel } from './CarePanel'
import { ListForSaleSheet } from '@/components/player-listings/ListForSaleSheet'
import { ForSaleReleaseBlockModal } from '@/components/player-listings/ForSaleReleaseBlockModal'
import { ListingRetractModal } from './ListingRetractModal'
import { Disc, Award, Leaf } from 'lucide-react'
import { TierBadge } from '@/components/ui/TierBadge'
import { isTradeable } from '@/lib/animalTiers'
import { SoundButton } from '@/components/ui/SoundButton'
import { getSoundUrl } from '@/data/animalSounds'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useItemShop } from '@/hooks/useItemShop'
import { useToast } from '@/components/ui/Toast'
import { usePlayerListings } from '@/hooks/usePlayerListings'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
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
  const [retractListingOpen, setRetractListingOpen] = useState(false)
  // Rescued flow
  const [releaseWildOpen, setReleaseWildOpen] = useState(false)
  // cancelListingBtnRef — focus returns here after the retract modal closes (WCAG 2.1 AA)
  const cancelListingBtnRef = useRef<HTMLButtonElement>(null)

  // Live-query the active listing for this pet (needed to pass listingId to the modal)
  const activeListing = useLiveQuery(
    () => pet?.id
      ? db.playerListings
          .where('petId').equals(pet.id)
          .filter(l => l.status === 'active')
          .first()
      : Promise.resolve(undefined),
    [pet?.id],
  )

  // Live-query the rescue mission for this pet — drives the Homing Status block.
  // Only runs when status is 'rescued' to avoid unnecessary DB reads.
  const rescueMission = useLiveQuery(
    () => pet?.id && pet?.status === 'rescued'
      ? db.rescueMissions
          .where('rescuedPetId').equals(pet.id)
          .first()
      : Promise.resolve(undefined),
    [pet?.id, pet?.status],
  )

  const isForSale = pet?.status === 'for_sale'
  const isRescued = pet?.status === 'rescued'

  // Reset sub-states when pet or open changes
  useEffect(() => {
    setIsRenaming(false)
    setReleaseOpen(false)
    setListForSaleOpen(false)
    setReleaseBlockOpen(false)
    setRetractListingOpen(false)
    setReleaseWildOpen(false)
  }, [pet, open])

  if (!pet) return null

  const colourHex = resolveColourHex(pet.animalType, pet.colour)

  // ─── Rescue homing calculations ──────────────────────────────────────────────
  // Only computed when this is a rescued pet and we have mission data.
  let daysUntilRelease = 0
  let isReleaseReady = false
  let homingProgress = 0

  if (isRescued && rescueMission?.releaseReadyDate) {
    const releaseDate = new Date(rescueMission.releaseReadyDate)
    const today = new Date()
    // Zero out time component for whole-day comparison
    releaseDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const msPerDay = 24 * 60 * 60 * 1000
    const remaining = Math.ceil((releaseDate.getTime() - today.getTime()) / msPerDay)
    daysUntilRelease = Math.max(0, remaining)
    isReleaseReady = daysUntilRelease === 0

    // Progress: days elapsed since foster start / total required days
    if (rescueMission.fosterStartDate && rescueMission.fosterDaysRequired > 0) {
      const startDate = new Date(rescueMission.fosterStartDate)
      startDate.setHours(0, 0, 0, 0)
      const elapsed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / msPerDay))
      homingProgress = Math.min(1, elapsed / rescueMission.fosterDaysRequired)
    }
  }

  async function handleReleaseWild() {
    if (!pet?.id) return
    try {
      // Phase C stub — Developer will wire to useRescueMissions.releasePet()
      await releasePet(pet.id)
      setReleaseWildOpen(false)
      toast({ type: 'success', title: `${pet.name} has been released! You earned 50 XP.` })
      onReleased()
    } catch {
      toast({ type: 'error', title: `Could not release ${pet.name} — please try again.` })
    }
  }

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
                    {/* Header badges: RarityBadge + TierBadge + for_sale / rescued badge */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <SoundButton soundUrl={getSoundUrl(pet.animalType)} />
                      <RarityBadge rarity={pet.rarity} />
                      <TierBadge category={pet.category} />
                      {isForSale && (
                        <Badge variant="amber">Listed for sale</Badge>
                      )}
                      {/* "In your care" — tint-pair, per spec §2.5. Never solid fill. */}
                      {isRescued && (
                        <span
                          className="inline-flex items-center rounded-[var(--r-pill)] text-[11px] font-semibold uppercase tracking-[0.5px]"
                          style={{
                            padding: '2px 8px',
                            background: 'var(--green-sub)',
                            border: '1px solid var(--green)',
                            color: 'var(--green-t)',
                          }}
                        >
                          In your care
                        </span>
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

          {/* Reward-only informational banner — shown between narrative and footer for reward-only pets.
              Non-interactive: no tap, hover, or focus. role="note" so screen readers announce it
              as supplementary information. Only rendered when isTradeable === false. */}
          {!isTradeable(pet.category) && (
            <div
              role="note"
              className="flex items-start gap-3 rounded-[var(--r-md)] border border-[var(--amber)] bg-[var(--amber-sub)] mb-4"
              style={{ padding: '12px 16px' }}
            >
              <Award size={16} className="text-[var(--amber-t)] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[14px] font-semibold text-[var(--amber-t)] leading-snug">
                  This animal was earned as a reward.
                </p>
                <p className="text-[13px] text-t2 mt-2 leading-snug">
                  Reward-only animals cannot be sold.
                </p>
              </div>
            </div>
          )}

          {/* Homing Status block — only for rescued pets. Per spec §2.5.
              Sits between the reward-only banner (or narrative) and the equipment section.
              Live-updates when releaseReadyDate changes without requiring sheet reopen. */}
          {isRescued && (
            <div
              className="rounded-[12px] p-4 mb-4"
              style={{ background: 'var(--elev)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Leaf size={20} className="text-[var(--green-t)] shrink-0" aria-hidden="true" />
                <p className="text-[14px] font-semibold text-[var(--t1)]">
                  Homing until ready for release
                </p>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-[var(--t3)] mb-1">
                Care Progress
              </p>

              {/* Progress bar — green fill */}
              <div
                className="h-1 rounded-full mb-1.5"
                style={{ background: 'var(--card)' }}
                role="progressbar"
                aria-valuenow={Math.round(homingProgress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Care progress"
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${homingProgress * 100}%`,
                    background: 'var(--green)',
                  }}
                />
              </div>

              {/* Days label — green text when ready */}
              {isReleaseReady ? (
                <p className="text-[13px]" style={{ color: 'var(--green-t)' }}>
                  Ready for release
                </p>
              ) : (
                <p className="text-[13px] text-[var(--t2)]">
                  {daysUntilRelease} {daysUntilRelease === 1 ? 'day' : 'days'} until release ready
                </p>
              )}
            </div>
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
            <>
              {/* rescued state: "List for Sale" absent entirely (rescued cards are not tradeable).
                  "Release" absent until release-ready. Spec §2.5. */}
              {isRescued ? (
                <div className="flex flex-col gap-2">
                  {isReleaseReady && (
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full"
                      onClick={() => setReleaseWildOpen(true)}
                    >
                      Release to wild
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="md"
                    className="w-full"
                  >
                    Keep caring for {pet.name}
                  </Button>
                </div>
              ) : isForSale ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Left col on iPad: empty spacer keeps "Cancel listing" right-aligned */}
                  <div className="hidden md:block" />
                  {/* "Cancel listing" — outline variant, right col on iPad / full-width on mobile */}
                  <Button
                    ref={cancelListingBtnRef}
                    variant="outline"
                    size="md"
                    className="w-full"
                    onClick={() => setRetractListingOpen(true)}
                  >
                    Cancel listing
                  </Button>
                </div>
              ) : isTradeable(pet.category) ? (
                /* Tradeable pet — full action set: Rename, Release, Dress Up (Stables), List for Sale, Compare */
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsRenaming(true)}
                  >
                    Rename
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    className="border-[var(--red)] text-[var(--red-t)] hover:bg-[var(--red-sub)]"
                    onClick={() => setReleaseOpen(true)}
                  >
                    Release
                  </Button>

                  {/* Dress up — only for Stables horses */}
                  {pet.category === 'Stables' && pet.id != null && (
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

                  {/* PL-01: "List for Sale" — tradeable pets only (not rendered for reward-only) */}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setListForSaleOpen(true)}
                  >
                    List for Sale
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    disabled
                    className="opacity-40 cursor-not-allowed"
                  >
                    Compare
                  </Button>
                </div>
              ) : (
                /* Reward-only pet — restricted action set: Rename (col 1) + Release (col 2).
                   "List for Sale" is absent from the DOM entirely (not disabled, not hidden).
                   The informational banner above the footer explains the absence. */
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsRenaming(true)}
                  >
                    Rename
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    className="border-[var(--red)] text-[var(--red-t)] hover:bg-[var(--red-sub)]"
                    onClick={() => setReleaseOpen(true)}
                  >
                    Release
                  </Button>
                </div>
              )}
            </>
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

      {/* auction-retract: ListingRetractModal — cancels an active listing.
          Only rendered when the active listing is confirmed (id is defined). */}
      {activeListing?.id != null && pet.id != null && (
        <ListingRetractModal
          listingId={activeListing.id}
          pet={pet as SavedName & { id: number }}
          isOpen={retractListingOpen}
          onClose={() => setRetractListingOpen(false)}
          onSuccess={() => {
            setRetractListingOpen(false)
            // PetDetailSheet footer refreshes reactively via pet.status via useLiveQuery
          }}
          triggerRef={cancelListingBtnRef as React.RefObject<HTMLElement>}
        />
      )}

      {/* store-rewards: Release to wild confirmation modal — spec §2.6.
          Rendered via Modal which uses createPortal internally. */}
      <Modal
        isOpen={releaseWildOpen}
        onClose={() => setReleaseWildOpen(false)}
        maxWidth="max-w-[420px]"
      >
        <div className="flex flex-col gap-0">
          {/* Animal image — centred header */}
          <div className="flex items-start gap-3 mb-4">
            <AnimalImage
              src={pet.imageUrl}
              alt={pet.name}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-[18px] font-bold text-[var(--t1)] leading-snug">
                Release {pet.name} to the wild?
              </h3>
            </div>
          </div>

          <p className="text-[14px] text-[var(--t2)] mt-0 mb-6 leading-relaxed">
            {pet.name} will leave your care. You'll earn bonus XP and a Conservation Hero badge
            as a thank you for your care.
          </p>

          <Button
            variant="accent"
            size="md"
            className="w-full mb-2"
            onClick={handleReleaseWild}
          >
            Release
          </Button>
          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={() => {
              setReleaseWildOpen(false)
              toast({ type: 'info', title: `Great choice! ${pet.name}'s care timer has been reset.` })
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  )
}
