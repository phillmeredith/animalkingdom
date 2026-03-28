# Integration Map

> The master event-consequence register.
> Every action that changes state, with every downstream effect.
> If it is not in here, it does not get built.
> Agents copy only the relevant events into each feature brief.

---

## Wallet Events

### 1. Daily Login Bonus Claimed

```
Event: Daily Login Bonus Claimed
Source: useWallet.claimDailyBonus()
Trigger: App opens / Home screen mounts, and lastDailyBonusDate !== today

Consequences (in execution order):
1. playerWallet.coins += 25 (useWallet)
2. playerWallet.lastDailyBonusDate = today (useWallet)
3. playerWallet.dailyLoginStreak++ (useWallet)
4. Transaction record created: { type: "earn", amount: 25, category: "daily" } (useWallet)
5. Toast (success): "Daily bonus! +25 coins"
6. Generate daily marketplace offers (useMarketplace.refreshMarketplace())
7. Generate daily races (useRacing.generateDailyRaces())
8. Generate daily quest for Home screen

If user is on a different screen when this fires:
- Fires on Home mount, so user is always on Home
- If called from background resume: toast appears on whatever screen

Failure scenarios:
- If already claimed today: no-op, returns { awarded: false }
```

---

## Adoption Events

### 2. Pet Adopted (from Generate)

```
Event: Pet Adopted from Generate
Source: useSavedNames.adoptPet(data) called by GenerateScreen
Trigger: Player taps "Adopt" on ResultsScreen after generation

Consequences (in execution order):
1. savedNames record created with source "generate" (useSavedNames)
2. Adoption overlay: animated icon + "You adopted [Name]!" (UI)
3. "Meet your new friend!" button → navigate to Home (UI)
4. On 50% chance:
   a. TraderPuzzle overlay appears (UI)
   b. Quiz question (numbers, spelling, animals, or geography)
   c. Correct: useWallet.earn(10-25, "Trader puzzle", "arcade"), useProgress.addXp()
   d. Wrong: useWallet.earn(1, "Effort reward", "arcade")
5. Feed entry created (useFeed — aggregated from savedNames)

If user is on a different screen when this fires:
- N/A — user is on the Generate screen

Failure scenarios:
- None — adoption from generate is free
```

### 3. Pet Adopted (from Marketplace)

```
Event: Pet Adopted from Marketplace
Source: useMarketplace.acceptOffer(offerId) where type === "sell"
Trigger: Player taps "Buy" on an NPC sell offer

Consequences (in execution order):
1. useWallet.spend(price, description, "marketplace") — returns false if can't afford
2. If spend fails: Toast (warning): "Not enough coins! You need X more" → STOP
3. marketOffers.status → "accepted" (useMarketplace)
4. Naming modal slides up (UI)
5. Player enters name → useSavedNames.adoptPet(data) with source "marketplace"
6. Toast (success): "Welcome [Name]!"
7. Transaction record already created by spend()
8. On 50% chance:
   a. TraderPuzzle overlay appears
   b. Same quiz flow as adoption event #2

If user is on a different screen when this fires:
- N/A — user is on the Shop screen

Failure scenarios:
- Insufficient funds: toast warning, action blocked, no coins deducted
```

### 4. Pet Adopted (from Auction Win)

```
Event: Pet Adopted from Auction Win
Source: Auction timer resolution (system)
Trigger: auctionItems.endsAt reached AND currentBidder === "player"

Consequences (in execution order):
1. auctionItems.status → "won" (useMarketplace)
2. Auction card shows green "WON" badge (UI)
3. Toast (success): "You won the auction! [Name] is yours!"
4. Naming modal slides up (UI)
5. Player enters name → useSavedNames.adoptPet(data) with source "auction"
6. Auction moves to "Past Auctions" (useMarketplace)
7. No additional wallet deduction — coins were held at bid time

If user is on a different screen when this fires:
- Toast appears on current screen
- Badge dot on Shop tab
- Naming modal appears when user returns to Shop

Failure scenarios:
- None — resolution is deterministic
```

### 5. Pet Adopted (from Rescue)

