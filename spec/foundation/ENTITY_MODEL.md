# Entity Model

> Defines every data entity in Animal Kingdom.
> Every entity with more than one state has a state machine.
> This document is the data contract — hooks and components build against it.
> Database: Dexie.js v4 (IndexedDB), schema version 9.

---

## Simple CRUD Entities

---

### savedNames

```
Entity: savedNames
Purpose: Adopted/rescued pets in the player's collection.

Fields:
  id: number (auto-increment)
  name: string — display name chosen by player
  animalType: string — e.g. "horse", "dog", "cat", "dinosaur"
  breed: string — specific breed within type
  category: string — "At Home" | "Stables" | "Farm" | "Lost World" | "Wild" | "Sea"
  gender: string — "male" | "female"
  age: string — "Newborn" | "Baby" | "Young" | "Adult" | "Old Timer"
  personality: string — "Brave" | "Gentle" | "Playful" | "Curious" | etc.
  colour: string — breed-specific colour
  rarity: string — "common" | "uncommon" | "rare" | "epic" | "legendary"
  imageUrl: string — path to breed image
  barnName: string | null — alternate name (horses)
  showName: string | null — alternate name (horses)
  racingName: string | null — alternate name (horses)
  kennelName: string | null — alternate name (dogs)
  pedigreeName: string | null — alternate name (dogs)
  speciesName: string | null — scientific name (all)
  discoveryNarrative: string — generated story text
  siblings: string[] — sibling name suggestions
  source: "generate" | "marketplace" | "auction" | "rescue"
  status: "active" | "for_sale"
  equippedSaddleId: number | null — FK to ownedItems
  careStreak: number — consecutive days with all 3 care actions, default 0
  lastFullCareDate: string | null — YYYY-MM-DD of last day all 3 actions done
  createdAt: Date
  updatedAt: Date

Dexie index: '++id, category, animalType, rarity, status'

Relationships:
  - has many careLog (one-to-many via petId)
  - has one ownedItems via equippedSaddleId (nullable)

Operations: create, read, update, delete (with confirmation)
```

---

### history

```
Entity: history
Purpose: Unsaved generated name results. Rolling buffer of 100 max.

Fields:
  id: number (auto-increment)
  animalType: string
  breed: string
  category: string
  gender: string
  age: string
  personality: string
  colour: string
  suggestedNames: string[] — the 3+ generated names
  discoveryNarrative: string
  createdAt: Date

Dexie index: '++id'

Internal rule: On insert, if count > 100, delete oldest entry.

Operations: create, read, delete (bulk prune)
```

---

### careLog

```
Entity: careLog
Purpose: Tracks daily care actions per pet (feed, clean, play).

Fields:
  id: number (auto-increment)
  petId: number — FK to savedNames
  date: string — YYYY-MM-DD
  action: "feed" | "clean" | "play"
  createdAt: Date

Dexie index: '++id, [petId+date+action]'

Relationships:
  - belongs to savedNames (many-to-one via petId)

Internal rule: Compound index [petId+date+action] prevents duplicate actions per pet per day.

Operations: create, read (query by petId and date)
```

---

### collectedCards

```
Entity: collectedCards
Purpose: Trading card collection. Unique by animal type + breed.

Fields:
  id: number (auto-increment)
  animalType: string — "horse" | "dinosaur" (card pools)
  breed: string — specific breed
  name: string — display name on card
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  imageUrl: string
  duplicateCount: number — how many times this card has been pulled, default 1
  firstCollectedAt: Date
  updatedAt: Date

Dexie index: '++id, &[animalType+breed], rarity'

Internal rule: On duplicate pull, increment duplicateCount rather than creating new record.

Operations: create, read, update (duplicate count), delete (sell duplicate)
```

---

### packHistory

```
Entity: packHistory
Purpose: Log of all card pack openings.

Fields:
  id: number (auto-increment)
  date: string — YYYY-MM-DD
  cardsReceived: Array<{ animalType: string, breed: string, rarity: string, isNew: boolean }>
  createdAt: Date

Dexie index: '++id, date'

Operations: create, read
```

---

### playerWallet

```
Entity: playerWallet
Purpose: Single-document coin balance and daily login tracking.

Fields:
  id: number (auto-increment, always 1)
  coins: number — current balance, default 500
  lastDailyBonusDate: string | null — YYYY-MM-DD
  dailyLoginStreak: number — consecutive days logged in, default 0
  totalEarned: number — lifetime coins earned
  totalSpent: number — lifetime coins spent
  createdAt: Date
  updatedAt: Date

Dexie index: '++id'

Internal rule: Only one record ever exists (id=1). Created on first app launch.

Operations: read, update
```

---

### transactions

