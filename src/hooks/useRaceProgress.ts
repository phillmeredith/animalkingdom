// useRaceProgress — derived timer state for the RaceProgressModal
//
// Purpose: Expose isReady and fillPercent for a single running race record,
//          ticking every 5 seconds. Contains no DB writes and no spend() calls.
//
// State machine:
//   racing  — finishesAt is in the future; progress bar ticks toward 95%
//   ready   — finishesAt has elapsed; isReady = true, fillPercent = 100 (clamped)
//
// This hook is purely derived state — the Race record itself is the source of
// truth. The hook does not mutate the race; resolveRace() is called by the
// parent via useRacing.
//
// Integration: no badge-eligible events fire in this hook. resolveRace() in
// useRacing is the badge-eligible event owner (racing track). Badge eligibility
// is currently unimplemented in useRacing — see technical debt note below.
//
// Technical debt (pre-existing, not introduced by this hook):
//   TD-001  enterRace() in useRacing calls spend() then db.races.update() outside
//           a db.transaction(). If the update fails, the player loses coins. This
//           violates the spend-before-write transaction integrity rule in CLAUDE.md.
//           Fix: wrap spend() + db.races.update() in a single db.transaction('rw',
//           [db.races, db.playerWallet, db.transactions], ...).
//
//   TD-002  resolveRace() in useRacing calls db.races.update() then earn() as
//           separate awaits. If earn() fails, the race is marked finished but the
//           player receives no prize. Should also be a single db.transaction().
//
//   TD-003  checkBadgeEligibility() is not called after race entry or resolution.
//           Racing is a badge-eligible event (CLAUDE.md). The racing track badges
//           will never unlock until this is added to enterRace() and resolveRace().

import { useState, useEffect, useRef } from 'react'
import type { Race } from '@/lib/db'

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Progress bar tick interval in milliseconds. 5 000ms per spec section 6.4. */
const TICK_INTERVAL_MS = 5_000

/** Minimum fill so the bar is never invisible while racing. */
const FILL_MIN = 5

/** Maximum fill while the race is still active — bar never shows 100% too early. */
const FILL_MAX_RACING = 95

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute the fill percentage (0–100, integers) for a race at a given point in time.
 *
 * Clamped:
 *   - Minimum 5  — bar is always visible while racing
 *   - Maximum 95 — bar never shows full while the race is still technically active
 *   - If the race has already elapsed, return 100 unconditionally
 */
function computeFill(race: Race, now: number): number {
  const start = race.startsAt.getTime()
  const finish = race.finishesAt.getTime()
  const duration = finish - start

  if (now >= finish || duration <= 0) return 100

  const elapsed = now - start
  const raw = (elapsed / duration) * 100
  return Math.round(Math.min(FILL_MAX_RACING, Math.max(FILL_MIN, raw)))
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export interface RaceProgressState {
  /**
   * True when race.finishesAt has elapsed.
   * Drives state A (racing) vs state B (ready) in RaceProgressModal.
   */
  isReady: boolean

  /**
   * 0–100 fill percentage for the progress bar.
   * Clamped to 5–95 while racing; jumps to 100 when isReady becomes true.
   */
  fillPercent: number
}

/**
 * useRaceProgress
 *
 * Given a running race record, returns isReady and fillPercent. Updates every
 * 5 seconds via a stable interval. Safe to call when race is null (returns
 * isReady: false, fillPercent: 5 as defaults).
 *
 * @param race - the Race record from useRacing. Must have startsAt and finishesAt.
 */
export function useRaceProgress(race: Race | null): RaceProgressState {
  const computeState = (now: number): RaceProgressState => {
    if (!race) return { isReady: false, fillPercent: FILL_MIN }
    const isReady = now >= race.finishesAt.getTime()
    const fillPercent = isReady ? 100 : computeFill(race, now)
    return { isReady, fillPercent }
  }

  const [state, setState] = useState<RaceProgressState>(() =>
    computeState(Date.now()),
  )

  // Track the race id so we reset immediately when a different race is passed.
  const raceIdRef = useRef<number | null | undefined>(race?.id)

  useEffect(() => {
    // If the race changed (e.g. modal opened for a different race), snap to new state.
    if (raceIdRef.current !== race?.id) {
      raceIdRef.current = race?.id
      setState(computeState(Date.now()))
    }

    // If already ready, no interval is needed.
    if (!race || state.isReady) return

    const tick = () => {
      const now = Date.now()
      const next = computeState(now)
      setState(next)
      // Once ready, the interval is no longer needed — it will be cleared by
      // the cleanup when isReady becomes true and the effect re-runs.
    }

    const id = setInterval(tick, TICK_INTERVAL_MS)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race, state.isReady])

  return state
}
