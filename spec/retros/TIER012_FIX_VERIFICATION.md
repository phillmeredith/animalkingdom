# Tier 0/1/2 Fix Verification Report

**Date:** 2026-03-27
**Reviewer:** Tester (QA)
**Scope:** Verification of all declared fixes across logic hooks and UI components following the comprehensive Tier 0/1/2 fix pass.

---

## Logic Fix Results

| Fix ID | File | Status | Notes |
|--------|------|--------|-------|
| Logic-01 | useMarketplace.ts | PASS | `earn()` is inside the `db.transaction()` callback at line 127 (`acceptBuyOffer`) and line 259 (`acceptNpcBuyerOffer`). Both are within `async () => {}` callbacks passed to `db.transaction('rw', ...)`. Atomicity confirmed. |
| Logic-02 | useRacing.ts | PASS | `PRIZE_DISTRIBUTION = [0.5, 0.25, 0.15, 0.10]` at line 19. Sum = 1.0 exactly. |
| Logic-03 | useWallet.ts + useItemShop.ts | PASS | `spend()` return type is `{ ok: true; transactionId: number } \| { ok: false }` (line 53, useWallet.ts). `buyItem()` returns `transactionId` in `BuyItemResult` (line 11, useItemShop.ts). `undoPurchase()` method exists at line 65. All callers check `.ok` not truthiness: `if (!paid.ok)` at useItemShop.ts:39, useMarketplace.ts:139, useRacing.ts:124, useCardPacks.ts:104. |
| Logic-04 | ArcadeShell.tsx | PASS | `earn(1, 'Effort reward', 'arcade')` is called at line 119, which is inside the `else` block of `if (correct)` (line 117–119) inside `handleAnswer`. Correct placement in the wrong-answer branch. |
| Logic-05 | ArcadeShell.tsx | PASS | `db.skillProgress.update(skillRecord.id, { gamesPlayed: ... })` at lines 94–96 inside `finishGame()`. DB update exists. |
| Logic-06 | useCareLog.ts | PASS | `yesterdayString()` helper defined at lines 23–27. Used on line 63 (`const yesterday = yesterdayString()`). Streak reset logic checks `lastDate === yesterday` before incrementing at lines 88–90. |
| Logic-07 | useCareLog.ts | PASS | `STREAK_BONUSES` defined at line 18 with keys `{ 3: 25, 7: 50, 14: 100, 30: 250 }`. `earn()` called at line 101 when `STREAK_BONUSES[newStreak]` is truthy. |
| Logic-08 | useSavedNames.ts | PASS | `if (pet.status === 'for_sale')` guard at line 42, before `db.savedNames.delete(id)` at line 46. Returns `{ success: false, reason: ... }` shape confirmed at lines 34–47. |
| Logic-09 | useMarketplace.ts | PASS | `ANIMALS.find(a => a.animalType === offer.animalType && a.breed === offer.breed)` at lines 145–147 in `acceptSellOffer`. Falls back to `'At Home'` only if lookup fails (line 154). |
| Logic-10 | useRacing.ts | PASS | `generateDailyRaces()` calls `todayString()` at line 80, queries for open races created today at lines 81–85, and returns early if already generated (`if (alreadyGeneratedToday) return` at line 85). |
| Logic-11 | useMarketplace.ts | PASS | Listing expiry: `24 * 60 * 60 * 1000` ms at line 203 (24h = 86,400,000 ms). NPC offer expiry: `30 * 60 * 1000` ms at line 225 (30 minutes = 1,800,000 ms). Both exact. |
| Logic-12 | useMarketplace.ts | PASS | Competing offers query at lines 262–265 inside `acceptNpcBuyerOffer` transaction. Filters by `listingId`, excludes accepted offer, status `'pending'`. Updates each to `'declined'` at line 267. |
| Logic-13 | HomeScreen.tsx | PASS | `setBonusChecked(true)` is inside `finally` block at line 49. The `try/catch/finally` structure spans lines 42–51. |
| Logic-14 | ArcadeShell.tsx | PASS | `catch` block at lines 98–101 calls `toast({ type: 'error', title: "Couldn't save your progress — try again." })`. Not a silent swallow. |

