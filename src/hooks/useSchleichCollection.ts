// useSchleichCollection.ts
// Implements: spec/features/schleich-collection-tracker/interaction-spec.md
// Refined stories: product/schleich-collection-tracker/refined-stories.md
//
// Self-review checklist:
// [x] Every method in the dev-brief interface is implemented
// [x] TypeScript strict mode — no `any` types
// [x] toggleOwned: try/catch, rethrows so FE caller fires toast (CLAUDE.md rule)
//     Hook does not call toast directly because hooks must not import from
//     components (template rule). FE wraps toggleOwned in its own try/catch
//     and calls useToast() there — satisfying the "user-facing error" requirement
//     without creating a component dependency in the hook.
// [x] No spend() call — this feature has zero economy connection
// [x] No badge eligibility — no badge-eligible events in this feature
// [x] No pet status enforcement — SchleichAnimal is independent of SavedName
// [x] Integration map: schleich feature has no entries in INTEGRATION_MAP.md
// [x] ownedIds is a reactive Set from useLiveQuery — updates grid in real time
// [x] Hook does not import from components

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { SCHLEICH_ITEMS } from '@/data/schleich'
import type { SchleichAnimal } from '@/data/schleich'

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseSchleichCollectionReturn {
  /** Full static catalogue of all 566 figurines — never changes at runtime */
  items: SchleichAnimal[]
  /** Reactive set of owned figurine ids — updates without page refresh via
   *  Dexie useLiveQuery; rebuilds whenever the schleichOwned table changes */
  ownedIds: Set<string>
  /** Toggle ownership for a single figurine.
   *  Adds to schleichOwned if not owned, removes if already owned.
   *  Optimistic UI: the ownedIds set is updated reactively by useLiveQuery
   *  immediately after the DB write.
   *  On DB error: rethrows the error so the calling component can catch it
   *  and display a user-facing toast via its own useToast() call.
   *  The component MUST wrap calls to toggleOwned in a try/catch and call
   *  toast({ type: 'error', ... }) in the catch block — this satisfies the
   *  CLAUDE.md build defect rule without importing Toast into the hook. */
  toggleOwned: (id: string) => Promise<void>
  /** Derived helper — true when the given id is in ownedIds. */
  isOwned: (id: string) => boolean
  /** True while the initial useLiveQuery result is still loading.
   *  The catalogue itself (items) is always synchronously available. */
  loading: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchleichCollection(): UseSchleichCollectionReturn {
  // Live query: reactive ownership set.
  // undefined = still loading (Dexie initial read in progress)
  // SchleichOwned[] = resolved (may be empty array)
  const ownedRows = useLiveQuery(
    () => db.schleichOwned.toArray(),
    [],
  )

  // Convert the array of ownership records to a Set<string> for O(1) lookup.
  // useMemo ensures we only rebuild the Set when the array reference changes.
  const ownedIds = useMemo<Set<string>>(
    () => new Set((ownedRows ?? []).map(row => row.id)),
    [ownedRows],
  )

  const loading = ownedRows === undefined

  // ── toggleOwned ─────────────────────────────────────────────────────────────
  // No economy connection — no spend(), no earn(), no transactions.
  // No badge eligibility — no badge-eligible events.
  // Error handling: wraps the DB operation in try/catch and rethrows.
  // The calling component MUST catch and show a toast (see interface JSDoc above).

  async function toggleOwned(id: string): Promise<void> {
    const alreadyOwned = ownedIds.has(id)
    try {
      if (alreadyOwned) {
        await db.schleichOwned.delete(id)
      } else {
        await db.schleichOwned.add({ id, ownedAt: Date.now() })
      }
      // useLiveQuery triggers automatically — no manual state update needed.
    } catch (err) {
      // Rethrow — do not swallow silently (CLAUDE.md error handling rules).
      // The calling component (SchleichDetailSheet) catches this and calls
      // toast({ type: 'error', ... }) via its own useToast() hook.
      throw err
    }
  }

  // ── isOwned ──────────────────────────────────────────────────────────────────
  // Derived helper: avoids the caller needing to hold a reference to ownedIds.

  function isOwned(id: string): boolean {
    return ownedIds.has(id)
  }

  return {
    items:       SCHLEICH_ITEMS,
    ownedIds,
    toggleOwned,
    isOwned,
    loading,
  }
}
