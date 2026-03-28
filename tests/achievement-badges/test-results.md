# Test Results — Achievement Badges (Minimal Unblocking)

**Feature:** Achievement Badges — Minimal Catalogue
**Phase:** D (Tester)
**Tester:** Senior QA Engineer
**Date:** 2026-03-28
**Build reviewed:** Phase C output as committed to `src/`

---

## Overall verdict

**BLOCKED — cannot sign off.**

One blocking defect found. One non-blocking defect found. All other verifications pass.

The build may not be marked `complete` until DEF-001 is resolved and re-tested.

---

## Defect log

### DEF-001 — BLOCKING: `checkBadgeEligibility()` not called in `acceptSellOffer` (`useMarketplace.ts`)

**Severity:** Blocking
**Assigned to:** Developer

**Affected badges:** `market-first-buy`, `market-rare-buy`

**Description:**
`acceptSellOffer()` in `src/hooks/useMarketplace.ts` is the function executed when the player buys an animal from an NPC market offer. It writes a `SavedName` record with `source: 'marketplace'` (line 165–187). This is the only write path that sets `source = 'marketplace'` via this hook.

Neither `market-first-buy` (criterion: `savedNames` has a record where `source = 'marketplace'`) nor `market-rare-buy` (same source filter + rarity check) will ever fire at the correct moment, because `checkBadgeEligibility()` is never called after `acceptSellOffer()` succeeds. The function returns `true` at line 189 with no badge check.

