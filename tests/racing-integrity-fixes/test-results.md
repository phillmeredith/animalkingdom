# Test Results — Racing Hook Integrity Fixes (TD-001–004)

**Feature:** racing-integrity-fixes
**Phase:** D — Regression Verification (Story 5)
**Tester:** QA agent
**Date:** 2026-03-28
**File under test:** `src/hooks/useRacing.ts`
**Supporting files read:** `src/hooks/useProgress.ts`, `src/screens/PlayHubScreen.tsx`, `src/screens/RacingScreen.tsx`
**Spec authority:** `product/racing-integrity-fixes/refined-stories.md`, `CLAUDE.md`

---

## Overall Status: BLOCKED

One defect logged. Sign-off is withheld until DEF-001 is resolved.

---

## Defect Register

### DEF-001 — `checkBadgeEligibility()` is a stub (BLOCKING)

**Severity:** High — build defect per `CLAUDE.md`
**Owner:** Developer

**Description:**
`checkBadgeEligibility()` in `src/hooks/useProgress.ts` (lines 138–141) is a stub that unconditionally returns `[]` with no evaluation logic:

```ts
async function checkBadgeEligibility(): Promise<Badge[]> {
  // Placeholder — badge logic implemented per feature as needed
  return []
}
```

This violates the rule in `CLAUDE.md`: "Do not stub this with an empty return. A stub that returns `[]` unconditionally is a build defect."

The `useRacing.ts` hook correctly calls `checkBadgeEligibility()` after `resolveRace()` (TD-003 wiring is correct). However, the function being wired to is non-functional. Players who complete races will never receive racing badges — no error surfaces, so the defect is invisible until players notice badges are never awarded.

**Reproduction:**
1. Read `src/hooks/useProgress.ts`, lines 138–141.
2. The function body contains only `return []` — no reads from `db.badges`, no reads from `db.races`, no evaluation of race counts, win counts, or participation milestones.
3. Any call to `checkBadgeEligibility()` after `resolveRace()` returns an empty array and awards nothing.

**Expected:** A real implementation that reads player race history and badge definitions, evaluates eligibility, and calls `awardBadge()` for any newly earned badges.

**Actual:** Unconditional `return []`.

**Resolution required:** Implement `checkBadgeEligibility()` with real evaluation logic before this feature is marked complete. Per the refined stories (Story 5 acceptance criteria): "If it IS a stub, log it as a separate defect before signing off on TD-003."

---

## TD-001 — `enterRace()` Transaction Boundary

**Result: PASS**

### Verification

**Transaction location:** Lines 151–164 of `src/hooks/useRacing.ts`.

- **Transaction opens:** Line 151 — `await db.transaction('rw', db.races, db.playerWallet, db.transactions, async () => {`
- **Transaction closes:** Line 164 — `})`

**Table list:** `db.races`, `db.playerWallet`, `db.transactions` — covers every table written to inside the boundary. `spend()` internally uses `db.playerWallet` and `db.transactions`; both are listed. PASS.

**spend() and db.races.update() co-location:** Both calls are inside the same `db.transaction()` boundary (lines 152 and 156 respectively). PASS.

**Rollback path — spend fails:**
Line 153: `if (!paid.ok) return` — when `spend()` returns `{ ok: false }`, execution returns early from the transaction callback. The `db.races.update()` call at line 156 is never reached. Dexie aborts the transaction. No race record is written. The post-transaction check at line 166 reads `entrySucceeded === false` and returns `{ success: false, reason: 'Not enough coins' }`.

**Rollback path — db.races.update() throws:**
If `db.races.update()` throws at line 156, Dexie rolls back the entire transaction. The `spend()` deduction (which completed at line 152 within the same transaction) is also rolled back. The player's coin balance is unchanged. This is correct atomic behaviour — code review evidence confirms correctness; a live IndexedDB rollback simulation is not feasible in this environment, and the code structure is sufficient evidence per Story 5 acceptance criteria.

**entrySucceeded flag correctness:**
`entrySucceeded` is initialised to `false` at line 150 (outside the transaction). It is set to `true` at line 163, which is reached only after both `spend()` succeeds (line 152) and `db.races.update()` completes (line 156–161). The post-transaction return at line 166 reads this flag correctly. If the transaction aborts for any reason, `entrySucceeded` remains `false`. PASS.

**Pre-condition guards outside transaction:**
Lines 125–127: race fetch and status/duplicate-entry checks execute before the transaction opens. These are read-only operations and correctly sit outside the write boundary. PASS.

