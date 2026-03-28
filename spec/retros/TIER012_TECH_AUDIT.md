# Tier 0, 1, 2 — Technical Integration Audit

**Audited by:** Developer
**Date:** 2026-03-27
**Scope:** All Tier 0/1/2 features built without full team process review
**Method:** Static code analysis of hooks, screens, components, db schema, and spec docs

---

## Executive Summary

1. **Race prize distribution is wrong (HIGH).** `useRacing.ts` uses `[0.5, 0.3, 0.15, 0.05]` but INTEGRATION_MAP.md specifies `[50%, 25%, 15%, 10%]` — the 2nd and 4th place payouts are incorrect, over-paying 2nd and under-paying 4th by a material amount.

2. **Item purchase undo is wired to the wrong thing (HIGH).** `ShopScreen.tsx` calls `buyItem()` then shows a toast — but the undo toast path described in INTEGRATION_MAP event #12 is never implemented. `undoLastTransaction()` exists in `useWallet` and `useItemShop` has no `undoPurchase` method at all. Players cannot undo item purchases.

3. **Care streak bonus milestones never fire (HIGH).** `useCareLog.ts` increments `careStreak` correctly but contains zero logic for the 3/7/14/30-day streak bonus payouts specified in INTEGRATION_MAP event #13. Coins are earned per-action but the milestone rewards are silently dropped.

4. **`checkBadgeEligibility()` is a permanent stub (HIGH).** `useProgress.ts` line 138–141 returns an empty array unconditionally. No badges from rescue, care, racing, arcade, or marketplace events are ever checked. The badge system is wired structurally but delivers nothing at runtime.

5. **`acceptBuyOffer` earn() call runs outside the DB transaction, creating a split-brain risk (MEDIUM).** If the `earn()` call fails after `db.savedNames.delete()` succeeds, the pet is gone but no coins arrive. This is a partial data-loss scenario.

---

## Integration Gaps — Per INTEGRATION_MAP.md Event

### Event 1: Daily Login Bonus Claimed

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| coins += 25 | YES | `useWallet.claimDailyBonus()` line 105 |
| lastDailyBonusDate = today | YES | line 113 |
| dailyLoginStreak++ | YES | line 104 |
| Transaction record created | YES | lines 116–124 |
| Toast "Daily bonus! +25 coins" | YES | `HomeScreen.tsx` lines 75–83 (DailyBonusCard) |
| Generate daily marketplace offers | PARTIAL | `HomeScreen.tsx` does NOT call `refreshOffers()`. `MarketplaceScreen.tsx` calls it independently on mount (line 312). Offers are generated when user visits marketplace, not on home load as specified. |
| Generate daily races | PARTIAL | `RacingScreen.tsx` calls `generateDailyRaces()` independently on mount (line 205). Not triggered from home screen as specified. |
| Generate daily quest for Home screen | GAP | No quest system exists anywhere in the codebase. |

**Finding:** Daily login correctly updates wallet and streak. Cross-system triggers (marketplace refresh, race generation) depend on the user navigating to those screens, not on home mount. This deviates from the spec and means a player who stays on Home all day gets stale marketplace data and no new races until they visit those screens.

---

### Event 2: Pet Adopted (from Generate)

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| savedNames record created | YES | `GenerateScreen.tsx:handleAdopt()` lines 336–360 |
| Adoption overlay | YES | `AdoptionOverlay` component shown lines 362–364 |
| "Meet your new friend!" nav to Home | YES | navigate('/') after TraderPuzzle completes |
| 50% TraderPuzzle overlay | YES | `handleAdoptionDismiss` lines 373–394 |
| TraderPuzzle correct: earn(10-25) + addXp() | PARTIAL | `TraderPuzzle` component wires `useWallet.earn()` — but `useProgress.addXp()` is not called from the TraderPuzzle completion path. XP for TraderPuzzle answers is not persisted. |
| Feed entry created | GAP | No `useFeed` hook or feed table exists in the schema or codebase. INTEGRATION_MAP references a feed system that was never built. |
| Adoption is free | YES | No spend call on generate path |

---

