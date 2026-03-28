# Refined User Stories — Racing Hook Integrity Fixes (TD-001–004)

**Feature:** racing-integrity-fixes
**Phase:** B (Product Owner)
**Author:** Product Owner agent
**Date:** 2026-03-28
**Status:** Awaiting [OWNER] approval before Phase C begins

---

## Nature of this work

These are defect fixes against `src/hooks/useRacing.ts`, identified during the post-Racing
Phase D and logged to the backlog as technical debt items TD-001 through TD-004. They are not
new features. No interaction spec or UR findings are required — the defect reports and the
project rules in `CLAUDE.md` are the authoritative source for what must change.

Phase C for this feature is a Developer-only dispatch. No Frontend Engineer work is required.
Story 5 (regression verification) is a Tester-only dispatch that follows Phase C.

---

## Scope (confirmed)

**In scope:**
- Wrapping `enterRace()` spend and DB write inside a single `db.transaction()` (TD-001)
- Wrapping `resolveRace()` earn and race status write inside a single `db.transaction()` (TD-002)
- Adding `checkBadgeEligibility()` call after `resolveRace()` completes (TD-003)
- Renaming `openRaces` to `activeRaces` and updating all call sites (TD-004)
- Tester regression verification covering all four transaction boundaries and the collection rename

