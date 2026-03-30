// usePawtect — Pawtect charity donation system
// Depends on: useWallet (for spend())
//
// Preset amount sanity check (required by refined-stories.md):
//   Daily login bonus = 25 coins. Based on wallet telemetry the starting balance is
//   500 coins and typical session earnings (arcade wins, care bonuses) range from
//   ~25–100 coins per session. The largest preset (50 coins) represents roughly half
//   a daily bonus or one session's arcade earnings — meaningful but not punitive.
//   The 5-coin preset is essentially free change. The range 5–50 is reasonable for
//   a child's game economy. No recalibration required for this iteration.
//
// Transaction boundary rule:
//   spend() + pawtectDonations.add() are inside a SINGLE db.transaction('rw', ...).
//   Dexie reuses the outer transaction for the inner playerWallet/transactions writes
//   that spend() performs — same pattern as useCardPacks.openPack().
//   If the donation record insert fails, the entire transaction rolls back and Harry's
//   coins are unchanged. This satisfies TRANS-2.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'

export interface PawtectState {
  /** Lifetime total coins donated — reactively updated via useLiveQuery. */
  totalDonated: number
  /** Deducts `amount` coins and records the donation. Throws on failure (caller handles toast). */
  donate: (amount: number) => Promise<void>
}

export function usePawtect(): PawtectState {
  const { spend } = useWallet()

  // Derive lifetime total by summing all donation records.
  // useLiveQuery re-runs automatically whenever pawtectDonations changes.
  const totalDonated = useLiveQuery(
    async () => {
      const all = await db.pawtectDonations.toArray()
      return all.reduce((sum, d) => sum + d.amount, 0)
    },
    [],
    0,
  )

  async function donate(amount: number): Promise<void> {
    // CRITICAL — both spend() and the donation record insert are inside one transaction.
    // Declared tables must be the union of all tables touched inside:
    //   pawtectDonations (new record)
    //   playerWallet + transactions (touched by spend() internally)
    // Dexie reuses this outer transaction for the subset writes inside spend().
    await db.transaction(
      'rw',
      db.pawtectDonations,
      db.playerWallet,
      db.transactions,
      async () => {
        const result = await spend(amount, 'Pawtect donation', 'items')
        if (!result.ok) {
          throw new Error('Not enough coins')
        }

        await db.pawtectDonations.add({
          amount,
          donatedAt: new Date(),
        })
      },
    )
  }

  return {
    totalDonated: totalDonated ?? 0,
    donate,
  }
}