---

## UI Fix Results

| Fix ID | File | Status | Notes |
|--------|------|--------|-------|
| UI-01 | AdoptionOverlay.tsx | PASS | No emoji characters in JSX. Lucide `Heart` icon used at line 47. No `repeat: Infinity` — animation uses spring transition with no repeat property. |
| UI-02 | BottomNav.tsx | PASS | `<span>` with label text rendered at lines 46–48 alongside `<Icon>` at lines 41–44 inside a flex-col div. Labels render below icons. |
| UI-03 | PetCard.tsx | PASS | `CheckCircle` conditional at lines 42–45, `AlertCircle` conditional at lines 46–51. Both depend on `careState` prop. |
| UI-04 | MarketplaceScreen.tsx | PASS | `namingPet` state declared at line 349. `NamingSheet` component defined at lines 303–328 and rendered inside a `BottomSheet` at lines 444–459. |
| UI-05a | FeaturedPetCard.tsx | PASS | Button at line 78: `variant="outline"`. |
| UI-05b | MarketplaceScreen.tsx | PARTIAL | `BuyOfferSheet`: Decline button at line 120 uses `variant="outline"`. Listing-form List button at line 278 uses `variant="primary"`. `SellOfferSheet` Pass button at line 163 uses `variant="outline"`. `MyListings` Remove button at line 233 uses `variant="outline"`. Accept button at line 206 uses `variant="accent"`. **No `variant="ghost"` found in MarketplaceScreen.tsx.** All 4 visible-action buttons confirmed non-ghost. PASS — no ghost variants present. |
| UI-05c | ArcadeShell.tsx | PASS | "Back to games" button at line 238 uses `variant="outline"`. No ghost variants. |
| UI-06 | Modal.tsx | PASS | Modal surface: `bg-[var(--card)]` at line 53. BottomSheet surface: `bg-[var(--card)]` at line 110. No `bg-[var(--elev)]` on either surface element (only used on close-button backgrounds, which is correct). |
| UI-07 | ExploreScreen.tsx | PASS | `CoinDisplay` in header at line 62. `max-w-3xl mx-auto w-full` present at lines 64, 72, and 77. **FAIL component:** `pb-24` is NOT present on the grid container. The `VirtualAnimalGrid` uses a virtualized absolute-positioned layout — the virtualizer's total-size div has no bottom padding. The grid wrapper (`div` at line 77, ExploreScreen) has no `pb-24`. Last-row cards may be obscured by the 68px fixed nav. |
| UI-08 | AnimalCard.tsx | PASS | `RarityBadge` used at line 40. No `RARITY_DOT` constant. No hardcoded hex values anywhere in the file. |
| UI-09 | MyAnimalsScreen.tsx | PASS | No native `<select>` element. Sort options are `<button>` pill elements at lines 105–118. Category filters are `<button>` pill elements at lines 83–94. |
| UI-10 | ReleaseConfirm.tsx | PASS | String "Are you sure you want to say goodbye" present at line 32: `Are you sure you want to say goodbye to {petName}? This can't be changed.` |
| UI-11 | ArcadeShell.tsx | PASS | `showExitConfirm` state declared at line 62. Overlay JSX at lines 254–268, rendered when `showExitConfirm` is true. |
| UI-12 | ArcadeShell.tsx | PASS | `useSpeech` imported at line 13. `speak()` called at line 71 inside a `useEffect` with `[currentIndex, phase]` dependency array at line 72. |
| UI-13 | ShopScreen.tsx | PASS | "You have {coins} coins — need {item.price}" rendered at lines 155–158 inside `!canAfford` conditional. `onUndo` callback passed to toast at lines 186–189 when `txId` is defined. |
| UI-14 | CarePanel.tsx | PASS | `Loader2` imported at line 5, used at line 77 with `animate-spin`. `Check` imported at line 5, used at line 77 in done state. No `'...'` or `'✓'` characters found. |
| UI-15 | CardsScreen.tsx | PASS | `pb-24` present at line 151 on the collection grid div: `className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-6 pb-24"`. |
| UI-16 | MarketplaceScreen.tsx | PASS | `isRefreshing` state at line 346. Set to `true` before `refreshOffers()` at line 352, reset in `.finally()` at line 353. Spinner shown at lines 409–413 when `isRefreshing && offers.length === 0`. |
| UI-17 | MarketplaceScreen.tsx | FAIL | `onDeclineOffer` callback at lines 435–437 calls `declineNpcBuyerOffer(id)` but **fires no toast**. The NPC buyer offer decline path is silent — the user gets no confirmation. Compare with the working buy-offer decline at line 479 which does fire `toast({ type: 'info', title: 'Offer declined' })`. |
| UI-18 | ShopScreen.tsx | PASS | Grid at line 254: `grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4`. Max 4 columns at `lg` breakpoint. |
| UI-19 | DailyBonusCard.tsx | PASS | Timer is `setTimeout(onDismiss, 5000)` at line 19 (5000 ms). `onClick={onDismiss}` on the card div at line 41. |
| UI-20 | ExploreScreen.tsx | PASS | Empty state renders at lines 78–90 when `filteredAnimals.length === 0`. Shows `Search` icon, "No animals found" heading, "Try a different search or clear filters" copy, and a "Clear search" button. |
| UI-21 | PetDetailSheet.tsx | PASS | Actions footer at lines 194–225 uses `grid grid-cols-2 gap-2`. Four buttons present: Rename (primary), Release (outline), List for Sale (outline), Compare (outline). |
| UI-22 | PetDetailSheet.tsx | PASS | Equipment section at lines 153–190. Saddle list rendered from `ownedItems.filter(i => i.category === 'saddle')`. `Disc` icon imported at line 11, used at line 174. |
| UI-23 | MarketplaceScreen.tsx | PASS | Browse tab content at lines 384–415 has `max-w-3xl mx-auto w-full` at line 385. Buy and sell offer lists use `md:grid-cols-2` at lines 389 and 397. MyListings component also uses `max-w-3xl mx-auto w-full` at line 190. |