### Event 3: Pet Adopted (from Marketplace)

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| useWallet.spend() | YES | `useMarketplace.acceptSellOffer()` line 137 |
| Spend fail: toast + STOP | YES | spend returns false, function returns false; UI checks result |
| marketOffers.status → "accepted" | YES | line 141 |
| Naming modal | GAP | `acceptSellOffer()` creates the pet immediately with a default name `"${offer.breed} ${offer.animalType}"` (line 144). There is no naming modal step. The pet is adopted without the player choosing a name. |
| useSavedNames.adoptPet() with source "marketplace" | YES | line 144 (inline add rather than calling adoptPet(), but functionally equivalent) |
| Toast "Welcome [Name]!" | PARTIAL | `MarketplaceScreen.tsx` line 420 shows `"You bought a ${selected.breed}!"` — no pet name because naming step is absent |
| 50% TraderPuzzle | GAP | No TraderPuzzle is triggered from the marketplace buy path |

---

### Event 4: Pet Adopted (from Auction Win)

**Status: GAP**

No auction system is implemented. The `auctionItems` and `auctionBids` tables exist in `db.ts` (lines 214–238, 296–314) but there is no `useAuction` hook, no auction UI in `MarketplaceScreen.tsx`, and `useMarketplace.ts` contains no auction methods. The entire auction feature is schema-only.

---

### Event 5: Pet Adopted (from Rescue)

**Status: GAP**

No rescue system exists. The `source: 'rescue'` value is defined on the `SavedName` type but there is no rescue flow, rescue event screen, or UI path that leads to it. INTEGRATION_MAP references `useSavedNames.adoptPet(data)` with source "rescue" — that call is never made from any screen. Badge check for rescue-related badges also absent (blocked by stub in `checkBadgeEligibility`).

---

### Event 6: Player Listing Created

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| playerListings record created | YES | `useMarketplace.createListing()` lines 184–201 |
| useSavedNames.setForSale(petId) → "for_sale" | YES | line 183 (inside the transaction) |
| Toast success | YES | `MarketplaceScreen.tsx` line 372 |
| Views counter incrementing (30-90s timer) | GAP | `viewCount` is set to 0 on create (line 192) and never updated. No timer logic exists. |
| Phase 1/2/3 NPC offer timeline | PARTIAL | An NPC offer is created immediately on listing (50% chance, lines 204–224) rather than after the 15-45 min Phase 3 delay. Phases 1 and 2 (watchers, enquiry messages) are not implemented. |
| Listing expires at 24h | GAP | `expiresAt` is set to `now + 7 days` (line 197: `7 * 24 * 60 * 60 * 1000`) — spec requires 24 hours. |
| Pet already listed: toast error | GAP | `createListing()` does not check whether the pet already has an active listing before creating another one. |

---

### Event 7: Player Listing Sold

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| npcBuyerOffers.status → "accepted" | YES | `acceptNpcBuyerOffer()` line 250 |
| playerListings.status → "sold" + soldTo/soldPrice/soldAt | YES | lines 246–249 |
| useWallet.earn(soldPrice) | YES | line 253 |
| useSavedNames.releasePet(petId) | YES | line 251 (savedNames.delete inside transaction) |
| Toast success | YES | `MarketplaceScreen.tsx` line 380 |
| All other active offers auto-declined | GAP | `acceptNpcBuyerOffer()` does not query and decline competing pending offers for the same listing. |
| 50% TraderPuzzle | GAP | Not triggered on listing sold path |
| Listing archived to Past Sales | GAP | No "Past Sales" view or past listings query in the UI |
| earn() runs outside the DB transaction | BUG | `acceptNpcBuyerOffer()` line 245 opens a transaction covering `playerListings, npcBuyerOffers, savedNames, playerWallet, transactions` — but then calls `await earn()` on line 253 **after** the transaction closes. The pet is deleted and listing marked sold before coins are awarded. If `earn()` throws, coins are lost. |

---

### Event 8: Auction Bid Placed

**Status: GAP**

Not implemented. No auction UI or hook. Schema exists only.

---

### Event 9: Auction Lost

**Status: GAP**

