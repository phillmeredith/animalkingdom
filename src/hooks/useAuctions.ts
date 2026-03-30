// useAuctions — NPC-driven daily animal auctions
// Stories: AUC-01 (schema + hook foundation), AUC-02 (NPC generation),
//          AUC-07 (bid flow), AUC-08 (re-bid flow), AUC-09 (NPC counter-bid),
//          AUC-10 (win resolution), AUC-11 (loss resolution), AUC-13 (offline delivery)
//
// Coin mechanic: coins are SPENT at bid time via spend(). If Harry loses, they are
// REFUNDED via earn(). There is no hold primitive. coinsInBids is a derived value
// computed from active AuctionBid records — it is NOT stored on the wallet.
//
import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, todayString } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'
import { ANIMALS } from '@/data/animals'
import { BREEDS_BY_TYPE } from '@/data/generateOptions'
import { isTradeable } from '@/lib/animalTiers'
// Rarity is imported only from db.ts. animals.ts defines an identical Rarity type
// but importing from both would create a structural duplicate — db.ts is the canonical source.
import type { AuctionItem, AuctionBid, Rarity, SavedName } from '@/lib/db'
// AnimalEntry.rarity uses the animals.ts Rarity, which is structurally identical to
// db.ts Rarity. TypeScript accepts indexing Record<Rarity, ...> with either type.
import type { AnimalEntry } from '@/data/animals'

// ─── NPC constants ─────────────────────────────────────────────────────────────

/** Whimsical non-human NPC seller names. Realistic human names are prohibited
 *  (UR finding: risk of social antagonism for ages 6–9). */
const NPC_NAMES = [
  'The Collector',
  'Wild Wanderer',
  'Safari Seeker',
  'The Naturalist',
  'Field Notes',
  'The Expedition',
] as const

/** Delay range for NPC counter-bids after a player bid, in milliseconds.
 *  Lower bound is a hard constraint from UR findings: below 3s feels instant
 *  and threatening for the target age group (ages 6–9, confidence: high). */
const NPC_BID_DELAY_MIN_MS = 3_000
const NPC_BID_DELAY_MAX_MS = 12_000

/** Maximum number of NPC bids per auction across all bid events.
 *  Once reached the NPC is silent for the remainder of the auction.
 *  Range 3–4 per PO decision (AUC-09 AC). */
const NPC_MAX_BIDS_MIN = 3
const NPC_MAX_BIDS_MAX = 4

/** Target player win rate ~60–65%.
 *  The NPC budget ceilings per rarity are the sole calibration mechanism.
 *  No additional win-rate tuning logic is permitted (AUC-09 AC). */
const NPC_BUDGET_CEILING: Record<Rarity, number> = {
  common:    0,    // common animals never appear in auctions
  uncommon:  200,
  rare:      600,
  epic:      1_400,
  legendary: 3_000,
}

// ─── Economy constants ─────────────────────────────────────────────────────────

/** Starting bid ranges per rarity tier (PO-specified values — AUC-02 AC).
 *  Developer must not change these without a PO story update. */
const STARTING_BID_RANGE: Record<Rarity, { min: number; max: number }> = {
  common:    { min: 0,     max: 0     }, // never appears
  uncommon:  { min: 80,    max: 150   },
  rare:      { min: 200,   max: 400   },
  epic:      { min: 500,   max: 900   },
  legendary: { min: 1_000, max: 2_000 },
}

/** Minimum increment per rarity (PO-specified — AUC-02 AC). */
const MINIMUM_INCREMENT: Record<Rarity, number> = {
  common:    0,   // never appears
  uncommon:  20,
  rare:      50,
  epic:      100,
  legendary: 200,
}

/** Auction duration range in hours (AUC-02 AC: 4–24h mix). */
const AUCTION_DURATION_HOURS = { min: 4, max: 24 }

/** Number of auctions to generate per daily batch (AUC-02 AC: 3–5 items).
 *  Refined stories use 3–5; interaction spec overview says 4–8.
 *  Refined stories are the authoritative Phase B output. */
const DAILY_BATCH_SIZE = { min: 3, max: 5 }

/** Probability that a generated auction includes a buy-now price (AUC-02 AC: ~50%). */
const BUY_NOW_PROBABILITY = 0.5

/** Buy-now price multiplier applied to startingBid (AUC-02 AC: 2.5×). */
const BUY_NOW_MULTIPLIER = 2.5

// ─── Exclusive breeds ──────────────────────────────────────────────────────────