```
Entity: transactions
Purpose: Immutable earn/spend ledger for all coin movements.

Fields:
  id: number (auto-increment)
  type: "earn" | "spend"
  amount: number — always positive
  source: string — human-readable description, e.g. "Coin Rush: 3 correct answers"
  category: "arcade" | "racing" | "marketplace" | "items" | "daily" | "care" | "cards" | "refund"
  relatedEntityId: number | null — FK to the related entity (race, auction, item, etc.)
  balanceAfter: number — wallet balance after this transaction
  createdAt: Date

Dexie index: '++id, type, category, createdAt'

Internal rule: Records are append-only. Never update or delete.

Operations: create, read (with pagination and filters)
```

---

### skillProgress

```
Entity: skillProgress
Purpose: Per-skill XP, tier, and streak tracking for arcade games.

Fields:
  id: number (auto-increment)
  area: string (unique) — "maths" | "spelling" | "science" | "geography"
  xp: number — cumulative score 0-100
  tier: number — 1-4, thresholds at 40/65/85
  totalCorrect: number — lifetime correct answers
  totalAttempted: number — lifetime total attempts
  currentStreak: number — consecutive correct answers
  bestStreak: number — all-time best streak
  gamesPlayed: number — total games completed
  lastPlayedAt: Date | null

Dexie index: '++id, &area'

Operations: read, update (XP, tier, streaks, counts)
```

---

### puzzleHistory

```
Entity: puzzleHistory
Purpose: Individual question response log for all quiz/puzzle answers.

Fields:
  id: number (auto-increment)
  area: string — "maths" | "spelling" | "science" | "geography"
  questionId: string — unique identifier for the question template
  tier: number — difficulty tier when answered
  correct: boolean
  answeredAt: Date

Dexie index: '++id, area, questionId'

Internal rule: Used to prevent question repetition within last 20 questions per area.

Operations: create, read (recent by area)
```

---

### badges

```
Entity: badges
Purpose: Achievement badges earned by the player.

Fields:
  id: number (auto-increment)
  badgeId: string (unique) — e.g. "master-trader-1", "animal-whisperer-3"
  track: string — "Master Trader" | "Animal Whisperer" | "Sharp Eye" | "World Traveller" | "Deal Maker"
  rank: "apprentice" | "expert" | "master"
  name: string — display name
  description: string — how it was earned
  iconUrl: string | null
  earnedAt: Date

Dexie index: '++id, &badgeId, track'

Operations: create, read
```

---

### ownedItems

```
Entity: ownedItems
Purpose: Items purchased from the Supplies shop.

Fields:
  id: number (auto-increment)
  itemDefId: string — references static item definition (e.g. "saddle-golden")
  category: "saddle" | "brush" | "feed" | "toy" | "blanket"
  name: string — display name
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
  statBoost: { stat: string, value: number } — e.g. { stat: "speed", value: 5 }
  purchasePrice: number — what was paid
  remainingUses: number | null — null for non-consumables, number for feed items
  equippedToPetId: number | null — FK to savedNames (saddles only)
  purchasedAt: Date

Dexie index: '++id, itemDefId, category, equippedToPetId'

Relationships:
  - optionally equipped to savedNames (many-to-one via equippedToPetId)

Operations: create, read, update (equip, use consumable), delete (sell)
```

---

## Entities With State Machines

---

### marketOffers

```
Entity: marketOffers
Purpose: NPC buy/sell offers that appear daily in the marketplace.

Fields:
  id: number (auto-increment)
  type: "buy" | "sell"
  animalType: string
  breed: string
  rarity: string
  imageUrl: string
  price: number
  npcName: string — NPC trader name
  npcPersonality: string — flavour text
  status: "pending" | "accepted" | "declined" | "expired"
  expiresAt: Date
  createdAt: Date
  updatedAt: Date

Dexie index: '++id, type, status'

States: [pending, accepted, declined, expired]

Transitions:
  pending -> accepted
    Trigger: Player taps "Accept" on a buy offer or "Buy" on a sell offer
    Side effects:
      - Buy offer: useWallet.earn(price), useSavedNames.releasePet(petId)
      - Sell offer: useWallet.spend(price), useSavedNames.adoptPet(data)
      - Toast: success message
      - 50% chance: trigger TraderPuzzle
      - Transaction record created

  pending -> declined
    Trigger: Player taps "Decline"
    Side effects:
      - Toast: "[NPC] understood. Maybe next time!"
      - No coin changes

  pending -> expired
    Trigger: Current time passes expiresAt
    Side effects:
      - Offer disappears from active list
      - No notification (silent expiry)
```

---

### playerListings