Not implemented. No auction resolution logic.

---

### Event 10: Race Entered

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| useWallet.spend(entryFee) | YES | `useRacing.enterRace()` line 116 |
| Spend fail: toast + STOP | YES | returns `{success: false, reason: 'Not enough coins'}`, UI handles it |
| races.participants updated | YES | line 139 |
| races.playerEntryPetId = petId | YES | line 140 |
| Toast success | YES | `RacingScreen.tsx` line 215 |
| Transaction record | YES | created by spend() |
| Horse already entered check | PARTIAL | `enterRace()` checks `race.playerEntryPetId !== null` (line 114) to prevent double-entry on the same race. However, there is no cross-race check — a pet can be entered into multiple open races simultaneously. INTEGRATION_MAP requires "Horse already entered in another race: toast error". |
| Race status updates to "running" immediately | DEVIATION | `enterRace()` sets status to `'running'` immediately on entry (line 140). The spec defines `open → running` triggered by `startsAt` time passing, not by player entry. This collapses the open/running distinction. |

---

### Event 11: Race Finished

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| Results calculated | YES | `simulateRace()` in `useRacing.ts` lines 48–62 |
| Prize distribution (50/25/15/10%) | BUG | `PRIZE_DISTRIBUTION = [0.5, 0.3, 0.15, 0.05]` (line 19). Spec requires 2nd place = 25%, but code pays 30%. 4th place should be 10%, code pays 5%. Total distribution sums to 100% but individual splits are wrong. |
| races.status → "finished" | YES | `resolveRace()` line 164 |
| useWallet.earn(prize) if top 4 | PARTIAL | earn() is called only if `playerResult.prize > 0` (line 168). But with the wrong distribution, 4th place gets 5% of pool, which may be 0 after `Math.floor()` on small pools (sprint prizePool = 80, 5% = 4 coins — still >0 but incorrect). |
| Transaction record | YES | created inside earn() |
| Toast with position | YES | `RacingScreen.tsx` lines 224–226 via setResult state |
| useProgress.addXp() for racing | GAP | INTEGRATION_MAP specifies `useProgress.addXp("racing", xpAmount)`. Racing is not a valid SkillArea (only: maths, spelling, science, geography). This call is absent and would fail if attempted. No XP is awarded for racing. |
| Results card full standings | YES | shown in finishedRaces section |

---

### Event 12: Item Purchased

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| useWallet.spend(price) | YES | `useItemShop.buyItem()` line 31 |
| Spend fail: reason returned | YES | returns `{success: false, reason: 'Not enough coins'}` |
| ownedItems record created | YES | lines 34–44 |
| Transaction record | YES | created by spend() |
| Toast with undo (5s) | GAP | `ShopScreen.tsx:handleBuy()` line 176 shows `toast({ type: 'success', title: 'Bought ${selected.name}!' })` — this is a plain success toast with no undo button or 5-second timer. The undo path from INTEGRATION_MAP event #12 is entirely absent. |
| Undo: useItemShop.undoPurchase() | GAP | `useItemShop` has no `undoPurchase` method. |
| Undo: useWallet.undoLastTransaction() | PARTIAL | Method exists in `useWallet` (line 130) but `buyItem()` does not return the `transactionId` needed to call it. The transaction is created inside `spend()` and the id is not surfaced. |

---