**Out of scope (this iteration):**
- Any changes to race generation logic (`generateDailyRaces`)
- Any changes to race simulation logic (`simulateRace`, `PRIZE_DISTRIBUTION`, `RACE_CONFIGS`)
- Any changes to NPC racer or breed configuration
- Any UI or visual changes — no components, no screens
- Any new racing features, race types, or entry flows
- Error handling improvements beyond what CLAUDE.md already requires of existing operations
  (the existing `enterRace` / `resolveRace` callers in the UI layer handle toast display;
  the hook's responsibility is transaction integrity, not user-facing error presentation)

---

## Stories

---

### Story 1 — TD-001: `enterRace()` spend-before-write transaction integrity

```
As a player entering a race,
I need the entry fee deduction and race record update to succeed or fail together,
So that I cannot lose coins without being registered in the race, and cannot be registered
without coins being deducted.
```

**The defect (current behaviour):**

In `useRacing.ts`, `enterRace()` calls `spend()` at line 123, then calls `db.races.update()`
at line 145 in a separate `await` outside any transaction. If `spend()` succeeds and the
`db.races.update()` subsequently throws, the player has paid the entry fee and received
nothing. This is data corruption with no recovery path.

**Acceptance criteria:**

- [ ] `enterRace()` wraps both the wallet deduction and the `db.races.update()` call inside a
      single `db.transaction('rw', [db.races, db.walletTransactions], async () => { ... })`.
      The specific tables included in the transaction must cover every table written to inside
      the boundary — at minimum `db.races` and whichever table `spend()` writes to.
- [ ] If `spend()` fails (returns `{ ok: false }`) inside the transaction, the transaction
      aborts. No `db.races.update()` is executed. The function returns
      `{ success: false, reason: 'Not enough coins' }`.
- [ ] If `db.races.update()` throws inside the transaction, Dexie rolls back the transaction.
      The player's coin balance is unchanged. The race record is unchanged.
- [ ] The pre-condition guards (race status check, duplicate entry check) remain outside the
      transaction boundary — they are read-only checks and must not be inside the write
      transaction.
- [ ] The saddle bonus lookup (`db.ownedItems.get(pet.equippedSaddleId)`) may remain outside
      the transaction boundary — it is a read that informs the write, not a write itself.
      However, if it is placed inside the transaction the Developer must add `db.ownedItems`
      to the transaction's table list.
- [ ] The function signature, return type, and observable behaviour from the caller's
      perspective are unchanged. This is an internal integrity fix only.
- [ ] No new toast calls are added inside `enterRace()`. Error presentation remains the
      caller's responsibility.

**Risk if not fixed:**

Player pays entry fee; race status write throws (e.g. IndexedDB quota, concurrent write
conflict); player is not entered in the race and has lost coins permanently. No recovery
path exists.

**Definition of done for this story:**

- [ ] `db.transaction('rw', ...)` wraps `spend()` and `db.races.update()` together.
- [ ] Both the success path and the rollback path are verified by the Tester in
      `tests/racing-integrity-fixes/test-results.md`.
- [ ] The Developer self-review checklist item "Spend-before-write transaction integrity" in
      `CLAUDE.md` is satisfied for this function.

---

### Story 2 — TD-002: `resolveRace()` earn-outside-transaction integrity

```
As a player whose race has finished,
I need the prize credit and the race status update to succeed or fail together,
So that I cannot win a race without receiving the prize, and cannot receive a prize for a
race that was not correctly marked as finished.
```

**The defect (current behaviour):**

In `useRacing.ts`, `resolveRace()` calls `db.races.update()` at line 169 to mark the race
as `finished` and write results, then calls `earn()` at line 176 in a separate `await`
outside any transaction. This creates two failure modes:

1. `db.races.update()` succeeds, `earn()` fails — race is marked finished, player wins,
   no prize is credited. The race will not re-resolve (status is `finished`) so the prize
   is permanently lost.
2. `earn()` succeeds, `db.races.update()` fails — the race status remains `running`. On
   next load the race appears as re-solvable. Calling `resolveRace()` again credits a
   second prize. This is a duplicate prize exploit.

**Acceptance criteria:**

- [ ] `resolveRace()` wraps both the `db.races.update()` call and the `earn()` call inside
      a single `db.transaction('rw', [db.races, db.walletTransactions], async () => { ... })`.
      The table list must cover every table written to inside the boundary.
- [ ] If `db.races.update()` throws inside the transaction, Dexie rolls back the transaction.
      The race status remains `running`. No prize is credited. The function returns `null`.
- [ ] If `earn()` fails inside the transaction (throws or returns an error), Dexie rolls back
      the transaction. The race status remains `running`. No partial state is persisted.
- [ ] The race simulation (`simulateRace`, prize calculation) executes before the transaction
      opens — it is a pure computation with no side effects and must not be inside the
      write transaction.
- [ ] The player result lookup (`withPrizes.find(p => p.isPlayer)`) also executes before or
      inside the transaction, as appropriate, but does not constitute a write.
- [ ] The conditional guard `if (playerResult?.prize && playerResult.prize > 0)` must remain
      so that `earn()` is only called when there is a non-zero prize. A player finishing
      outside the prize positions must not trigger an `earn()` call.
- [ ] The function signature, return type, and observable behaviour from the caller's
      perspective are unchanged.

**Risk if not fixed:**

Failure mode 1: player wins race, loses prize permanently. Failure mode 2: duplicate prize
exploit via race re-resolution. Both are active data integrity risks in the current build.

**Definition of done for this story:**

- [ ] `db.transaction('rw', ...)` wraps `db.races.update()` and `earn()` together.
- [ ] Both failure modes (earn fails, update fails) are verified by the Tester.
- [ ] The Developer self-review checklist item "Spend-before-write transaction integrity" in
      `CLAUDE.md` is satisfied for this function (earn/spend symmetry applies).

---

### Story 3 — TD-003: Missing `checkBadgeEligibility()` after race completion

```
As a player who has completed a race,
I need the system to evaluate my badge eligibility immediately after the race resolves,
So that any badge I have earned through racing is awarded at the correct moment rather
than being silently missed.
```

**The defect (current behaviour):**

`resolveRace()` does not call `checkBadgeEligibility()` after a race completes. Per the
project rule in `CLAUDE.md`: "Any hook that triggers a badge-eligible event (care, rescue,
racing, arcade, marketplace) must call `checkBadgeEligibility()` after the event fires."
Racing is explicitly listed. A race completion is a badge-eligible event. The call is absent.

**Acceptance criteria:**

- [ ] After the `db.transaction()` introduced in Story 2 commits successfully, `resolveRace()`
      calls `checkBadgeEligibility()`.
- [ ] `checkBadgeEligibility()` is called unconditionally after a successful resolution — it
      must not be gated on whether the player won a prize. A player finishing last is still
      eligible for participation-based badges.
- [ ] `checkBadgeEligibility()` is called outside the transaction boundary (it is a
      post-commit side effect, not part of the atomic write).
- [ ] `checkBadgeEligibility()` is not a stub that unconditionally returns `[]`. If the
      current implementation is a stub, that is a pre-existing defect that must be surfaced
      to [OWNER] before Phase C is marked complete. The Tester must verify the function is
      a real implementation or log a separate defect.