```
Entity: playerListings
Purpose: Animals the player has listed for sale on the marketplace.

Fields:
  id: number (auto-increment)
  petId: number — FK to savedNames
  petName: string — cached for display
  breed: string
  rarity: string
  imageUrl: string
  askingPrice: number
  marketValue: number — estimated value at time of listing
  viewCount: number — simulated views counter, default 0
  status: "active" | "sold" | "expired" | "cancelled"
  soldTo: string | null — NPC buyer name
  soldPrice: number | null — final sale price
  listedAt: Date
  expiresAt: Date — 24 hours after listedAt
  soldAt: Date | null
  updatedAt: Date

Dexie index: '++id, status, petId'

Relationships:
  - belongs to savedNames (via petId)
  - has many npcBuyerOffers (one-to-many via listingId)

States: [active, sold, expired, cancelled]

Transitions:
  active -> sold
    Trigger: Player accepts an npcBuyerOffer
    Side effects:
      - useWallet.earn(soldPrice)
      - useSavedNames.releasePet(petId)
      - All other active offers auto-declined with polite messages
      - Toast: "[petName] has found a new home with [buyer]! +[amount] coins"
      - Transaction record created
      - 50% chance: trigger TraderPuzzle

  active -> expired
    Trigger: Current time passes expiresAt (24 hours)
    Side effects:
      - Toast: "Your listing for [petName] has ended"
      - Summary shown: total views, offers received, highest offer
      - Pet returns to normal status in savedNames (status -> "active")
      - Options: relist at lower price or keep

  active -> cancelled
    Trigger: Player taps "Cancel" and confirms
    Side effects:
      - All active buyer offers auto-declined with cancellation messages
      - Pet returns to normal status (savedNames.status -> "active")
      - Toast: "Listing removed"
```

---

### npcBuyerOffers

```
Entity: npcBuyerOffers
Purpose: NPC offers on the player's active listings.

Fields:
  id: number (auto-increment)
  listingId: number — FK to playerListings
  npcName: string — from NPC persona pool
  npcBackground: string — persona description
  offerPrice: number
  message: string — personalised message from NPC
  maxPrice: number — hidden, max the NPC will pay (rarity-based multiplier)
  status: "pending" | "accepted" | "declined" | "expired" | "countered"
  counterPrice: number | null — player's counter-offer amount
  counterResponse: string | null — NPC response to counter
  expiresAt: Date — 30 minutes after creation
  createdAt: Date
  updatedAt: Date

Dexie index: '++id, listingId, status'

Relationships:
  - belongs to playerListings (many-to-one via listingId)

States: [pending, accepted, declined, expired, countered]

Transitions:
  pending -> accepted
    Trigger: Player taps "Accept" on the offer
    Side effects:
      - playerListings → sold (triggers listing sold cascade)
      - useWallet.earn(offerPrice)

  pending -> declined
    Trigger: Player taps "Decline"
    Side effects:
      - NPC withdrawal message logged to listing activity feed
      - No coin changes

  pending -> countered
    Trigger: Player taps "Counter" and submits counter price
    Side effects:
      - counterPrice recorded
      - NPC responds in 5-10 minutes (simulated timer):
        - If counterPrice <= maxPrice: NPC accepts → listing sold
        - If counterPrice > maxPrice but within 15%: NPC suggests midpoint
        - If counterPrice >> maxPrice: NPC rejects, original offer stands or withdraws

  pending -> expired
    Trigger: 30 minutes pass without player action
    Side effects:
      - Toast: "[NPC]'s offer has expired"
      - Activity feed: "[NPC] has withdrawn — they found another animal"
      - Listing viewCount may decrease slightly

  countered -> accepted
    Trigger: NPC accepts the counter-offer
    Side effects:
      - Same as pending -> accepted but at counterPrice

  countered -> declined
    Trigger: NPC rejects the counter and player doesn't accept original
    Side effects:
      - NPC sends polite rejection message
      - Offer remains with original price or NPC withdraws
```

---

### auctionItems

```
Entity: auctionItems
Purpose: System-generated auctions in the marketplace.

Fields:
  id: number (auto-increment)
  animalType: string
  breed: string
  rarity: string
  imageUrl: string
  name: string — NPC-generated name for the animal
  startingBid: number — minimum bid by rarity (Common 40, Uncommon 75, Rare 150, Epic 300, Legendary 500)
  currentBid: number — highest current bid
  currentBidder: "player" | string — "player" or NPC name
  totalBids: number — count of all bids
  status: "active" | "won" | "lost" | "expired"
  startsAt: Date — when auction becomes visible
  endsAt: Date — auction end time (0.5-12 hours after start)
  createdAt: Date
  updatedAt: Date

Dexie index: '++id, status, endsAt'

Relationships:
  - has many auctionBids (one-to-many via auctionId)

States: [active, won, lost, expired]

Transitions:
  active -> won
    Trigger: endsAt reached AND currentBidder === "player"
    Side effects:
      - Auction card shows green "WON" badge
      - Toast: "You won the auction! [name] is yours!"
      - Naming modal slides up → player names the animal
      - useSavedNames.adoptPet(data) with source "auction"
      - No additional wallet deduction (coins held at bid time)
      - Moves to "Past Auctions"

  active -> lost
    Trigger: endsAt reached AND currentBidder !== "player" AND player has bid
    Side effects:
      - Player's last bid refunded → useWallet.earn(lastBidAmount)
      - Toast: "Auction ended. [amount] coins refunded"
      - Auction card shows red "LOST" badge
      - Transaction record: refund
      - Moves to "Past Auctions"

  active -> expired
    Trigger: endsAt reached AND totalBids === 0
    Side effects:
      - Auction disappears silently
      - Replaced by new auction in next generation cycle
```

