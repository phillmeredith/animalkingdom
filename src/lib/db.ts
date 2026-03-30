// db.ts — Animal Kingdom Database Schema
// Dexie.js v4 (IndexedDB), schema version 16
// All tables defined in spec/foundation/ENTITY_MODEL.md
// Never delete or rename columns — add new ones and increment version

import Dexie, { type Table } from 'dexie'
import type { LeMieuxSlot } from '@/data/lemieux'
import { REWARD_ONLY_CATEGORIES } from '@/lib/animalTiers'

// Re-export LeMieuxSlot so callers can import it from either module.
export type { LeMieuxSlot } from '@/data/lemieux'

// ─── Entity types ──────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type CareAction = 'feed' | 'clean' | 'play'
export type SkillArea = 'maths' | 'spelling' | 'science' | 'geography'
export type TransactionCategory = 'arcade' | 'racing' | 'marketplace' | 'items' | 'daily' | 'care' | 'cards' | 'refund' | 'auction'
export type RaceType = 'sprint' | 'standard' | 'endurance' | 'championship'

export interface SavedName {
  id?: number
  name: string
  animalType: string
  breed: string
  category: 'At Home' | 'Stables' | 'Farm' | 'Lost World' | 'Wild' | 'Sea'
  gender: 'male' | 'female'
  age: 'Newborn' | 'Baby' | 'Young' | 'Adult' | 'Old Timer'
  personality: string
  colour: string
  rarity: Rarity
  imageUrl: string
  barnName: string | null
  showName: string | null
  racingName: string | null
  kennelName: string | null
  pedigreeName: string | null
  speciesName: string | null
  discoveryNarrative: string
  siblings: string[]
  source: 'generate' | 'marketplace' | 'auction' | 'rescue'
  status: 'active' | 'for_sale' | 'rescued'
  equippedSaddleId: number | null
  careStreak: number
  lastFullCareDate: string | null
  createdAt: Date
  updatedAt: Date
}

export interface HistoryEntry {
  id?: number
  animalType: string
  breed: string
  category: string
  gender: string
  age: string
  personality: string
  colour: string
  suggestedNames: string[]
  discoveryNarrative: string
  createdAt: Date
}

export interface CareLog {
  id?: number
  petId: number
  date: string // YYYY-MM-DD
  action: CareAction
  createdAt: Date
}

export interface CardStats {
  speed: number        // 0–100
  strength: number     // 0–100
  stamina: number      // 0–100
  agility: number      // 0–100
  intelligence: number // 0–100
}

export interface CollectedCard {
  id?: number
  animalType: string
  breed: string
  name: string
  rarity: Rarity
  imageUrl: string
  duplicateCount: number
  firstCollectedAt: Date
  updatedAt: Date
  // Added in v10 — card-collection-detail schema extension
  stats: CardStats
  description: string
  ability?: string
  abilityDescription?: string
  // Added in v17 — educational-games card progression
  level: number           // 1–10, default 1
  xp: number              // XP within current level, default 0
  yearLevel: 1 | 2 | 3   // 1=Getting started, 2=Going further, 3=Expert. Default 1
  gameHistory: {
    wordSafari: number    // sessions played, default 0
    coinRush: number
    habitatBuilder: number
    worldQuest: number
  }
  habitatBuilderState: {  // null when no session in progress
    day: number           // 1–5
    decisions: string[]   // decision keys made so far
    stats: { stamina: number; health: number; food: number }
  } | null
  // Geographic / curriculum data — populated from card-catalogue-200.json at acquisition time
  // All optional: existing cards will not have these fields; they are populated when a new pack
  // is opened after v17 is deployed. No retroactive backfill is performed.
  coordinates?: { lat: number; lng: number } | null
  biome?: string | null
  region?: string | null
  conservationStatus?: string | null
  countries?: string[]
  worldQuestMigrates?: boolean
  wordSafariVocab?: string[]
  coinRushFacts?: Record<string, number | string>
  habitatBuilderRole?: 'carnivore' | 'herbivore' | 'omnivore' | null
  habitatBuilderPrey?: string[]
  habitatBuilderPredators?: string[]
  worldQuestRegion?: string | null
  worldQuestMigrationRoute?: string | null
}

export interface PackHistory {
  id?: number
  date: string // YYYY-MM-DD
  cardsReceived: Array<{
    animalType: string
    breed: string
    rarity: Rarity
    isNew: boolean
  }>
  createdAt: Date
}

