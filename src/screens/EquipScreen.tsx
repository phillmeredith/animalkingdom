// EquipScreen — drag-to-slot LeMieux equipment dresser for a specific horse
// Route: /equip/:petId
//
// Interaction model:
//   Drag from the items strip onto a slot → calls equip()
//   Tap item in strip to select → tap slot to equip (tap fallback)
//   Tap filled slot → calls unequipSlot()
//
// Slot layout (relative to a 300px-tall container):
//   HEAD   — above horse, centred
//   BRIDLE — left of horse
//   BODY   — right of horse
//   SADDLE — below horse, centred
//   LEGS   — row of 4 below saddle
//
// Animation:
//   Slot fill: scale [0.8 → 1], spring stiffness 400 damping 20
//   Legs stagger: 80ms between FL→FR→BL→BR
//   useReducedMotion() → skip animations if true

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Crown, Link, Layers, Dumbbell, Footprints, ShoppingBag,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { CoinDisplay } from '@/components/ui/CoinDisplay'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { BottomSheet } from '@/components/ui/Modal'

import { useEquipment } from '@/hooks/useEquipment'
import { useItemShop } from '@/hooks/useItemShop'
import { useWallet } from '@/hooks/useWallet'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSavedNames } from '@/hooks/useSavedNames'
import { useToast } from '@/components/ui/Toast'

import { LEMIEUX_ITEMS } from '@/data/lemieux'
import type { LeMieuxItem, LeMieuxSlot } from '@/data/lemieux'
import type { OwnedItem } from '@/lib/db'
import { cn } from '@/lib/utils'

// ─── Category tints ────────────────────────────────────────────────────────────

const SLOT_ICON: Record<LeMieuxSlot, React.ReactNode> = {
  head:   <Crown     size={18} strokeWidth={2} aria-hidden="true" />,
  bridle: <Link      size={18} strokeWidth={2} aria-hidden="true" />,
  body:   <Layers    size={18} strokeWidth={2} aria-hidden="true" />,
  saddle: <Dumbbell  size={18} strokeWidth={2} aria-hidden="true" />,
  legs:   <Footprints size={18} strokeWidth={2} aria-hidden="true" />,
}

const SLOT_LABEL: Record<LeMieuxSlot, string> = {
  head:   'Head',
  bridle: 'Bridle',
  body:   'Rug',
  saddle: 'Saddle',
  legs:   'Legs',
}

const CATEGORY_WELL_BG: Record<string, string> = {
  'fly-hoods':            'var(--blue-sub)',
  'headcollars-leadropes':'var(--amber-sub)',
  'horse-rugs':           'var(--purple-sub)',
  'boots-bandages':       'var(--green-sub)',
  'saddlery-tack':        'var(--amber-sub)',
  'fly-protection':       'var(--blue-sub)',
  'grooming-care':        'var(--green-sub)',
  'stable-yard':          'var(--pink-sub)',
  'supplements':          'var(--purple-sub)',
  'hobby-horse':          'var(--pink-sub)',
}

const CATEGORY_ICON_COLOR: Record<string, string> = {
  'fly-hoods':            'var(--blue-t)',
  'headcollars-leadropes':'var(--amber-t)',
  'horse-rugs':           'var(--purple-t)',
  'boots-bandages':       'var(--green-t)',
  'saddlery-tack':        'var(--amber-t)',
  'fly-protection':       'var(--blue-t)',
  'grooming-care':        'var(--green-t)',
  'stable-yard':          'var(--pink-t)',
  'supplements':          'var(--purple-t)',
  'hobby-horse':          'var(--pink-t)',
}

const CATEGORY_BORDER: Record<string, string> = {
  'fly-hoods':            'var(--blue)',
  'headcollars-leadropes':'var(--amber)',
  'horse-rugs':           'var(--purple)',
  'boots-bandages':       'var(--green)',
  'saddlery-tack':        'var(--amber)',
  'fly-protection':       'var(--blue)',
  'grooming-care':        'var(--green)',
  'stable-yard':          'var(--pink)',
  'supplements':          'var(--purple)',
  'hobby-horse':          'var(--pink)',
}

// ─── ItemWell — shared image/icon renderer ─────────────────────────────────────