```
Event: Pet Rescued
Source: useSavedNames.adoptPet(data) called by rescue flow
Trigger: Player taps "Rescue" on EventDetailScreen → completes generate flow

Consequences (in execution order):
1. savedNames record created with source "rescue" (useSavedNames)
2. Rescue celebration overlay: shield icon + "You rescued [Name]!" (UI)
3. "Meet your new friend!" button → navigate to Home (UI)
4. Feed entry created
5. No cost (rescues are free)
6. Badge check: rescue-related badges (useProgress.checkBadgeEligibility())

Failure scenarios:
- None — rescues are free
```

---

## Marketplace Events

### 6. Player Listing Created

```
Event: Player Listing Created
Source: useMarketplace.listForSale(petId, askingPrice)
Trigger: Player taps "List for Sale" in pricing modal

Consequences (in execution order):
1. playerListings record created with status "active", expiresAt = now + 24h (useMarketplace)
2. useSavedNames.setForSale(petId) — status → "for_sale"
3. Celebration micro-animation: card "flies" to marketplace (UI)
4. Toast (success): "Listed! Your [breed] is now on the market"
5. Views counter starts incrementing (seeded random, every 30-90 seconds, +1 to +3)
6. Phase 1 (0-5 min): NPC watchers appear in activity feed
7. Phase 2 (5-15 min): NPC enquiry messages arrive
8. Phase 3 (15-45 min): NPC buyer offers generated based on price-to-market ratio
   - Price ≤ market: 3 offers
   - Price 1-1.5×: 2 offers
   - Price 1.5-2×: 1 offer
   - Price > 2×: 0 offers

Failure scenarios:
- Pet already listed: toast error
```

### 7. Player Listing Sold

```
Event: Player Listing Sold
Source: useMarketplace.acceptBuyerOffer(offerId)
Trigger: Player taps "Accept" on an NPC buyer offer

Consequences (in execution order):
1. npcBuyerOffers.status → "accepted" (useMarketplace)
2. playerListings.status → "sold", soldTo, soldPrice, soldAt set (useMarketplace)
3. useWallet.earn(soldPrice, description, "marketplace")
4. Coin burst animation (UI)
5. useSavedNames.releasePet(petId)
6. Toast (success): "[Name] has found a new home with [buyer]! +[amount] coins"
7. All other active offers auto-declined with polite messages (useMarketplace)
8. Listing archived to Past Sales
9. Transaction record created by earn()
10. On 50% chance: TraderPuzzle overlay

If user is on a different screen when this fires:
- N/A — user is on the listing detail screen

Failure scenarios:
- Offer already expired: toast error, refresh listing
```

---

## Auction Events

### 8. Auction Bid Placed

```
Event: Auction Bid Placed
Source: useMarketplace (auction methods)
Trigger: Player taps "Place Bid" on auction detail

Consequences (in execution order):
1. Calculate bid amount: currentBid + 50
2. useWallet.spend(bidAmount, description, "marketplace")
3. If spend fails: Toast (warning): "Not enough coins! You need X more" → STOP
4. auctionBids record created (useMarketplace)
5. auctionItems.currentBid = bidAmount, currentBidder = "player" (useMarketplace)
6. Toast (success): "Bid placed! [amount] coins"
7. Anti-snipe check: if bid in final 60 seconds, extend endsAt by 2 minutes
8. Schedule NPC counter-bid: 60% chance, 30-90 seconds later
9. If NPC counter-bids:
   a. NPC bid placed (auctionBids record)
   b. auctionItems.currentBidder = NPC name
   c. Player's bid refunded: useWallet.earn(bidAmount, "Auction refund", "refund")
   d. Toast (warning): "You've been outbid by [NPC name]!"

If user is on a different screen when NPC counter-bids:
- Toast appears on current screen
- Badge dot on Shop tab

Failure scenarios:
- Insufficient funds: toast warning, bid not placed
- Auction already ended: toast error
```

### 9. Auction Lost

