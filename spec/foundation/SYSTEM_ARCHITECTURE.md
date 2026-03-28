# System Architecture

> Defines the technical architecture for Animal Kingdom.
> Every hook, its interface, and its dependencies are documented here.
> This is the contract every agent builds against.

---

## Tech Stack

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| React 18 + TypeScript | UI framework | Component model, strict typing, ecosystem maturity |
| Vite 5 | Build / dev server | Fast HMR, ESM-native, minimal config |
| Tailwind CSS 3 | Styling | Utility-first, design-token friendly, purges unused CSS |
| Framer Motion 11 | Animation | Declarative spring physics, gesture support, reduced-motion API |
| Dexie.js v4 / IndexedDB | Client-side database | Offline-first PWA, reactive queries via `useLiveQuery` |
| dexie-react-hooks | React bindings | `useLiveQuery` for reactive database reads |
| @tanstack/react-virtual 3 | Virtualised lists | Performance for 4,600+ animal directory |
| React Router DOM 6 | Routing | Tab-based navigation, overlay management |
| Lucide React | Icons | Consistent stroke icons, tree-shakeable, 24px default |
| DM Sans (Google Fonts) | Typography | Geometric humanist typeface per NFT Dark DS |
| Vercel | Hosting | Zero-config deploy, edge CDN, PWA headers |
| vite-plugin-pwa | PWA support | Service worker generation, manifest, offline |

### iPad Safari Constraints
- No push notifications (no Web Push in Safari PWA)
- IndexedDB soft limit ~50MB (sufficient for text data, not for images)
- Web Speech API: works but may have reliability issues — always provide visual fallback
- `safe-area-inset-bottom` must be respected for bottom nav
- `standalone` display mode when installed to home screen
- No background sync — all timers resolved on next app open

---

## Hook Dependency Graph

```
                    ┌─────────────┐
                    │   useFeed   │ ←── reads from multiple hooks (read-only)
                    └─────────────┘
                          ↑
    ┌───────────┬─────────┼─────────┬──────────────┐
    │           │         │         │              │
┌───────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌───────────┐
│useMarket│ │useRacing│ │useItem│ │useCard │ │useCareLog │
│place   │ │        │ │Shop  │ │Packs  │ │           │
└───┬───┘ └───┬────┘ └───┬───┘ └───┬────┘ └─────┬─────┘
    │         │         │         │              │
    ├─────────┼─────────┘         │              │
    │         │                   │              │
    ▼         ▼                   ▼              ▼
┌─────────┐ ┌─────────────┐  ┌─────────┐
│useWallet│ │useSavedNames│  │useWallet│
└─────────┘ └─────────────┘  └─────────┘

Standalone (no dependencies):
  useWallet, useProgress, useSavedNames, useNameHistory, useReducedMotion, useSpeech
```

---

## Hook Definitions

### useWallet

```
Hook: useWallet

Manages: playerWallet, transactions

Public interface:
  coins: number — current balance (reactive via useLiveQuery)
  totalEarned: number — lifetime earned (reactive)
  totalSpent: number — lifetime spent (reactive)

  earn(amount: number, source: string, category: TransactionCategory): Promise<void>
  spend(amount: number, source: string, category: TransactionCategory): Promise<boolean>
    — returns false if insufficient funds, true if success
  canAfford(amount: number): boolean
  getTransactions(limit?: number, filter?: TransactionCategory): Promise<Transaction[]>
  claimDailyBonus(): Promise<{ awarded: boolean, amount: number, streak: number }>
  undoLastTransaction(transactionId: number): Promise<boolean>
    — only works within 5s of creation, for purchase undo

Internal behaviour:
  - earn() creates transaction record with balanceAfter
  - spend() checks balance first, creates transaction record, returns boolean
  - undoLastTransaction() validates timestamp and reverses both wallet and transaction
  - claimDailyBonus() checks lastDailyBonusDate, awards 25 coins, increments streak
  - Wallet initialised with 500 coins on first access

Does NOT call any other hooks.

Types:
  TransactionCategory = "arcade" | "racing" | "marketplace" | "items" | "daily" | "care" | "cards" | "refund"
```

---

### useProgress