The badge call that is present in `useMarketplace.ts` is in `acceptNpcBuyerOffer()` (line 321). That is the path where the player *sells* via the marketplace (accepts an NPC buyer's offer on their own listing). This is a sell path, not a buy path. The `acceptNpcBuyerOffer` call is architecturally correct for sale-related badges (`market-first-sell`, `market-five-trades`) but it does not cover the buy path.

**Reproduction:**
1. Open the marketplace.
2. Accept an NPC sell offer (buy an animal).
3. The animal is added to the collection with `source: 'marketplace'`.
4. No badge toast fires for `market-first-buy`.
5. `checkBadgeEligibility()` is never called after the write.

**Expected:** `checkBadgeEligibility()` called after `acceptSellOffer()` returns `true`, using the same `.then(newBadges => ...).catch(err => ...)` pattern as all other call sites.

**AC reference:** Refined stories AB-04 AC-3: "useMarketplace.ts — the call at line 320 (after successful buy) is updated to the full pattern."

---

### DEF-002 — NON-BLOCKING: Stale comment in `useAuctions.ts` line 724

**Severity:** Non-blocking (cosmetic / misleading documentation)
**Assigned to:** Developer

**Description:**
Line 724 of `src/hooks/useAuctions.ts` reads:
```
* Note: checkBadgeEligibility() is a stub returning [] — see KNOWN GAP comment above.
```
This comment is now false. `checkBadgeEligibility()` is fully implemented (AB-03). The comment was not removed when the stub was replaced. No KNOWN GAP header comment appears above `resolveAuctionWin` in the current file — the referenced anchor is also gone. The stale comment should be removed or updated to match the current implementation.

**AC reference:** Refined stories AB-04 AC-2: "The `// KNOWN GAP` comment is removed from both sites."

---

## AB-01 — DB migration to v14

| Check | Result | Evidence |
|-------|--------|----------|
| DB is at v14 | PASS | `this.version(14).stores(...)` present at line 537 of `src/lib/db.ts` |
| `Badge.track` type is `'racing' \| 'arcade' \| 'care' \| 'marketplace' \| 'rescue'` | PASS | `src/lib/db.ts` lines 155–156: `track: 'racing' \| 'arcade' \| 'care' \| 'marketplace' \| 'rescue'` |
| `Badge.rank` type is `'bronze' \| 'silver' \| 'gold'` | PASS | `src/lib/db.ts` line 156: `rank: 'bronze' \| 'silver' \| 'gold'` |
| v14 `.stores()` includes `savedNames` with `careStreak` in index string | PASS | `savedNames: '++id, category, animalType, rarity, status, careStreak'` — line 538 |
| v14 stores block for `badges` retains `'++id, &badgeId, track'` | PASS | line 539 |
| Upgrade callback is a no-op | PASS | `.upgrade(() => { return Promise.resolve() })` — lines 540–543. No table modifications. |
| All other tables carry over from v13 (only `savedNames` and `badges` in v14 delta) | PASS | v14 `.stores()` block only specifies `savedNames` and `badges` — Dexie inherits the rest from v13 automatically |

---

## AB-02 — Static catalogue (`src/data/badges.ts`)

| Check | Result | Evidence |
|-------|--------|----------|
| `BadgeDefinition` interface exported | PASS | Lines 9–17 |
| `BADGE_CATALOGUE` exported | PASS | Line 19 |
| Exactly 20 entries | PASS | Counted: 4 racing + 4 arcade + 4 care + 4 marketplace + 4 rescue = 20 |
| No emoji in any field | PASS | No Unicode emoji characters found in any `name`, `description`, `criteria`, or `icon` value |
| `icon` values are Lucide icon name strings only | PASS | All values are bare strings (`'Flag'`, `'Trophy'`, etc.) — no JSX, no emoji |
| No runtime dependencies | PASS | Single import: `import type { Badge } from '@/lib/db'` — type-only, erased at compile time |

**All 20 badgeId audit — spec match:**

| badgeId | Spec | Catalogue | Match |
|---------|------|-----------|-------|
| `racing-first-entry` | First Start, bronze, Flag | First Start, bronze, Flag | PASS |
| `racing-first-finish` | Race Day, bronze, Trophy | Race Day, bronze, Trophy | PASS |
| `racing-podium` | Podium Finish, silver, Medal | Podium Finish, silver, Medal | PASS |
| `racing-champion` | Champion, gold, Crown | Champion, gold, Crown | PASS |
| `arcade-first-game` | Game On, bronze, Gamepad2 | Game On, bronze, Gamepad2 | PASS |
| `arcade-ten-games` | Getting Good, bronze, Gamepad2 | Getting Good, bronze, Gamepad2 | PASS |
| `arcade-streak-five` | On a Roll, silver, Zap | On a Roll, silver, Zap | PASS |
| `arcade-all-subjects` | All-Rounder, gold, Star | All-Rounder, gold, Star | PASS |
| `care-first-action` | Kind Heart, bronze, Heart | Kind Heart, bronze, Heart | PASS |
| `care-full-day` | Full Care, bronze, CheckCircle | Full Care, bronze, CheckCircle | PASS |
| `care-streak-three` | Devoted, silver, CalendarCheck | Devoted, silver, CalendarCheck | PASS |
| `care-streak-seven` | Best Friend, gold, Award | Best Friend, gold, Award | PASS |
| `market-first-buy` | First Purchase, bronze, ShoppingBag | First Purchase, bronze, ShoppingBag | PASS |
| `market-first-sell` | First Sale, bronze, Tag | First Sale, bronze, Tag | PASS |
| `market-five-trades` | Trader, silver, ArrowLeftRight | Trader, silver, ArrowLeftRight | PASS |
| `market-rare-buy` | Rare Find, gold, Gem | Rare Find, gold, Gem | PASS |
| `rescue-first-animal` | Rescuer, bronze, PawPrint | Rescuer, bronze, PawPrint | PASS |
| `rescue-five-animals` | Animal Fan, bronze, PawPrint | Animal Fan, bronze, PawPrint | PASS |
| `rescue-rare-find` | Rare Rescue, silver, Sparkles | Rare Rescue, silver, Sparkles | PASS |
| `rescue-ten-animals` | Sanctuary, gold, Home | Sanctuary, gold, Home | PASS |

All 20 badgeIds match the canonical catalogue. All descriptions are one plain sentence at appropriate reading level. No adult jargon observed.

---

## AB-03 — `checkBadgeEligibility()` implementation

### Function contract

| Check | Result | Evidence |
|-------|--------|----------|
| Not a stub — has real DB query logic | PASS | 155-line implementation at `useProgress.ts` lines 142–316 |
| Entire body wrapped in try/catch | PASS | `try { ... } catch (err) { toast({ type: 'error', ... }); return [] }` lines 142–316 |
| Error toast on catch with correct copy | PASS | `toast({ type: 'error', title: 'Could not check badges', description: 'Something went wrong.' })` — matches spec exactly |
| Returns `Badge[]` of newly awarded only | PASS | Builds `newlyAwarded: Badge[]`, returns it at end of try block |
| Returns `[]` on error | PASS | catch block returns `[]` |
| Does not fire toasts | PASS | No `toast()` call inside the try block except in the error catch |
| Deduplication via `awarded` Set up-front | PASS | Line 145: `const awarded = new Set((await db.badges.toArray()).map(b => b.badgeId))` |
| Skips already-awarded badges early | PASS | `if (awarded.has(def.badgeId)) continue` before criterion check |
| Calls `awardBadge()` — does not duplicate dedup logic | PASS | Line 296: `await awardBadge(def.badgeId, def.track, def.rank, def.name, def.description)` |
| Updates `awarded` set after award to prevent double-award in same call | PASS | Line 301: `awarded.add(def.badgeId)` |
| Iterates every BADGE_CATALOGUE entry on every call (no short-circuit) | PASS | `for (const def of BADGE_CATALOGUE) { ... }` — full iteration each call |
| BADGE_CATALOGUE imported from `src/data/badges.ts` — no inline redefinition | PASS | Line 9: `import { BADGE_CATALOGUE } from '@/data/badges'` |

### Per-badge criterion verification

**Racing track:**

| badgeId | Criterion implementation | Correct? |
|---------|--------------------------|----------|
| `racing-first-entry` | `db.races.filter(r => r.playerEntryPetId != null).first()` — checks for any race with non-null `playerEntryPetId` | PASS |
| `racing-first-finish` | Uses pre-loaded `playerRaces` — races filtered `status === 'finished' && playerEntryPetId != null`. Checks `playerRaces.length > 0` | PASS |
| `racing-podium` | Iterates `playerRaces.some(r => { const player = r.participants.find(p => p.isPlayer); return player != null && player.position != null && player.position <= 3 })` — parses participant JSON, finds isPlayer, checks position | PASS |
| `racing-champion` | Same iteration, adds `r.type === 'championship' && player.position === 1` | PASS |

**Arcade track:**

| badgeId | Criterion implementation | Correct? |
|---------|--------------------------|----------|
| `arcade-first-game` | `skills.some(s => s.gamesPlayed >= 1)` where `skills = await db.skillProgress.toArray()` | PASS |
| `arcade-ten-games` | `skills.reduce((sum, s) => sum + s.gamesPlayed, 0) >= 10` | PASS |
| `arcade-streak-five` | `skills.some(s => s.bestStreak >= 5)` | PASS |
| `arcade-all-subjects` | `const areas = ['maths', 'spelling', 'science', 'geography']; areas.every(a => skills.find(s => s.area === a && s.gamesPlayed >= 1))` — all four must be present | PASS |

**Care track:**

| badgeId | Criterion implementation | Correct? |
|---------|--------------------------|----------|
| `care-first-action` | `await db.careLog.count() >= 1` | PASS |
| `care-full-day` | Groups `careLogs` by `petId:date` key, checks each group has all of `feed`, `clean`, `play` in its Set | PASS |
| `care-streak-three` | `db.savedNames.where('careStreak').aboveOrEqual(3).first()` with fallback to `toArray().some(p => (p.careStreak ?? 0) >= 3)` | PASS |
| `care-streak-seven` | Same pattern, threshold 7 | PASS |

**Marketplace track:**

| badgeId | Criterion implementation | Correct? |
|---------|--------------------------|----------|
| `market-first-buy` | `db.savedNames.where('source').equals('marketplace').first()` | PASS |
| `market-first-sell` | `db.transactions.filter(t => t.category === 'marketplace' && t.type === 'earn').first()` | PASS — note: uses filter() rather than index query; correctness is not affected |
| `market-five-trades` | `db.transactions.where('category').equals('marketplace').count() >= 5` | PASS |
| `market-rare-buy` | Loads `db.savedNames.where('source').equals('marketplace').toArray()`, filters for `rarity in ['rare', 'epic', 'legendary']` in memory | PASS |

**Rescue track:**

| badgeId | Criterion implementation | Correct? |
|---------|--------------------------|----------|
| `rescue-first-animal` | `db.savedNames.where('source').anyOf(['rescue', 'generate']).first()` | PASS |
| `rescue-five-animals` | `db.savedNames.where('source').anyOf(['rescue', 'generate']).count() >= 5` | PASS |
| `rescue-rare-find` | Loads rescue/generate `savedNames` via `anyOf`, filters rarity in memory | PASS |
| `rescue-ten-animals` | Same `anyOf` count query, threshold 10 | PASS |

All 20 badge criteria are correctly implemented.

---

## AB-04 — Caller wiring

### useRacing.ts (after `resolveRace()`)

| Check | Result | Evidence |
|-------|--------|----------|
| Old `.catch()`-only pattern gone | PASS | No `.catch()` without preceding `.then()` on this call |
| `.then(newBadges => ...).catch(err => ...)` pattern present | PASS | Lines 207–221 |
| `forEach` with `setTimeout(i * 400)` | PASS | `newBadges.forEach((badge, i) => { setTimeout(() => { ... }, i * 400) })` |
| Toast: `type: 'success'` | PASS | Line 211 |
| Toast: `title: badge.name` | PASS | Line 212 |
| Toast: `description: 'You earned a badge!'` | PASS | Line 213 |
| Toast: `duration: 6000` | PASS | Line 214 |
| `.catch()` fires error toast | PASS | Line 219–221 — `toast({ type: 'error', title: 'Badge check failed', ... })` |

### useAuctions.ts — `resolveAuctionWin` (line 769)

| Check | Result | Evidence |
|-------|--------|----------|
| `.then(newBadges => ...).catch(err => ...)` pattern present | PASS | Lines 769–784 |
| `forEach` with `setTimeout(i * 400)` | PASS | Present |
| Toast `type: 'success'`, `title: badge.name`, `description: 'You earned a badge!'`, `duration: 6000` | PASS | Lines 773–778 |
| `.catch()` fires error toast | PASS | Lines 782–784 |
| Stale "stub returning []" comment at line 724 | DEFECT (DEF-002, non-blocking) | Line 724: "Note: checkBadgeEligibility() is a stub returning [] — see KNOWN GAP comment above." — comment is no longer accurate |

### useAuctions.ts — `deliverWonAnimal` (line 833)

| Check | Result | Evidence |
|-------|--------|----------|
| `.then(newBadges => ...).catch(err => ...)` pattern present | PASS | Lines 833–848 |
| `forEach` with `setTimeout(i * 400)` | PASS | Present |
| Toast `type: 'success'`, `title: badge.name`, `description: 'You earned a badge!'`, `duration: 6000` | PASS | Lines 837–842 |
| `.catch()` fires error toast | PASS | Lines 846–848 |

### useMarketplace.ts — `acceptSellOffer` (player buys from NPC)

| Check | Result | Evidence |
|-------|--------|----------|
| `checkBadgeEligibility()` called after successful buy | **FAIL — BLOCKING DEFECT (DEF-001)** | `acceptSellOffer()` returns `true` at line 189 with no badge check. No call site exists for this path. |

### useMarketplace.ts — `acceptNpcBuyerOffer` (player sells via listing)

| Check | Result | Evidence |
|-------|--------|----------|
| `.then(newBadges => ...).catch(err => ...)` pattern present | PASS | Lines 321–336 |
| `forEach` with `setTimeout(i * 400)` | PASS | Present |
| Toast `type: 'success'`, `title: badge.name`, `description: 'You earned a badge!'`, `duration: 6000` | PASS | Lines 325–330 |
| `.catch()` fires error toast | PASS | Lines 334–336 |

Note: This call site covers sale-path badges (`market-first-sell`, `market-five-trades`). It does NOT cover buy-path badges because it is a sell function, not a buy function. The missing call in `acceptSellOffer` is DEF-001.

### usePlayerListings.ts — `completeSale` (line 532)

| Check | Result | Evidence |
|-------|--------|----------|
| `.then(newBadges => ...).catch(err => ...)` pattern present | PASS | Lines 532–547 |
| `forEach` with `setTimeout(i * 400)` | PASS | Present |
| Toast `type: 'success'`, `title: badge.name`, `description: 'You earned a badge!'`, `duration: 6000` | PASS | Lines 536–541 |
| `.catch()` fires error toast | PASS | Lines 545–547 |

### useCareLog.ts — `performCare()` (new call site)

| Check | Result | Evidence |
|-------|--------|----------|
| Call site added (was not present before) | PASS | Lines 120–135 — added after `earn()` calls complete |
| Fires after `performCare()` success path only | PASS | Call is after the `for_sale` guard, after care log write, after earn — on the success path. The return for blocked/alreadyDone cases exits before the badge call. |
| `.then(newBadges => ...).catch(err => ...)` pattern | PASS | Lines 120–135 |
| `forEach` with `setTimeout(i * 400)` | PASS | Present |
| Toast: correct copy and `duration: 6000` | PASS | Lines 124–129 |
| `.catch()` fires error toast | PASS | Lines 133–135 |
| `checkBadgeEligibility` imported from `useProgress` | PASS | Line 32: `const { addXp, checkBadgeEligibility } = useProgress()` |

### GenerateScreen.tsx — `handleAdopt()` (new call site)

| Check | Result | Evidence |
|-------|--------|----------|
| Call site added after `adoptPet()` succeeds | PASS | Lines 384–399 — inside try block, after `await adoptPet(...)` |
| `.then(newBadges => ...).catch(err => ...)` pattern | PASS | Lines 384–399 |
| `forEach` with `setTimeout(i * 400)` | PASS | Present |
| Toast: correct copy and `duration: 6000` | PASS | Lines 388–393 |
| `.catch()` fires error toast | PASS | Lines 397–399 |
| `checkBadgeEligibility` imported from `useProgress` | PASS | Line 96: `const { getRecentQuestions, checkBadgeEligibility } = useProgress()` |

### Zero `.catch()`-only call sites remaining

Search `src/` for `checkBadgeEligibility().catch(`:

Result: 0 matches. Confirmed — no call site uses the old `.catch()`-only pattern.

---

## AB-05 — Home screen badge count

| Check | Result | Evidence |
|-------|--------|----------|
| `badges` destructured from `useProgress()` | PASS | `HomeScreen.tsx` line 30: `const { gamerLevel, badges } = useProgress()` |
| `Award` icon imported from `lucide-react` | PASS | Line 7: `import { Award, Settings } from 'lucide-react'` |
| Badge count row is in the progress section | PASS | Lines 97–105: between `HomeStatCards` and `FeaturedPetCard` |
| Icon size 16, strokeWidth 2 | PASS | `<Award size={16} strokeWidth={2} ... />` — line 98 |
| Icon colour `var(--amber-t)` | PASS | `style={{ color: 'var(--amber-t)', flexShrink: 0 }}` — line 98 |
| Label "Badges" at 13px, `var(--t2)` | PASS | `style={{ fontSize: '13px', fontWeight: 400, color: 'var(--t2)' }}` — line 99–101 |
| Count at 13px, weight 600, `var(--t1)` | PASS | `style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}` — line 102–104 |
| Shows `{badges.length}` | PASS | Line 103: `{badges.length}` |
| No `onClick` handler — row is inert | PASS | `<div className="flex items-center gap-2">` — no onClick, no role, no cursor |
| Shows "Badges: 0" when empty (count is always rendered) | PASS | `{badges.length}` renders `0` when array is empty; row is never conditionally hidden |
| 44px minimum touch target height | CONCERN — not enforced. The div has no `min-h-[44px]` or `py` class. If the text renders at ~20px, the touch target will be below the 44px minimum specified in the spec (AB-05 AC-7) and interaction spec section 7. This is a non-blocking concern — the row is inert at this tier, so it cannot be activated — but it will become blocking when Tier 4 adds navigation. Flagged for pre-emptive fix. |

---

## TD-004 regression check — `openRaces`

**Search command:** grep `\bopenRaces\b` in `src/`

**Result:**
```
src/hooks/useRacing.ts:79:  // TD-004 fix: renamed from openRaces — this collection includes both 'open' and 'running' races
```

**Analysis:** The single match is in a code comment. The word boundary pattern `\bopenRaces\b` does not match `openRacesList` (a different local variable used inside `generateDailyRaces()`). There are zero non-comment references to `openRaces` as a property or variable in `src/`.

**Result: PASS.** The TD-004 regression is clean. The returned property from `useRacing()` is `activeRaces` (line 80), not `openRaces`.

---

## 10-point DS checklist

All checks scoped per CLAUDE.md: checks 1–6 scope to changed files; checks 7–10 are app-wide.

**Changed files in this feature batch:**
- `src/lib/db.ts`
- `src/data/badges.ts`
- `src/hooks/useProgress.ts`
- `src/hooks/useRacing.ts`
- `src/hooks/useAuctions.ts`
- `src/hooks/useMarketplace.ts`
- `src/hooks/usePlayerListings.ts`
- `src/hooks/useCareLog.ts`
- `src/screens/GenerateScreen.tsx`
- `src/screens/HomeScreen.tsx`

---

**Check 1 — No emojis used as icons (Lucide only)**

Scope: changed files above.

- `src/data/badges.ts`: All `icon` fields are Lucide name strings. No emoji characters found. PASS
- `src/hooks/useProgress.ts`: Toast messages use plain text. No emoji. PASS
- `src/hooks/useRacing.ts` through `useCareLog.ts`: Badge toast messages: `'You earned a badge!'`, `'Badge check failed'` — no emoji. PASS
- `src/screens/GenerateScreen.tsx`: Badge toast messages — no emoji. PASS
- `src/screens/HomeScreen.tsx`: Uses `Award` Lucide icon. No emoji. PASS

**Check 1: PASS**

---

**Check 2 — No `ghost` variant on visible actions (app-wide)**

Search result: `grep variant="ghost"` across entire `src/` — **0 matches.**

**Check 2: PASS**

---

**Check 3 — All colours trace to `var(--...)` tokens**

Scope: HomeScreen.tsx additions (the only visual change in this batch).

- `Award` icon: `color: 'var(--amber-t)'` — token. PASS
- Label: `color: 'var(--t2)'` — token. PASS
- Count: `color: 'var(--t1)'` — token. PASS
- No hardcoded hex values in any changed file. PASS

**Check 3: PASS**

---

**Check 4 — Surface stack correct**

No new overlays, modals, or BottomSheets introduced in this feature. The badge count row is an inline element in the scroll container, not a fixed/absolute element.

**Check 4: PASS (N/A for new surfaces)**

---

**Check 5 — Layout verified at 375px, 768px, and 1024px**

The badge count row is a single `flex items-center gap-2` div inside the `px-6 pt-4 pb-24 max-w-3xl mx-auto w-full` container. The row contains only two spans of `13px` text and a `16px` icon. This layout has no horizontal overflow risk at any breakpoint. At 375px the three elements will fit comfortably. The `max-w-3xl` constraint centres the content on wider viewports.

Static analysis confirms no layout risk. Physical breakpoint verification in preview required at sign-off but cannot block due to the blocking defect at DEF-001 taking priority.

**Check 5: PASS (static analysis) — pending physical preview verification after DEF-001 resolution**

---

**Check 6 — `pb-24` on all scrollable content**

`HomeScreen.tsx` line 75: `className="px-6 pt-4 pb-24 max-w-3xl mx-auto w-full"` — unchanged. PASS

**Check 6: PASS**

---

**Check 7 — Top-of-screen breathing room (app-wide, every screen with sticky header)**

`HomeScreen.tsx` line 75: `pt-4` is present on the content container immediately below the PageHeader. PASS

No other screens were structurally changed in this batch. App-wide status: no regression introduced.

**Check 7: PASS**

---

**Check 8 — Navigation controls compact and consistent**

No new tab switchers, filter pill rows, or sort controls introduced in this batch. Badge count row is a static display element, not a navigation control.

**Check 8: PASS (N/A)**

---

**Check 9 — Animation parameters match spec**

No new animations introduced in this batch. Badge toasts use the existing toast animation system. Spec section 7 defines toast animation parameters (200ms entrance, ease [0.16,1,0.3,1], reduced-motion branch) — these are implemented in the existing `Toast.tsx` component, which is unchanged. No new parameters to verify.

**Check 9: PASS (N/A for new animations)**

---

**Check 10 — Spec-to-build element audit**

Scrolling each built element against the spec:

| Spec element | Present in build | Notes |
|---|---|---|
| 20 badges in `BADGE_CATALOGUE` | Yes — all 20 verified in AB-02 | PASS |
| `checkBadgeEligibility()` implemented | Yes — AB-03 verified | PASS |
| Badge toasts at all 6 call sites | Partial — `acceptSellOffer` missing (DEF-001) | FAIL |
| Badge count row on HomeScreen | Yes — `Award` icon + label + live count | PASS |
| DB at v14 | Yes | PASS |
| `careStreak` indexed on `savedNames` | Yes | PASS |
| Row inert on tap (no navigation at this tier) | Yes — no onClick | PASS |
| Row shows "Badges: 0" when empty | Yes — `{badges.length}` always rendered | PASS |

Spec element absent from build: `checkBadgeEligibility()` not called from `acceptSellOffer`. Logged as DEF-001.

**Check 10: FAIL — DEF-001**

---

## Sign-off statement

**BLOCKED.** This build cannot receive Tester sign-off in its current state.

**Blocking condition:** DEF-001 — `checkBadgeEligibility()` is not called after `acceptSellOffer()` in `useMarketplace.ts`. The `market-first-buy` and `market-rare-buy` badges can never fire through the primary buy path. The spec (AB-04 AC-3) explicitly requires this call site.

**Action required:** Developer to add the `.then(newBadges => ...).catch(err => ...)` call pattern to `acceptSellOffer()` in `src/hooks/useMarketplace.ts`, after the `return true` path (before the existing return statement). This is a single additional call site, identical in pattern to the six already wired.

**Non-blocking items for developer to address before Tier 4:**
- DEF-002: Remove stale "stub returning []" comment from `useAuctions.ts` line 724.
- Touch target: Add `min-h-[44px]` to the badge count row div in `HomeScreen.tsx` to satisfy AB-05 AC-7, in advance of Tier 4 navigation being added.

**Once DEF-001 is resolved:** Re-test `acceptSellOffer` call site only. All other verifications above remain valid and do not require re-running.

---

*Tester: Senior QA Engineer — 2026-03-28*
