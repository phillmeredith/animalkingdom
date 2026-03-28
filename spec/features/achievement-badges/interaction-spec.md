# Interaction Spec — Achievement Badges (Minimal Unblocking Spec)

**Scope:** Minimal spec to unblock `checkBadgeEligibility()` in `useProgress.ts`.
Full badge hub / browse screen is deferred to Tier 4.
This spec covers: badge catalogue, award notification, badge count placement, and the implementation contract.

**Author:** UX Designer
**Date:** 2026-03-28
**Status:** Ready for Phase B (PO) review before Phase C begins

---

## Schema alignment note — read before implementing

The `Badge` entity in `src/lib/db.ts` (v9 schema) defines:

```ts
track: 'Master Trader' | 'Animal Whisperer' | 'Sharp Eye' | 'World Traveller' | 'Deal Maker'
rank:  'apprentice' | 'expert' | 'master'
```

The brief uses `track: racing | arcade | care | marketplace | rescue` and `rank: bronze | silver | gold`.

**Decision:** The DB schema track names and rank labels are wrong for this feature's intent.
The Developer must add a schema version (v15 or next available) that:

1. Changes `Badge.track` to: `'racing' | 'arcade' | 'care' | 'marketplace' | 'rescue'`
2. Changes `Badge.rank` to: `'bronze' | 'silver' | 'gold'`

The existing `badges` table is empty in all live installs (stub was never called). No migration
of existing data is needed — the upgrade callback can modify() with a no-op. The version bump
is still required to satisfy Dexie's schema version contract.

The spec below uses the corrected type values (`racing`, `bronze`, etc.) throughout.
FE and Dev must not use the old type values — they are deprecated by this spec.

---

## 1. Badge catalogue

### Rank → DS colour mapping

| Rank | Tint pair bg | Border | Text | Gradient (icon circle) |
|------|-------------|--------|------|------------------------|
| bronze | `var(--amber-sub)` | `1px solid var(--amber)` | `var(--amber-t)` | `--grad-warm` |
| silver | `var(--blue-sub)` | `1px solid var(--blue)` | `var(--blue-t)` | `--grad-cool` |
| gold | `var(--purple-sub)` | `1px solid var(--purple)` | `var(--purple-t)` | `--grad-aurora` |

All badge rank pills use tint-pair only. Never solid fill + white text.

---

### Track: racing

Event hooks: `enterRace()` and `resolveRace()` in `useRacing.ts`

| badgeId | rank | name | description | criteria | icon |
|---------|------|------|-------------|----------|------|
| `racing-first-entry` | bronze | First Start | You entered your first race. | `races` table has at least 1 record where `playerEntryPetId IS NOT NULL` | `Flag` |
| `racing-first-finish` | bronze | Race Day | You finished your first race. | `races` table has at least 1 record where `status = 'finished'` AND `playerEntryPetId IS NOT NULL` | `Trophy` |
| `racing-podium` | silver | Podium Finish | You finished in the top 3 in a race. | `races` table has at least 1 finished record where player participant has `position <= 3` | `Medal` |
| `racing-champion` | gold | Champion | You won a Championship race. | `races` table has at least 1 finished record where `type = 'championship'` AND player participant has `position = 1` | `Crown` |

**Criteria implementation notes:**
- `playerEntryPetId IS NOT NULL` is a proxy for "player entered". No separate entry-event log exists — use this field.
- Player position is stored in `race.participants[]` as `{ isPlayer: true, position: N }`. The criteria check must find the player participant in the JSON array, not a separate column.
- For `racing-podium`: query all finished races with `playerEntryPetId NOT NULL`, parse `participants`, find the record where `isPlayer = true`, check `position <= 3`.

---

### Track: arcade

Event hooks: `addXp()` and `recordAnswer()` in `useProgress.ts`

| badgeId | rank | name | description | criteria | icon |
|---------|------|------|-------------|----------|------|
| `arcade-first-game` | bronze | Game On | You played your first arcade game. | `skillProgress` table has at least 1 record where `gamesPlayed >= 1` across any area | `Gamepad2` |
| `arcade-ten-games` | bronze | Getting Good | You played 10 arcade games. | Sum of `gamesPlayed` across all `skillProgress` rows is >= 10 | `Gamepad2` |
| `arcade-streak-five` | silver | On a Roll | You got 5 correct answers in a row. | `skillProgress` has at least 1 record where `bestStreak >= 5` across any area | `Zap` |
| `arcade-all-subjects` | gold | All-Rounder | You played every subject. | `skillProgress` has at least 1 record with `gamesPlayed >= 1` for EACH of: `maths`, `spelling`, `science`, `geography` | `Star` |