```
Hook: useProgress

Manages: skillProgress, puzzleHistory, badges

Public interface:
  skills: SkillProgress[] — all 4 skill areas (reactive)
  badges: Badge[] — all earned badges (reactive)
  gamerLevel: number — derived from total XP across all skills

  getSkill(area: SkillArea): SkillProgress
  addXp(area: SkillArea, amount: number): Promise<{ newXp: number, tierChanged: boolean, newTier: number }>
  recordAnswer(area: SkillArea, questionId: string, tier: number, correct: boolean): Promise<void>
  getRecentQuestions(area: SkillArea, limit?: number): Promise<string[]>
    — returns questionIds to prevent repeats within last 20
  getBadges(): Promise<Badge[]>
  awardBadge(badgeId: string, track: string, rank: string, name: string, description: string): Promise<void>
  checkBadgeEligibility(): Promise<Badge[]>
    — returns any newly earned badges

Internal behaviour:
  - addXp() auto-calculates tier based on thresholds: 40/65/85
  - Tier can increase (+3 correct at T1, +2 at T2, +1 at T3-4) or decrease (safety net: 3 wrong → drop one tier temporarily)
  - recordAnswer() logs to puzzleHistory and updates streak counts
  - gamerLevel = Math.floor(totalXpAllSkills / 100)
  - Every 5 games completed across all areas → free adoption token (stored in badges)

Does NOT call any other hooks.

Types:
  SkillArea = "maths" | "spelling" | "science" | "geography"
```

---

### useSavedNames

```
Hook: useSavedNames

Manages: savedNames

Public interface:
  pets: SavedName[] — all adopted pets (reactive)
  petCount: number — total count (reactive)
  petsByCategory: Record<string, SavedName[]> — grouped (reactive)

  getPet(id: number): Promise<SavedName | undefined>
  adoptPet(data: Omit<SavedName, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>
    — returns new pet id
  releasePet(id: number): Promise<void>
    — confirmation required at UI layer
  renamePet(id: number, name: string): Promise<void>
  updatePet(id: number, changes: Partial<SavedName>): Promise<void>
  setForSale(id: number): Promise<void>
    — sets status to "for_sale"
  clearForSale(id: number): Promise<void>
    — sets status back to "active"
  getHorses(): Promise<SavedName[]>
    — filtered by animalType === "horse"

Internal behaviour:
  - adoptPet() sets createdAt and updatedAt
  - releasePet() hard deletes the record (UI must confirm first)
  - Pets with status "for_sale" show badge overlay in collection views
  - getHorses() used by Racing for horse selection

Does NOT call any other hooks.
```

---

### useNameHistory

```
Hook: useNameHistory

Manages: history

Public interface:
  history: HistoryEntry[] — recent generations (reactive, newest first)

  addToHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<void>
  getHistory(): Promise<HistoryEntry[]>
  clearHistory(): Promise<void>

Internal behaviour:
  - On addToHistory(), if count > 100, prune oldest entries to keep exactly 100
  - History is unsaved generate results — saved ones go to savedNames

Does NOT call any other hooks.
```

---

### useReducedMotion

```
Hook: useReducedMotion

Manages: prefers-reduced-motion media query

Public interface:
  reducedMotion: boolean — true if user prefers reduced motion

Internal behaviour:
  - Wraps window.matchMedia('(prefers-reduced-motion: reduce)')
  - Listens for changes and re-renders
  - Also checks localStorage for manual override from Settings

Does NOT call any other hooks.
```

---

### useSpeech

```
Hook: useSpeech

Manages: Web Speech API (SpeechSynthesis)

Public interface:
  speak(text: string): void
  stop(): void
  isSpeaking: boolean
  isSupported: boolean
  enabled: boolean — user toggle from Settings

Internal behaviour:
  - Uses window.speechSynthesis with lang 'en-GB'
  - Silently no-ops if browser doesn't support or user has disabled
  - Cancels current speech before starting new
  - Reads from localStorage for enabled toggle

Does NOT call any other hooks.
```

---

### useMarketplace