- [ ] If `checkBadgeEligibility()` throws, the error must not propagate to the caller or
      suppress the race result. Badge checking is a non-blocking post-action side effect.
      Wrap in a `.catch()` that calls `toast({ type: 'error', ... })` with a user-facing
      message — a silent swallow is prohibited per `CLAUDE.md`.
- [ ] The return value of `resolveRace()` is unchanged — it still returns the player result
      object, not a badge result.

**Risk if not fixed:**

Players who complete races never receive racing badges. Because the call is absent rather
than broken, no error surfaces. The defect is invisible to players until they notice badges
are never awarded for racing activity.

**Definition of done for this story:**

- [ ] `checkBadgeEligibility()` is called after every successful `resolveRace()` completion.
- [ ] The call is outside the transaction boundary.
- [ ] The call is non-blocking and has a `.catch()` with a user-facing toast.
- [ ] The Tester verifies `checkBadgeEligibility()` is invoked (not stubbed) and that a
      badge-eligible race completion produces the expected eligibility evaluation.

---

### Story 4 — TD-004: `openRaces` collection name does not match its contents

```
As a developer reading or consuming the useRacing hook,
I need the derived collection names to accurately describe what they contain,
So that I can reason correctly about which races are included without reading the
filter implementation.
```

**The defect (current behaviour):**

In `useRacing.ts` line 75, the collection `openRaces` is defined as:

```ts
const openRaces = races.filter(r => r.status === 'open' || r.status === 'running')
```

The name `openRaces` implies only `status === 'open'` races. The collection actually
contains both `open` and `running` races. Per `CLAUDE.md`: "A collection named `openRaces`
that excludes `running` is wrong if `running` is a state the player actively participates
in. Trace every status transition against every derived collection before marking the hook
complete."

A player who has entered a race (status transitions to `running`) is actively participating.
The collection must be named to reflect this accurately.

**Acceptance criteria:**

- [ ] The collection previously named `openRaces` is renamed to `activeRaces` in
      `useRacing.ts`. The filter logic (`status === 'open' || status === 'running'`) is
      unchanged — this is a rename only, not a logic change.
- [ ] The hook's return object is updated: `openRaces` is replaced by `activeRaces`.
- [ ] Every call site that currently destructures or references `openRaces` from `useRacing()`
      is updated to reference `activeRaces`. The Developer must search the entire `src/`
      directory for `openRaces` and update every occurrence.
- [ ] No component or hook retains a reference to `openRaces` after this change. The Tester
      must verify this by searching for `openRaces` in `src/` — zero results is the
      acceptance condition.
- [ ] The rename does not alter any rendered output or user-facing behaviour. This is a
      refactor only.
- [ ] If any component contains logic branching on `openRaces.length` or similar, the
      branch behaviour must be verified unchanged after the rename.

**Risk if not fixed:**

Developer confusion leads to future bugs where code reasons incorrectly about which races
are in scope (e.g. a developer filtering `openRaces` for "races not yet started" and
missing `running` races, causing running races to disappear from active views). This is a
latent bug vector, not a current user-facing defect.

**Definition of done for this story:**

- [ ] `openRaces` does not appear anywhere in `src/` (confirmed by Tester search).
- [ ] `activeRaces` is exported from `useRacing()` and used correctly at all call sites.
- [ ] No regression in any screen that previously consumed `openRaces`.

---

### Story 5 — Regression verification (Tester)

```
As the team,
We need a structured Tester verification pass across all four integrity fixes,
So that we have documented evidence that the transaction boundaries, badge eligibility,
and collection rename are correctly implemented before this feature is marked complete.
```

**This story is dispatched to the Tester only, after Phase C is complete.**

**Acceptance criteria:**

- [ ] **TD-001 transaction boundary:** Tester manually verifies (by reading the hook code)
      that `spend()` and `db.races.update()` in `enterRace()` are inside the same
      `db.transaction('rw', ...)` call. The transaction table list covers at minimum
      `db.races` and the wallet table. Tester records the line numbers of the transaction
      open and close.

- [ ] **TD-001 rollback path:** Tester documents a method to verify rollback (e.g. confirms
      that if `db.races.update()` were to throw, the spend would be reversed by Dexie's
      transaction rollback). If a live rollback test is feasible in the environment, it is
      performed and the result recorded. If not feasible, the code review evidence is
      sufficient — but this must be stated explicitly.