**Criteria implementation notes:**
- `gamesPlayed` is incremented by `useProgress.addXp()` — confirm this is the correct signal or use `puzzleHistory` count as an alternative. If `gamesPlayed` is not reliably incremented, use `db.puzzleHistory.count()` instead.
- `arcade-all-subjects` requires all four `SkillArea` values to have at least one played game. Query all four rows from `skillProgress` and check each.

---

### Track: care

Event hooks: `performCare()` in `useCareLog.ts`

| badgeId | rank | name | description | criteria | icon |
|---------|------|------|-------------|----------|------|
| `care-first-action` | bronze | Kind Heart | You looked after an animal for the first time. | `careLog` table has at least 1 record | `Heart` |
| `care-full-day` | bronze | Full Care | You fed, cleaned, and played with an animal in one day. | `careLog` has at least 3 records sharing the same `petId + date`, one each for `feed`, `clean`, `play` | `CheckCircle` |
| `care-streak-three` | silver | Devoted | You cared for an animal three days in a row. | `savedNames` has at least 1 record where `careStreak >= 3` | `CalendarCheck` |
| `care-streak-seven` | gold | Best Friend | You cared for an animal seven days in a row. | `savedNames` has at least 1 record where `careStreak >= 7` | `Award` |

**Criteria implementation notes:**
- `careStreak` is maintained on `SavedName`. Query `db.savedNames.where('careStreak').aboveOrEqual(N)` — this requires the column to be indexed. If not indexed, fall back to `toArray()` and filter in memory. The Developer must check whether a `careStreak` index exists; if not, add it in the schema migration alongside the track/rank changes.
- `care-full-day`: use `db.careLog.where('[petId+date+action]')` compound index — already defined in v9.

---

### Track: marketplace

Event hooks: `acceptBuyOffer()` and `acceptSellOffer()` in `useMarketplace.ts`

| badgeId | rank | name | description | criteria | icon |
|---------|------|------|-------------|----------|------|
| `market-first-buy` | bronze | First Purchase | You bought your first animal at the market. | `savedNames` has at least 1 record where `source = 'marketplace'` | `ShoppingBag` |
| `market-first-sell` | bronze | First Sale | You sold your first animal at the market. | `transactions` has at least 1 record where `category = 'marketplace'` AND `type = 'earn'` | `Tag` |
| `market-five-trades` | silver | Trader | You made 5 marketplace trades. | Count of `transactions` where `category = 'marketplace'` is >= 5 | `ArrowLeftRight` |
| `market-rare-buy` | gold | Rare Find | You bought a rare or better animal. | `savedNames` has at least 1 record where `source = 'marketplace'` AND `rarity IN ('rare', 'epic', 'legendary')` | `Gem` |

**Criteria implementation notes:**
- `market-first-sell`: `transactions` with `category = 'marketplace'` and `type = 'earn'` is the signal for a completed sale. This covers both `acceptBuyOffer()` (NPC buying from player) and future auction win payouts.
- `market-five-trades`: count both buy and sell transactions (`type` either) where `category = 'marketplace'`. Use `db.transactions.where('category').equals('marketplace').count()`.
- `market-rare-buy`: query `db.savedNames.where('[rarity+source]')` if compound index exists, otherwise filter in memory. Do not add a compound index for this — `toArray()` and filter is acceptable for a small collection.

---

### Track: rescue

Event hooks: generate wizard completion

| badgeId | rank | name | description | criteria | icon |
|---------|------|------|-------------|----------|------|
| `rescue-first-animal` | bronze | Rescuer | You rescued your first animal. | `savedNames` has at least 1 record where `source = 'rescue'` OR `source = 'generate'` | `PawPrint` |
| `rescue-five-animals` | bronze | Animal Fan | You rescued 5 animals. | Count of `savedNames` where `source IN ('rescue', 'generate')` is >= 5 | `PawPrint` |
| `rescue-rare-find` | silver | Rare Rescue | You found a rare animal. | `savedNames` has at least 1 record where `source IN ('rescue', 'generate')` AND `rarity IN ('rare', 'epic', 'legendary')` | `Sparkles` |
| `rescue-ten-animals` | gold | Sanctuary | You have rescued 10 animals. | Count of `savedNames` where `source IN ('rescue', 'generate')` is >= 10 | `Home` |