export interface PlayerWallet {
  id?: number
  coins: number
  lastDailyBonusDate: string | null
  dailyLoginStreak: number
  totalEarned: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id?: number
  type: 'earn' | 'spend'
  amount: number
  source: string
  category: TransactionCategory
  relatedEntityId: number | null
  balanceAfter: number
  createdAt: Date
}

export interface SkillProgress {
  id?: number
  area: SkillArea
  xp: number
  tier: number
  totalCorrect: number
  totalAttempted: number
  currentStreak: number
  bestStreak: number
  gamesPlayed: number
  lastPlayedAt: Date | null
  // Added in v17 — educational-games year level progression
  yearLevel: 1 | 2 | 3           // 1=Getting started, 2=Going further, 3=Expert. Default 1
  recentAccuracy: number[]        // last 15 session accuracies (0–100), rolling window
  discoveredCountries: string[]   // countries unlocked via World Quest. Default []
}

export interface PuzzleHistory {
  id?: number
  area: SkillArea
  questionId: string
  tier: number
  correct: boolean
  answeredAt: Date
}

export interface Badge {
  id?: number
  badgeId: string
  track: 'racing' | 'arcade' | 'care' | 'marketplace' | 'rescue'
  rank: 'bronze' | 'silver' | 'gold'
  name: string
  description: string
  iconUrl: string | null
  earnedAt: Date
}

export interface OwnedItem {
  id?: number
  itemDefId: string
  // Classic item categories + LeMieux equipment slugs.
  // LeMieux slugs added in v12 — classic slugs preserved unchanged.
  category:
    | 'saddle'
    | 'brush'
    | 'feed'
    | 'toy'
    | 'blanket'
    | 'fly-hoods'
    | 'headcollars-leadropes'
    | 'horse-rugs'
    | 'boots-bandages'
    | 'saddlery-tack'
    | 'fly-protection'
    | 'grooming-care'
    | 'stable-yard'
    | 'supplements'
    | 'hobby-horse'
  name: string
  rarity: Rarity
  // Nullable in v12 — LeMieux items carry no stat boost.
  statBoost: { stat: string; value: number } | null
  purchasePrice: number
  remainingUses: number | null
  equippedToPetId: number | null
  // Added in v12 — LeMieux equipment slot (null for unequipped or non-equippable).
  equippedSlot?: LeMieuxSlot | null
  // Added in v12 — reference back to the LeMieux static catalogue id.
  // Parallel to itemDefId (which stores the same value) but typed explicitly.
  lemieuxItemId?: string | null
  purchasedAt: Date
}