### Event 13: Care Action Performed

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| careLog record created | YES | `useCareLog.performCare()` line 49 |
| Success animation / toast | YES | `CarePanel.tsx` lines 33–37 |
| Care circle on Home (reactive) | PARTIAL | Home screen does not show a care circle or care status for any pet. `FeaturedPetCard` renders pet info but no care indicator. |
| All 3 actions: careStreak++ + lastFullCareDate | YES | lines 62–68 |
| Mood update (green/amber/hidden) | GAP | No mood field on `SavedName`. No mood UI exists anywhere. |
| Streak milestone bonuses (3/7/14/30 days) | GAP | `useCareLog.ts` updates `careStreak` but has no logic to check milestones and call `earn()`. The milestone rewards are completely absent. |
| Well-cared horses: +5 speed flag for next race | GAP | No speed bonus flag on `SavedName`. `useRacing.enterRace()` does not check care status when computing `baseSpeed`. |
| Duplicate action: compound index prevents | YES | Dexie compound index `[petId+date+action]` exists (db.ts line 299). However, the index prevents duplicate writes at DB level but `performCare()` checks `isDoneToday()` first (line 45) for a friendlier UX path. |
| Coins per action (5) | YES | `COINS_PER_ACTION = 5` line 10 |
| Full care bonus (10 coins) | YES | `FULL_CARE_BONUS = 10` line 12 |
| `XP_PER_ACTION` constant defined | DEAD CODE | `XP_PER_ACTION = 5` declared line 11 but never used. No XP is awarded for care actions. |
| Care gated on pet status | GAP | `performCare()` does not check `savedName.status`. A pet listed `for_sale` can still receive care actions. |

---

### Event 14: Card Pack Opened

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| Generate N cards by rarity weights | YES | `useCardPacks.openPack()` lines 109–138 |
| New card: collectedCards created | YES | lines 124–135 |
| Duplicate: duplicateCount++ | PARTIAL | Duplicate increments `existing.duplicateCount + 1` (line 121) but initial creation sets `duplicateCount: 0` (line 131) — this is correct, but the display in `CardsScreen.tsx` line 173 shows `×{card.duplicateCount + 1}` which means a card seen once shows "×1" (correct). A card seen twice shows "×2" (correct). This is fine. |
| packHistory record created | YES | lines 140–149 |
| Pack animation: 5 cards | YES | `CardReveal` component, one card revealed per tap |
| "NEW" badge on new cards | YES | `card.isNew` flag line 115 |
| Daily pack timer resets | GAP | INTEGRATION_MAP specifies a free daily pack available once per day. `useCardPacks` has no daily availability gating — packs can be purchased any number of times per day as long as coins permit. The spec concept of "daily pack" is not reflected in the implementation (packs are purchasable, not daily-free). This may be a spec vs. implementation design divergence, but it needs explicit owner decision. |
| Rarity filtering by animal data | PARTIAL | `pickAnimalForRarity()` filters on hardcoded type name strings (lines 59–63) like `['Lion', 'Tiger', ...]`. This relies on `a.animalType` matching exactly, which is fragile if animal data names change. |

---

### Event 15: Arcade Game Completed

**Status: PARTIAL**

| Consequence | Implemented | Notes |
|---|---|---|
| earn() per correct answer | PARTIAL | `ArcadeShell.tsx` awards coins as a lump sum at game end (line 71: `finalScore * COINS_PER_CORRECT`), not per-question during play as specified. One transaction is created rather than one per correct answer. |
| useProgress.addXp() | YES | line 76, called at game end |
| useProgress.recordAnswer() | YES | line 97, called per question |
| GameOver overlay | YES | results phase renders at lines 164–219 |
| Tier-up celebration | GAP | `finishGame()` calls `addXp()` but discards the return value (`tierChanged`, `newTier`). No tier-up celebration is triggered. |
| checkBadgeEligibility() | GAP | Not called after game completion. Blocked by the stub. |
| Effort reward (1 coin) for wrong answers | GAP | Wrong answers are not rewarded. `COINS_PER_CORRECT` only fires for correct answers. Spec requires `earn(1, "Effort reward", "arcade")` for each wrong answer. |
| gamesPlayed count update | GAP | `ArcadeShell.tsx` does not call `db.skillProgress.update(..., { gamesPlayed: gamesPlayed + 1 })`. The `gamesPlayed` field is never incremented at game end. |
| Every 5 games: free adoption token badge | GAP | No adoption token badge system exists. |
| silently swallows earn/addXp errors | RISK | `finishGame()` line 77: `catch { /* silently swallow */ }` — if earn or addXp fail, no feedback is given and the error is lost. |

---

### Event 16: Badge Earned

**Status: GAP**