---

### auctionBids

```
Entity: auctionBids
Purpose: Bid history for auctions.

Fields:
  id: number (auto-increment)
  auctionId: number — FK to auctionItems
  bidder: "player" | string — "player" or NPC name
  amount: number
  createdAt: Date

Dexie index: '++id, auctionId'

Relationships:
  - belongs to auctionItems (many-to-one via auctionId)

Operations: create, read (by auctionId, ordered by amount desc)

Internal rules:
  - Player bid: auto-increments by 50 over current bid
  - NPC counter-bid: 60% chance, 30-90 seconds after player bid
  - Player coins deducted on bid, refunded if outbid
  - Anti-snipe: bid in final 60 seconds extends auction by 2 minutes
```

---

### races

```
Entity: races
Purpose: Daily horse races with entry fees and prize pools.

Fields:
  id: number (auto-increment)
  name: string — race name
  type: "sprint" | "standard" | "endurance" | "championship"
  entryFee: number — 25 / 75 / 150 / 300
  prizePool: number — 100 / 350 / 800 / 2000
  maxRunners: number — 4 / 6 / 8 / 10
  duration: number — minutes: 30 / 60 / 180 / 360
  participants: Array<{
    name: string,
    breed: string,
    isPlayer: boolean,
    petId: number | null,
    baseSpeed: number,
    saddleBonus: number,
    randomFactor: number,
    totalScore: number | null,
    position: number | null,
    prize: number | null
  }>
  playerEntryPetId: number | null — FK to savedNames
  status: "upcoming" | "open" | "running" | "finished"
  scheduledAt: Date — when race appears
  startsAt: Date — when entries close and race begins
  finishesAt: Date — when results are calculated
  createdAt: Date
  updatedAt: Date

Dexie index: '++id, status, startsAt'

States: [upcoming, open, running, finished]

Transitions:
  upcoming -> open
    Trigger: Current time passes scheduledAt
    Side effects:
      - Race card appears in Racing tab
      - NPC participants pre-populated (some slots)
      - "Enter" button enabled

  open -> running
    Trigger: Current time passes startsAt
    Side effects:
      - Entry no longer possible
      - Race card shows "RACING..." with animated indicator
      - If player entered: toast "The race has started! Good luck!"

  running -> finished
    Trigger: Current time passes finishesAt
    Side effects:
      - Results calculated: baseSpeed + saddleBonus + randomFactor per participant
      - Participants ranked by totalScore
      - Prize distribution: 1st 50%, 2nd 25%, 3rd 15%, 4th+ 10%
      - If player placed: useWallet.earn(prize), toast with position + prize
      - If player didn't place top 4: toast "Better luck next time!"
      - Transaction record created
      - useProgress.addXp("racing", xpAmount) if applicable
      - Results card shows full standings
```

---

## Summary

| Table | Dexie Index | Has State Machine |
|-------|-------------|-------------------|
| savedNames | `++id, category, animalType, rarity, status` | No (status is simple flag) |
| history | `++id` | No |
| careLog | `++id, [petId+date+action]` | No |
| collectedCards | `++id, &[animalType+breed], rarity` | No |
| packHistory | `++id, date` | No |
| playerWallet | `++id` | No |
| transactions | `++id, type, category, createdAt` | No |
| skillProgress | `++id, &area` | No |
| puzzleHistory | `++id, area, questionId` | No |
| badges | `++id, &badgeId, track` | No |
| ownedItems | `++id, itemDefId, category, equippedToPetId` | No |
| marketOffers | `++id, type, status` | Yes: pending → accepted / declined / expired |
| playerListings | `++id, status, petId` | Yes: active → sold / expired / cancelled |
| npcBuyerOffers | `++id, listingId, status` | Yes: pending → accepted / declined / expired / countered |
| auctionItems | `++id, status, endsAt` | Yes: active → won / lost / expired |
| auctionBids | `++id, auctionId` | No |
| races | `++id, status, startsAt` | Yes: upcoming → open → running → finished |