export type MarketOfferStatus = 'pending' | 'accepted' | 'declined' | 'expired'
export interface MarketOffer {
  id?: number
  type: 'buy' | 'sell'
  animalType: string
  breed: string
  rarity: Rarity
  imageUrl: string
  price: number
  npcName: string
  npcPersonality: string
  status: MarketOfferStatus
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type PlayerListingStatus = 'active' | 'sold' | 'expired' | 'cancelled'
export interface PlayerListing {
  id?: number
  petId: number
  petName: string
  breed: string
  rarity: Rarity
  imageUrl: string
  askingPrice: number
  marketValue: number
  viewCount: number
  status: PlayerListingStatus
  soldTo: string | null
  soldPrice: number | null
  listedAt: Date
  expiresAt: Date
  soldAt: Date | null
  updatedAt: Date
}

export type NpcBuyerOfferStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'countered'
export interface NpcBuyerOffer {
  id?: number
  listingId: number
  npcName: string
  npcBackground: string
  offerPrice: number
  message: string
  maxPrice: number
  status: NpcBuyerOfferStatus
  counterPrice: number | null
  counterResponse: string | null
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export type AuctionStatus = 'active' | 'won' | 'lost' | 'expired'
export interface AuctionItem {
  id?: number
  animalType: string
  breed: string
  rarity: Rarity
  imageUrl: string
  name: string
  startingBid: number
  currentBid: number
  currentBidder: string
  totalBids: number
  status: AuctionStatus
  startsAt: Date
  endsAt: Date
  createdAt: Date
  updatedAt: Date
  // Added in v13 — auctions feature (AUC-01)
  /** Optional buy-now price; absent → buy-now row not shown in the detail sheet. */
  buyNow?: number
  /** Minimum amount by which each bid must exceed currentBid; drives stepper floor. */
  minimumIncrement: number
  /** NPC name that listed this auction (e.g. "The Collector"). */
  npcSeller: string
  /**
   * When true, this animal is not available through the Generate Wizard — its breed
   * is in the exclusive pool. The AuctionCard renders an "Exclusive" label when true,
   * and a "Rare find" label for non-exclusive uncommon+ animals.
   */
  exclusiveToAuction: boolean
  /** Category of the animal (used for display in the detail sheet). */
  category: string
}

export interface AuctionBid {
  id?: number
  auctionId: number
  bidder: string // 'player' or NPC name
  amount: number
  createdAt: Date
  // Added in v13 — auctions feature (AUC-08)
  /** 'active' while this is the current leading bid for this bidder; 'superseded' when
   *  a re-bid has replaced it. Only one 'active' player bid per auction at any time. */
  bidStatus: 'active' | 'superseded'
}

export type RaceStatus = 'upcoming' | 'open' | 'running' | 'finished'
export interface RaceParticipant {
  name: string
  breed: string
  isPlayer: boolean
  petId: number | null
  baseSpeed: number
  saddleBonus: number
  randomFactor: number
  totalScore: number | null
  position: number | null
  prize: number | null
}

export interface Race {
  id?: number
  name: string
  type: RaceType
  entryFee: number
  prizePool: number
  maxRunners: number
  duration: number // minutes
  participants: RaceParticipant[]
  playerEntryPetId: number | null
  status: RaceStatus
  scheduledAt: Date
  startsAt: Date
  finishesAt: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Schleich collection types ─────────────────────────────────────────────────

/** Ownership record for a Schleich figurine.
 *  id is the derived stable key: image filename without extension
 *  e.g. "haflinger-foal-13951" from "images/haflinger-foal-13951.jpg"
 *  Primary key is the string id — no auto-increment. */
export interface SchleichOwned {
  id: string       // derived key, not auto-increment
  ownedAt: number  // Date.now() timestamp
}

// ─── Pawtect charity types ─────────────────────────────────────────────────────

/** One donation record. The lifetime total is derived by summing all rows. */
export interface PawtectDonation {
  id?: number
  amount: number
  donatedAt: Date
}

// ─── Rescue mission types ─────────────────────────────────────────────────────

export type MissionTaskType = 'arcade' | 'care' | 'map' | 'knowledge' | 'checkin'
export type MissionStatus = 'available' | 'in_progress' | 'complete' | 'claimed'

export interface MissionTask {
  taskId: string
  type: MissionTaskType
  description: string  // e.g. "Complete 3 Word Safari sessions with any card"
  required: number     // e.g. 3
  completed: number    // e.g. 2
  done: boolean
}

export interface RescueMission {
  id?: number
  animalType: string           // matches animals.ts animalType
  breed: string                // matches animals.ts breed
  name: string                 // display name e.g. "Giant Panda"
  imageUrl: string
  rarity: Rarity
  conservationStatus: string   // 'VU', 'EN', 'CR' etc.
  habitat: string
  nativeRegion: string
  about: string                // 2-3 sentence conservation context
  tasks: MissionTask[]
  status: MissionStatus
  rescuedPetId: number | null  // set when claimed — references savedNames.id
  fosterDaysRequired: number   // minimum days in care before release ready
  fosterStartDate: string | null // YYYY-MM-DD when card was added to collection
  releaseReadyDate: string | null // YYYY-MM-DD when release is available
  releasedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// ─── Database class ────────────────────────────────────────────────────────────

export class AnimalKingdomDB extends Dexie {
  savedNames!: Table<SavedName>
  history!: Table<HistoryEntry>
  careLog!: Table<CareLog>
  collectedCards!: Table<CollectedCard>
  packHistory!: Table<PackHistory>
  playerWallet!: Table<PlayerWallet>
  transactions!: Table<Transaction>
  marketOffers!: Table<MarketOffer>
  playerListings!: Table<PlayerListing>
  npcBuyerOffers!: Table<NpcBuyerOffer>
  auctionItems!: Table<AuctionItem>
  auctionBids!: Table<AuctionBid>
  skillProgress!: Table<SkillProgress>
  puzzleHistory!: Table<PuzzleHistory>
  badges!: Table<Badge>
  races!: Table<Race>
  ownedItems!: Table<OwnedItem>
  schleichOwned!: Table<SchleichOwned>
  pawtectDonations!: Table<PawtectDonation>
  rescueMissions!: Table<RescueMission>