**Criteria implementation notes:**
- The generate wizard sets `source: 'generate'` on `SavedName`. A future "rescue" flow would set `source: 'rescue'`. The criteria treat both as equivalent for badge purposes.
- Count queries: `db.savedNames.where('source').anyOf(['rescue', 'generate']).count()`. The `source` field is not currently indexed — the Developer must either add an index in the migration or use `toArray().filter()`. For a small collection (child's pet list), in-memory filter is acceptable.

---

## 2. Award notification pattern

### What fires when a badge is awarded

A badge award produces a **toast notification only**. No blocking overlay at this tier.
The full award celebration animation is deferred to Tier 4 (Badge Hub feature).

Rationale: `checkBadgeEligibility()` is called non-blocking (`.catch(...)` pattern, already
established in `useRacing.ts`). A blocking overlay from a non-blocking call is architecturally
wrong — it could fire at any time after the triggering action. A toast is the correct pattern
for a fire-and-forget event.

### Toast anatomy

```
type:        'success'
title:       "[Badge name]"          — e.g. "Race Day"
description: "You earned a badge!"  — short, child-readable, never more than one clause
duration:    6000ms                  — longer than default 3000ms to give Harry time to read
```

The existing Toast system (`src/components/ui/Toast.tsx`) supports a `duration` override.
Pass `duration: 6000` explicitly. Do not use the default.

The toast uses the existing `success` config (`--green-sub` bg, `--green-t` title, `CheckCircle` icon).
No new toast type or config variant is needed at this tier. If the Tier 4 Badge Hub introduces
a dedicated `badge` toast type with a rank-coloured icon, that is a future spec change.

### Auto-dismiss behaviour

The badge toast auto-dismisses after 6000ms. It is also manually dismissible via the existing
`X` button in the top-right corner of the toast card. This matches all other toasts — no
special dismiss pattern required.

### Multiple badges in one call

`checkBadgeEligibility()` may return multiple newly-awarded badges in a single call (e.g. a
player's first race completion could trigger both `racing-first-entry` and `racing-first-finish`).
The caller (hook) must fire one toast per badge, sequentially, with a 400ms delay between each.
The Toast system stacks up to 3 toasts — if more than 3 badges fire at once, the oldest is
dropped. At this tier (15-20 badges total), simultaneous awards of 3+ badges are extremely
unlikely. No queue system is needed.

### Reduced-motion behaviour

The existing `Toast.tsx` already honours `useReducedMotion()` — when reduced motion is
preferred, entrance/exit animations are skipped (`initial={}` / `exit={}` branch). No
additional work required for the badge toast.

### Accessibility

- `aria-live="polite"` is already set on the toast container. Badge toasts are automatically
  announced to screen readers.
- Toast title and description must be written in plain English without abbreviations.
- Do not use icon names as labels (e.g. never "Trophy icon awarded").

---

## 3. Badge display — where badges live in the UI

**This tier specifies location only. The full badge display screen is Tier 4.**

### Placement: Home screen — progress summary section

The badge count summary belongs on the Home screen, in the existing progress/stats section
(wherever XP and level are displayed). A compact row shows:

```
[Award icon]  Badges: 3
```

- Icon: `Award` from Lucide, size 16, stroke-width 2, colour `var(--amber-t)`
- Label: "Badges" in Body Sm (13px, `var(--t2)`)
- Count: Body Sm (13px, `var(--t1)`, semibold)
- Tapping this row navigates to the Badge Hub screen (Tier 4 — not built yet, so tap is inert at this tier)

If the player has 0 badges, show "Badges: 0" — do not hide the row.

**Do not add a dedicated badges tab to the bottom navigation at this tier.** Bottom nav
changes require a separate spec and PO approval.

### What is not in scope at this tier

- Badge grid / catalogue browse screen — Tier 4
- Per-badge detail sheet — Tier 4
- Badge notifications in other screens (My Animals, racing results) — Tier 4
- Badge progress indicators ("2/4 in Racing track") — Tier 4

---

## 4. `checkBadgeEligibility()` implementation contract

### Signature

```ts
async function checkBadgeEligibility(): Promise<Badge[]>
```

Returns an array of `Badge` records that were newly awarded in this call.
Returns `[]` if no new badges were earned.
Never throws — all errors must be caught internally and reported via the existing
`toast({ type: 'error', ... })` pattern.

### What it reads

| DB table | Purpose |
|----------|---------|
| `db.badges` | Deduplication — which badges are already awarded |
| `db.races` | Racing criteria |
| `db.skillProgress` | Arcade criteria |
| `db.puzzleHistory` | Arcade fallback if `gamesPlayed` is unreliable |
| `db.careLog` | Care criteria |
| `db.savedNames` | Care streak, rescue count, marketplace source |
| `db.transactions` | Marketplace trade count and sale signal |

### Deduplication

Before awarding any badge, call `db.badges.where('badgeId').equals(id).first()`.
If a record exists, skip — this badge is already awarded.

The existing `awardBadge()` function in `useProgress.ts` already handles this
deduplication internally. `checkBadgeEligibility()` must call `awardBadge()` for
each newly-qualifying badge — it must not duplicate the deduplication logic.

### Internal award or return candidates?

`checkBadgeEligibility()` must:
1. Internally call `awardBadge()` for each newly-qualified badge (writes to DB)
2. Return the array of newly-awarded `Badge` records (so the caller can fire toasts)

The caller (hook) is responsible for firing toasts from the returned array.
`checkBadgeEligibility()` itself must not fire toasts — that is the caller's concern.

This split is intentional: `checkBadgeEligibility()` is a data function; toast is a UI concern.
The hook bridges the two.

### Catalogue definition

The catalogue is defined as a static constant inside `useProgress.ts` (or a co-located file
`src/hooks/badgeCatalogue.ts` if the Developer prefers). It is not stored in the DB — only
awarded badges are stored. The catalogue is the source of truth for what badges exist and
what criteria they require.

### Performance contract

`checkBadgeEligibility()` is called after user actions (race resolve, care action, etc.).
It must complete within a reasonable time for a child's small dataset. No pagination needed.
All reads may use `toArray()` for tables with expected row counts under 1000 (all tables here
qualify at this user's scale). Index-based queries are preferred but not mandatory for
correctness.

### Error handling

```ts
async function checkBadgeEligibility(): Promise<Badge[]> {
  try {
    // ... catalogue checks ...
    return newlyAwardedBadges
  } catch (err) {
    toast({ type: 'error', title: 'Could not check badges', description: 'Something went wrong.' })
    return []
  }
}
```

The function must never propagate an exception to its caller. Returning `[]` on error is
correct — badge checks are non-critical. The toast ensures Harry (or Phill) is aware if
something went wrong.

---

## 5. PageHeader slot assignments

No new PageHeader is introduced at this tier.

The badge count row on the Home screen is a content element within an existing section,
not a header control. No slot assignment required.

When the Tier 4 Badge Hub screen is built, its spec must assign:
- Centre slot: section switcher if the hub has multiple tabs (e.g. All / Racing / Arcade)
- Below slot: filter pills if filtering by earned/unearned status

---

## 6. DS compliance notes

### Badge rank pill anatomy

Used wherever a badge rank label is shown (toast description, future badge card):

```
layout:       inline-flex, align-items: center, gap: 4px
padding:      4px 8px
border-radius: var(--r-pill)
background:   [rank tint] — see table in section 1
border:       1px solid [rank colour]
text:         Body Sm (13px), font-weight 600, colour [rank text token]
icon:         Lucide icon, size 12, stroke-width 2, matching text colour
```

Never use solid colour + white text on a rank pill.

### Badge icon circle (future use — Tier 4)

```
size:         40px × 40px
border-radius: 50%
background:   [rank gradient] — see gradient column in section 1 table
icon:         Lucide, size 20, stroke-width 2, colour: white (#FCFCFD)
```

### Toast at award time

Uses existing success toast config. No new DS tokens required.

### Colour usage — prohibited patterns

- Do not use `--amber` as a solid background with white text for bronze
- Do not use `--blue` as a solid background with white text for silver
- Do not use `--purple` as a solid background with white text for gold
- All badge rank indicators are tint-pair only

---

## 7. Interaction states

### Badge count row (Home screen)

| State | Visual |
|-------|--------|
| Default | `Award` icon in `--amber-t`, label in `--t2`, count in `--t1` |
| Hover (iPad pointer) | Row background shifts to `var(--elev)`, no other change |
| Active (tap) | Scale `0.97`, transition 150ms — inert at this tier (no navigation target yet) |
| Zero badges | Shows "Badges: 0" — row is always visible, never hidden |

Touch target minimum: 44px height. The row must meet this even if the text renders shorter.

### Award toast (at moment of badge earn)

| State | Visual |
|-------|--------|
| Entering | Slides in from top, opacity 0→1, y -12→0, scale 0.97→1, duration 200ms, ease [0.16,1,0.3,1] |
| Reduced motion | No slide/scale — opacity 0→1 only |
| Visible | Static, auto-dismiss timer running |
| Dismiss tap | Immediate removal, exit animation: opacity 1→0, y 0→-8, scale 1→0.97 |
| Auto-dismiss (6000ms) | Same exit animation as dismiss tap |

---

## 8. Handoff notes for Developer

1. **Schema migration is required first.** Update `Badge.track` and `Badge.rank` union types
   in `db.ts` before implementing the catalogue. Increment the DB version. Do not ship
   `checkBadgeEligibility()` against the wrong type values.

2. **Add `badgeCatalogue.ts`** at `src/hooks/badgeCatalogue.ts` as a static array of badge
   definitions. Each entry: `{ badgeId, track, rank, name, description, icon, checkCriteria }`.
   The `checkCriteria` field is a function `() => Promise<boolean>` that performs the DB
   read for that badge. `checkBadgeEligibility()` iterates this array, calls `checkCriteria()`,
   and awards those that return `true` and are not already in `db.badges`.

3. **Toast firing is the caller's responsibility.** `checkBadgeEligibility()` returns the
   `Badge[]` array. Each hook that calls it must iterate the result and fire a toast per badge
   with `duration: 6000`. The toast message is: `title: badge.name`, `description: "You earned a badge!"`.

4. **Racing position check requires JSON parse.** The `position` of the player participant is
   stored inside `race.participants` (a JSON array column). There is no indexed column for
   player position. The check must load finished races and parse the participants array.
   This is correct at Harry's scale — do not add a denormalized column for this.

5. **`careStreak` index.** Check whether `careStreak` is in the Dexie index definition for
   `savedNames`. If not, add it to the migration. Without an index, fall back to
   `db.savedNames.toArray().then(rows => rows.some(r => r.careStreak >= N))`.

6. **Calling sites.** `checkBadgeEligibility()` is already called in:
   - `useRacing.ts` — after `resolveRace()` (TD-003 fix, already in codebase)
   - `useProgress.ts` — stub exists, must be implemented
   The following hooks call `checkBadgeEligibility()` but the call site may not yet be
   wired. Confirm and add if missing:
   - `useCareLog.ts` — after `performCare()` returns `success: true`
   - `useMarketplace.ts` — after `acceptBuyOffer()` and `acceptSellOffer()` succeed
   - Generate wizard completion hook — after `savedNames.add()` for a rescued/generated animal

7. **Non-blocking call pattern.** Every calling site must use the `.catch()` pattern already
   established in `useRacing.ts`:
   ```ts
   checkBadgeEligibility()
     .then(newBadges => newBadges.forEach(b => toast({ type: 'success', title: b.name, description: 'You earned a badge!', duration: 6000 })))
     .catch(err => toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' }))
   ```
   The `checkBadgeEligibility()` function itself also wraps in try/catch (section 4 above),
   so this is double-guarded. Do not rely on only one layer.

---

## 9. Out of scope — Tier 4 items (do not implement now)

- Badge browse / hub screen
- Per-badge detail sheet with criteria progress
- "X of Y" progress indicators on locked badges
- Celebration overlay / animation at badge award
- Badge display on animal detail sheet
- Badge count in bottom navigation
- Filtering / sorting the badge collection
- Social sharing of badges