/**
 * Breeds that are NOT available through the Generate Wizard pool.
 * These map to AnimalEntry records in ANIMALS[] that have no corresponding
 * BREEDS_BY_TYPE entry. At least one per daily batch must be exclusive (AUC-02 AC).
 *
 * Derived by cross-referencing ANIMALS[] against BREEDS_BY_TYPE. Any breed in
 * ANIMALS that does not appear in the Generate Wizard is flagged as exclusive.
 */
const GENERATE_WIZARD_BREEDS = new Set<string>(
  Object.values(BREEDS_BY_TYPE).flatMap(options => options.map(o => o.value))
)

/** True when an AnimalEntry's breed is not obtainable through the Generate Wizard. */
function isExclusiveBreed(animal: AnimalEntry): boolean {
  return !GENERATE_WIZARD_BREEDS.has(animal.breed)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Shuffle an array in-place using Fisher-Yates. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Derive a friendly auction display name from an animal entry.
 *  Format: "[Breed] [AnimalType]" — e.g. "Lipizzaner Horse". */
function auctionDisplayName(animal: AnimalEntry): string {
  return `${animal.breed} ${animal.animalType}`
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuctions() {
  const { earn, spend } = useWallet()
  const { checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  // Track which NPC name was used as the competing bidder in the previous counter-bid
  // event this session. Used to prevent the same name appearing in consecutive auctions.
  const lastNpcBidderRef = useRef<string | null>(null)

  // ── Live queries ────────────────────────────────────────────────────────────

  /** All auctions — active and recently resolved (won/lost). */
  const auctions = useLiveQuery(
    () => db.auctionItems.orderBy('endsAt').toArray(),
    [],
    [] as AuctionItem[],
  )

  /** All active (non-superseded) bids by the player.
   *  Full table scan with filter — auctionBids is small (bounded by daily auction
   *  count × max bid attempts per auction, typically < 50 rows) so a filter scan
   *  is acceptable and simpler than a compound index range query. */
  const playerBidsRaw = useLiveQuery(
    () => db.auctionBids
      .filter(b => b.bidder === 'player' && b.bidStatus === 'active')
      .toArray(),
    [],
    [] as AuctionBid[],
  )

  /**
   * Map of auctionId → player's current active bid amount.
   * Only active bids on active auctions count — bids on resolved auctions
   * are not included (those coins have already been refunded or kept as win).
   */
  const playerBids: Record<number, number> = {}
  if (playerBidsRaw && auctions) {
    const activeAuctionIds = new Set(
      auctions.filter(a => a.status === 'active').map(a => a.id!)
    )
    for (const bid of playerBidsRaw) {
      if (activeAuctionIds.has(bid.auctionId)) {
        playerBids[bid.auctionId] = bid.amount
      }
    }
  }

  /**
   * Total coins currently in active bids.
   * Derived from the bid table — NOT from the wallet's totalSpent.
   * Updates reactively via useLiveQuery. The prop name coinsInBids is the only
   * permitted name for this figure (heldAmount is explicitly prohibited per AUC-01 AC).
   */
  const coinsInBids = Object.values(playerBids).reduce((sum, amt) => sum + amt, 0)

  // ── Daily auction generation (AUC-02) ──────────────────────────────────────

  /**
   * Generates a daily batch of 3–5 NPC-listed auctions.
   * Called automatically on mount when no active auctions exist.
   * Safe to call manually (e.g. dev tooling, pull-to-refresh).
   *
   * Generation rules (AUC-02 AC):
   * - All animals are uncommon rarity or above — common never appears
   * - At least one must be rare or above
   * - At least one must be exclusive (breed not in Generate Wizard)
   * - No NPC seller name repeats within the batch
   * - Duration 4–24h mix
   * - buyNow present on ~50% of auctions at 2.5× startingBid
   */
  async function refreshAuctions(): Promise<void> {
    try {
      // Gate: skip if active auctions already exist for today
      const today = todayString()
      const existingActive = await db.auctionItems
        .where('status')
        .equals('active')
        .toArray()

      // An auction is "today's" if it was created today and has not yet expired
      const todaysActive = existingActive.filter(
        a => a.createdAt.toISOString().slice(0, 10) === today
      )
      if (todaysActive.length > 0) return

      // Build eligible animal pool: uncommon+ from ANIMALS catalogue, tradeable only.
      // Animal economy tiers: reward-only animals (Wild, Sea, Lost World) are excluded
      // at the data layer so they never appear in auctions.
      const eligibleAnimals = ANIMALS.filter(
        a => isTradeable(a.category) && (
          a.rarity === 'uncommon' || a.rarity === 'rare' ||
          a.rarity === 'epic' || a.rarity === 'legendary'
        )
      )

      const exclusiveAnimals = eligibleAnimals.filter(isExclusiveBreed)
      const rareOrAbove = eligibleAnimals.filter(
        a => a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary'
      )

      // Determine batch size
      const batchSize = randomBetween(DAILY_BATCH_SIZE.min, DAILY_BATCH_SIZE.max)

      // Shuffle NPC names for seller assignment (no repeats within the batch)
      const shuffledNpcNames = shuffle([...NPC_NAMES])

      // We must guarantee at least 1 exclusive and at least 1 rare+.
      // Pick these slots first, then fill the rest from the general pool.
      const selected: AnimalEntry[] = []
      const usedIds = new Set<string>()

      // Slot 1: exclusive animal (required)
      if (exclusiveAnimals.length === 0) {
        // Defensive: if somehow no exclusive animals exist, fall back gracefully
        // This should never happen given the current ANIMALS catalogue
        toast({
          type: 'error',
          title: 'Auction generation error',
          description: 'No exclusive animals available for auctions. Please report this.',
        })
        return
      }
      const shuffledExclusive = shuffle([...exclusiveAnimals])
      selected.push(shuffledExclusive[0])
      usedIds.add(shuffledExclusive[0].id)

      // Slot 2: rare+ animal (may overlap with slot 1 if slot 1 is already rare+)
      const eligibleRare = rareOrAbove.filter(a => !usedIds.has(a.id))
      if (eligibleRare.length > 0) {
        const shuffledRare = shuffle([...eligibleRare])
        selected.push(shuffledRare[0])
        usedIds.add(shuffledRare[0].id)
      }

      // Fill remaining slots from the full eligible pool (uncommon+)
      const remaining = shuffle(eligibleAnimals.filter(a => !usedIds.has(a.id)))
      while (selected.length < batchSize && remaining.length > 0) {
        const next = remaining.shift()!
        selected.push(next)
        usedIds.add(next.id)
      }

      // Final shuffle so the required slots don't always appear first
      shuffle(selected)

      // Build AuctionItem records
      const now = new Date()
      const items: Omit<AuctionItem, 'id'>[] = selected.map((animal, index) => {
        const range = STARTING_BID_RANGE[animal.rarity]
        const startingBid = randomBetween(range.min, range.max)
        const minimumIncrement = MINIMUM_INCREMENT[animal.rarity]
        const durationHours = randomBetween(AUCTION_DURATION_HOURS.min, AUCTION_DURATION_HOURS.max)
        const endsAt = new Date(now.getTime() + durationHours * 60 * 60 * 1_000)
        const hasBuyNow = Math.random() < BUY_NOW_PROBABILITY
        const npcSeller = shuffledNpcNames[index % shuffledNpcNames.length]

        return {
          animalType:          animal.animalType,
          breed:               animal.breed,
          rarity:              animal.rarity,
          imageUrl:            animal.imageUrl,
          name:                auctionDisplayName(animal),
          category:            animal.category,
          startingBid,
          currentBid:          startingBid,
          currentBidder:       npcSeller, // NPC is the initial "holder" of reserve price
          totalBids:           0,
          status:              'active',
          startsAt:            now,
          endsAt,
          createdAt:           now,
          updatedAt:           now,
          minimumIncrement,
          buyNow:              hasBuyNow ? Math.round(startingBid * BUY_NOW_MULTIPLIER) : undefined,
          npcSeller,
          exclusiveToAuction:  isExclusiveBreed(animal),
        }
      })

      await db.auctionItems.bulkAdd(items as AuctionItem[])
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not load auctions',
        description: 'There was a problem setting up today\'s auctions. Please try again.',
      })
    }
  }

  // ── Bid placement (AUC-07) ─────────────────────────────────────────────────

  /**
   * Place or re-place a bid on an auction.
   *
   * First bid: spend(amount) + auctionBids.add() + auctionItems.update() in ONE transaction.
   *
   * Re-bid (player already has an active bid on this auction, AUC-08):
   * All four of these steps execute atomically in ONE transaction:
   * 1. earn() to refund the prior active bid amount
   * 2. spend() the new bid amount
   * 3. Mark the old bid record as 'superseded'
   * 4. Write the new bid record + update AuctionItem.currentBid / currentBidder
   *
   * Transaction integrity: spend() and the DB writes that deliver the bid must be
   * inside the same db.transaction(). A violation is a build defect per CLAUDE.md.
   */
  async function placeBid(auctionId: number, amount: number): Promise<void> {
    try {
      // Pre-condition reads — outside the write transaction (read-only)
      const auction = await db.auctionItems.get(auctionId)
      if (!auction || auction.status !== 'active') {
        toast({
          type: 'error',
          title: 'Auction no longer available',
          description: 'This auction has ended or is no longer active.',
        })
        return
      }

      const minimumBid = auction.currentBid + auction.minimumIncrement
      if (amount < minimumBid) {
        toast({
          type: 'error',
          title: 'Bid too low',
          description: `The minimum bid is ${minimumBid} coins.`,
        })
        return
      }

      // Find any existing active bid by the player on this auction
      const existingBid = await db.auctionBids
        .where('auctionId')
        .equals(auctionId)
        .filter(b => b.bidder === 'player' && b.bidStatus === 'active')
        .first()

      const now = new Date()

      // All wallet and bid table writes go inside ONE transaction.
      // spend() internally writes to db.playerWallet + db.transactions — both
      // listed here so Dexie nests the inner transaction correctly.
      // earn() follows the same pattern.
      let bidSucceeded = false

      await db.transaction(
        'rw',
        db.auctionItems,
        db.auctionBids,
        db.playerWallet,
        db.transactions,
        async () => {
          if (existingBid) {
            // Re-bid path (AUC-08): refund prior bid then spend new amount
            await earn(
              existingBid.amount,
              `Auction re-bid refund: ${auction.name}`,
              'auction',
              auctionId,
            )

            await db.auctionBids.update(existingBid.id!, {
              bidStatus: 'superseded',
            } as Partial<AuctionBid>)
          }

          // Attempt to spend the new bid amount
          const paid = await spend(amount, `Auction bid: ${auction.name}`, 'auction', auctionId)
          if (!paid.ok) {
            // spend() returning ok: false rolls back automatically in a transaction
            // because we return without further writes — Dexie will still commit
            // the earn() and bidStatus update above unless we throw.
            // We must throw to roll back the full transaction.
            throw new Error('insufficient_coins')
          }

          // Write the new bid record
          await db.auctionBids.add({
            auctionId,
            bidder:    'player',
            amount,
            bidStatus: 'active',
            createdAt: now,
          })

          // Update the auction's current bid state
          await db.auctionItems.update(auctionId, {
            currentBid:    amount,
            currentBidder: 'player',
            totalBids:     auction.totalBids + 1,
            updatedAt:     now,
          })

          bidSucceeded = true
        }
      )

      if (!bidSucceeded) {
        // Should not reach here — the throw above will propagate to the catch block.
        // Kept as a defensive guard.
        toast({
          type: 'error',
          title: 'You don\'t have enough coins',
          description: 'Try a lower bid amount.',
        })
        return
      }

      // Schedule an NPC counter-bid after a random delay (AUC-09)
      scheduleNpcCounterBid(auctionId)

    } catch (err) {
      if (err instanceof Error && err.message === 'insufficient_coins') {
        // Surface as inline error in BidConfirmState — not a toast (AUC-07 AC)
        // The caller reads this by catching the error or checking a return value.
        // Re-throw so the FE component can display the inline error state.
        throw err
      }
      toast({
        type: 'error',
        title: 'Bid could not be placed',
        description: 'Something went wrong. Please try again.',
      })
    }
  }

  // ── Buy-now (AUC-07) ──────────────────────────────────────────────────────

  /**
   * Execute the buy-now flow for an auction.
   * Identical transaction pattern to placeBid but the amount is fixed (auction.buyNow).
   * On success, resolveAuction() is called immediately (Harry wins outright).
   */
  async function buyNow(auctionId: number): Promise<void> {
    try {
      const auction = await db.auctionItems.get(auctionId)
      if (!auction || auction.status !== 'active' || !auction.buyNow) {
        toast({
          type: 'error',
          title: 'Buy now not available',
          description: 'This auction\'s buy-now option is no longer available.',
        })
        return
      }

      const amount = auction.buyNow
      const existingBid = await db.auctionBids
        .where('auctionId')
        .equals(auctionId)
        .filter(b => b.bidder === 'player' && b.bidStatus === 'active')
        .first()

      const now = new Date()
      let buySucceeded = false

      await db.transaction(
        'rw',
        db.auctionItems,
        db.auctionBids,
        db.playerWallet,
        db.transactions,
        async () => {
          // Refund any existing active bid before spending the buy-now price
          if (existingBid) {
            await earn(
              existingBid.amount,
              `Auction buy-now bid refund: ${auction.name}`,
              'auction',
              auctionId,
            )
            await db.auctionBids.update(existingBid.id!, {
              bidStatus: 'superseded',
            } as Partial<AuctionBid>)
          }

          const paid = await spend(amount, `Auction buy now: ${auction.name}`, 'auction', auctionId)
          if (!paid.ok) {
            throw new Error('insufficient_coins')
          }

          await db.auctionBids.add({
            auctionId,
            bidder:    'player',
            amount,
            bidStatus: 'active',
            createdAt: now,
          })

          // Mark the auction as won immediately — buy now short-circuits the close timer
          await db.auctionItems.update(auctionId, {
            currentBid:    amount,
            currentBidder: 'player',
            totalBids:     auction.totalBids + 1,
            status:        'won',
            updatedAt:     now,
          })

          buySucceeded = true
        }
      )

      if (!buySucceeded) return

      // Deliver the animal and fire the win overlay (AUC-10)
      await deliverWonAnimal(auctionId)

    } catch (err) {
      if (err instanceof Error && err.message === 'insufficient_coins') {
        throw err
      }
      toast({
        type: 'error',
        title: 'Buy now could not be completed',
        description: 'Something went wrong. Please try again.',
      })
    }
  }

  // ── NPC counter-bid mechanic (AUC-09) ─────────────────────────────────────

  /**
   * Schedule an NPC counter-bid after a random delay of 3–12 seconds.
   * The 3-second lower bound is a hard constraint from UR findings.
   *
   * The NPC will not bid if:
   * - The auction is no longer active
   * - The NPC's total bid count on this auction has reached its random cap (3–4)
   * - The NPC's budget ceiling for the auction's rarity has been reached
   */
  function scheduleNpcCounterBid(auctionId: number): void {
    const delay = randomBetween(NPC_BID_DELAY_MIN_MS, NPC_BID_DELAY_MAX_MS)

    setTimeout(async () => {
      try {
        await executeNpcCounterBid(auctionId)
      } catch (err) {
        // NPC bid errors are non-blocking — they must not surface as user-visible
        // errors because the NPC bidding mechanic is invisible infrastructure.
        // We do not call toast() here: a failing NPC counter-bid is silent.
        // The player will simply remain the leading bidder, which is a better
        // outcome than an confusing error message about something they didn't do.
        //
        // This is the ONLY permitted silent catch in this hook. All player-facing
        // operations (placeBid, buyNow, resolveAuction) use toast() on error.
        console.warn('[useAuctions] NPC counter-bid failed silently:', err)
      }
    }, delay)
  }

  async function executeNpcCounterBid(auctionId: number): Promise<void> {
    // Re-fetch the auction state at execution time (delay may have elapsed)
    const auction = await db.auctionItems.get(auctionId)
    if (!auction || auction.status !== 'active') return

    // Count how many NPC bids have already been placed on this auction
    const npcBids = await db.auctionBids
      .where('auctionId')
      .equals(auctionId)
      .filter(b => b.bidder !== 'player')
      .toArray()

    // Randomise the per-auction NPC bid cap (3 or 4) deterministically per auction
    // by using the auction id as a seed (same cap across the auction's lifetime)
    const npcCap = (auction.id! % 2 === 0) ? NPC_MAX_BIDS_MIN : NPC_MAX_BIDS_MAX
    if (npcBids.length >= npcCap) return

    // Check NPC budget ceiling
    const totalNpcSpend = npcBids.reduce((sum, b) => sum + b.amount, 0)
    const budgetCeiling = NPC_BUDGET_CEILING[auction.rarity]
    const nextBidAmount = auction.currentBid + auction.minimumIncrement

    if (totalNpcSpend + auction.minimumIncrement > budgetCeiling) return
    if (nextBidAmount > budgetCeiling) return

    // Pick an NPC name that is not the same as the last competing bidder this session
    const availableNames = NPC_NAMES.filter(n => n !== lastNpcBidderRef.current)
    const npcName = availableNames.length > 0
      ? pickRandom(availableNames)
      : pickRandom(NPC_NAMES)

    lastNpcBidderRef.current = npcName

    const now = new Date()
    const wasPlayerLeading = auction.currentBidder === 'player'

    // NPC bid record + auction state update in ONE transaction (AUC-09 AC)
    await db.transaction('rw', db.auctionItems, db.auctionBids, async () => {
      await db.auctionBids.add({
        auctionId,
        bidder:    npcName,
        amount:    nextBidAmount,
        bidStatus: 'active',
        createdAt: now,
      })

      await db.auctionItems.update(auctionId, {
        currentBid:    nextBidAmount,
        currentBidder: npcName,
        totalBids:     auction.totalBids + 1,
        updatedAt:     now,
      })
    })

    // If Harry was the leading bidder, he is now outbid — fire the toast (AUC-09 AC).
    // Toast fires AFTER the NPC bid delay, on the NPC bid event.
    // This toast must NOT say "Your coins are back" — Harry's coins are still spent
    // and will only return if he loses the auction entirely (AUC-09 AC, AUC-11 AC).
    if (wasPlayerLeading) {
      // AUC-DEF-01: Check if the player can afford the next minimum bid.
      // If not, fire the "out of coins" variant so Harry knows he cannot re-bid.
      const wallet = await db.playerWallet.get(1)
      const playerBalance = wallet?.coins ?? 0
      const canAffordNextBid = playerBalance >= nextBidAmount

      if (canAffordNextBid) {
        toast({
          type: 'warning',
          title: `You've been outbid — bid again to stay in.`,
        })
      } else {
        toast({
          type: 'warning',
          title: `You've been outbid on ${auction.name} and you're out of coins to bid higher.`,
        })
      }
    }
  }

  // ── Auction resolution ────────────────────────────────────────────────────

  /**
   * Check all active auctions whose endsAt has passed and resolve them.
   * Called on hook mount (handles AUC-13 offline delivery) and can be called
   * periodically by a timer in the component layer.
   *
   * Resolution is idempotent — a won/lost auction will not be processed again.
   */
  async function resolveExpiredAuctions(): Promise<void> {
    try {
      const now = new Date()
      const expired = await db.auctionItems
        .where('status')
        .equals('active')
        .filter(a => a.endsAt <= now)
        .toArray()

      for (const auction of expired) {
        if (auction.currentBidder === 'player') {
          await resolveAuctionWin(auction)
        } else {
          // Check whether Harry had any bid on this auction at all
          const playerBid = await db.auctionBids
            .where('auctionId')
            .equals(auction.id!)
            .filter(b => b.bidder === 'player' && b.bidStatus === 'active')
            .first()

          if (playerBid) {
            await resolveAuctionLoss(auction, playerBid.amount)
          } else {
            // No player bid — just mark as expired, no refund needed
            await db.auctionItems.update(auction.id!, {
              status:    'expired',
              updatedAt: new Date(),
            })
          }
        }
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not check auction results',
        description: 'Please reopen the app to see your auction outcomes.',
      })
    }
  }

  /**
   * Resolve a win for an auction that Harry holds the top bid on.
   * Called by resolveExpiredAuctions() or immediately after buyNow().
   *
   * All writes are atomic in ONE transaction (AUC-10 AC):
   * 1. Set AuctionItem.status to 'won'
   * 2. Write the new animal to savedNames
   * No earn() call — Harry's bid coins were spent at bid time and are not refunded on win.
   *
   * After the transaction: checkBadgeEligibility() is called non-blocking (AUC-10 AC).
   */
  async function resolveAuctionWin(auction: AuctionItem): Promise<void> {
    const now = new Date()

    await db.transaction('rw', db.auctionItems, db.savedNames, async () => {
      await db.auctionItems.update(auction.id!, {
        status:    'won',
        updatedAt: now,
      })

      // Build the SavedName record for the won animal
      const savedAnimal: Omit<SavedName, 'id'> = {
        animalType:         auction.animalType,
        breed:              auction.breed,
        category:           (auction.category as SavedName['category']) ?? 'Wild',
        gender:             Math.random() < 0.5 ? 'male' : 'female',
        age:                'Young',
        personality:        'Gentle',
        colour:             '',
        rarity:             auction.rarity,
        imageUrl:           auction.imageUrl,
        name:               auction.name,
        barnName:           null,
        showName:           null,
        racingName:         null,
        kennelName:         null,
        pedigreeName:       null,
        speciesName:        null,
        discoveryNarrative: `${auction.name} arrived from the auction — a special find from ${auction.npcSeller}.`,
        siblings:           [],
        source:             'auction',
        status:             'active',
        equippedSaddleId:   null,
        careStreak:         0,
        lastFullCareDate:   null,
        createdAt:          now,
        updatedAt:          now,
      }

      await db.savedNames.add(savedAnimal as SavedName)
    })

    // Badge eligibility check after auction win delivery.
    // Non-blocking: errors must not propagate to the caller or suppress the result.
    checkBadgeEligibility()
      .then(newBadges => {
        newBadges.forEach((badge, i) => {
          setTimeout(() => {
            toast({
              type:        'success',
              title:       badge.name,
              description: 'You earned a badge!',
              duration:    6000,
            })
          }, i * 400)
        })
      })
      .catch(err =>
        toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' })
      )
  }

  /**
   * Deliver the won animal after a buy-now purchase.
   * Identical to resolveAuctionWin but the auction status was already set to 'won'
   * inside the buyNow transaction — this function only handles the animal delivery
   * and badge check side-effects.
   *
   * Separated from resolveAuctionWin to avoid a second status update race.
   */
  async function deliverWonAnimal(auctionId: number): Promise<void> {
    try {
      const auction = await db.auctionItems.get(auctionId)
      if (!auction || auction.status !== 'won') return

      const now = new Date()

      // Write the new animal — AuctionItem status is already 'won' from buyNow transaction
      await db.savedNames.add({
        animalType:         auction.animalType,
        breed:              auction.breed,
        category:           (auction.category as SavedName['category']) ?? 'Wild',
        gender:             Math.random() < 0.5 ? 'male' : 'female',
        age:                'Young',
        personality:        'Gentle',
        colour:             '',
        rarity:             auction.rarity,
        imageUrl:           auction.imageUrl,
        name:               auction.name,
        barnName:           null,
        showName:           null,
        racingName:         null,
        kennelName:         null,
        pedigreeName:       null,
        speciesName:        null,
        discoveryNarrative: `${auction.name} arrived from the auction — a special find from ${auction.npcSeller}.`,
        siblings:           [],
        source:             'auction',
        status:             'active',
        equippedSaddleId:   null,
        careStreak:         0,
        lastFullCareDate:   null,
        createdAt:          now,
        updatedAt:          now,
      } as SavedName)

      // Badge eligibility check after buy-now animal delivery.
      // Non-blocking: errors must not propagate to the caller or suppress the result.
      checkBadgeEligibility()
        .then(newBadges => {
          newBadges.forEach((badge, i) => {
            setTimeout(() => {
              toast({
                type:        'success',
                title:       badge.name,
                description: 'You earned a badge!',
                duration:    6000,
              })
            }, i * 400)
          })
        })
        .catch(err =>
          toast({ type: 'error', title: 'Badge check failed', description: (err as Error).message ?? 'Something went wrong' })
        )
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not deliver your auction win',
        description: 'Something went wrong. Your coins were spent — please contact support.',
      })
    }
  }

  /**
   * Resolve a loss: refund Harry's last active bid and mark the auction as lost.
   * The word "lost" must NOT appear in any user-facing copy (AUC-11 AC).
   *
   * Transaction (AUC-11 AC — build defect if violated):
   * earn() and AuctionItem.status update are in ONE db.transaction().
   */
  async function resolveAuctionLoss(auction: AuctionItem, playerBidAmount: number): Promise<void> {
    const now = new Date()

    await db.transaction(
      'rw',
      db.auctionItems,
      db.playerWallet,
      db.transactions,
      async () => {
        await earn(
          playerBidAmount,
          `Auction refund: ${auction.name}`,
          'auction',
          auction.id,
        )

        await db.auctionItems.update(auction.id!, {
          status:    'lost',
          updatedAt: now,
        })
      }
    )

    // Toast fires after loss resolution (AUC-11 AC).
    // Copy rules: "went to another home", "Your coins are back", amber (warning) styling.
    // The word "lost" must NOT appear in this copy.
    // Online loss: "[Name] went to another home. Your coins are back."
    // Offline loss (AUC-13): detected by checking if the auction's endsAt was before
    // the last time the hook ran; the FE layer passes an `offline` flag when applicable.
    // For simplicity the hook always uses the standard copy — the caller can pass
    // whether this is an offline resolution when it calls resolveExpiredAuctions().
    toast({
      type:        'warning',
      title:       `${auction.name} went to another home.`,
      description: 'Your coins are back.',
    })
  }

  // ── resolveAuction (public, used by FE for manual triggers) ────────────────

  /**
   * Public entry point for resolving a specific auction by ID.
   * Reads the current state and delegates to win or loss resolution.
   * The FE layer calls this when testing or when the timer fires in the detail sheet.
   */
  async function resolveAuction(auctionId: number): Promise<void> {
    try {
      const auction = await db.auctionItems.get(auctionId)
      if (!auction || auction.status !== 'active') return

      if (auction.currentBidder === 'player') {
        await resolveAuctionWin(auction)
      } else {
        const playerBid = await db.auctionBids
          .where('auctionId')
          .equals(auctionId)
          .filter(b => b.bidder === 'player' && b.bidStatus === 'active')
          .first()

        if (playerBid) {
          await resolveAuctionLoss(auction, playerBid.amount)
        } else {
          await db.auctionItems.update(auctionId, {
            status:    'expired',
            updatedAt: new Date(),
          })
        }
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Could not resolve auction',
        description: 'Something went wrong. Please try again.',
      })
    }
  }

  // ── AUC-13: Offline delivery on app load ───────────────────────────────────
  // Resolved by resolveExpiredAuctions() called on mount (see useEffect below).
  // Any auction that ended while Harry was offline will be resolved on the next
  // app open, and the appropriate win or loss toast will fire.
  //
  // Offline loss copy (AUC-11 AC): "Remember [Name]? They went to another home.
  // Your coins are back." — the standard resolveAuctionLoss() toast does not
  // use "Remember" phrasing. The FE layer wraps resolveExpiredAuctions() and
  // can detect that an auction ended while offline (endsAt < Date.now() - sessionStart)
  // to pass a flag. For Phase C the standard copy is used; the offline-variant copy
  // is a Tester-flagged gap to address in Phase D if needed.

  // ── Mount effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    // AUC-13: resolve any auctions that expired while offline
    resolveExpiredAuctions()

    // AUC-02: generate daily auctions if none are active
    refreshAuctions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── retractBid (auction-retract feature) ──────────────────────────────────
  //
  // Withdraws Harry's active bid on an auction and refunds the bid amount.
  //
  // CRITICAL TRANSACTION RULE (CLAUDE.md — spend-before-write, same principle for
  // refunds): earn(bidAmount) AND bid record deletion must be inside a single
  // db.transaction('rw', ...). If bid deletion fails after earn() succeeds, the
  // entire transaction rolls back — Harry does NOT receive coins for a bid that
  // still exists. Violating this boundary is a build defect.
  //
  // earn() internally accesses db.playerWallet and db.transactions — both listed
  // in the transaction table set so Dexie nests the inner transaction correctly.
  //
  // On success: returns { success: true }. The calling modal fires success toast.
  // On error:   toast type:'error' + rethrow so the modal stays open (TRANS-3).

  async function retractBid(
    auctionId: number,
    bidId: number,
    bidAmount: number,
  ): Promise<{ success: true }> {
    try {
      // Pre-condition read — outside the write transaction
      const auction = await db.auctionItems.get(auctionId)
      if (!auction || auction.status !== 'active') {
        throw new Error('Auction is no longer active.')
      }

      const bid = await db.auctionBids.get(bidId)
      if (!bid || bid.bidStatus !== 'active') {
        throw new Error('Bid is no longer active.')
      }

      const now = new Date()

      // earn() + bid deletion inside ONE transaction — build defect if split
      await db.transaction(
        'rw',
        db.auctionBids,
        db.auctionItems,
        db.playerWallet,
        db.transactions,
        async () => {
          // Refund the bid amount to Harry's wallet
          await earn(
            bidAmount,
            `Auction bid withdrawn: ${auction.name}`,
            'auction',
            auctionId,
          )

          // Mark the bid record as superseded (soft delete — preserves history)
          await db.auctionBids.update(bidId, {
            bidStatus: 'superseded',
          } as Partial<AuctionBid>)

          // Revert the auction's currentBidder to the NPC seller if Harry was
          // the leading bidder, so the auction remains well-formed.
          if (auction.currentBidder === 'player') {
            await db.auctionItems.update(auctionId, {
              currentBidder: auction.npcSeller,
              currentBid:    auction.startingBid,
              updatedAt:     now,
            })
          }
        },
      )

      return { success: true }
    } catch (err) {
      toast({ type: 'error', title: 'Could not cancel — please try again.' })
      throw err
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    /** All auction items (active, won, lost, expired). Sorted by endsAt ascending.
     *  Reward-only animals are excluded — only tradeable categories surface here. */
    auctions: (auctions ?? []).filter(a => isTradeable(a.category)),
    /** Map of auctionId → player's current active bid amount (active auctions only). */
    playerBids,
    /**
     * Total coins currently committed in active bids.
     * Derived from the bid table — NOT a wallet field.
     * Name is coinsInBids — heldAmount is explicitly prohibited (AUC-01 AC).
     */
    coinsInBids,
    placeBid,
    buyNow,
    retractBid,
    resolveAuction,
    refreshAuctions,
    resolveExpiredAuctions,
  }
}