  constructor() {
    super('AnimalKingdom')

    this.version(9).stores({
      savedNames:     '++id, category, animalType, rarity, status',
      history:        '++id',
      careLog:        '++id, [petId+date+action]',
      collectedCards: '++id, &[animalType+breed], rarity',
      packHistory:    '++id, date',
      playerWallet:   '++id',
      transactions:   '++id, type, category, createdAt',
      marketOffers:   '++id, type, status',
      playerListings: '++id, status, petId',
      npcBuyerOffers: '++id, listingId, status',
      auctionItems:   '++id, status, endsAt',
      auctionBids:    '++id, auctionId',
      skillProgress:  '++id, &area',
      puzzleHistory:  '++id, area, questionId',
      badges:         '++id, &badgeId, track',
      races:          '++id, status, startsAt',
      ownedItems:     '++id, itemDefId, category, equippedToPetId',
    })

    // v10 — card-collection-detail schema extension
    // Adds stats, description, ability, abilityDescription to collectedCards.
    // Store definition is unchanged (no new indexed columns), so .stores() is
    // omitted here — Dexie inherits the v9 definition automatically.
    // The upgrade callback backfills placeholder values for all existing rows.
    this.version(10).upgrade(async tx => {
      await tx.table('collectedCards').toCollection().modify(card => {
        // Only backfill records that were created before v10
        if (!card.stats) {
          card.stats = {
            speed: 50,
            strength: 50,
            stamina: 50,
            agility: 50,
            intelligence: 50,
          }
        }
        if (card.description === undefined) {
          card.description = ''
        }
        // ability and abilityDescription are optional — leave undefined on
        // existing records; no backfill needed.
      })
    })

    // v11 — schleich-collection-tracker
    // Adds schleichOwned table: { id: string (primary), ownedAt: number }
    // id is derived from the image filename without extension.
    // New table — no existing data to backfill, no upgrade callback needed.
    this.version(11).stores({
      savedNames:     '++id, category, animalType, rarity, status',
      history:        '++id',
      careLog:        '++id, [petId+date+action]',
      collectedCards: '++id, &[animalType+breed], rarity',
      packHistory:    '++id, date',
      playerWallet:   '++id',
      transactions:   '++id, type, category, createdAt',
      marketOffers:   '++id, type, status',
      playerListings: '++id, status, petId',
      npcBuyerOffers: '++id, listingId, status',
      auctionItems:   '++id, status, endsAt',
      auctionBids:    '++id, auctionId',
      skillProgress:  '++id, &area',
      puzzleHistory:  '++id, area, questionId',
      badges:         '++id, &badgeId, track',
      races:          '++id, status, startsAt',
      ownedItems:     '++id, itemDefId, category, equippedToPetId',
      schleichOwned:  'id',
    })

    // v12 — lemieux-equipment-system
    // Extends OwnedItem type union for category to include LeMieux slugs.
    // Adds equippedSlot and lemieuxItemId fields to OwnedItem records.
    // No new indexed columns — ownedItems indexes are unchanged.
    // No upgrade callback needed; new fields are optional and null-safe.
    // The ownedItems index on equippedToPetId is sufficient for slot queries.
    this.version(12).stores({
      savedNames:     '++id, category, animalType, rarity, status',
      history:        '++id',
      careLog:        '++id, [petId+date+action]',
      collectedCards: '++id, &[animalType+breed], rarity',
      packHistory:    '++id, date',
      playerWallet:   '++id',
      transactions:   '++id, type, category, createdAt',
      marketOffers:   '++id, type, status',
      playerListings: '++id, status, petId',
      npcBuyerOffers: '++id, listingId, status',
      auctionItems:   '++id, status, endsAt',
      auctionBids:    '++id, auctionId',
      skillProgress:  '++id, &area',
      puzzleHistory:  '++id, area, questionId',
      badges:         '++id, &badgeId, track',
      races:          '++id, status, startsAt',
      ownedItems:     '++id, itemDefId, category, equippedToPetId',
      schleichOwned:  'id',
    })

    // v13 — auctions feature (AUC-01)
    // Adds buyNow, minimumIncrement, npcSeller, exclusiveToAuction, category fields
    // to AuctionItem. Adds bidStatus field to AuctionBid.
    //
    // auctionBids index unchanged — active-bid queries use filter() on the
    // per-auction result set (small enough that a full scan is acceptable).
    // All new AuctionItem fields are either optional (buyNow) or have safe defaults
    // applied by the upgrade callback below — no runtime errors on existing records.
    //
    // Existing AuctionBid records are backfilled: bidStatus defaults to 'active' so
    // any pre-v13 bid records (unlikely in production, possible in dev) remain valid.
    this.version(13).stores({
      savedNames:     '++id, category, animalType, rarity, status',
      history:        '++id',
      careLog:        '++id, [petId+date+action]',
      collectedCards: '++id, &[animalType+breed], rarity',
      packHistory:    '++id, date',
      playerWallet:   '++id',
      transactions:   '++id, type, category, createdAt',
      marketOffers:   '++id, type, status',
      playerListings: '++id, status, petId',
      npcBuyerOffers: '++id, listingId, status',
      auctionItems:   '++id, status, endsAt',
      // auctionId index retained from v9; active-bid queries use filter() on the
      // per-auction result set (small enough that a full scan is acceptable).
      auctionBids:    '++id, auctionId',
      skillProgress:  '++id, &area',
      puzzleHistory:  '++id, area, questionId',
      badges:         '++id, &badgeId, track',
      races:          '++id, status, startsAt',
      ownedItems:     '++id, itemDefId, category, equippedToPetId',
      schleichOwned:  'id',
    }).upgrade(async tx => {
      // Backfill AuctionItem records created before v13 — set safe defaults so
      // pre-existing rows are not broken by the new required fields.
      // Cast to `any` so TypeScript allows the undefined guard on fields that the
      // interface types as required (pre-v13 records won't have them at runtime).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.table('auctionItems').toCollection().modify((item: any) => {
        if (item.minimumIncrement === undefined) {
          item.minimumIncrement = 20 // minimum safe default (uncommon tier)
        }
        if (item.npcSeller === undefined) {
          item.npcSeller = 'The Collector'
        }
        if (item.exclusiveToAuction === undefined) {
          item.exclusiveToAuction = false
        }
        if (item.category === undefined) {
          item.category = 'Wild'
        }
        // buyNow is intentionally omitted — undefined = no buy-now option shown
      })

      // Backfill AuctionBid records — default bidStatus to 'active' so pre-v13
      // records remain valid and are treated as leading bids.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.table('auctionBids').toCollection().modify((bid: any) => {
        if (bid.bidStatus === undefined) {
          bid.bidStatus = 'active'
        }
      })
    })

