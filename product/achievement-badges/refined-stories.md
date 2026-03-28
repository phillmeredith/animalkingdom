# Refined Stories — Achievement Badges (Minimal Unblocking)

**Feature:** Achievement Badges — Minimal Catalogue
**Phase:** B (Product Owner)
**Date:** 2026-03-28
**Status:** Awaiting [OWNER] approval before Phase C begins

---

## Feature context

`checkBadgeEligibility()` in `src/hooks/useProgress.ts` is a stub returning `[]`
unconditionally. This causes three problems:

1. Racing Hook Integrity Fixes (TD-001–004) cannot achieve Tester sign-off because
   badge behaviour is untestable.
2. All existing `.catch()`-only call sites in `useRacing.ts`, `useAuctions.ts`,
   `useMarketplace.ts`, `usePlayerListings.ts`, and `useCareLog.ts` silently ignore the
   return value — they do not fire badge toasts because there is nothing to fire.
3. Harry receives no recognition for activity he is already performing.

This feature implements the minimum required to make `checkBadgeEligibility()` real:
a corrected DB schema, a static badge catalogue of 20 badges across 5 tracks, a
working implementation of the eligibility function, caller wiring to fire badge toasts,
and a badge count on the Home screen.

The full Badge Hub browse screen, per-badge progress indicators, celebration overlays,
and navigation tab are deferred to Tier 4.

**Primary user:** Harry, approximately 6 years old, ADHD and autism, independent iPad user.
**Unblocks:** Racing Integrity Fixes (TD-001–004) Phase D sign-off.

---

## Source documents

- `research/achievement-badges/ur-findings.md`
- `spec/features/achievement-badges/interaction-spec.md`

---

## Stories

---

### Story AB-01 — DB schema migration

**Prerequisite for all other stories. Must be completed first.**

As a developer maintaining the codebase,
I need the `Badge` entity's `track` and `rank` union types corrected and the DB version
incremented,
so that all downstream code uses the correct domain values and Dexie does not throw a
schema version error.

**Context:** The current `Badge` interface (line 155, `src/lib/db.ts`) declares:
- `track: 'Master Trader' | 'Animal Whisperer' | 'Sharp Eye' | 'World Traveller' | 'Deal Maker'`
- `rank: 'apprentice' | 'expert' | 'master'`

The interaction spec requires `track: 'racing' | 'arcade' | 'care' | 'marketplace' | 'rescue'`
and `rank: 'bronze' | 'silver' | 'gold'`. The existing values are wrong for this feature's
intent and must be replaced.

**Acceptance criteria:**

1. DB is incremented from v13 to v14. The `this.version(14).stores({...})` block is added
   to `src/lib/db.ts`.
2. The `Badge` TypeScript interface is updated: `track` becomes
   `'racing' | 'arcade' | 'care' | 'marketplace' | 'rescue'` and `rank` becomes
   `'bronze' | 'silver' | 'gold'`. The old union values are removed entirely.
3. The v14 stores definition for `badges` retains `'++id, &badgeId, track'` — no change to
   index structure, only the TypeScript types change.
4. The v14 stores definition for `savedNames` adds `careStreak` to the index string:
   `'++id, category, animalType, rarity, status, careStreak'`. This index is required by
   `care-streak-three` and `care-streak-seven` badge criteria.
5. The v14 upgrade callback is a no-op (`() => {}`). The `badges` table is empty in all
   live installs. No data migration is needed.
6. All other tables in v14 carry over their index definitions unchanged from v13.
7. TypeScript compilation passes with zero errors after the change. No file anywhere in
   `src/` retains a reference to the old `track` or `rank` string literals from the `Badge`
   interface.
8. The existing `awardBadge()` function in `useProgress.ts` compiles cleanly against the
   new types — its `track` and `rank` parameters must accept the new union values.

**Out of scope:**
- Any change to other tables' index definitions beyond adding `careStreak` to `savedNames`.
- Any migration of existing badge records (the table is empty).

---

### Story AB-02 — Static badge catalogue

