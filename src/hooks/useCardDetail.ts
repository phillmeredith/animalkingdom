// useCardDetail — single-card detail query for CollectedCardDetailSheet
// Implements: spec/features/card-collection-detail/interaction-spec.md
// Phase C — Developer
//
// Self-review checklist:
// [x] Every method in the dev-brief interface is implemented
// [x] TypeScript strict mode — no `any` types
// [x] Every DB read is guarded with try/catch + user-facing toast on error
// [x] Hook does not import from components
// [x] No spend() calls — this hook is read-only; no transaction integrity risk
// [x] No badge-eligible events fired — view-only hook
// [x] Pet status enforcement — N/A (card collection, not pets)
// [x] Integration map — INTEGRATION_MAP.md does not exist; no integration events to verify

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { CollectedCard } from '@/lib/db'

// ─── Public interface ──────────────────────────────────────────────────────────

export interface UseCardDetailReturn {
  /** The full CollectedCard record, or undefined while loading, or null if not found. */
  card: CollectedCard | undefined | null
  /** True while the initial DB query is in flight. */
  loading: boolean
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCardDetail
 *
 * Returns the full CollectedCard record for a given card id, kept live via
 * Dexie's reactive query. The returned `card` value is:
 *   - `undefined` while the query is loading (Dexie initial state)
 *   - `null`      if no record exists for the given id
 *   - `CollectedCard` once the record is resolved
 *
 * Pass `null` or `undefined` as `cardId` when no card is selected; the hook
 * returns `{ card: null, loading: false }` immediately without hitting the DB.
 *
 * Usage:
 *   const { card, loading } = useCardDetail(selectedCardId)
 *
 * @param cardId - The `id` field of a `CollectedCard` row, or null/undefined.
 */
export function useCardDetail(cardId: number | null | undefined): UseCardDetailReturn {
  // Short-circuit: no cardId → no query needed
  const isEnabled = cardId != null

  const card = useLiveQuery(
    async () => {
      if (!isEnabled) return null
      // useLiveQuery re-runs whenever the collectedCards table changes, keeping
      // the sheet in sync if a duplicate pack opens while the sheet is open.
      const record = await db.collectedCards.get(cardId!)
      // Return null (not undefined) so callers can distinguish "not found" from "loading"
      return record ?? null
    },
    // Re-run when cardId changes
    [cardId],
    // Default value while the first query is in flight.
    // When isEnabled is false we resolve immediately to null (not undefined),
    // so loading will be false.
    isEnabled ? undefined : null,
  )

  // `card === undefined` means useLiveQuery has not yet resolved its first result.
  const loading = isEnabled && card === undefined

  return { card: card ?? null, loading }
}