    // v14 — achievement-badges (AB-01)
    // Corrects Badge.track union: 'racing' | 'arcade' | 'care' | 'marketplace' | 'rescue'
    // Corrects Badge.rank union: 'bronze' | 'silver' | 'gold'
    // Adds careStreak index to savedNames — required by care-streak-three and
    // care-streak-seven badge criteria.
    //
    // No data migration needed: the badges table is empty in all live installs
    // (checkBadgeEligibility was a stub). careStreak is a new index on an existing
    // column — Dexie will build the index at upgrade time.
    this.version(14).stores({
      savedNames: '++id, category, animalType, rarity, status, careStreak',
      badges:     '++id, &badgeId, track',
    }).upgrade(() => {
      // No-op: badges table is empty; careStreak index is built automatically by Dexie.
      return Promise.resolve()
    })

    // v15 — badge-source-index
    // Adds `source` index to savedNames — required by rescue/generate badge criteria
    // in checkBadgeEligibility() which uses db.savedNames.where('source').anyOf(...).
    // Without this index, Dexie throws "KeyRange only allowed on indexed properties"
    // causing all badge checks to fail silently.
    this.version(15).stores({
      savedNames: '++id, category, animalType, rarity, status, careStreak, source',
    }).upgrade(() => {
      // No-op: Dexie builds the source index automatically at upgrade time.
      return Promise.resolve()
    })

    // v16 — pawtect-charity
    // Adds pawtectDonations table: { id (auto), amount, donatedAt }
    // Lifetime total is derived by summing all rows — no denormalised counter.
    // New table — no existing data to backfill, no upgrade callback needed.
    this.version(16).stores({
      pawtectDonations: '++id, amount, donatedAt',
    })