As a developer implementing `checkBadgeEligibility()`,
I need a static, typed catalogue of all 20 badges with their criteria documented,
so that the eligibility function has a single source of truth to iterate against and badge
data is not scattered across the codebase.

**Acceptance criteria:**

1. A file `src/data/badges.ts` is created and exports a constant
   `BADGE_CATALOGUE: BadgeDefinition[]`.
2. `BadgeDefinition` is defined as an interface in the same file:
   ```
   interface BadgeDefinition {
     badgeId: string
     track:   Badge['track']
     rank:    Badge['rank']
     name:    string
     description: string
     icon:    string    // Lucide icon name as a string — resolved to component at render time
     criteria: string   // Human-readable documentation only — logic lives in checkBadgeEligibility()
   }
   ```
3. `BADGE_CATALOGUE` contains exactly 20 entries: 4 per track across 5 tracks.
4. All 20 entries are present as specified in the catalogue table below (see "Badge
   catalogue" section).
5. No entry contains an emoji character anywhere — in `name`, `description`, `criteria`,
   or `icon`. `icon` contains a Lucide icon name string only.
6. `icon` values must be valid Lucide icon names. The following names are used (confirmed
   against the interaction spec): `Flag`, `Trophy`, `Medal`, `Crown`, `Gamepad2`, `Zap`,
   `Star`, `Heart`, `CheckCircle`, `CalendarCheck`, `Award`, `ShoppingBag`, `Tag`,
   `ArrowLeftRight`, `Gem`, `PawPrint`, `Sparkles`, `Home`.
7. All `name` values are 2–3 words maximum. Names match the catalogue table exactly.
8. `description` values are one plain sentence written at approximately Year 2 reading level.
   No adult jargon ("accumulate", "proficiency", "participant"). No negative framing.
9. The file has no runtime dependencies — it is a pure static data file. It must not import
   from `useProgress`, `db`, or any hook.

**Out of scope:**
- A `checkCriteria` function field on `BadgeDefinition`. Criteria logic lives in
  `checkBadgeEligibility()`, not in the catalogue. The `criteria` field is documentation only.
- Any DB storage of the catalogue. Only awarded badges are stored.

---

## Badge catalogue

All 20 badges across 5 tracks. These values are canonical — the Developer must implement
exactly these entries in `BADGE_CATALOGUE`.

### Track: racing

| badgeId | rank | name | description | icon | criteria (documentation) |
|---------|------|------|-------------|------|--------------------------|
| `racing-first-entry` | bronze | First Start | You entered your first race. | `Flag` | `races` table has at least 1 record where `playerEntryPetId IS NOT NULL` |
| `racing-first-finish` | bronze | Race Day | You finished your first race. | `Trophy` | `races` table has at least 1 finished record where `playerEntryPetId IS NOT NULL` |
| `racing-podium` | silver | Podium Finish | You came in the top three. | `Medal` | `races` table has at least 1 finished record where the player participant has `position <= 3` |
| `racing-champion` | gold | Champion | You won a Championship race. | `Crown` | `races` table has at least 1 finished record where `type = 'championship'` and the player participant has `position = 1` |

### Track: arcade

| badgeId | rank | name | description | icon | criteria (documentation) |
|---------|------|------|-------------|------|--------------------------|
| `arcade-first-game` | bronze | Game On | You played your first arcade game. | `Gamepad2` | `skillProgress` has at least 1 record where `gamesPlayed >= 1` |
| `arcade-ten-games` | bronze | Getting Good | You played 10 arcade games. | `Gamepad2` | Sum of `gamesPlayed` across all `skillProgress` rows is >= 10 |
| `arcade-streak-five` | silver | On a Roll | You got 5 right answers in a row. | `Zap` | `skillProgress` has at least 1 record where `bestStreak >= 5` |
| `arcade-all-subjects` | gold | All-Rounder | You played every subject. | `Star` | `skillProgress` has a record with `gamesPlayed >= 1` for each of: `maths`, `spelling`, `science`, `geography` |

### Track: care

| badgeId | rank | name | description | icon | criteria (documentation) |
|---------|------|------|-------------|------|--------------------------|
| `care-first-action` | bronze | Kind Heart | You looked after an animal for the first time. | `Heart` | `careLog` has at least 1 record |
| `care-full-day` | bronze | Full Care | You fed, cleaned, and played with an animal in one day. | `CheckCircle` | `careLog` has at least 3 records sharing the same `petId + date`, one each for `feed`, `clean`, `play` |
| `care-streak-three` | silver | Devoted | You cared for an animal three days in a row. | `CalendarCheck` | `savedNames` has at least 1 record where `careStreak >= 3` |
| `care-streak-seven` | gold | Best Friend | You cared for an animal seven days in a row. | `Award` | `savedNames` has at least 1 record where `careStreak >= 7` |

### Track: marketplace

| badgeId | rank | name | description | icon | criteria (documentation) |
|---------|------|------|-------------|------|--------------------------|
| `market-first-buy` | bronze | First Purchase | You bought your first animal at the market. | `ShoppingBag` | `savedNames` has at least 1 record where `source = 'marketplace'` |
| `market-first-sell` | bronze | First Sale | You sold your first animal at the market. | `Tag` | `transactions` has at least 1 record where `category = 'marketplace'` AND `type = 'earn'` |
| `market-five-trades` | silver | Trader | You made 5 trades at the market. | `ArrowLeftRight` | Count of `transactions` where `category = 'marketplace'` is >= 5 |
| `market-rare-buy` | gold | Rare Find | You bought a rare or better animal. | `Gem` | `savedNames` has at least 1 record where `source = 'marketplace'` AND `rarity IN ('rare', 'epic', 'legendary')` |

### Track: rescue

| badgeId | rank | name | description | icon | criteria (documentation) |
|---------|------|------|-------------|------|--------------------------|
| `rescue-first-animal` | bronze | Rescuer | You rescued your first animal. | `PawPrint` | `savedNames` has at least 1 record where `source IN ('rescue', 'generate')` |
| `rescue-five-animals` | bronze | Animal Fan | You rescued 5 animals. | `PawPrint` | Count of `savedNames` where `source IN ('rescue', 'generate')` is >= 5 |
| `rescue-rare-find` | silver | Rare Rescue | You found a rare animal. | `Sparkles` | `savedNames` has at least 1 record where `source IN ('rescue', 'generate')` AND `rarity IN ('rare', 'epic', 'legendary')` |
| `rescue-ten-animals` | gold | Sanctuary | You have rescued 10 animals. | `Home` | Count of `savedNames` where `source IN ('rescue', 'generate')` is >= 10 |

---

### Story AB-03 — `checkBadgeEligibility()` implementation

As a player using the app,
I need the badge eligibility check to evaluate all 20 badge criteria against real data and
award any newly-qualifying badges,
so that Harry receives recognition for activity he is already performing.

**This is the core story. The stub in `useProgress.ts` (lines 138–141) must be replaced
with a real implementation.**

**Acceptance criteria — function contract:**

1. `checkBadgeEligibility()` has the signature `async function checkBadgeEligibility(): Promise<Badge[]>`.
2. It returns a `Badge[]` array containing only the badges newly awarded in this call.
   An empty array is returned if no new badges are awarded. It never returns `null` or
   `undefined`.
3. The function never throws. All errors are caught in a top-level `try/catch`. On error,
   `toast({ type: 'error', title: 'Could not check badges', description: 'Something went wrong.' })`
   is called and `[]` is returned.
4. `checkBadgeEligibility()` does not fire badge toasts. Toast firing is the caller's
   responsibility (see Story AB-04). The function is a data function only.
5. Before awarding any badge, the function checks `db.badges.where('badgeId').equals(id).first()`.
   If a record already exists, the badge is skipped. The existing `awardBadge()` function
   handles the actual DB write — `checkBadgeEligibility()` calls `awardBadge()` for each
   newly-qualifying badge.

**Acceptance criteria — DB reads:**

6. The function reads from: `db.races`, `db.skillProgress`, `db.careLog`, `db.savedNames`,
   `db.transactions`, `db.badges`. No other tables.
7. All reads use `toArray()` or index-based queries against the actual app DB. No mocked
   data, no hardcoded arrays.

**Acceptance criteria — racing track (4 badges):**

8. `racing-first-entry` is awarded when: `db.races.toArray()` returns at least 1 record
   where `playerEntryPetId` is not null and not undefined.
9. `racing-first-finish` is awarded when: `db.races.toArray()` returns at least 1 record
   where `status = 'finished'` AND `playerEntryPetId` is not null.
10. `racing-podium` is awarded when: the finished races with `playerEntryPetId` not null
    are loaded, their `participants` array is parsed, and at least 1 has a player entry
    (the object in the array where `isPlayer = true`) with `position <= 3`.
11. `racing-champion` is awarded when: the finished races are loaded, `participants` parsed,
    and at least 1 has `type = 'championship'` AND the player participant has `position = 1`.
12. Racing criteria that require parsing `participants`: the check loads the finished race
    records, iterates `race.participants`, finds the entry where `isPlayer === true`, and
    reads its `position`. No denormalized position column is added to the races table.

**Acceptance criteria — arcade track (4 badges):**

13. `arcade-first-game` is awarded when: `db.skillProgress.toArray()` returns at least 1
    record where `gamesPlayed >= 1`.
14. `arcade-ten-games` is awarded when: the sum of `gamesPlayed` across all `skillProgress`
    rows is >= 10.
15. `arcade-streak-five` is awarded when: `db.skillProgress.toArray()` returns at least 1
    record where `bestStreak >= 5`.
16. `arcade-all-subjects` is awarded when: `skillProgress` has at least one record with
    `gamesPlayed >= 1` for each of the four areas: `maths`, `spelling`, `science`,
    `geography`. All four must be present.

**Acceptance criteria — care track (4 badges):**

17. `care-first-action` is awarded when: `db.careLog.count()` returns >= 1.
18. `care-full-day` is awarded when: loading `db.careLog.toArray()` and grouping by
    `petId + date` finds at least one group containing records for all three actions
    `feed`, `clean`, and `play`.
19. `care-streak-three` is awarded when: `db.savedNames.where('careStreak').aboveOrEqual(3).first()`
    returns a record. If the index is not available (runtime error), falls back to
    `db.savedNames.toArray().then(rows => rows.some(r => r.careStreak >= 3))`.
20. `care-streak-seven` is awarded when: same query as above but with threshold 7.

**Acceptance criteria — marketplace track (4 badges):**

21. `market-first-buy` is awarded when: `db.savedNames.where('source').equals('marketplace').first()`
    returns a record.
22. `market-first-sell` is awarded when: `db.transactions.toArray()` returns at least 1
    record where `category = 'marketplace'` AND `type = 'earn'`.
23. `market-five-trades` is awarded when:
    `db.transactions.where('category').equals('marketplace').count()` returns >= 5.
24. `market-rare-buy` is awarded when: loading marketplace-sourced `savedNames` and filtering
    for `rarity IN ('rare', 'epic', 'legendary')` finds at least 1 record. Uses
    `db.savedNames.where('source').equals('marketplace').toArray()` then filters in memory.
    No compound index is added for this criterion.

**Acceptance criteria — rescue track (4 badges):**

25. `rescue-first-animal` is awarded when:
    `db.savedNames.where('source').anyOf(['rescue', 'generate']).first()` returns a record.
26. `rescue-five-animals` is awarded when:
    `db.savedNames.where('source').anyOf(['rescue', 'generate']).count()` returns >= 5.
27. `rescue-rare-find` is awarded when: loading `savedNames` with `source IN ('rescue', 'generate')`
    and filtering in memory for `rarity IN ('rare', 'epic', 'legendary')` finds at least 1 record.
28. `rescue-ten-animals` is awarded when: the same `anyOf` count query returns >= 10.

**Acceptance criteria — catalogue placement:**

29. The catalogue constant (`BADGE_CATALOGUE` from `src/data/badges.ts`) is imported into
    `useProgress.ts` and iterated inside `checkBadgeEligibility()`. The function does not
    re-define badge data inline.
30. The function iterates every entry in `BADGE_CATALOGUE` on every call. It does not short-
    circuit after the first match or skip tracks where no action recently occurred. This
    ensures that badges which qualify from historical data (e.g. Harry upgrades the app
    while already having 5 races) are awarded on the next call.

**Out of scope:**
- Criterion progress tracking (e.g. "1 of 3 races done") — Tier 4.
- Toast firing inside this function — see Story AB-04.
- Any new DB index beyond what is specified in AB-01.

---

### Story AB-04 — Caller wiring (toast firing)

As a player,
I need badge toasts to appear when I earn a badge,
so that Harry knows the app has noticed what he did and can read what the badge was for.

**Context:** All existing `checkBadgeEligibility()` call sites use `.catch(err => ...)` only
and discard the return value. They must be updated to handle the returned `Badge[]` array
and fire toasts.

The correct call pattern (from the interaction spec, section 8) is:
```ts
checkBadgeEligibility()
  .then(newBadges => {
    newBadges.forEach((badge, i) => {
      setTimeout(() => {
        toast({ type: 'success', title: badge.name, description: 'You earned a badge!', duration: 6000 })
      }, i * 400)
    })
  })
  .catch(err => toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' }))
```

**Acceptance criteria:**

1. `useRacing.ts` — the call at line 206 (after `resolveRace()`) is updated to the full
   `.then(newBadges => ...).catch(err => ...)` pattern. The previous `.catch()`-only call
   is replaced entirely.
2. `useAuctions.ts` — the call at line 776 (inside `resolveAuctionWin`) and the call at
   line 830 (inside the buy-now delivery path) are both updated to the full pattern. The
   `// KNOWN GAP` comment is removed from both sites.
3. `useMarketplace.ts` — the call at line 320 (after successful buy) is updated to the
   full pattern.
4. `usePlayerListings.ts` — the call at line 531 (after `acceptNpcBuyerOffer`) is updated
   to the full pattern.
5. `useCareLog.ts` — a `checkBadgeEligibility()` call using the full pattern is added after
   `performCare()` returns `{ success: true }`. If no call site exists, one is added.
   `checkBadgeEligibility` is imported from `useProgress` in this hook.
6. No call site in the codebase calls `checkBadgeEligibility()` with a `.catch()`-only
   handler after this story is complete. Running `grep -rn "checkBadgeEligibility" src/`
   and inspecting every result must confirm zero instances of the pattern
   `checkBadgeEligibility().catch(`.
7. If `newBadges` is empty (no badges awarded), no toast fires. The `forEach` on an empty
   array is a no-op — this is the correct behaviour, no explicit guard needed.
8. Consecutive badge toasts are delayed 400ms apart using `setTimeout`. The first badge
   fires immediately (delay = 0 * 400 = 0ms). The second fires after 400ms. The third
   after 800ms.
9. Each toast uses `duration: 6000`. This is explicitly passed — the default toast duration
   is not used.
10. Toast `type` is `'success'`. Toast `title` is `badge.name`. Toast `description` is the
    string `'You earned a badge!'` — this exact string, no variation.
11. The `generate wizard completion` hook (whichever hook calls `db.savedNames.add()` for
    a generated animal) is searched. If it does not already call `checkBadgeEligibility()`,
    a call is added after the `savedNames.add()` completes.

**Out of scope:**
- Staggered animation of multiple badge toasts beyond the 400ms delay — that is the
  existing Toast system's stacking behaviour.
- Any change to the Toast component itself.

---

### Story AB-05 — Badge count on Home screen

As Harry,
I need to see how many badges I have earned on the Home screen,
so that I can see my collection growing over time and know where to look when I earn more.

**Acceptance criteria:**

1. The Home screen's existing progress/stats section includes a row showing:
   `[Award icon]  Badges: [count]`
2. The icon is the `Award` Lucide icon, size 16px, stroke-width 2,
   colour `var(--amber-t)`.
3. The label "Badges" is rendered at Body Sm (13px) in `var(--t2)`.
4. The count is rendered at Body Sm (13px), font-weight semibold (600), in `var(--t1)`.
5. The count is live: it reads from `useProgress().badges.length`. When a badge is
   awarded and `useProgress` re-renders (Dexie live query), the count updates without
   a page reload.
6. When no badges have been earned, the row shows "Badges: 0". The row is never hidden
   regardless of count.
7. The touch target for the row is at minimum 44px in height, even if the text content
   renders shorter.
8. Tapping the row is inert at this tier. No navigation occurs. No toast fires on tap.
   A `console.log` or no-op `onClick` handler is acceptable — do not navigate to a
   non-existent route.
9. No new tab is added to the bottom navigation. The bottom nav is unchanged by this story.
10. The row is verified at 375px, 768px, and 1024px widths. It does not overflow or wrap
    unexpectedly at any breakpoint.
11. The hover state for the row (iPad pointer): row background shifts to `var(--elev)`.
    No other visual change on hover.
12. The active (tap) state: scale 0.97, transition 150ms.

**DS compliance:**
- The `Award` icon is Lucide only. No emoji.
- Colour values are tokens only: `var(--amber-t)`, `var(--t2)`, `var(--t1)`.
- No hardcoded hex values.

**Out of scope:**
- Navigation from this row to a Badge Hub screen — Tier 4.
- A count indicator or dot on the bottom nav — Tier 4.
- Progress bar or "X of Y" breakdown — Tier 4.

---

### Story AB-06 — Tester verification

As the team,
I need Tester sign-off confirming that all 20 badge criteria evaluate correctly, toasts
fire with the right parameters, and no regressions are introduced,
so that the Racing Integrity Fixes Phase D sign-off is no longer blocked by the stub.

**Acceptance criteria:**

1. `tests/achievement-badges/test-results.md` exists and contains a Tester sign-off
   statement with date.
2. All 20 badge criteria are individually verified. The test results file lists each
   `badgeId` and records: criterion met in test data (yes/no), badge record written to
   `db.badges` (yes/no), toast fired (yes/no), toast `duration` confirmed as 6000ms (yes/no).
3. Deduplication is verified: awarding the same badge a second time (by triggering the
   criterion again after the badge is already in `db.badges`) must not award a duplicate
   record and must not fire a duplicate toast.
4. `openRaces` regression (TD-004): a search of `src/` for the string `openRaces` returns
   zero matches. The Tester records the grep command and its output in the test results file.
5. The 400ms stagger between consecutive badge toasts is confirmed by triggering a scenario
   where at least 2 badges fire in the same call (e.g. entering and resolving a race for
   the first time). The second toast appears noticeably after the first.
6. The badge count on the Home screen increments when a badge is awarded and decrements to
   0 when the `badges` table is cleared (dev reset). Live query behaviour is confirmed.
7. The `useCareLog.ts` call site is confirmed: `performCare()` with a valid action calls
   `checkBadgeEligibility()` after success.
8. The 10-point DS checklist is completed in full and all 10 items are explicitly listed
   with pass/fail status in `tests/achievement-badges/test-results.md`. All 10 must pass
   for sign-off to be valid.
9. Layout is verified at 375px, 768px, and 1024px for the Home screen badge row. Results
   are recorded.
10. Any defects found during Phase D are logged in `tests/achievement-badges/test-results.md`
    with severity (blocking/non-blocking) and assigned to the relevant agent for resolution
    before sign-off is given.

---

## Definition of Done

The feature is complete when all of the following are true. This checklist must be run as
`spec/features/achievement-badges/done-check.md` before backlog status is set to `complete`.

- [ ] DB is at v14. `Badge.track` and `Badge.rank` use the new union values. `careStreak`
      is indexed on `savedNames`.
- [ ] `src/data/badges.ts` exports `BADGE_CATALOGUE` with exactly 20 entries. No emoji
      anywhere in the file.
- [ ] `checkBadgeEligibility()` in `useProgress.ts` is a real implementation, not a stub.
      It returns `Badge[]` of newly awarded badges and never throws.
- [ ] All 20 badge criteria are implemented and each maps to the canonical query defined
      in AB-03.
- [ ] All call sites in `useRacing.ts`, `useAuctions.ts`, `useMarketplace.ts`,
      `usePlayerListings.ts`, and `useCareLog.ts` use the `.then(newBadges => ...).catch(...)`
      pattern. Zero `.catch()`-only call sites remain.
- [ ] `checkBadgeEligibility()` does not fire toasts directly. Toasts are fired by callers.
- [ ] Badge toasts use `duration: 6000` and `type: 'success'`.
- [ ] Consecutive badge toasts in a single call are staggered 400ms apart.
- [ ] Home screen shows `Award` icon + "Badges: N" with live count. Row is inert on tap.
      Row shows "Badges: 0" when count is zero.
- [ ] `tests/achievement-badges/test-results.md` exists with Tester sign-off.
- [ ] All 20 badge criteria individually verified by Tester.
- [ ] 10-point DS checklist completed and all 10 items pass in test results.
- [ ] `openRaces` absent from `src/` (TD-004 regression check).
- [ ] TypeScript compiles with zero errors after all changes.

---

## Scope decisions

### In scope

- DB migration (v13 to v14): type correction for `Badge.track` and `Badge.rank`; adding
  `careStreak` index to `savedNames`.
- Static badge catalogue: 20 badges across 5 tracks.
- `checkBadgeEligibility()` implementation covering all 20 criteria.
- Caller wiring in all 5 hooks that currently call (or should call) `checkBadgeEligibility()`.
- Badge count row on Home screen (live, inert tap).

### Out of scope (deferred to Tier 4)

- Badge Hub browse screen.
- Per-badge detail sheet.
- Criterion progress indicators ("2 of 4 races done").
- Celebration overlay at badge award.
- Badge display on animal detail sheet.
- Badge count or dot in bottom navigation.
- Filtering or sorting the badge collection.
- `enterRace()` badge call — racing entry is already captured by `resolveRace()` which
  fires after entry and resolution. A separate entry call on `enterRace()` is not needed
  at this tier; `racing-first-entry` criterion reads the `races` table directly.

### Scope decision: `enterRace()` call site not added

The interaction spec (section 8) identifies `enterRace()` as a potential call site.
However, `resolveRace()` already calls `checkBadgeEligibility()` and the `racing-first-entry`
criterion evaluates the `races` table for any record with `playerEntryPetId IS NOT NULL` —
which is set when `enterRace()` completes. The badge will therefore be awarded the first
time `resolveRace()` fires after the player's first entry, which is the next natural
interaction point. Adding a call to `enterRace()` would cause the badge to fire mid-flow
before the race is resolved. Deferring it to `resolveRace()` is the safer pattern for
Harry (avoids notification during active race setup). This decision may be revisited in
Tier 4 if the UX spec defines an explicit post-entry badge moment.

---

## Known risks carried forward

**Risk: badge toast fires during an active arcade game or race.**
The interaction spec notes (section 8) that `checkBadgeEligibility()` is called after the
event is recorded. At this tier, no queueing mechanism exists to delay toast firing until
after an active overlay is dismissed. This is an accepted risk for the minimal scope.
The Tester must note any observed interruptions during Phase D. A queueing mechanism is
Tier 4 scope.

**Risk: mastery badge progress is hidden.**
`care-streak-three`, `care-streak-seven`, `rescue-five-animals`, `rescue-ten-animals`,
`arcade-ten-games`, and `market-five-trades` are count-based criteria with no visible
progress indicator at this tier. Harry will not know he is close to these badges until
they fire. This is accepted for the minimal scope and is the primary motivation for the
Tier 4 progress indicator work.

**Risk: school-reward-chart association.**
UR findings flag that Harry's relationship to visible reward charts is unknown. The approach
(badge count on Home screen, not a prominent locked catalogue) is conservative — Harry sees
how many he has, not a list of everything he has not done. This is intentionally less
prominent than the full visible-locked catalogue described in the UR findings. The full
catalogue display is deferred to Tier 4 when [OWNER] can confirm Harry's response to the
format.

---

## Phase C must not begin until [OWNER] approves this document.