```
Hook: useMarketplace

Manages: marketOffers, playerListings, npcBuyerOffers

Public interface:
  offers: MarketOffer[] — active NPC offers (reactive)
  listings: PlayerListing[] — player's active listings (reactive)
  pastListings: PlayerListing[] — sold/expired/cancelled (reactive)

  acceptOffer(offerId: number): Promise<void>
  declineOffer(offerId: number): Promise<void>
  listForSale(petId: number, askingPrice: number): Promise<number>
    — returns listing id
  cancelListing(listingId: number): Promise<void>
  acceptBuyerOffer(offerId: number): Promise<void>
  declineBuyerOffer(offerId: number): Promise<void>
  counterBuyerOffer(offerId: number, counterPrice: number): Promise<void>
  getBuyerOffers(listingId: number): Promise<NpcBuyerOffer[]>
  refreshMarketplace(): Promise<void>
    — generates new daily offers

Internal behaviour:
  - acceptOffer() on sell: calls useWallet.spend(), useSavedNames.adoptPet()
  - acceptOffer() on buy: calls useWallet.earn(), useSavedNames.releasePet()
  - listForSale() calls useSavedNames.setForSale()
  - cancelListing() calls useSavedNames.clearForSale()
  - NPC buyer offers arrive on staggered timers (simulated with setTimeout)
  - Views counter increments on seeded random schedule
  - All state transitions follow ENTITY_MODEL.md

Called by: (nothing — top-level feature hook)
Calls:
  - useWallet (for earn/spend on trades)
  - useSavedNames (for adopt/release/status changes)
```

---

### useRacing

```
Hook: useRacing

Manages: races

Public interface:
  todaysRaces: Race[] — all races for today (reactive)
  activeRaces: Race[] — open + running (reactive)
  pastRaces: Race[] — finished (reactive)

  enterRace(raceId: number, petId: number): Promise<boolean>
    — returns false if can't afford or horse already entered
  cancelEntry(raceId: number): Promise<boolean>
    — returns false if race already started
  getResults(raceId: number): Promise<RaceParticipant[]>
  generateDailyRaces(): Promise<void>
    — creates 4-6 staggered races

Internal behaviour:
  - enterRace() calls useWallet.spend(entryFee)
  - Race resolution calculates scores: baseSpeed (breed tier) + saddleBonus + random factor
  - Prize distribution: 1st 50%, 2nd 25%, 3rd 15%, 4th+ 10% of pool
  - Winning calls useWallet.earn(prize)
  - generateDailyRaces() creates races with staggered startsAt times
  - NPC participants auto-generated with seeded names/breeds

Calls:
  - useWallet (for entry fees and prizes)
  - useSavedNames (for horse selection and saddle bonus lookup)
```

---

### useItemShop

```
Hook: useItemShop

Manages: ownedItems

Public interface:
  ownedItems: OwnedItem[] — all items in inventory (reactive)
  ownedByCategory: Record<string, OwnedItem[]> — grouped (reactive)

  buyItem(itemDefId: string, name: string, category: string, rarity: string, price: number, statBoost: StatBoost, remainingUses?: number): Promise<{ success: boolean, transactionId?: number }>
  sellItem(itemId: number): Promise<void>
    — refunds 50% of purchase price
  equipItem(itemId: number, petId: number): Promise<void>
  unequipItem(itemId: number): Promise<void>
  useConsumable(itemId: number): Promise<{ remainingUses: number }>
    — decrements uses, auto-deletes at 0
  undoPurchase(transactionId: number): Promise<boolean>
    — within 5s window

Internal behaviour:
  - buyItem() calls useWallet.spend(), returns transactionId for undo
  - sellItem() calls useWallet.earn(50% of purchasePrice)
  - equipItem() sets equippedToPetId and updates savedNames.equippedSaddleId
  - Only one saddle can be equipped per horse

Calls:
  - useWallet (for buy/sell coin changes)
```

---

### useCareLog

```
Hook: useCareLog

Manages: careLog

Public interface:
  getTodaysCare(petId: number): Promise<{ feed: boolean, clean: boolean, play: boolean }>
  getAllTodaysCare(): Promise<Record<number, { feed: boolean, clean: boolean, play: boolean }>>
    — keyed by petId, for Home screen rendering

  logCare(petId: number, action: CareAction): Promise<void>
  getStreak(petId: number): Promise<number>
    — reads from savedNames.careStreak
  getMood(petId: number): Promise<"happy" | "okay" | "none">
    — green (all 3 done), amber (1-2 done), hidden (0 done)

Internal behaviour:
  - logCare() creates careLog record
  - After logging, checks if all 3 actions done today → updates savedNames.careStreak and lastFullCareDate
  - Streak resets to 0 if a day is missed
  - Streak milestones: 3 days = 10 coins, 7 days = 25, 14 days = 50, 30 days = 100
  - Compound index prevents duplicate actions

Calls:
  - useSavedNames (to update careStreak and lastFullCareDate)

Types:
  CareAction = "feed" | "clean" | "play"
```

