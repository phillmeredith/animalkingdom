// useWallet — manages playerWallet + transactions
// Leaf hook — no dependencies on other hooks

import { useLiveQuery } from 'dexie-react-hooks'
import { db, ensureWallet, todayString } from '@/lib/db'
import type { Transaction, TransactionCategory } from '@/lib/db'

export function useWallet() {
  const wallet = useLiveQuery(() => db.playerWallet.get(1), [])

  const coins = wallet?.coins ?? 0
  const totalEarned = wallet?.totalEarned ?? 0
  const totalSpent = wallet?.totalSpent ?? 0
  const streak = wallet?.dailyLoginStreak ?? 0

  function canAfford(amount: number): boolean {
    return coins >= amount
  }

  async function earn(
    amount: number,
    source: string,
    category: TransactionCategory,
    relatedEntityId?: number,
  ): Promise<void> {
    const w = await ensureWallet()
    const newBalance = w.coins + amount
    const now = new Date()

    await db.transaction('rw', db.playerWallet, db.transactions, async () => {
      await db.playerWallet.update(1, {
        coins: newBalance,
        totalEarned: w.totalEarned + amount,
        updatedAt: now,
      })
      await db.transactions.add({
        type: 'earn',
        amount,
        source,
        category,
        relatedEntityId: relatedEntityId ?? null,
        balanceAfter: newBalance,
        createdAt: now,
      })
    })
  }

  async function spend(
    amount: number,
    source: string,
    category: TransactionCategory,
    relatedEntityId?: number,
  ): Promise<{ ok: true; transactionId: number } | { ok: false }> {
    const w = await ensureWallet()
    if (w.coins < amount) return { ok: false }

    const newBalance = w.coins - amount
    const now = new Date()

    let transactionId = 0
    await db.transaction('rw', db.playerWallet, db.transactions, async () => {
      await db.playerWallet.update(1, {
        coins: newBalance,
        totalSpent: w.totalSpent + amount,
        updatedAt: now,
      })
      transactionId = await db.transactions.add({
        type: 'spend',
        amount,
        source,
        category,
        relatedEntityId: relatedEntityId ?? null,
        balanceAfter: newBalance,
        createdAt: now,
      })
    })

    return { ok: true, transactionId }
  }

  async function getTransactions(
    limit = 50,
    filter?: TransactionCategory,
  ): Promise<Transaction[]> {
    let query = db.transactions.orderBy('createdAt').reverse()
    if (filter) {
      return query.filter(t => t.category === filter).limit(limit).toArray()
    }
    return query.limit(limit).toArray()
  }

  async function claimDailyBonus(): Promise<{
    awarded: boolean
    amount: number
    streak: number
  }> {
    const w = await ensureWallet()
    const today = todayString()

    if (w.lastDailyBonusDate === today) {
      return { awarded: false, amount: 0, streak: w.dailyLoginStreak }
    }

    const amount = 25
    const newStreak = w.dailyLoginStreak + 1
    const newBalance = w.coins + amount
    const now = new Date()

    await db.transaction('rw', db.playerWallet, db.transactions, async () => {
      await db.playerWallet.update(1, {
        coins: newBalance,
        totalEarned: w.totalEarned + amount,
        lastDailyBonusDate: today,
        dailyLoginStreak: newStreak,
        updatedAt: now,
      })
      await db.transactions.add({
        type: 'earn',
        amount,
        source: 'Daily login bonus',
        category: 'daily',
        relatedEntityId: null,
        balanceAfter: newBalance,
        createdAt: now,
      })
    })

    return { awarded: true, amount, streak: newStreak }
  }

  async function undoLastTransaction(transactionId: number): Promise<boolean> {
    const tx = await db.transactions.get(transactionId)
    if (!tx) return false

    // Only allow undo within 5 seconds
    const age = Date.now() - tx.createdAt.getTime()
    if (age > 5000) return false

    const w = await ensureWallet()
    const now = new Date()

    await db.transaction('rw', db.playerWallet, db.transactions, async () => {
      // Reverse the transaction
      const coinsAdjust = tx.type === 'spend' ? tx.amount : -tx.amount
      const newBalance = w.coins + coinsAdjust
      const newEarned = tx.type === 'earn' ? w.totalEarned - tx.amount : w.totalEarned
      const newSpent = tx.type === 'spend' ? w.totalSpent - tx.amount : w.totalSpent

      await db.playerWallet.update(1, {
        coins: newBalance,
        totalEarned: Math.max(0, newEarned),
        totalSpent: Math.max(0, newSpent),
        updatedAt: now,
      })
      await db.transactions.delete(transactionId)
    })

    return true
  }

  return {
    coins,
    totalEarned,
    totalSpent,
    streak,
    canAfford,
    earn,
    spend,
    getTransactions,
    claimDailyBonus,
    undoLastTransaction,
  }
}