    // v17 — educational-games card progression
    //
    // CollectedCard extensions:
    //   level, xp, yearLevel, gameHistory, habitatBuilderState — progression fields,
    //   backfilled with safe defaults for all existing rows.
    //   Catalogue fields (coordinates, biome, region, etc.) are optional and NOT
    //   backfilled — they are populated at pack-open time going forward.
    //
    // SkillProgress extensions:
    //   yearLevel, recentAccuracy, discoveredCountries — backfilled with defaults.
    //
    // No new indexed columns — store definitions unchanged. Dexie inherits v16 layout.
    this.version(17).upgrade(async tx => {
      await tx.table('collectedCards').toCollection().modify((card: any) => {
        if (card.level === undefined) {
          card.level = 1
        }
        if (card.xp === undefined) {
          card.xp = 0
        }
        if (card.yearLevel === undefined) {
          card.yearLevel = 1
        }
        if (card.gameHistory === undefined) {
          card.gameHistory = {
            wordSafari: 0,
            coinRush: 0,
            habitatBuilder: 0,
            worldQuest: 0,
          }
        }
        if (card.habitatBuilderState === undefined) {
          card.habitatBuilderState = null
        }
        // Catalogue fields are intentionally left absent on existing rows.
        // They will be populated when new packs are opened after v17.
      })

      await tx.table('skillProgress').toCollection().modify((skill: any) => {
        if (skill.yearLevel === undefined) {
          skill.yearLevel = 1
        }
        if (skill.recentAccuracy === undefined) {
          skill.recentAccuracy = []
        }
        if (skill.discoveredCountries === undefined) {
          skill.discoveredCountries = []
        }
      })
    })

    // v18 — store-rewards / rescue missions
    // Adds rescueMissions table: { id (auto), status, animalType }
    // New table — no existing data to backfill, no upgrade callback needed.
    this.version(18).stores({
      rescueMissions: '++id, status, animalType',
    })