---

### useCardPacks

```
Hook: useCardPacks

Manages: collectedCards, packHistory

Public interface:
  collection: CollectedCard[] — all cards (reactive)
  collectionByRarity: Record<string, CollectedCard[]> — grouped (reactive)
  totalCards: number
  totalUnique: number
  canOpenPack: boolean — true if daily pack available (reactive)
  nextPackTime: Date | null — when next pack is available

  openPack(): Promise<PackResult>
    — returns 5 cards with isNew flags
  getCollectionProgress(): { total: number, unique: number, byRarity: Record<string, { owned: number, total: number }> }
  sellDuplicate(cardId: number): Promise<void>
    — decrements duplicateCount, earns coins by rarity

Internal behaviour:
  - openPack() generates 5 cards using rarity weights: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%
  - Cards drawn from horse breeds + dinosaur type pools
  - One free pack per day at 5pm
  - Duplicate cards increment duplicateCount
  - Pack results logged to packHistory

Calls:
  - useWallet (for selling duplicates: common 5c, uncommon 15c, rare 50c, epic 150c, legendary 500c)

Types:
  PackResult = { cards: Array<{ animalType: string, breed: string, rarity: string, imageUrl: string, isNew: boolean }> }
```

---

### useFeed

```
Hook: useFeed

Manages: (read-only aggregator — no owned tables)

Public interface:
  recentActivity: FeedEntry[] — last 20 activity items (reactive)

  getActivity(limit?: number): Promise<FeedEntry[]>

Internal behaviour:
  - Aggregates from: transactions, careLog, collectedCards, badges
  - Generates social-style feed entries from activity data
  - Also generates random NPC "social posts" about pets using seeded RNG (feedRng)
  - Sorted by timestamp descending
  - Includes rescue alert generation (event-driven opportunities)

Calls (read-only):
  - Reads from Dexie tables directly (transactions, careLog, etc.)
  - Does NOT call other hooks' methods — only reads their managed tables

Types:
  FeedEntry = { id: string, type: "care" | "earn" | "badge" | "social" | "rescue", text: string, timestamp: Date, petId?: number, imageUrl?: string }
```

---

## Notification Architecture

### Toast Types

| Type | Background | Border | Icon colour | Title colour | Auto-dismiss |
|------|-----------|--------|-------------|-------------|-------------|
| success | `--green-sub` | `rgba(69,178,107,.2)` | `--green` | `--green-t` | 3s |
| warning | `--amber-sub` | `rgba(245,166,35,.2)` | `--amber` | `--amber-t` | 5s |
| error | `--red-sub` | `rgba(239,70,111,.2)` | `--red` | `--red-t` | Persistent |
| info | `--blue-sub` | `rgba(55,114,255,.2)` | `--blue` | `--blue-t` | 3s |
| undo | `--blue-sub` | `rgba(55,114,255,.2)` | `--blue` | `--blue-t` | 5s (with undo button) |

### Stacking Rules
- Maximum 3 toasts visible at once
- New toasts push from top (newest on top)
- Persistent toasts (error) must be dismissed manually via close button
- Undo toasts have an inline flat-blue button; double-tap guard prevents accidental undo

### Cross-Screen Notifications
- Toasts appear regardless of which screen the user is on
- Auction outbid: toast + badge dot on Shop tab
- Race finished: toast + badge dot on Play tab
- Badges return to source screen to show context when tapped

---

## Routing and Navigation

### Screen Hierarchy