`useProgress.checkBadgeEligibility()` (lines 138–141) is a permanent stub returning `[]`. `awardBadge()` exists and correctly writes to Dexie, but is never called from any feature. Badges earned from care, rescue, racing, marketplace, or arcade events are not checked or awarded. The `badges` table exists and is correctly indexed but is empty for all players. No feed entry system exists.

---

## Pet Status Enforcement

`SavedName.status` has two valid values: `'active'` and `'for_sale'`.

### Where status IS correctly checked

| Location | File:Line | Check |
|---|---|---|
| RacingScreen — entry sheet | `RacingScreen.tsx:325` | `pets.filter(p => p.status === 'active')` — correct, prevents listing for-sale pets in races |
| MarketplaceScreen — listing tab | `MarketplaceScreen.tsx:186` | `pets.filter(p => p.status === 'active')` — correct, prevents re-listing |

### Where status is NOT checked (gaps)

| Location | File:Line | Expected | Actual |
|---|---|---|---|
| MyAnimalsScreen grid | `MyAnimalsScreen.tsx:52–66` | Should visually distinguish for_sale pets or exclude from direct action | Renders all pets identically regardless of status. A for_sale pet can be tapped and its detail sheet opened, showing the Release button with no indication it is listed. |
| CarePanel / useCareLog | `useCareLog.ts:38–71` | Care actions should be blocked or warned when pet is for_sale | `performCare()` has no status check. A listed pet can be cared for normally. |
| PetDetailSheet | `PetDetailSheet.tsx:67–77` | Release button should be blocked if pet is for_sale (pet is already "leaving") | No status guard. A for_sale pet can be released directly, bypassing the listing flow and deleting the pet without cancelling the active listing. This leaves a dangling `playerListings` record with a dead `petId`. |
| BuyOfferSheet (NPC wants to buy) | `MarketplaceScreen.tsx:64–66` | Matching pets should exclude for_sale pets (player shouldn't sell a pet that's already listed) | Filters by `animalType/breed` match only, no status filter. A for_sale pet appears in the "select which to sell" list. |
| useSavedNames.getHorses() | `useSavedNames.ts:54–56` | Racing should only consider active horses | Returns all horses regardless of status. `useRacing` calls this to get available horses (though the entry sheet separately filters — the hook itself is not status-aware). |
| useRacing.enterRace() — pet lock | `useRacing.ts:111–145` | After entering a race, pet should be locked (e.g. status = 'racing') to prevent entering other races | No lock is applied. Only `playerEntryPetId` on the race record prevents double-entry on the same race. The same pet can be entered in multiple different open races. |

---

## Wallet Safety

### Positive findings

- `spend()` reads a fresh wallet from Dexie (`ensureWallet()`) before checking balance, preventing stale React state from causing incorrect affordability decisions (`useWallet.ts:54–55`).
- `spend()` and `earn()` both use `db.transaction('rw', ...)` wrapping wallet update and transaction insert atomically (`useWallet.ts:30–45, 60–76`).
- `canAfford()` is a pure read from the live-queried `coins` value — suitable for UI gating.
- `undoLastTransaction()` has a 5-second age guard (`useWallet.ts:135–137`).

### Concerns

| ID | Issue | File:Line | Severity |
|---|---|---|---|
| W-1 | **earn() called outside transaction in acceptBuyOffer()** | `useMarketplace.ts:123–129` | HIGH |
| W-2 | **earn() called outside transaction in acceptNpcBuyerOffer()** | `useMarketplace.ts:245–254` | HIGH |
| W-3 | **undoLastTransaction() deletes the transaction record** | `useWallet.ts:154` | MEDIUM |
| W-4 | **spend() re-reads wallet but does not lock** | `useWallet.ts:54–76` | LOW |

**W-1 detail:** `acceptBuyOffer()` opens a transaction covering `db.marketOffers, db.savedNames, db.playerWallet, db.transactions`, but the `earn()` call on line 127 is `await`ed **after** the `db.transaction()` block closes. The pet is deleted and offer marked accepted before coins are awarded. If anything between the transaction close and the `earn()` call throws (device sleep, tab close, Dexie error), the player loses their pet and gets no coins.