- [ ] **TD-002 transaction boundary:** Tester manually verifies that `db.races.update()` and
      `earn()` in `resolveRace()` are inside the same `db.transaction('rw', ...)` call.
      Tester records the line numbers.

- [ ] **TD-002 duplicate prize path:** Tester verifies that once a race is marked `finished`,
      calling `resolveRace()` again on the same race returns `null` without crediting a
      prize. This must be explicitly tested — read the guard (`race.status !== 'running'`)
      and confirm it is present and reached before any `earn()` or `db.races.update()` call.

- [ ] **TD-003 badge eligibility call:** Tester verifies (by reading the hook code) that
      `checkBadgeEligibility()` is called after the transaction in `resolveRace()`. Tester
      confirms the call is outside the `db.transaction()` boundary. Tester verifies the
      call has a `.catch()` with a toast (not a silent swallow).

- [ ] **TD-003 badge function is not a stub:** Tester locates the `checkBadgeEligibility()`
      implementation and confirms it is not a function that unconditionally returns `[]`
      with no evaluation logic. If it is a stub, Tester logs this as a separate defect
      before signing off on TD-003.

- [ ] **TD-004 rename completeness:** Tester searches `src/` for the string `openRaces`.
      Zero results is the acceptance condition. Any remaining reference is a defect. Tester
      records the search command and result in `test-results.md`.

- [ ] **TD-004 call site coverage:** Tester confirms that all screens and components that
      previously used `openRaces` now use `activeRaces` and continue to behave correctly.
      No screen has lost its active races list.

- [ ] **10-point DS checklist:** All ten checklist items from `CLAUDE.md` are explicitly
      listed and evaluated in `tests/racing-integrity-fixes/test-results.md`. Items 1–6
      are scoped to files changed in this feature. Items 7–10 are app-wide. Because this
      feature introduces no visual changes, checks 1–6 are expected to pass trivially —
      the Tester must still confirm them explicitly, not skip them.

- [ ] **No regression in race entry flow:** Tester enters a race via the UI and confirms the
      entry fee is deducted correctly and the race transitions to `running` status. The
      `RunningRaceCard` appears.

- [ ] **No regression in race resolution flow:** Tester resolves a race via the UI and
      confirms the prize is credited correctly and the race transitions to `finished` status.

- [ ] **No regression in UI consuming `activeRaces`:** Tester confirms the Racing tab
      continues to display open and running races after the rename. The count and content
      of races displayed is unaffected.

**Out of scope for this story:**

- Load testing or concurrent write simulation.
- Testing any race feature other than entry and resolution.

**Definition of done for this story:**

- [ ] `tests/racing-integrity-fixes/test-results.md` exists and contains Tester sign-off.
- [ ] All acceptance criteria above are explicitly addressed with pass/fail recorded.
- [ ] No open defects remain from this verification pass. If defects are found, they are
      logged and must be resolved before this feature's backlog status is set to `complete`.

---

## Definition of Done — feature level

All conditions below must be true before this feature's backlog status is set to `complete`.

- [ ] Stories 1–4 have been implemented by the Developer and all acceptance criteria pass.
- [ ] Story 5 has been completed by the Tester with no open defects.
- [ ] `tests/racing-integrity-fixes/test-results.md` exists and contains explicit Tester
      sign-off.
- [ ] `spec/features/racing-integrity-fixes/done-check.md` has been completed (Phase E).
- [ ] The Developer self-review checklist items in `CLAUDE.md` — specifically
      "Spend-before-write transaction integrity" and "Badge and reward eligibility" — are
      satisfied for both `enterRace()` and `resolveRace()`.
- [ ] No occurrence of `openRaces` remains anywhere in `src/`.
- [ ] The backlog entry "Racing hook integrity fixes (TD-001–004)" in
      `spec/backlog/BACKLOG.md` is updated to `complete` only after the above conditions
      are all met.

---

## Spec reference

- Hook under fix: `src/hooks/useRacing.ts`
- Project rules (authoritative source): `CLAUDE.md` — sections on spend-before-write,
  badge eligibility, error handling, and hook state machine validation
- Backlog entry: `spec/backlog/BACKLOG.md` — "Racing hook integrity fixes (TD-001–004)",
  Tier 2, `queued`
- No interaction spec or UR findings file is required for this feature (defect fixes only).

---

_Phase C must not begin until [OWNER] has explicitly approved this document._