```
Bottom Tab Bar (5 tabs)
├── Home (HomeScreen)
│   ├── ResultsScreen (overlay — tap pet card)
│   ├── CareScreen (overlay — tap care icon)
│   ├── EventDetailScreen (overlay — tap rescue/event)
│   ├── HomeBuilderScreen (overlay — from pet profile)
│   └── Settings (full-screen overlay — gear icon)
│
├── Explore
│   ├── DirectoryScreen (default sub-view)
│   │   └── Animal Profile (overlay — tap entry)
│   │       └── TraderPuzzle (overlay — 50% chance after 8s)
│   └── GenerateScreen (sub-view)
│       ├── ResultsScreen (overlay — generation complete)
│       │   └── AdoptionOverlay (overlay — after adopt)
│       │       └── TraderPuzzle (overlay — 50% chance)
│       └── [7-step wizard inline]
│
├── My Animals
│   ├── CollectionScreen (default sub-tab)
│   │   └── ResultsScreen (overlay — tap animal)
│   ├── CardsScreen (sub-tab)
│   │   └── Card Detail (overlay — tap card)
│   │   └── Pack Opening (overlay — open pack)
│   └── CompareScreen (sub-tab)
│
├── Play
│   ├── PuzzleHubScreen (default sub-tab: Arcade)
│   │   └── GameShell (full-screen overlay — any game)
│   │       └── GameOver (overlay — game ends)
│   └── RacingScreen (sub-tab)
│       ├── Horse Selection (overlay — enter race)
│       └── Race Results (overlay — race finished)
│
└── Shop
    ├── MarketplaceScreen (default sub-tab: Pets)
    │   ├── Offer Detail (overlay)
    │   ├── Auction Detail (overlay)
    │   ├── Listing Detail (overlay — player's listing)
    │   ├── Naming Modal (overlay — after buy/win)
    │   └── TraderPuzzle (overlay — 50% after trade)
    └── SuppliesScreen (sub-tab)
        └── Item Detail (overlay — tap card)
```

### Overlay Rules
- Overlays can stack maximum 2 deep (e.g. pet profile → TraderPuzzle)
- Back/swipe-down dismisses top overlay, returns to parent
- After adoption/purchase completion, navigate to Home
- Settings is a full-screen overlay from Home header, not a tab

### Deep Linking
- Outbid notification → Shop tab → Auction detail
- Race finished notification → Play tab → Racing sub-tab → Race results
- Badge earned → source screen (Arcade, Marketplace, etc.)

---

## Component Architecture

### Shared Component Library

| Component | Key Props | Purpose |
|-----------|----------|---------|
| `Button` | variant, size, icon, disabled, loading, onClick | 7 variants × 3 sizes, pill-shaped |
| `Card` | children, onClick, hoverable, rarity | Surface container, 16px radius |
| `BottomSheet` | isOpen, onClose, title, children | iOS-style slide-up overlay |
| `Modal` | isOpen, onClose, title, children | Centred overlay |
| `Toast` | type, title, description, action?, onDismiss | Top-centre notification |
| `Badge` | variant, solid?, children | Tinted pill badge |
| `RarityBadge` | rarity | Pre-styled rarity badge |
| `PillToggle` | tabs, activeTab, onChange | Segmented control |
| `CoinDisplay` | amount | Amber pill with coin icon |
| `PageHeader` | title, tabs?, trailing? | Grid layout: title / tabs / trailing |
| `GradientFade` | — | Fixed gradient above bottom nav |
| `EmptyState` | icon, title, description, cta? | Empty content placeholder |
| `LoadingState` | — | Skeleton / spinner |
| `AnimalImage` | src, alt, fallback? | Image with paw-print fallback |
| `RarityBorder` | rarity, children | Left-border accent wrapper |
| `BottomNav` | activeTab, onTabChange | 5-tab fixed bottom bar |
| `StatCard` | label, value, delta? | Dashboard stat card |
| `DataTable` | headers, rows | Styled table in card wrap |
| `Avatar` | name, size, gradient? | Gradient-filled circle |
| `SearchBar` | value, onChange, placeholder | Styled search input |

### Layout Patterns

**Standard page:**
```
PageHeader (title + optional pills + optional trailing)
  ↓
Content (px-24, scrollable, pb-32)
  ↓
GradientFade (fixed, 32px above nav)
  ↓
BottomNav (fixed, 80px)
```

**Hero page (Home, Play, Shop):**
```
Hero section (full-width, content-driven height, within px-24)
  ↓
Content sections (px-24, scrollable)
  ↓
GradientFade + BottomNav
```

### Design System Reference
All visual tokens: `design-system/DESIGN_SYSTEM.md`