**W-2 detail:** Identical pattern in `acceptNpcBuyerOffer()` — transaction on line 245 closes, then `earn()` is called on line 253. Pet is deleted first, coins arrive second.

**W-3 detail:** `undoLastTransaction()` deletes the transaction record (`db.transactions.delete(transactionId)`) rather than inserting a compensating record. This violates the entity model rule "Records are append-only. Never update or delete." It also means the ledger balance history is broken (prior `balanceAfter` values are now wrong relative to actual current balance for any records created between the original transaction and the undo).

**W-4 detail:** `spend()` reads wallet balance, checks affordability, then writes — all without a pessimistic lock. In a single-user IndexedDB context this is very unlikely to cause a double-spend, but two rapid simultaneous calls (e.g. double-tap) could both pass the `w.coins < amount` check before either writes. The `db.transaction('rw')` wrapper provides some protection but only if both calls share the same Dexie transaction scope. They do not.

---

## Error Handling Coverage

| Feature | Operation | Error Handled in UI? | Notes |
|---|---|---|---|
| Racing | enterRace() | YES | `RacingScreen.tsx:210–212` shows toast on failure |
| Racing | resolveRace() | NO | `RacingScreen.tsx:222–226` — null result silently drops; no toast if resolveRace returns null |
| Marketplace | acceptBuyOffer() | YES | `MarketplaceScreen.tsx:402–405` shows error toast |
| Marketplace | acceptSellOffer() | YES | `MarketplaceScreen.tsx:423–427` shows error toast |
| Marketplace | acceptNpcBuyerOffer() | YES | `MarketplaceScreen.tsx:379–382` shows error toast |
| Marketplace | createListing() | NO | `MarketplaceScreen.tsx:370–373` — no error handling, just fires and toasts success unconditionally |
| Marketplace | cancelListing() | NO | `MarketplaceScreen.tsx:374–377` — fires unconditionally |
| Item Shop | buyItem() | YES | `ShopScreen.tsx:176–180` checks result.success |
| Item Shop | equipItem() | NO | `useItemShop.ts:49–66` is async, silently fails |
| Item Shop | unequipItem() | NO | `useItemShop.ts:69–75` is async, silently fails |
| Cards | openPack() | YES | `CardsScreen.tsx:200–203` shows error toast |
| Care | performCare() | YES | `CarePanel.tsx:39` shows error toast in catch |
| Generate | adoptPet() | PARTIAL | `GenerateScreen.tsx:364–368` catches but shows no toast (comment says "Toast error would go here") |
| Arcade | earn() / addXp() at game end | NO | `ArcadeShell.tsx:77` silently swallows errors |
| Wallet | claimDailyBonus() | NO | `HomeScreen.tsx:38–48` — async failure would leave `bonusChecked` as false, blocking UI indefinitely due to `const loading = !bonusChecked` |
| Wallet | undoLastTransaction() | NO | Return value not checked by any caller |

---

## Persistence Audit

### What should be in Dexie — and whether it is

| Data | Should Persist | Persists | Notes |
|---|---|---|---|
| Pet collection (savedNames) | YES | YES | Correctly written on adoptPet(), updated on rename/update |
| Care log | YES | YES | careLog table, written on performCare() |
| Care streak on SavedName | YES | YES | Updated on full care day |
| Daily bonus date + streak | YES | YES | claimDailyBonus() writes atomically |
| Wallet balance + totals | YES | YES | earn() and spend() write atomically |
| Transaction ledger | YES | YES | Appended on every earn/spend |
| Skill XP + tier | YES | YES | addXp() writes to skillProgress |
| Puzzle answer history | YES | YES | recordAnswer() writes to puzzleHistory |
| Badges | YES | PARTIAL | awardBadge() writes correctly, but is never called |
| Owned items | YES | YES | buyItem() writes on purchase |
| Market offers | YES | YES | Written by refreshOffers() |
| Player listings | YES | YES | Written by createListing() |
| NPC buyer offers | YES | YES | Written by createListing() (immediate 50% offer) |
| Auction items | YES | NO | Table exists in schema, never written |
| Auction bids | YES | NO | Table exists in schema, never written |
| Race records | YES | YES | Written by generateDailyRaces() and updated by enterRace()/resolveRace() |
| Card collection | YES | YES | Written by openPack() |
| Pack history | YES | YES | Written by openPack() |
| Generation history | YES | YES | addToHistory() in GenerateScreen |
| Feed entries | YES | NO | No feed table in schema, no feed system at all |
| Mood per pet | YES | NO | No mood field on SavedName |
| Care speed flag for racing | YES | NO | No field on SavedName for race speed bonus |
| TraderPuzzle XP rewards | YES | NO | useProgress.addXp() not called from TraderPuzzle |
| gamesPlayed counter | YES | NO | ArcadeShell never increments gamesPlayed |