---

## Regression Check Results

| Hook | Check | Status | Notes |
|------|-------|--------|-------|
| useRacing.ts | `enterRace()` with new `spend()` return type | PASS | Line 123: `const paid = await spend(race.entryFee, ...)`. Line 124: `if (!paid.ok) return { success: false, reason: 'Not enough coins' }`. Correctly checks `.ok`. No regression. |
| useCardPacks.ts | `openPack()` spend result check | PASS | Line 103: `const paid = await spend(def.price, ...)`. Line 104: `if (!paid.ok) return { success: false, ... }`. Correctly checks `.ok`. No regression. |
| useMarketplace.ts | `acceptSellOffer()` spend result check | PASS | Line 138: `const paid = await spend(offer.price, ...)`. Line 139: `if (!paid.ok) return false`. Correctly checks `.ok`. No regression. |

---

## New Issues Found During Review

### NEW-01 — VirtualAnimalGrid.tsx: Emoji in EmptyState prop (line 60)
**File:** `src/components/explore/VirtualAnimalGrid.tsx:60`
**Severity:** Medium — design system violation (CLAUDE.md: "No emojis in JSX")
**Detail:** `EmptyState` is called with `icon="🔍"` (a string emoji). This path is now unreachable in the running app (ExploreScreen renders its own empty state before passing animals to the grid), but the code still contains a prohibited emoji character.
**Expected:** Lucide `Search` icon component
**Note:** This empty-state branch in the virtualizer is superseded by the ExploreScreen-level empty state (UI-20 PASS), but the dead code should still be cleaned up for design system compliance.

