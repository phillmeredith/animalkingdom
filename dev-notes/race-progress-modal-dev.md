# Dev Handoff Notes — race-progress-modal

**Phase:** C (Developer)
**Date:** 2026-03-28
**Author:** Developer agent

---

## What was built

### 1. `src/hooks/useRaceProgress.ts` (new)

A pure derived-state hook with no DB side-effects. Given a `Race | null`, it exposes:

- `isReady: boolean` — true when `Date.now() >= race.finishesAt.getTime()`
- `fillPercent: number` — integer 0–100 for the progress bar fill

The hook ticks every 5 000ms via `setInterval`. The interval is cleared as soon as `isReady` becomes true (the effect re-runs on `state.isReady` change and the early return prevents a new interval from being registered). When `race` changes identity (different race opened), a `useRef` guard detects the id change and snaps the state synchronously before the effect runs.

**No async operations, no DB calls, no `spend()`, no `earn()`, no badge events.**

### 2. `src/components/ui/Modal.tsx` — `BottomSheet` updated

Added `maxHeight` prop to `BottomSheetProps`. The prop flows through to:
- The panel `motion.div` `style.maxHeight`
- The inner scroll container `maxHeight: calc(${maxHeight} - 80px)`

The Tailwind class `max-h-[85vh]` has been removed from the `cn()` call; the inline style is now the sole constraint. This is intentional — Tailwind and inline styles have conflicting specificity in Vite/PostCSS; using only the inline style removes the ambiguity.

---

## BottomSheet `maxHeight` API contract

```typescript
interface BottomSheetProps {
  // ...existing props unchanged...
  maxHeight?: string   // CSS length string; default: "85vh"
}
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `maxHeight` | `string` | `"85vh"` | Any valid CSS length. Drives both the panel cap and the inner scroll container. |

Usage in `RaceProgressModal`:
```tsx
<BottomSheet maxHeight="80vh" ...>
```

All existing `BottomSheet` usages that do not pass `maxHeight` are unchanged — they receive `"85vh"` as the default.

---

## State machine — `useRaceProgress`

```
                  now < race.finishesAt
             ┌──────────────────────────────┐
             │                              │
             ▼                              │
         [ racing ]  ──── tick (5s) ────▶  [ racing ]
         isReady: false                 isReady: false
         fillPercent: 5–95              fillPercent: 5–95 (increases)
             │
             │  now >= race.finishesAt
             │  (detected on tick or on mount)
             ▼
          [ ready ]
          isReady: true
          fillPercent: 100
          (interval cleared, no further ticks)
```

**Transitions:**
- Mount with `finishesAt` already elapsed → opens directly in `ready` state, no interval set
- Mount with `finishesAt` in future → enters `racing` state, interval ticks every 5s
- `racing` → `ready` → detected on a tick when `now >= finishesAt`; interval clears on next effect run

**There is no backward transition.** A race that becomes `ready` does not revert. This is correct — `finishesAt` is immutable on the record.

---

## Integration events

This hook participates in no integration map events. It reads `race.startsAt` and `race.finishesAt` (both `Date` objects) and derives state from them. No writes occur.

The `resolveRace()` function in `useRacing` is called by `RacingContent` (the parent of `RaceProgressModal`) and is not touched by this hook.

---

## Technical debt flagged (pre-existing — not introduced by this feature)

### TD-001 — `enterRace()`: spend-before-write transaction violation

**Location:** `src/hooks/useRacing.ts`, `enterRace()`, lines 123–151

`spend()` is called at line 123, then `db.races.update()` is called at line 145 as a separate `await` outside any `db.transaction()`. If the `db.races.update()` call throws, the player loses the entry fee coins but the race record is never updated — they cannot enter or recover the coins. This is a data corruption path.

**Fix:** wrap `spend()` and `db.races.update()` inside a single `db.transaction('rw', [db.races, db.playerWallet, db.transactions], async () => { ... })`.

**Severity:** CLAUDE.md classifies this as a build defect. It was not introduced by this feature and is outside Phase C scope for `race-progress-modal`, but it must be resolved before `useRacing` is touched again.

### TD-002 — `resolveRace()`: earn-after-write sequencing risk

**Location:** `src/hooks/useRacing.ts`, `resolveRace()`, lines 168–178

`db.races.update()` and `earn()` are separate `await` calls outside a transaction. If `earn()` fails, the race is marked `finished` but the player receives no prize. Lower severity than TD-001 (no coin loss, only prize non-receipt), but still a data integrity gap.

**Fix:** wrap inside a single `db.transaction('rw', [db.races, db.playerWallet, db.transactions], ...)`.

### TD-003 — `checkBadgeEligibility()` never called for racing events

**Location:** `src/hooks/useRacing.ts`

Racing is a badge-eligible event track per `CLAUDE.md`. Neither `enterRace()` nor `resolveRace()` calls `checkBadgeEligibility()`. Racing track badges cannot unlock until this is added.

**Fix:** call `checkBadgeEligibility()` after `resolveRace()` resolves, passing the racing event context.

### TD-004 — Scroll lock and portal: RESOLVED (pre-existing fix already in codebase)

`Modal.tsx` already uses `useScrollLock()` (reference-counted) and `createPortal(content, document.body)` on both `Modal` and `BottomSheet`. These were resolved in a previous session. No action needed.

---

## Files changed

- `src/hooks/useRaceProgress.ts` — new file
- `src/components/ui/Modal.tsx` — `BottomSheet` component, `maxHeight` prop added

## Files not touched (out of scope)

- `src/hooks/useRacing.ts` — no changes; TD-001/002/003 logged for future fix
- `src/screens/` — no screen files
- `src/components/racing/` — `RaceProgressModal` component is FE scope (Phase C parallel)

---

## Notes for FE agent

The `RaceProgressModal` component (`src/components/racing/RaceProgressModal.tsx`) is FE scope. Key integration points:

1. The parent (`RacingContent`) owns open/close state and looks up the `pet` from `useSavedNames` by `race.playerEntryPetId` before passing it as a prop. The modal is fully presentational.

2. `useRaceProgress(race)` is called in the parent (or inside `RaceProgressModal` directly — either works since it has no side-effects). The `isReady` and `fillPercent` values drive the state A / state B split.

3. The `BottomSheet` receives `maxHeight="80vh"` per Story 9. No other prop changes.

4. The component must use `ReactDOM.createPortal(content, document.body)` — `RacingContent` is inside a Framer Motion animated ancestor which breaks `position: fixed` stacking context. This is non-negotiable per interaction spec section 5.1 and CLAUDE.md portal requirement.

5. For the `AnimatePresence` wrapping within `RaceProgressModal` — if a `ConfettiBurst` or celebration overlay is added in a later iteration, it must get its own `<AnimatePresence>` wrapper and must NOT be a sibling of the sheet panel inside a shared `mode="wait"` block (CLAUDE.md Framer Motion rule 1).