---

## Schema vs. Usage Gaps

### Tables defined but never written to

| Table | Status | Detail |
|---|---|---|
| `auctionItems` | UNUSED | Schema defined (db.ts:227), type exported, no hook writes to it |
| `auctionBids` | UNUSED | Schema defined (db.ts:237), type exported, no hook writes to it |

### Fields defined but never written

| Entity | Field | Status | Detail |
|---|---|---|---|
| `SavedName` | `barnName` | ALWAYS NULL | Set to null on all creation paths, never updated |
| `SavedName` | `showName` | ALWAYS NULL | Same |
| `SavedName` | `racingName` | ALWAYS NULL | Same |
| `SavedName` | `kennelName` | ALWAYS NULL | Same |
| `SavedName` | `pedigreeName` | ALWAYS NULL | Same |
| `SavedName` | `speciesName` | ALWAYS NULL | Same |
| `SavedName` | `siblings` | ALWAYS EMPTY | Set to `[]` on all create paths, never updated |
| `SkillProgress` | `gamesPlayed` | NEVER INCREMENTED | ArcadeShell does not update this field |
| `SkillProgress` | `currentStreak` | ONLY RESETS | recordAnswer() increments on correct, resets on wrong — but the streak is never surfaced in any UI |
| `Race` | `scheduledAt` | SET BUT UNUSED | generateDailyRaces() sets it to `now` for all races; transitions `upcoming→open` are never checked |
| `Race` | `startsAt` / `finishesAt` | SET BUT UNUSED | Race timing is driven by manual player tap (resolveRace), not by these timestamps |
| `OwnedItem` | `equippedToPetId` indexed | CORRECT USAGE | Used by equipItem/unequipItem — index is appropriate |

### Fields read but inconsistently written

| Issue | Detail |
|---|---|
| `SavedName.equippedSaddleId` vs `OwnedItem.equippedToPetId` | Two-way sync is attempted in `useItemShop.equipItem()` (lines 64–66) and `unequipItem()` (lines 70–74). However, `unequipItem()` reads the item **after** updating it (line 71: `const item = await db.ownedItems.get(itemId)` after `db.ownedItems.update(itemId, { equippedToPetId: null })`), so `item.category` could theoretically be stale though in practice IndexedDB is synchronous within a transaction. More importantly, `releasePet()` / `savedNames.delete()` does not clear `equippedToPetId` on the OwnedItem — the saddle remains "equipped" to a deleted pet. |
| `PlayerListing.expiresAt` | Set to 7 days in createListing() (line 197) but ENTITY_MODEL.md specifies 24 hours. No expiry enforcement loop exists anywhere. |
| `NpcBuyerOffer.expiresAt` | Set to 48 hours in createListing() (line 220) but ENTITY_MODEL.md specifies 30 minutes. No expiry enforcement loop exists. |
| `collectedCards.duplicateCount` | Initial value on creation is `0` (line 131), meaning first copy = 0 duplicates. Second copy = 1 duplicate. The display in CardsScreen shows `×{card.duplicateCount + 1}` which is correct (first copy shows nothing, second shows ×2). Internally consistent but the field name is slightly misleading (it counts duplicates, first instance is 0 not 1). |

### Missing index that will cause table scans

| Table | Missing Index | Impact |
|---|---|---|
| `npcBuyerOffers` | No index on `expiresAt` | If expiry enforcement is ever added, querying expired offers requires a full table scan |
| `transactions` | No index on `relatedEntityId` | Looking up transactions by race/item/listing requires a filter scan |
| `careLog` | No index on `petId` alone | Queries for all care logs for a pet (e.g. history view) use the compound index which requires specifying date range |