### NEW-02 — ReleaseConfirm.tsx: `variant="ghost"` on visible Cancel button (line 37)
**File:** `src/components/my-animals/ReleaseConfirm.tsx:37`
**Severity:** Medium — design system violation (CLAUDE.md: "ghost button variant for visible actions — use outline, primary, or accent")
**Detail:** The Cancel button uses `variant="ghost"`. The Cancel action is a clearly visible interactive element.
**Expected:** `variant="outline"`
**Note:** The ghost variant issue was partially addressed in this fix pass (UI-05) but `ReleaseConfirm.tsx` was not in scope for that fix. It was missed.

### NEW-03 — ExploreScreen.tsx: No `pb-24` on the scrollable grid (UI-07 FAIL, expanded)
**File:** `src/screens/ExploreScreen.tsx:77` / `src/components/explore/VirtualAnimalGrid.tsx:71`
**Severity:** High — last row of animals in the Explore grid is obscured by the 68px fixed bottom nav on all devices.
**Detail:** The `VirtualAnimalGrid` wrapper div at line 71 of VirtualAnimalGrid.tsx has `className="flex-1 overflow-y-auto"` with no `pb-24`. The virtualizer calculates `totalSize` without any bottom padding offset. The last row of animal cards will be partially hidden under the nav bar when scrolled to the end.
**Reproduction:** Load Explore, scroll to the bottom of the animal list, observe the final row of cards.

### NEW-04 — MarketplaceScreen.tsx: NPC buyer offer decline fires no toast (UI-17 FAIL, expanded)
**File:** `src/screens/MarketplaceScreen.tsx:435–437`
**Severity:** Low — user feedback gap, not a data integrity issue.
**Detail:** `onDeclineOffer` handler calls `declineNpcBuyerOffer(id)` with no subsequent toast. The user gets no confirmation that their decline was registered. The symmetric offer-decline path in the Browse tab correctly fires `toast({ type: 'info', title: 'Offer declined' })` at line 479 and 506.

---

## Summary Tables

### Logic Fixes: 14/14 PASS

### UI Fixes: 20/23 PASS, 1/23 PARTIAL (reclassified PASS), 2/23 FAIL

| Result | Count |
|--------|-------|
| PASS | 20 |
| FAIL | 2 (UI-07, UI-17) |
| PARTIAL | 0 (UI-05b reclassified PASS — no ghost variants found) |

### Regression Checks: 3/3 PASS

### New Issues Found: 4

| ID | Severity | File | Summary |
|----|----------|------|---------|
| NEW-01 | Medium | VirtualAnimalGrid.tsx:60 | Emoji in dead EmptyState branch |
| NEW-02 | Medium | ReleaseConfirm.tsx:37 | `variant="ghost"` on visible Cancel button |
| NEW-03 | High | ExploreScreen.tsx / VirtualAnimalGrid.tsx | No `pb-24` on Explore grid — last row obscured by nav |
| NEW-04 | Low | MarketplaceScreen.tsx:435 | No toast on NPC buyer offer decline |

---

## Final Verdict

**NOT SIGNED OFF**

### Blockers

1. **UI-07 FAIL / NEW-03 (High):** ExploreScreen grid has no `pb-24`. The virtual grid's last row is obscured by the fixed navigation bar. This directly breaks the core browse experience on every device. The fix requires adding bottom padding to `VirtualAnimalGrid.tsx` (the virtualizer container needs an explicit bottom padding in its height calculation, or a padding element appended after the virtualizer div).

2. **UI-17 FAIL / NEW-04 (Low):** NPC buyer offer decline fires no user feedback toast. Although low severity, it is a user-facing gap in a feature explicitly called out in the fix list. Confirming the toast was the declared fix criterion.

### Non-blocking issues to address before next sign-off cycle

- NEW-02: `variant="ghost"` on `ReleaseConfirm.tsx` Cancel button — missed in the ghost-button fix pass.
- NEW-01: Dead-code emoji in `VirtualAnimalGrid.tsx` empty state — design system violation even if the branch is unreachable in production.

All 14 logic fixes and all regression checks are confirmed correct. 20 of 22 UI fixes pass. The two failures above must be resolved before this build can be signed off.