```
Event: Auction Lost
Source: Auction timer resolution (system)
Trigger: auctionItems.endsAt reached AND currentBidder !== "player" AND player has bid

Consequences (in execution order):
1. auctionItems.status → "lost" (useMarketplace)
2. Player's held bid refunded: useWallet.earn(lastBidAmount, "Auction refund", "refund")
3. Toast (info): "Auction ended. [amount] coins refunded"
4. Auction card shows red "LOST" badge
5. Transaction record: refund
6. Auction moves to "Past Auctions"

If user is on a different screen:
- Toast on current screen
- Badge dot on Shop tab
```

---

## Racing Events

### 10. Race Entered

```
Event: Race Entered
Source: useRacing.enterRace(raceId, petId)
Trigger: Player selects horse and confirms entry

Consequences (in execution order):
1. useWallet.spend(entryFee, description, "racing")
2. If spend fails: Toast (warning): "Not enough coins!" → STOP
3. races.participants updated with player's horse (useRacing)
4. races.playerEntryPetId = petId
5. Horse appears in entrants list alongside NPCs (UI)
6. Toast (success): "Entered! Good luck!"
7. Transaction record created by spend()

Failure scenarios:
- Insufficient funds: toast warning, entry blocked
- Horse already entered in another race: toast error
- Race already started (status !== "open"): toast error
```

### 11. Race Finished

```
Event: Race Finished
Source: Race timer resolution (system)
Trigger: races.finishesAt reached while status === "running"

Consequences (in execution order):
1. Calculate results: baseSpeed + saddleBonus + randomFactor per participant
2. Rank participants by totalScore, assign positions
3. Calculate prizes: 1st 50%, 2nd 25%, 3rd 15%, 4th+ 10% of prizePool
4. races.status → "finished", results populated (useRacing)
5. If player placed top 4:
   a. useWallet.earn(prize, description, "racing")
   b. Toast (success): "Your horse finished [X]th! Won [Y] coins!"
6. If player placed 5th+:
   a. Toast (info): "Your horse finished [X]th. Better luck next time!"
7. Transaction record created (if prize earned)
8. Results card shows full standings (UI)

If user is on a different screen:
- Toast on current screen
- Badge dot on Play tab
- Full results available when user returns to Racing

Failure scenarios:
- None — resolution is deterministic
```

---

## Item Events

### 12. Item Purchased

```
Event: Item Purchased
Source: useItemShop.buyItem(...)
Trigger: Player taps inline "Buy" button on item card

Consequences (in execution order):
1. useWallet.spend(price, description, "items")
2. If spend fails: Toast (warning): "Not enough coins!" → STOP
3. ownedItems record created (useItemShop)
4. Transaction record created by spend()
5. Toast (undo): "Bought [Item]! Tap to undo" — 5s auto-dismiss with undo button
6. If undo tapped within 5s:
   a. useItemShop.undoPurchase(transactionId)
   b. useWallet.undoLastTransaction(transactionId) — refunds coins
   c. ownedItems record deleted
   d. Toast (info): "Purchase undone"

Failure scenarios:
- Insufficient funds: toast warning, purchase blocked
- Undo after 5s: no-op, undo button disappears
```

---

## Care Events

### 13. Care Action Performed

```
Event: Care Action Performed
Source: useCareLog.logCare(petId, action)
Trigger: Player completes drag-and-drop care interaction

Consequences (in execution order):
1. careLog record created (useCareLog)
2. Success animation on CareScreen (UI)
3. Toast (success): "Fed [Name]!" / "Cleaned [Name]!" / "Played with [Name]!"
4. Care circle fills in on Home screen (UI — reactive via useLiveQuery)
5. Modal auto-closes after animation
6. Check if all 3 actions done today:
   a. If yes: update savedNames.careStreak++, savedNames.lastFullCareDate = today
   b. Update mood: all 3 = green, 1-2 = amber, 0 = hidden
7. Check streak milestones:
   a. 3 days: useWallet.earn(10, "Care streak bonus", "care")
   b. 7 days: useWallet.earn(25, "Care streak bonus", "care")
   c. 14 days: useWallet.earn(50, "Care streak bonus", "care")
   d. 30 days: useWallet.earn(100, "Care streak bonus", "care")
8. Well-cared-for horses: +5 speed bonus flag for next race

Failure scenarios:
- Duplicate action (already done today): compound index prevents, toast: "Already done today!"
```

