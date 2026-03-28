// useItemShop — item purchasing and inventory management
// Depends on: useWallet

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureWallet } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { getItemDef } from '@/data/itemDefs'
import type { OwnedItem } from '@/lib/db'
import type { LeMieuxItem } from '@/data/lemieux'

// buyItem return shape — transactionId is set on success so callers can offer undo (R-03 / QA-030)
export interface BuyItemResult {
  success: boolean
  reason?: string
  transactionId?: number
}

export function useItemShop() {
  const { spend, undoLastTransaction } = useWallet()

  const ownedItems = useLiveQuery(
    () => db.ownedItems.toArray(),
    [],
    [] as OwnedItem[],
  )

  function getOwnedCount(itemDefId: string): number {
    return ownedItems.filter(i => i.itemDefId === itemDefId).length
  }

  function getEquippedItem(petId: number, category: OwnedItem['category']): OwnedItem | undefined {
    return ownedItems.find(i => i.equippedToPetId === petId && i.category === category)
  }

  async function buyItem(itemDefId: string): Promise<BuyItemResult> {
    const def = getItemDef(itemDefId)
    if (!def) return { success: false, reason: 'Unknown item' }

    const paid = await spend(def.price, `Bought ${def.name}`, 'items')
    if (!paid.ok) return { success: false, reason: 'Not enough coins' }

    const ownedItemId = await db.ownedItems.add({
      itemDefId: def.id,
      category: def.category,
      name: def.name,
      rarity: def.rarity,
      statBoost: def.statBoost,
      purchasePrice: def.price,
      remainingUses: def.uses,
      equippedToPetId: null,
      purchasedAt: new Date(),
    })

    // Store the ownedItem id on the transaction so undoPurchase can find it.
    // We store it via relatedEntityId by updating the just-created transaction.
    await db.transactions.update(paid.transactionId, { relatedEntityId: ownedItemId })

    return { success: true, transactionId: paid.transactionId }
  }

  /**
   * Undo a purchase within the 5-second window.
   * Deletes the ownedItem record and refunds coins via undoLastTransaction.
   * Returns true if the undo succeeded, false if outside window or already undone.
   */
  async function undoPurchase(transactionId: number): Promise<boolean> {
    const tx = await db.transactions.get(transactionId)
    if (!tx) return false

    // Enforce 5-second window
    const age = Date.now() - tx.createdAt.getTime()
    if (age > 5000) return false

    // Delete the ownedItem that was created by this purchase
    if (tx.relatedEntityId !== null) {
      await db.ownedItems.delete(tx.relatedEntityId)
    }

    // Reverse the wallet transaction
    return undoLastTransaction(transactionId)
  }

  async function equipItem(itemId: number, petId: number): Promise<void> {
    const item = await db.ownedItems.get(itemId)
    if (!item) return

    // Unequip any existing item of the same category from this pet
    const existing = ownedItems.find(
      i => i.equippedToPetId === petId && i.category === item.category && i.id !== itemId,
    )
    if (existing?.id) {
      await db.ownedItems.update(existing.id, { equippedToPetId: null })
    }

    await db.ownedItems.update(itemId, { equippedToPetId: petId })

    // Also update the pet's equippedSaddleId if it's a saddle
    if (item.category === 'saddle') {
      await db.savedNames.update(petId, { equippedSaddleId: itemId })
    }
  }

  async function unequipItem(itemId: number, petId: number): Promise<void> {
    await db.ownedItems.update(itemId, { equippedToPetId: null })
    const item = await db.ownedItems.get(itemId)
    if (item?.category === 'saddle') {
      await db.savedNames.update(petId, { equippedSaddleId: null })
    }
  }

  async function useItem(itemId: number): Promise<void> {
    const item = await db.ownedItems.get(itemId)
    if (!item || item.remainingUses === null) return

    if (item.remainingUses <= 1) {
      await db.ownedItems.delete(itemId)
    } else {
      await db.ownedItems.update(itemId, { remainingUses: item.remainingUses - 1 })
    }
  }

  // ── LeMieux inventory queries ──────────────────────────────────────────────

  /** Reactive set of lemieuxItemId values the player owns.
   *  Rebuilds whenever the ownedItems table changes.
   *  O(1) lookups via Set — use ownedLeMieuxIds.has(item.id) in render. */
  const ownedLeMieuxRows = useLiveQuery(
    () =>
      db.ownedItems
        .filter(i => i.lemieuxItemId != null)
        .toArray(),
    [],
    [] as OwnedItem[],
  )

  const ownedLeMieuxIds = useMemo<Set<string>>(
    () => new Set(ownedLeMieuxRows.flatMap(i => (i.lemieuxItemId ? [i.lemieuxItemId] : []))),
    [ownedLeMieuxRows],
  )

  /** How many copies of a given LeMieux item the player owns.
   *  Synchronous — reads from the reactive ownedLeMieuxRows array. */
  function countOwned(lemieuxItemId: string): number {
    return ownedLeMieuxRows.filter(i => i.lemieuxItemId === lemieuxItemId).length
  }

  // ── buyLeMieuxItem ─────────────────────────────────────────────────────────
  // Transaction integrity: spend() + ownedItems.add() are inside a single
  // db.transaction() that includes playerWallet, transactions, and ownedItems.
  // Dexie v4 zone-based transaction propagation means the spend() inner
  // transaction participates in the outer one — both commits or neither does.
  // This satisfies the CLAUDE.md spend-before-write rule.

  async function buyLeMieuxItem(item: LeMieuxItem): Promise<void> {
    await db.transaction(
      'rw',
      db.playerWallet,
      db.transactions,
      db.ownedItems,
      async () => {
        // Read wallet inside transaction for a consistent snapshot
        const w = await ensureWallet()
        if (w.coins < item.price) {
          throw new Error('Not enough coins')
        }

        const newBalance = w.coins - item.price
        const now = new Date()

        // Deduct coins
        await db.playerWallet.update(1, {
          coins: newBalance,
          totalSpent: w.totalSpent + item.price,
          updatedAt: now,
        })

        // Record transaction
        const txId = await db.transactions.add({
          type: 'spend',
          amount: item.price,
          source: `Bought ${item.name}`,
          category: 'items',
          relatedEntityId: null,
          balanceAfter: newBalance,
          createdAt: now,
        })

        // Add to inventory — this is the item the player purchased.
        // If this write throws, the whole transaction rolls back (coins refunded).
        const ownedItemId = await db.ownedItems.add({
          itemDefId:       item.id,
          lemieuxItemId:   item.id,
          category:        item.urlSlug as OwnedItem['category'],
          name:            item.name,
          rarity:          'epic',
          statBoost:       null,
          purchasePrice:   item.price,
          remainingUses:   null,
          equippedToPetId: null,
          equippedSlot:    null,
          purchasedAt:     now,
        })

        // Link the ownedItem back to the transaction for undo support
        await db.transactions.update(txId, { relatedEntityId: ownedItemId })
      },
    )
    // Errors propagate to the caller.
    // The calling component must wrap buyLeMieuxItem in try/catch and call
    // toast({ type: 'error', title: 'Could not complete purchase. Please try again.' })
  }

  return {
    ownedItems,
    getOwnedCount,
    getEquippedItem,
    buyItem,
    undoPurchase,
    equipItem,
    unequipItem,
    useItem,
    // LeMieux additions
    ownedLeMieuxIds,
    countOwned,
    buyLeMieuxItem,
  }
}
