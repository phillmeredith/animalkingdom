// useNameHistory — rolling buffer of the last 100 generation events
// Written on every completed generate, regardless of adoption

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { HistoryEntry } from '@/lib/db'

export function useNameHistory() {
  const history = useLiveQuery(
    () => db.history.orderBy('id').reverse().toArray(),
    [],
    [] as HistoryEntry[],
  )

  async function addToHistory(
    entry: Omit<HistoryEntry, 'id' | 'createdAt'>,
  ): Promise<void> {
    try {
      await db.transaction('rw', db.history, async () => {
        await db.history.add({ ...entry, createdAt: new Date() })
        const count = await db.history.count()
        if (count > 100) {
          const oldest = await db.history.orderBy('id').first()
          if (oldest?.id) await db.history.delete(oldest.id)
        }
      })
    } catch {
      // History is non-critical — silently swallow
    }
  }

  async function clearHistory(): Promise<void> {
    await db.history.clear()
  }

  return { history, addToHistory, clearHistory }
}