---

## Card Events

### 14. Card Pack Opened

```
Event: Card Pack Opened
Source: useCardPacks.openPack()
Trigger: Player taps "Open Pack" when daily pack available

Consequences (in execution order):
1. Generate 5 cards using rarity weights (Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%)
2. For each card:
   a. If new: collectedCards record created
   b. If duplicate: collectedCards.duplicateCount++
3. packHistory record created with all 5 cards
4. Pack opening animation: 5 cards dealt face-down, flip one by one with 600ms stagger (UI)
5. "NEW" badge on cards player doesn't already own (UI)
6. Daily pack timer resets to next day at 5pm

If user is on a different screen when this fires:
- N/A — user is on the Cards screen

Failure scenarios:
- Daily pack not available: button disabled, countdown shown
```

---

## Arcade Events

### 15. Arcade Game Completed

```
Event: Arcade Game Completed
Source: GameShell component → useWallet + useProgress
Trigger: Player completes all rounds in any arcade game

Consequences (in execution order):
1. For each correct answer during game:
   a. useWallet.earn(10-25 per question based on tier, description, "arcade")
   b. useProgress.addXp(area, xpAmount)
   c. useProgress.recordAnswer(area, questionId, tier, true)
2. For each wrong answer during game:
   a. useWallet.earn(1, "Effort reward", "arcade")
   b. useProgress.recordAnswer(area, questionId, tier, false)
3. GameOver overlay: animated score, coins earned, encouraging message (UI)
4. Check tier change: if addXp() returned tierChanged, show tier-up celebration
5. Check badge eligibility: useProgress.checkBadgeEligibility()
6. If new badge earned:
   a. Badge earned celebration overlay
   b. Toast (success): "New badge: [badge name]!"
7. Update gamesPlayed count
8. Every 5 games: free adoption token badge awarded

Failure scenarios:
- None — all answers earn coins (effort-based rewards)
```

---

## Badge Events

### 16. Badge Earned

```
Event: Badge Earned
Source: useProgress.awardBadge(...)
Trigger: checkBadgeEligibility() finds an earned but unawarded badge

Consequences (in execution order):
1. badges record created (useProgress)
2. Celebration toast or overlay depending on badge significance
3. Badge appears in horizontal scroll on Home screen
4. Feed entry created

If user is on a different screen when this fires:
- Toast on current screen
- Badge visible on Home when user returns

Failure scenarios:
- Badge already earned: no-op (unique constraint on badgeId)
```

---

## Summary

| # | Event | Source Hook | Key Side Effects |
|---|-------|-----------|-----------------|
| 1 | Daily Login | useWallet | +25 coins, streak, marketplace refresh, race generation |
| 2 | Adopt (Generate) | useSavedNames | Pet created, celebration, 50% TraderPuzzle |
| 3 | Adopt (Marketplace) | useMarketplace | Wallet spend, naming, pet created, 50% TraderPuzzle |
| 4 | Adopt (Auction Win) | useMarketplace | Naming, pet created, past auctions |
| 5 | Adopt (Rescue) | useSavedNames | Pet created (free), rescue celebration |
| 6 | Listing Created | useMarketplace | Pet flagged, views timer, NPC phases start |
| 7 | Listing Sold | useMarketplace | Wallet earn, pet removed, offers declined, 50% TraderPuzzle |
| 8 | Auction Bid | useMarketplace | Wallet spend (hold), NPC counter-bid timer |
| 9 | Auction Lost | useMarketplace | Refund, lost badge |
| 10 | Race Entered | useRacing | Wallet spend, participant list |
| 11 | Race Finished | useRacing | Results, prizes, XP |
| 12 | Item Purchased | useItemShop | Wallet spend, undo toast |
| 13 | Care Action | useCareLog | Care log, mood, streak, speed bonus |
| 14 | Pack Opened | useCardPacks | 5 cards, collection update, animation |
| 15 | Game Completed | useProgress | Coins, XP, tier check, badge check |
| 16 | Badge Earned | useProgress | Badge record, celebration, feed entry |