function ItemWell({
  item,
  size = 32,
  className = '',
}: {
  item: LeMieuxItem
  size?: number
  className?: string
}) {
  const [imgError, setImgError] = useState(false)
  const showIcon = !item.imageUrl || imgError

  return (
    <div
      className={cn('relative flex items-center justify-center overflow-hidden', className)}
      style={{
        background: showIcon ? CATEGORY_WELL_BG[item.urlSlug] ?? 'var(--elev)' : undefined,
      }}
    >
      {showIcon ? (
        <span
          aria-hidden="true"
          style={{ color: CATEGORY_ICON_COLOR[item.urlSlug] ?? 'var(--t4)', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Scale the slot icon up to the requested size */}
          <span style={{ transform: `scale(${size / 18})`, display: 'inline-flex' }}>
            {SLOT_ICON[item.slot ?? 'head']}
          </span>
        </span>
      ) : (
        <img
          src={item.imageUrl!}
          alt={item.name}
          className="w-full h-full object-cover object-center"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  )
}

// ─── SlotButton ────────────────────────────────────────────────────────────────

function SlotButton({
  slot,
  slotIndex,
  equippedItem,
  selectedOwnedItem,
  reducedMotion,
  onTap,
  onDragOver,
  onDrop,
  isDragTarget,
}: {
  slot: LeMieuxSlot
  /** For legs slot: 0=FL, 1=FR, 2=BL, 3=BR */
  slotIndex?: number
  equippedItem: OwnedItem | undefined
  selectedOwnedItem: OwnedItem | null
  reducedMotion: boolean
  onTap: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDragTarget: boolean
}) {
  const isFilled = equippedItem != null
  const lemieuxItem = equippedItem?.lemieuxItemId
    ? LEMIEUX_ITEMS.find(i => i.id === equippedItem.lemieuxItemId) ?? null
    : null

  // Stagger delay for legs
  const staggerDelay = (slotIndex ?? 0) * 0.08

  const wellBg = lemieuxItem
    ? (CATEGORY_WELL_BG[lemieuxItem.urlSlug] ?? 'var(--elev)')
    : 'var(--elev)'

  const borderColor = isDragTarget
    ? 'var(--blue)'
    : isFilled && lemieuxItem
    ? (CATEGORY_BORDER[lemieuxItem.urlSlug] ?? 'var(--border)')
    : 'var(--border)'

  const borderStyle = isDragTarget || isFilled ? '1.5px solid' : '1.5px dashed'

  return (
    <motion.button
      onClick={onTap}
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-label={`${SLOT_LABEL[slot]} slot${isFilled ? ` — ${equippedItem?.name ?? ''} equipped` : ' — empty'}`}
      className="relative flex flex-col items-center justify-center gap-0.5 transition-colors"
      style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: isDragTarget
          ? 'var(--blue-sub)'
          : isFilled && lemieuxItem
          ? wellBg
          : 'var(--elev)',
        border: `${borderStyle} ${borderColor}`,
      }}
      animate={
        isFilled && !reducedMotion
          ? { scale: [0.8, 1] }
          : { scale: 1 }
      }
      transition={
        isFilled && !reducedMotion
          ? {
              type: 'spring' as const,
              stiffness: 400,
              damping: 20,
              delay: staggerDelay,
            }
          : { duration: 0 }
      }
    >
      {isFilled && lemieuxItem ? (
        // Show item thumbnail when filled
        <ItemWell
          item={lemieuxItem}
          size={32}
          className="w-8 h-8 rounded-[6px] overflow-hidden"
        />
      ) : (
        // Show slot icon when empty
        <>
          <span
            aria-hidden="true"
            style={{ color: 'var(--t4)' }}
          >
            {SLOT_ICON[slot]}
          </span>
          <span
            className="text-center leading-none"
            style={{ fontSize: 10, fontWeight: 500, color: 'var(--t4)' }}
          >
            {SLOT_LABEL[slot]}
          </span>
        </>
      )}
    </motion.button>
  )
}

// ─── InventoryStrip ────────────────────────────────────────────────────────────

function InventoryStrip({
  ownedLeMieuxItems,
  selectedOwnedId,
  onSelect,
  onDragStart,
}: {
  ownedLeMieuxItems: (OwnedItem & { lemieuxDef: LeMieuxItem })[]
  selectedOwnedId: number | null
  onSelect: (item: OwnedItem) => void
  onDragStart: (e: React.DragEvent, item: OwnedItem) => void
}) {
  if (ownedLeMieuxItems.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6">
        <ShoppingBag size={32} className="text-[var(--t4)]" aria-hidden="true" />
        <p className="text-[13px] text-[var(--t3)]">No items — buy some from the Store</p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-row gap-3 overflow-x-auto pb-2"
      style={{ scrollbarWidth: 'none', WebkitScrollSnapType: undefined } as React.CSSProperties}
    >
      {ownedLeMieuxItems.map(({ lemieuxDef, ...ownedItem }) => {
        const isSelected = ownedItem.id === selectedOwnedId
        const isEquipped = ownedItem.equippedToPetId != null
        return (
          <button
            key={ownedItem.id}
            draggable
            onDragStart={e => onDragStart(e, ownedItem)}
            onClick={() => onSelect(ownedItem)}
            aria-label={`${lemieuxDef.name}${isEquipped ? ', equipped' : ''}`}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div
              className="relative overflow-hidden transition-all duration-150"
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                outline: isSelected
                  ? '2px solid var(--blue)'
                  : isEquipped
                  ? '2px solid var(--green)'
                  : 'none',
                outlineOffset: 2,
              }}
            >
              <ItemWell
                item={lemieuxDef}
                size={32}
                className="w-full h-full"
              />
              {isEquipped && (
                <div
                  className="absolute bottom-0 left-0 right-0 text-center"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--green-t)',
                    background: 'var(--green-sub)',
                    padding: '2px 0',
                  }}
                >
                  ON
                </div>
              )}
            </div>
            <span
              className="text-center line-clamp-1 w-[72px]"
              style={{ fontSize: 10, color: 'var(--t3)' }}
            >
              {lemieuxDef.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── HorsePicker BottomSheet ────────────────────────────────────────────────────
// Used when navigating to equip screen from Items Collection tab.
// Not used directly from EquipScreen — kept here for co-location.

export function HorsePickerSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { pets } = useSavedNames()
  const navigate = useNavigate()
  const horses = useMemo(
    () => pets.filter(p => p.category === 'Stables' && p.status === 'active'),
    [pets],
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Choose a horse to equip">
      <div className="px-6 pb-8 flex flex-col gap-2">
        {horses.length === 0 ? (
          <p className="text-[13px] text-[var(--t3)] py-4">
            No horses in your stables yet.
          </p>
        ) : (
          horses.map(horse => (
            <button
              key={horse.id}
              onClick={() => {
                onClose()
                navigate(`/equip/${horse.id}`)
              }}
              className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border-s)] bg-[var(--elev)] hover:border-[var(--border)] transition-colors text-left"
            >
              <AnimalImage
                src={horse.imageUrl}
                alt={horse.name}
                className="w-12 h-12 rounded-[10px] object-cover shrink-0"
              />
              <div>
                <div className="text-[14px] font-semibold text-[var(--t1)]">{horse.name}</div>
                <div className="text-[12px] text-[var(--t3)]">{horse.breed}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </BottomSheet>
  )
}

// ─── EquipScreen ───────────────────────────────────────────────────────────────

export function EquipScreen() {
  const { petId: petIdParam } = useParams<{ petId: string }>()
  const navigate = useNavigate()
  const petId = petIdParam ? parseInt(petIdParam, 10) : null

  const { coins } = useWallet()
  const { equip, unequipSlot, itemInSlot } = useEquipment()
  const { ownedItems } = useItemShop()
  const { pets } = useSavedNames()
  const { toast } = useToast()
  const reducedMotion = useReducedMotion()

  // The pet we're dressing
  const pet = useMemo(
    () => (petId != null ? pets.find(p => p.id === petId) ?? null : null),
    [pets, petId],
  )

  // All owned LeMieux items visible in the strip:
  //   - unequipped (equippedToPetId === null)
  //   - equipped to THIS horse (equippedToPetId === petId)
  // Items equipped to other horses are hidden
  const ownedLeMieuxItems = useMemo<(OwnedItem & { lemieuxDef: LeMieuxItem })[]>(() => {
    if (petId == null) return []
    return ownedItems
      .filter(item => {
        if (!item.lemieuxItemId) return false
        if (item.equippedToPetId === null) return true
        if (item.equippedToPetId === petId) return true
        return false
      })
      .flatMap(item => {
        const def = LEMIEUX_ITEMS.find(d => d.id === item.lemieuxItemId)
        if (!def) return []
        return [{ ...item, lemieuxDef: def }]
      })
  }, [ownedItems, petId])

  // Tap-to-equip state: the currently selected inventory item
  const [selectedOwnedId, setSelectedOwnedId] = useState<number | null>(null)
  // Drag-over state: the slot currently being hovered
  const [dragOverSlot, setDragOverSlot] = useState<LeMieuxSlot | null>(null)
  // Leg sub-index being dragged over (0-3)
  const [dragOverLegIndex, setDragOverLegIndex] = useState<number | null>(null)

  // Slot layout — single slots
  const singleSlots: LeMieuxSlot[] = ['head', 'bridle', 'body', 'saddle']

  // Item in each slot for this pet (reactive)
  function slotItem(slot: LeMieuxSlot) {
    if (petId == null) return undefined
    return itemInSlot(petId, slot)
  }

  // ── Tap handler for slot button ─────────────────────────────────────────────
  async function handleSlotTap(slot: LeMieuxSlot) {
    if (petId == null) return
    const current = slotItem(slot)

    if (current) {
      // Tap filled slot → unequip
      try {
        await unequipSlot(petId, slot)
      } catch {
        toast({ type: 'error', title: 'Could not remove item. Please try again.' })
      }
      return
    }

    if (selectedOwnedId == null) return

    const selectedItem = ownedLeMieuxItems.find(i => i.id === selectedOwnedId)
    if (!selectedItem) return

    // Check slot compatibility
    if (selectedItem.lemieuxDef.slot !== slot) {
      toast({ type: 'error', title: `${selectedItem.lemieuxDef.name} goes in the ${SLOT_LABEL[selectedItem.lemieuxDef.slot ?? 'head']} slot` })
      return
    }

    try {
      await equip(selectedOwnedId, petId, slot)
      setSelectedOwnedId(null)
    } catch {
      toast({ type: 'error', title: 'Could not equip item. Please try again.' })
    }
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────
  function handleDragStart(e: React.DragEvent, item: OwnedItem) {
    e.dataTransfer.setData('text/plain', String(item.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, slot: LeMieuxSlot, legIndex?: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(slot)
    setDragOverLegIndex(legIndex ?? null)
  }

  function handleDragLeave() {
    setDragOverSlot(null)
    setDragOverLegIndex(null)
  }

  async function handleDrop(e: React.DragEvent, targetSlot: LeMieuxSlot) {
    e.preventDefault()
    setDragOverSlot(null)
    setDragOverLegIndex(null)
    if (petId == null) return

    const ownedItemIdStr = e.dataTransfer.getData('text/plain')
    const ownedItemId = parseInt(ownedItemIdStr, 10)
    if (isNaN(ownedItemId)) return

    const droppedItem = ownedLeMieuxItems.find(i => i.id === ownedItemId)
    if (!droppedItem) return

    // Silently ignore incompatible slot drops
    if (droppedItem.lemieuxDef.slot !== targetSlot) return

    try {
      await equip(ownedItemId, petId, targetSlot)
    } catch {
      toast({ type: 'error', title: 'Could not equip item. Please try again.' })
    }
  }

  if (petId == null || pet == null) {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] items-center justify-center">
        <p className="text-[var(--t3)] text-[15px]">Horse not found</p>
      </div>
    )
  }

  // Equipment is currently restricted to Stables (horses) only.
  // Other animal categories will get their own equip screens in a future update.
  if (pet.category !== 'Stables') {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] items-center justify-center gap-3 px-8 text-center">
        <p className="text-[17px] font-semibold text-[var(--t1)]">Equipment coming soon</p>
        <p className="text-[14px] text-[var(--t2)]">
          Items can currently only be equipped to horses. More animal types coming later.
        </p>
      </div>
    )
  }

  const LEG_LABELS = ['FL', 'FR', 'BL', 'BR']
  const legsItem = slotItem('legs')

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] overflow-y-auto">
      <PageHeader
        title={pet.name}
        trailing={<CoinDisplay amount={coins} />}
      />

      <div
        className="px-6 pt-6 pb-24 max-w-3xl mx-auto w-full"
        onDragLeave={handleDragLeave}
      >

        {/* Equipment area */}
        <div
          className="relative flex items-center justify-center select-none"
          style={{ height: 300 }}
        >
          {/* Horse image — centre */}
          <div
            className="relative rounded-[16px] border border-[var(--border-s)] bg-[var(--elev)] overflow-hidden shrink-0"
            style={{ width: 200, height: 200 }}
          >
            <AnimalImage
              src={pet.imageUrl}
              alt={pet.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* HEAD slot — above horse, centred */}
          <div
            className="absolute"
            style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            <SlotButton
              slot="head"
              equippedItem={slotItem('head')}
              selectedOwnedItem={ownedLeMieuxItems.find(i => i.id === selectedOwnedId) ?? null}
              reducedMotion={reducedMotion}
              isDragTarget={dragOverSlot === 'head'}
              onTap={() => handleSlotTap('head')}
              onDragOver={e => handleDragOver(e, 'head')}
              onDrop={e => handleDrop(e, 'head')}
            />
          </div>

          {/* BRIDLE slot — left of horse */}
          <div
            className="absolute"
            style={{ top: '50%', left: 0, transform: 'translateY(-50%)' }}
          >
            <SlotButton
              slot="bridle"
              equippedItem={slotItem('bridle')}
              selectedOwnedItem={ownedLeMieuxItems.find(i => i.id === selectedOwnedId) ?? null}
              reducedMotion={reducedMotion}
              isDragTarget={dragOverSlot === 'bridle'}
              onTap={() => handleSlotTap('bridle')}
              onDragOver={e => handleDragOver(e, 'bridle')}
              onDrop={e => handleDrop(e, 'bridle')}
            />
          </div>

          {/* BODY slot — right of horse */}
          <div
            className="absolute"
            style={{ top: '50%', right: 0, transform: 'translateY(-50%)' }}
          >
            <SlotButton
              slot="body"
              equippedItem={slotItem('body')}
              selectedOwnedItem={ownedLeMieuxItems.find(i => i.id === selectedOwnedId) ?? null}
              reducedMotion={reducedMotion}
              isDragTarget={dragOverSlot === 'body'}
              onTap={() => handleSlotTap('body')}
              onDragOver={e => handleDragOver(e, 'body')}
              onDrop={e => handleDrop(e, 'body')}
            />
          </div>

          {/* SADDLE slot — below horse, centred */}
          <div
            className="absolute"
            style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)' }}
          >
            <SlotButton
              slot="saddle"
              equippedItem={slotItem('saddle')}
              selectedOwnedItem={ownedLeMieuxItems.find(i => i.id === selectedOwnedId) ?? null}
              reducedMotion={reducedMotion}
              isDragTarget={dragOverSlot === 'saddle'}
              onTap={() => handleSlotTap('saddle')}
              onDragOver={e => handleDragOver(e, 'saddle')}
              onDrop={e => handleDrop(e, 'saddle')}
            />
          </div>

          {/* LEGS slot — row of 4, below saddle */}
          <div
            className="absolute flex flex-row gap-1"
            style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)' }}
          >
            {LEG_LABELS.map((label, i) => (
              <SlotButton
                key={label}
                slot="legs"
                slotIndex={i}
                equippedItem={legsItem}
                selectedOwnedItem={ownedLeMieuxItems.find(item => item.id === selectedOwnedId) ?? null}
                reducedMotion={reducedMotion}
                isDragTarget={dragOverSlot === 'legs' && (dragOverLegIndex === i || dragOverLegIndex === null)}
                onTap={() => handleSlotTap('legs')}
                onDragOver={e => handleDragOver(e, 'legs', i)}
                onDrop={e => handleDrop(e, 'legs')}
              />
            ))}
          </div>
        </div>

        {/* Inventory strip */}
        <div className="mt-8">
          <p
            className="mb-3"
            style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px' }}
          >
            Your items
          </p>
          <InventoryStrip
            ownedLeMieuxItems={ownedLeMieuxItems}
            selectedOwnedId={selectedOwnedId}
            onSelect={item => setSelectedOwnedId(prev => prev === item.id ? null : item.id ?? null)}
            onDragStart={handleDragStart}
          />
        </div>

        {/* Tap-to-equip hint */}
        {selectedOwnedId != null && (
          <p
            className="mt-4 text-center"
            style={{ fontSize: 12, color: 'var(--blue-t)' }}
          >
            Now tap a slot to equip — or tap the item again to deselect
          </p>
        )}

      </div>
    </div>
  )
}