**Saddle bonus lookup outside transaction:**
Lines 130–132: `db.ownedItems.get()` executes before the transaction opens. `db.ownedItems` is not in the transaction table list — this is correct because the lookup is read-only and outside the boundary. PASS.

---

## TD-002 — `resolveRace()` Transaction Boundary

**Result: PASS**

### Verification

**Transaction location:** Lines 186–201 of `src/hooks/useRacing.ts`.

- **Transaction opens:** Line 186 — `await db.transaction('rw', db.races, db.playerWallet, db.transactions, async () => {`
- **Transaction closes:** Line 201 — `})`

**Table list:** `db.races`, `db.playerWallet`, `db.transactions` — covers every table written to inside the boundary. `earn()` internally uses `db.playerWallet` and `db.transactions`; both are listed. PASS.

**db.races.update() and earn() co-location:** Both calls are inside the same `db.transaction()` boundary (lines 187 and 194 respectively). PASS.

**Pre-condition guard outside transaction:**
Lines 172–173: race fetch and `race.status !== 'running'` check execute before the transaction opens. PASS.

**Duplicate-prize exploit path (finished race re-resolution):**
Line 173: `if (!race || race.status !== 'running') return null`. Once a race is marked `finished`, this guard fires before the transaction opens. No `db.races.update()` and no `earn()` call is reached. The function returns `null`. The duplicate prize exploit is closed. PASS.

**simulateRace() executes before transaction:**
Lines 176–181: `simulateRace()`, prize calculation (`withPrizes`), and `playerResult` lookup all execute before line 186 where the transaction opens. These are pure computations with no side effects. PASS.

**earn() conditional guard:**
Line 193: `if (playerResult?.prize && playerResult.prize > 0)` — `earn()` is only called when the player has a non-zero prize. A player finishing outside the prize positions (prize is `0`) does not trigger an `earn()` call. PASS.

**Rollback path — earn() fails:**
If `earn()` throws at line 194, Dexie rolls back the entire transaction. The `db.races.update()` call (which completed at line 187 within the same transaction) is also rolled back. The race status remains `running`. No partial state is persisted. Code review evidence confirms correctness; live simulation not feasible in this environment. PASS.

---

## TD-003 — `checkBadgeEligibility()` After Resolve

**Result: PARTIAL PASS — wiring correct, implementation is a stub (see DEF-001)**

### Verification

**Call location:** Lines 206–208 of `src/hooks/useRacing.ts`:

```ts
checkBadgeEligibility().catch(err =>
  toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' })
)
```

**Outside transaction boundary:** The call at line 206 is after the transaction closes at line 201. PASS.

**Called unconditionally:** The call is not gated on `playerResult` having a prize. It fires for every successful race resolution, including last-place finishes. PASS.

**Non-blocking:** The call uses `.catch()` and does not `await`. The race result is returned at line 210 regardless of badge check outcome. PASS.

**Error handling — not a silent swallow:** The `.catch()` at line 207 calls `toast({ type: 'error', ... })` with a user-facing title and a description derived from the error message. This is the correct pattern per `CLAUDE.md`. PASS.

**checkBadgeEligibility() implementation:** FAIL — see DEF-001. The function in `src/hooks/useProgress.ts` lines 138–141 is a stub. The wiring from `useRacing.ts` is correct; the target function is not. This prevents TD-003 from being fully signed off.

---

## TD-004 — `openRaces` to `activeRaces` Rename

**Result: PASS**

### Verification

**Search for `openRaces` in `src/`:**

Results:

| File | Line | Content |
|------|------|---------|
| `src/hooks/useRacing.ts` | 79 | `// TD-004 fix: renamed from openRaces — this collection includes...` (comment) |
| `src/hooks/useRacing.ts` | 86 | `const openRacesList = await db.races.where('status').equals('open').toArray()` |
| `src/hooks/useRacing.ts` | 87 | `const alreadyGeneratedToday = openRacesList.some(` |
| `src/hooks/useRacing.ts` | 93 | `if (openRacesList.length >= 3) return` |

Assessment: All four occurrences are within `generateDailyRaces()` (lines 83–121). Lines 86, 87, and 93 reference `openRacesList` — a local variable scoped to `generateDailyRaces()` that queries only `status === 'open'` races for the daily generation gate. This is semantically distinct from the exported `activeRaces` collection and the name is accurate for its purpose. Line 79 is a comment documenting the rename.

Zero occurrences of `openRaces` exist as an exported symbol or call-site reference. The acceptance condition (zero results for the exported collection name) is met. PASS.

**`activeRaces` in hook return object:**
Line 217: `activeRaces,` is in the return object. PASS.

**`activeRaces` call sites:**