    // v19 — rescue mission task description migration
    // Rewrites task descriptions from school-subject language ("Answer 2 science
    // questions") to ranger vocabulary ("Complete 2 animal tracking sessions").
    // The localStorage seed flag (rescue_missions_seeded_v1) prevents re-seeding,
    // so existing users have the old descriptions — this one-time upgrade patches them.
    // Keyed by taskId — only updates tasks whose description has changed.
    this.version(19).upgrade(async tx => {
      const TASK_DESCRIPTIONS: Record<string, string> = {
        'wolf-arcade-1':      'Complete 2 animal tracking sessions in Word Safari',
        'wolf-care-1':        'Carry out 3 welfare checks at the sanctuary',
        'wolf-knowledge-1':   'Study 2 animal profiles in your ranger log',
        'fox-arcade-1':       'Complete 2 animal tracking sessions in Word Safari',
        'fox-knowledge-1':    'Study 2 animal profiles in your ranger log',
        'fox-checkin-1':      'Check in to the sanctuary on 2 separate days',
        'dolphin-arcade-1':   'Complete 3 animal tracking sessions in Word Safari',
        'dolphin-knowledge-1':'Study 3 animal profiles in your ranger log',
        'dolphin-care-1':     'Carry out 4 welfare checks at the sanctuary',
        'seahorse-arcade-1':  'Complete 3 animal tracking sessions in Word Safari',
        'seahorse-knowledge-1':'Study 3 animal profiles in your ranger log',
        'seahorse-map-1':     'Survey 2 new habitats on the World Map',
        'koala-arcade-1':     'Complete 4 animal tracking sessions in Word Safari',
        'koala-care-1':       'Carry out 5 welfare checks at the sanctuary',
        'koala-knowledge-1':  'Complete 4 habitat surveys on the World Map',
        'koala-checkin-1':    'Check in to the sanctuary on 3 separate days',
        'panda-arcade-1':     'Complete 5 animal tracking sessions in Word Safari',
        'panda-care-1':       'Carry out 7 welfare checks at the sanctuary',
        'panda-knowledge-1':  'Complete 5 ranger field notes',
        'panda-map-1':        'Survey 3 new habitats on the World Map',
        'panda-checkin-1':    'Check in to the sanctuary on 5 separate days',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.table('rescueMissions').toCollection().modify((mission: any) => {
        if (!Array.isArray(mission.tasks)) return
        let changed = false
        mission.tasks = mission.tasks.map((task: any) => {
          const updated = TASK_DESCRIPTIONS[task.taskId]
          if (updated && task.description !== updated) {
            changed = true
            return { ...task, description: updated }
          }
          return task
        })
        if (!changed) return false // signal no modification needed
      })
    })
  }
}

export const db = new AnimalKingdomDB()

// ─── DB helpers ────────────────────────────────────────────────────────────────

/** Ensure playerWallet exists (id=1), initialised with 500 coins.
 *  Wrapped in an explicit rw transaction so Dexie skips optimistic ops
 *  (trans.explicit=true bypasses the applyOptimisticOps path entirely,
 *  preventing the v4.4.1 null-push bug triggered by React StrictMode). */
export async function ensureWallet(): Promise<PlayerWallet> {
  return db.transaction('rw', db.playerWallet, async () => {
    const existing = await db.playerWallet.get(1)
    if (existing) return existing

    const now = new Date()
    const wallet: PlayerWallet = {
      coins: 500,
      lastDailyBonusDate: null,
      dailyLoginStreak: 0,
      totalEarned: 0,
      totalSpent: 0,
      createdAt: now,
      updatedAt: now,
    }
    await db.playerWallet.add(wallet)
    return (await db.playerWallet.get(1))!
  })
}

/** Ensure all 4 skill areas exist in skillProgress.
 *  Same explicit-transaction guard as ensureWallet. */
export async function ensureSkillProgress(): Promise<void> {
  await db.transaction('rw', db.skillProgress, async () => {
    const areas: SkillArea[] = ['maths', 'spelling', 'science', 'geography']
    for (const area of areas) {
      const exists = await db.skillProgress.where('area').equals(area).first()
      if (!exists) {
        await db.skillProgress.add({
          area,
          xp: 0,
          tier: 1,
          totalCorrect: 0,
          totalAttempted: 0,
          currentStreak: 0,
          bestStreak: 0,
          gamesPlayed: 0,
          lastPlayedAt: null,
          yearLevel: 1,
          recentAccuracy: [],
          discoveredCountries: [],
        })
      }
    }
  })
}

/** Today's date as YYYY-MM-DD string */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── Animal economy tier migration (v1) ───────────────────────────────────────

/**
 * One-time migration: cancel any active `for_sale` listings on reward-only animals.
 *
 * Reward-only categories: Wild, Sea, Lost World. These animals cannot be traded
 * under the animal-economy-tiers feature rules. If any were listed before the
 * feature shipped, this migration returns them to `status: 'active'` and cancels
 * their player listing record — both inside a single transaction so partial
 * migration is not possible.
 *
 * The migration flag `migration_tier_v1` in localStorage ensures this runs
 * exactly once, even if called multiple times (e.g. on every app init).
 *
 * Silent: no toast, no notification to the player.
 */
export async function runTierMigrationV1(): Promise<void> {
  const FLAG = 'migration_tier_v1'
  if (localStorage.getItem(FLAG)) return

  const now = new Date()

  try {
    // Identify affected pets before opening the transaction
    const affectedPets = await db.savedNames
      .where('status')
      .equals('for_sale')
      .filter(pet => (REWARD_ONLY_CATEGORIES as readonly string[]).includes(pet.category))
      .toArray()

    if (affectedPets.length === 0) {
      localStorage.setItem(FLAG, '1')
      return
    }

    await db.transaction('rw', db.savedNames, db.playerListings, async () => {
      for (const pet of affectedPets) {
        // Restore pet to active
        await db.savedNames.update(pet.id!, { status: 'active', updatedAt: now })

        // Cancel any active listing for this pet
        const listings = await db.playerListings
          .where('petId')
          .equals(pet.id!)
          .filter(l => l.status === 'active')
          .toArray()

        for (const listing of listings) {
          await db.playerListings.update(listing.id!, {
            status: 'cancelled',
            updatedAt: now,
          })
        }
      }
    })

    localStorage.setItem(FLAG, '1')
  } catch {
    // Migration failure is non-fatal — log for diagnostics, but do not surface to the
    // player. The flag is NOT set on failure so the migration will retry on next init.
    console.error('[runTierMigrationV1] migration failed — will retry on next app start')
  }
}