---

## Priority Ranking

| ID | Finding | Priority | Impact |
|---|---|---|---|
| R-01 | `acceptBuyOffer()` and `acceptNpcBuyerOffer()` call `earn()` outside the DB transaction — split-brain risk where pet is deleted but coins not awarded | HIGH | Data loss |
| R-02 | Race prize distribution wrong: 2nd = 30% (should be 25%), 4th = 5% (should be 10%) | HIGH | Incorrect payouts every race |
| R-03 | Item purchase undo not implemented — `undoPurchase` method missing, `buyItem()` returns no transaction ID, no undo toast | HIGH | Feature entirely absent |
| R-04 | `checkBadgeEligibility()` is a permanent stub — no badges are ever awarded at runtime | HIGH | Entire badge system non-functional |
| R-05 | Care streak milestone bonuses (3/7/14/30 day) never fire | HIGH | Promised rewards never paid |
| R-06 | Pet released from `PetDetailSheet` while `for_sale` creates a dangling PlayerListing with a dead petId | HIGH | DB integrity |
| R-07 | Adoption from marketplace creates pet with default name, no naming modal | MEDIUM | Feature gap vs. spec |
| R-08 | 50% TraderPuzzle not triggered from marketplace buy or listing sold paths | MEDIUM | Feature gap vs. spec |
| R-09 | XP not awarded for TraderPuzzle correct answers | MEDIUM | Persistence gap |
| R-10 | Auction system: tables exist, feature not built | MEDIUM | Feature gap — depends on roadmap priority |
| R-11 | Rescue system: source type defined, flow not built | MEDIUM | Feature gap |
| R-12 | `gamesPlayed` field never incremented in ArcadeShell | MEDIUM | Persistence gap; affects any UI reading this field |
| R-13 | ArcadeShell swallows earn/addXp errors silently | MEDIUM | Silent failure |
| R-14 | HomeScreen daily bonus failure leaves loading state stuck forever | MEDIUM | UX lockout |
| R-15 | PlayerListing expires at 7 days, spec says 24 hours | MEDIUM | Business logic divergence |
| R-16 | NpcBuyerOffer expires at 48 hours, spec says 30 minutes | MEDIUM | Business logic divergence |
| R-17 | Cross-race pet locking absent — same pet can enter multiple races | MEDIUM | Logic gap |
| R-18 | Effort reward (1 coin) for wrong arcade answers not implemented | MEDIUM | Spec gap |
| R-19 | Race status jumps `open → running` on player entry, bypassing the time-based transition | MEDIUM | State machine deviation |
| R-20 | Other active NPC buyer offers not auto-declined when one is accepted | MEDIUM | Logic gap; players see stale offers |
| R-21 | Care actions not blocked when pet status is `for_sale` | LOW | Minor UX inconsistency |
| R-22 | For-sale pets shown in BuyOfferSheet matching list | LOW | Minor UX inconsistency |
| R-23 | `undoLastTransaction()` deletes the record, violating append-only ledger rule | LOW | Ledger correctness |
| R-24 | OwnedItem `equippedToPetId` not cleared on `releasePet()` | LOW | Orphaned data |
| R-25 | `auctionItems` and `auctionBids` tables unused in code | LOW | Dead schema |
| R-26 | Multiple SavedName alternate-name fields always null | LOW | Schema waste (harmless) |
| R-27 | Daily marketplace refresh and race generation not triggered from HomeScreen | LOW | Spec deviation — alternative mounting works but creates lazy load |
| R-28 | No daily pack gate — packs can be opened unlimited times per day | LOW | Spec divergence; business model question for owner |
| R-29 | Care circle / mood indicator absent from Home screen | LOW | UI feature gap |
| R-30 | `XP_PER_ACTION` declared in useCareLog.ts but never used | LOW | Dead code |

---

*This document feeds the fix pass. Address HIGH findings before any Phase D test sign-off.*