| File | Lines | Usage |
|------|-------|-------|
| `src/screens/PlayHubScreen.tsx` | 482, 503, 505, 538, 539 | Correctly destructures `activeRaces` from `useRacing()` and uses it to derive `yourRaces` and `availableRaces` |
| `src/screens/RacingScreen.tsx` | 293, 325, 326 | Correctly destructures `activeRaces` from `useRacing()` and uses it to derive `yourRaces` and `availableRaces` |

Both screens apply the same downstream filter logic against `activeRaces` (`r.playerEntryPetId !== null` and `r.status === 'open' && r.playerEntryPetId === null`). This is consistent and correct — the wider `activeRaces` collection (open + running) is filtered appropriately at each call site. PASS.

**No screen has lost its active races list:** Both `PlayHubScreen` and `RacingScreen` consume `activeRaces`. Neither references the old `openRaces` symbol. PASS.

---

## 10-Point Design System Checklist

This feature has no visual changes. `src/hooks/useRacing.ts` is a pure logic file with no JSX, no styles, and no UI elements. Checks 1–6 are scoped to files changed in this feature. Checks 7–10 are app-wide.

| # | Check | Scope | Result | Notes |
|---|-------|-------|--------|-------|
| 1 | No emojis used as icons — Lucide only in JSX, data files, toast messages, button labels | `useRacing.ts` | PASS | No JSX in this file. Toast messages use plain English strings only. No emoji characters present. |
| 2 | No `ghost` variant on visible actions — grep entire codebase | App-wide | PASS | `grep variant="ghost"` across all of `src/` returned zero results. |
| 3 | All colours from `var(--...)` tokens — no hardcoded hex values | `useRacing.ts` | PASS | No style declarations in this file. |
| 4 | Surface stack correct — glass rule on all fixed/absolute overlays | `useRacing.ts` | PASS | No overlay or positioned elements in this file. |
| 5 | Layout verified at 375px, 768px, 1024px | `useRacing.ts` | PASS | No layout changes in this feature. No new screens introduced. Existing screen layout is unchanged. |
| 6 | All scrollable content has `pb-24` minimum | `useRacing.ts` | PASS | No layout changes. Existing `pb-24` on `PlayHubScreen` and `RacingScreen` is unaffected. |
| 7 | Top-of-screen `pt-4` on all screens with sticky glass header | App-wide | PASS | No new screens introduced in this feature. Existing screens are unchanged. |
| 8 | Navigation controls compact and consistent | App-wide | PASS | No new controls introduced. Existing tab switchers and filter pills are unchanged. |
| 9 | Animation parameters match spec | App-wide | PASS | No animations introduced or modified. |
| 10 | Spec-to-build element audit — scroll every built screen and compare against spec | `useRacing.ts` | PASS | Hook-only change. No UI elements added or removed. Both `PlayHubScreen` and `RacingScreen` continue to consume the hook's return values correctly. The rename of `openRaces` to `activeRaces` introduces no visible change to either screen. |

---

## Regression Verification Summary

### Race entry flow

Verified by code review. `enterRace()` returns `{ success: true }` after both `spend()` and `db.races.update()` complete inside the transaction. The caller (PlayHubScreen / RacingScreen) receives the same return shape as before. The entry fee deduction and race status transition to `running` are atomic. `RunningRaceCard` will appear because `activeRaces` includes `status === 'running'` races.

### Race resolution flow

Verified by code review. `resolveRace()` returns `{ position, prize, participants }` after both `db.races.update()` and (conditionally) `earn()` complete inside the transaction. The caller receives the same return shape as before. Prize credit and `finished` status are atomic.

### UI consuming `activeRaces`

Both `PlayHubScreen` (lines 503, 505, 538, 539) and `RacingScreen` (lines 325, 326) correctly reference `activeRaces`. The downstream filter logic (`yourRaces`, `availableRaces`) is functionally identical to what previously operated on `openRaces`. No screen has regressed.

---

## Sign-off

**Status: BLOCKED**

TD-001 (transaction boundary, enterRace): PASS
TD-002 (transaction boundary, resolveRace): PASS
TD-003 (badge eligibility wiring): PASS — wiring correct; implementation is a stub
TD-003 (badge eligibility implementation): FAIL — DEF-001
TD-004 (openRaces rename): PASS
10-point DS checklist: PASS (all 10 items)

This feature cannot be marked complete while DEF-001 is open. Once `checkBadgeEligibility()` in `src/hooks/useProgress.ts` is implemented with real evaluation logic, re-run Phase D (limited to TD-003 re-verification) before setting backlog status to `complete`.
