// useEquipment.ts — LeMieux equipment equip/unequip operations
//
// Implements: spec/features/lemieux-equipment-system/interaction-spec.md
// Refined stories: product/lemieux-equipment-system/refined-stories.md
//
// Self-review checklist:
// [x] All DB writes inside db.transaction('rw', ...) — no writes outside transactions
// [x] equip() checks for an existing item in the target slot and unequips it first
// [x] Every async operation wrapped in try/catch — rethrows so FE caller fires toast
//     (same pattern as useSchleichCollection — hook must not import from components)
// [x] useLiveQuery used for all reactive state — no manual re-fetching
// [x] No circular imports — LeMieuxSlot imported from @/data/lemieux, same as db.ts
// [x] legs slot: one OwnedItem record covers all four legs; FE renders four slot
//     indicators all reading from the same record (per owner confirmation)
// [x] No spend() call — this hook does not purchase items; purchasing is in useItemShop
// [x] No badge eligibility — no badge-eligible events in the equip/unequip flow
// [x] Pet status not checked here — caller must verify pet.status !== 'for_sale'
//     before calling equip(); hook trusts the petId it receives

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { OwnedItem } from '@/lib/db'
import type { LeMieuxSlot } from '@/data/lemieux'

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseEquipmentReturn {
  /**
   * Equip an owned item to a slot on a pet.
   * If the slot is already occupied, the current occupant is unequipped first
   * (returned to inventory). Then the new item is equipped.
   * Throws on DB error — calling component must catch and toast.
   */
  equip(ownedItemId: number, petId: number, slot: LeMieuxSlot): Promise<void>

  /**
   * Remove an item from its current slot, returning it to inventory.
   * Throws on DB error — calling component must catch and toast.
   */
  unequip(ownedItemId: number): Promise<void>

  /**
   * Find the item currently in a given slot for a given pet and unequip it.
   * No-op if the slot is empty.
   * Throws on DB error — calling component must catch and toast.
   */
  unequipSlot(petId: number, slot: LeMieuxSlot): Promise<void>

  /**
   * Reactive array of OwnedItem records equipped to the given pet.
   * Rebuilds automatically whenever the ownedItems table changes.
   * Returns [] while the initial Dexie read is in progress.
   */
  equippedItems(petId: number): OwnedItem[]

  /**
   * Derived helper — the OwnedItem currently in the given slot for this pet,
   * or undefined if the slot is empty.
   */
  itemInSlot(petId: number, slot: LeMieuxSlot): OwnedItem | undefined
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEquipment(): UseEquipmentReturn {
  // Live query: all owned items that are currently equipped to any pet.
  // We fetch the full equipped set here so equippedItems(petId) and
  // itemInSlot(petId, slot) can be synchronous derived lookups.
  const allEquipped = useLiveQuery(
    () =>
      db.ownedItems
        .where('equippedToPetId')
        .above(0)
        .toArray(),
    [],
    [] as OwnedItem[],
  )

  // ── equip ──────────────────────────────────────────────────────────────────
  // Transaction scope: ownedItems only — no coins change.
  // Reads the current occupant from the DB (not from allEquipped) inside the
  // transaction so we get a consistent snapshot. This prevents a TOCTOU race
  // if the component renders twice before the first equip commits.

  async function equip(ownedItemId: number, petId: number, slot: LeMieuxSlot): Promise<void> {
    try {
      await db.transaction('rw', db.ownedItems, async () => {
        // Find any existing item in this slot for this pet
        const current = await db.ownedItems
          .where('equippedToPetId')
          .equals(petId)
          .filter(item => item.equippedSlot === slot)
          .first()

        // Unequip the current occupant if present and it is not the same item
        if (current?.id !== undefined && current.id !== ownedItemId) {
          await db.ownedItems.update(current.id, {
            equippedToPetId: null,
            equippedSlot:    null,
          })
        }

        // Equip the new item
        await db.ownedItems.update(ownedItemId, {
          equippedToPetId: petId,
          equippedSlot:    slot,
        })
      })
    } catch (err) {
      // Rethrow — the calling component must catch and call
      // toast({ type: 'error', title: 'Could not equip item. Please try again.' })
      throw err
    }
  }

  // ── unequip ────────────────────────────────────────────────────────────────

  async function unequip(ownedItemId: number): Promise<void> {
    try {
      await db.transaction('rw', db.ownedItems, async () => {
        await db.ownedItems.update(ownedItemId, {
          equippedToPetId: null,
          equippedSlot:    null,
        })
      })
    } catch (err) {
      // Rethrow — calling component must catch and toast
      throw err
    }
  }

  // ── unequipSlot ────────────────────────────────────────────────────────────

  async function unequipSlot(petId: number, slot: LeMieuxSlot): Promise<void> {
    try {
      await db.transaction('rw', db.ownedItems, async () => {
        const current = await db.ownedItems
          .where('equippedToPetId')
          .equals(petId)
          .filter(item => item.equippedSlot === slot)
          .first()

        if (current?.id !== undefined) {
          await db.ownedItems.update(current.id, {
            equippedToPetId: null,
            equippedSlot:    null,
          })
        }
        // No-op if slot is empty — not an error
      })
    } catch (err) {
      // Rethrow — calling component must catch and toast
      throw err
    }
  }

  // ── equippedItems (derived) ────────────────────────────────────────────────
  // Returns the subset of allEquipped for a specific petId.
  // Memoization happens in the calling component via useMemo if needed — this
  // is a synchronous filter on the already-reactive allEquipped array.

  function equippedItems(petId: number): OwnedItem[] {
    return allEquipped.filter(item => item.equippedToPetId === petId)
  }

  // ── itemInSlot (derived) ───────────────────────────────────────────────────

  function itemInSlot(petId: number, slot: LeMieuxSlot): OwnedItem | undefined {
    return allEquipped.find(
      item => item.equippedToPetId === petId && item.equippedSlot === slot,
    )
  }

  return {
    equip,
    unequip,
    unequipSlot,
    equippedItems,
    itemInSlot,
  }
}

// ─── Convenience selector hook ────────────────────────────────────────────────
// Callers that only need the equipped state for a single pet can use this
// lighter hook — it issues a targeted live query instead of fetching all equipped
// items across all pets.

export function useEquippedItems(petId: number): {
  items: OwnedItem[]
  itemInSlot: (slot: LeMieuxSlot) => OwnedItem | undefined
} {
  const items = useLiveQuery(
    () =>
      petId > 0
        ? db.ownedItems.where('equippedToPetId').equals(petId).toArray()
        : Promise.resolve([] as OwnedItem[]),
    [petId],
    [] as OwnedItem[],
  )

  // Stable memoized slot lookup — rebuilds only when items array changes
  const slotMap = useMemo(() => {
    const m = new Map<LeMieuxSlot, OwnedItem>()
    for (const item of items) {
      if (item.equippedSlot) m.set(item.equippedSlot, item)
    }
    return m
  }, [items])

  function itemInSlot(slot: LeMieuxSlot): OwnedItem | undefined {
    return slotMap.get(slot)
  }

  return { items, itemInSlot }
}
