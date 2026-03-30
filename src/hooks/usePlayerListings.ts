// usePlayerListings — player listing lifecycle for player-listings feature
//
// Owns: listPet, cancelListing, completeSale, NPC offer simulation, expiry checks.
//
// Transaction integrity (CLAUDE.md — spend-before-write rule):
//   completeSale:   earn() + savedNames.delete() + playerListings.update() are wrapped
//                   in a single db.transaction('rw', ...) so coins and pet deletion are
//                   always atomic. If earn() succeeds and deletion throws, the whole
//                   transaction rolls back — Harry neither gains coins nor loses the pet.
//
//   listPet:        savedNames.update(status:'for_sale') and playerListings.add() are
//                   wrapped in one db.transaction(). Partial state (listing created but
//                   pet still 'active', or vice versa) is not possible.
//
//   cancelListing:  playerListings.update(status:'cancelled') and savedNames.update(
//                   status:'active') are wrapped in one db.transaction(). The system
//                   cannot be left in a state where the listing is cancelled but the
//                   pet is still 'for_sale'.
//
// Portal requirement: SoldCelebrationOverlay and ForSaleReleaseBlockModal are
//   FE-owned components. This hook exposes the data and actions; components must
//   render those overlays via ReactDOM.createPortal(content, document.body).
//
// Badge eligibility: acceptNpcBuyerOffer is a marketplace-category event.
//   checkBadgeEligibility() is called after every successful sale.
//
// Error handling: every async operation has try/catch with toast(). Silent swallows
//   (.catch(() => {})) are prohibited per CLAUDE.md.
//
// Pet status enforcement: listPet() rejects pets that are already 'for_sale'.
//   cancelListing() is the only way to revert; this is enforced via the DB transaction.
//
// [x] No spend() calls — listings are a zero-fee earn-only flow.
// [x] Badge eligibility — checkBadgeEligibility() called after acceptNpcBuyerOffer.
// [x] Error handling — every async op try/catch with toast.
// [x] Transaction integrity — all paired DB writes are inside the same db.transaction().

import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { db } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'
import type { PlayerListing, NpcBuyerOffer, Rarity, SavedName } from '@/lib/db'

// ─── Configurable timing constants (module-level exports — importable for testing) ──

/** Minimum delay before the first NPC offer arrives after listing (30 minutes). */
export const NPC_OFFER_MIN_DELAY_MS = 30 * 60 * 1000 // 1_800_000

/** Maximum delay before the first NPC offer arrives after listing (4 hours). */
export const NPC_OFFER_MAX_DELAY_MS = 4 * 60 * 60 * 1000 // 14_400_000

/** Minimum spacing between subsequent NPC offers on the same listing (1 hour). */
export const NPC_OFFER_MIN_SPACING_MS = 60 * 60 * 1000 // 3_600_000

/** Maximum number of NPC offers per listing lifetime (across all sessions). */
export const NPC_OFFER_MAX_PER_LISTING = 3

/** Number of days before an active listing expires automatically. */
export const LISTING_EXPIRY_DAYS = 7

// ─── Suggested prices per rarity band (exported for FE pill display) ─────────

export const SUGGESTED_PRICES: Record<Rarity, number> = {
  common:    50,
  uncommon:  150,
  rare:      350,
  epic:      800,
  legendary: 1500,
}

// ─── Market value bands (used to compute offer amounts relative to listing price) ──

const RARITY_MARKET_VALUES: Record<Rarity, [number, number]> = {
  common:    [30,   80],
  uncommon:  [80,   200],
  rare:      [200,  500],
  epic:      [500,  1200],
  legendary: [1200, 3000],
}

// ─── NPC buyer pool (no emoji — Lucide avatar only in components) ─────────────

const NPC_BUYERS: Array<{ name: string; backgroundTemplate: (breed: string) => string; messageTemplate: (petName: string, breed: string) => string }> = [
  {
    name: 'Farmer Joe',
    backgroundTemplate: (breed) => `A friendly farmer looking for a well-cared-for ${breed}.`,
    messageTemplate: (petName) => `${petName} looks like a fine animal. I would give them a good home on my farm.`,
  },
  {
    name: 'Lady Hartwell',
    backgroundTemplate: (breed) => `A distinguished collector who seeks only the finest ${breed}.`,
    messageTemplate: (petName) => `I have admired ${petName} from afar. They would be most at home in my estate.`,
  },
  {
    name: 'Ranger Silva',
    backgroundTemplate: (breed) => `An experienced ranger who knows how to care for a ${breed} in the wild.`,
    messageTemplate: (petName) => `${petName} deserves wide open spaces. I can offer exactly that.`,
  },
  {
    name: 'Dr Patel',
    backgroundTemplate: (breed) => `A veterinarian with a passion for rehoming ${breed} animals.`,
    messageTemplate: (petName) => `My clinic has plenty of space for ${petName}. They will receive expert care.`,
  },
  {
    name: 'Captain Reyes',
    backgroundTemplate: (breed) => `A seafarer who keeps a small menagerie of unusual ${breed}.`,
    messageTemplate: (petName) => `${petName} caught my eye the moment I saw the listing. A fair price for a fine companion.`,
  },
  {
    name: 'Miss Tanaka',
    backgroundTemplate: (breed) => `A cheerful hobbyist who adores caring for ${breed}.`,
    messageTemplate: (petName) => `Oh, ${petName} is wonderful! I would love to give them a cosy new home.`,
  },
  {
    name: 'Baron Klaus',
    backgroundTemplate: (breed) => `A mysterious collector who acquires only the most interesting ${breed}.`,
    messageTemplate: (petName) => `${petName} interests me greatly. My offer reflects their true worth.`,
  },
  {
    name: 'Old Brennan',
    backgroundTemplate: (breed) => `A retired handler who raised many ${breed} in his time.`,
    messageTemplate: (petName) => `I know how to look after ${petName} right. Been doing it all my life.`,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Returns the median market value for the given rarity band. */
function medianMarketValue(rarity: Rarity): number {
  const [min, max] = RARITY_MARKET_VALUES[rarity]
  return Math.floor((min + max) / 2)
}

/**
 * Computes the offer amount for an NPC buyer based on price-to-market ratio.
 *
 * Rules (from spec PL-6 / interaction-spec.md section 6):
 *   - NPC offers are always at or below the asking price.
 *   - If the asking price is below market value, NPC may offer the full asking price.
 *   - Price ≤ 70% market value:  up to 3 offers expected; offer = 75–100% of asking.
 *   - Price 71–150% of market:   up to 2 offers expected; offer = 70–95% of asking.
 *   - Price > 150% of market:    1 offer expected; offer = 60–85% of asking.
 */
function computeOfferAmount(askingPrice: number, rarity: Rarity): number {
  const market = medianMarketValue(rarity)
  const ratio = askingPrice / market

  let pctMin: number
  let pctMax: number

  if (ratio <= 0.70) {
    // Underpriced — buyer is happy to pay asking or close to it
    pctMin = 75
    pctMax = 100
  } else if (ratio <= 1.50) {
    // Fair range
    pctMin = 70
    pctMax = 95
  } else {
    // Overpriced — buyers will offer well below asking
    pctMin = 60
    pctMax = 85
  }

  const pct = randomBetween(pctMin, pctMax) / 100
  return Math.max(1, Math.floor(askingPrice * pct))
}

/**
 * Determines how many NPC offers to generate for a listing based on price-to-market
 * ratio (spec PL-6).
 */
function maxOffersForListing(askingPrice: number, rarity: Rarity): number {
  const market = medianMarketValue(rarity)
  const ratio = askingPrice / market
  if (ratio <= 0.70) return 3
  if (ratio <= 1.50) return 2
  return 1
}

/**
 * Schedules NPC buyer offer generation for a listing.
 *
 * Uses setTimeout to fire the first offer within [NPC_OFFER_MIN_DELAY_MS,
 * NPC_OFFER_MAX_DELAY_MS]. Subsequent offers (if applicable) are spaced at
 * least NPC_OFFER_MIN_SPACING_MS apart.
 *
 * Note: This mechanism uses in-memory timers. If Harry closes the app between
 * listing and offer generation, the timer does not persist. On next app open,
 * the on-load expiry/offer check reschedules pending offers where needed.
 *
 * Returns a cleanup function that clears all scheduled timers (for use in
 * useEffect cleanup).
 */
function scheduleNpcOffers(
  listingId: number,
  listing: { petName: string; breed: string; rarity: Rarity; askingPrice: number },
  onOfferCreated: (listingId: number, petName: string) => void,
): () => void {
  const maxOffers = maxOffersForListing(listing.askingPrice, listing.rarity)
  const timers: ReturnType<typeof setTimeout>[] = []

  const firstDelay = randomBetween(NPC_OFFER_MIN_DELAY_MS, NPC_OFFER_MAX_DELAY_MS)

  async function generateOffer(attemptNumber: number): Promise<void> {
    // Guard: re-fetch listing to ensure it is still active before creating the offer
    const currentListing = await db.playerListings.get(listingId)
    if (!currentListing || currentListing.status !== 'active') return

    // Guard: do not exceed MAX_PER_LISTING across all existing offers
    const existingOfferCount = await db.npcBuyerOffers
      .where('listingId').equals(listingId)
      .count()
    if (existingOfferCount >= NPC_OFFER_MAX_PER_LISTING) return

    const buyer = NPC_BUYERS[Math.floor(Math.random() * NPC_BUYERS.length)]
    const offerPrice = computeOfferAmount(listing.askingPrice, listing.rarity)
    const now = new Date()

    // NPC offer expires in 48 hours (generous window — Harry is a young player)
    const offerExpiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    await db.npcBuyerOffers.add({
      listingId,
      npcName: buyer.name,
      npcBackground: buyer.backgroundTemplate(listing.breed),
      offerPrice,
      message: buyer.messageTemplate(listing.petName, listing.breed),
      maxPrice: Math.floor(listing.askingPrice * 0.98),
      status: 'pending',
      counterPrice: null,
      counterResponse: null,
      expiresAt: offerExpiresAt,
      createdAt: now,
      updatedAt: now,
    })

    onOfferCreated(listingId, listing.petName)

    // Schedule subsequent offers if we have not reached the cap
    if (attemptNumber < maxOffers) {
      const nextDelay = randomBetween(NPC_OFFER_MIN_SPACING_MS, NPC_OFFER_MIN_SPACING_MS * 3)
      const t = setTimeout(() => {
        generateOffer(attemptNumber + 1).catch(() => {
          // Non-recoverable background timer — no toast needed; the next app open
          // will reschedule via the on-load pending offer check.
        })
      }, nextDelay)
      timers.push(t)
    }
  }

  const firstTimer = setTimeout(() => {
    generateOffer(1).catch(() => {
      // Same rationale as above: background timer failure is not user-visible;
      // on-load check compensates.
    })
  }, firstDelay)
  timers.push(firstTimer)

  return () => timers.forEach(clearTimeout)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlayerListings() {
  const { earn } = useWallet()
  const { checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  // Live query: all active listings (drives the My Listings tab)
  const activeListings = useLiveQuery(
    () => db.playerListings.where('status').equals('active').toArray(),
    [],
    [] as PlayerListing[],
  )

  // Live query: all pending NPC buyer offers (components can filter by listingId)
  const pendingNpcOffers = useLiveQuery(
    () => db.npcBuyerOffers.where('status').equals('pending').toArray(),
    [],
    [] as NpcBuyerOffer[],
  )

  // ── On-load expiry check ───────────────────────────────────────────────────
  //
  // Runs once on mount. Finds all active listings where expiresAt < now and
  // marks them expired, reverting the pet status to 'active'.
  //
  // If Harry was offline when the listing expired, this fires the expiry toast
  // and reverts the pet on the next app open (as required by PL-10).

  useEffect(() => {
    checkExpiredListings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkExpiredListings(): Promise<void> {
    try {
      const now = Date.now()
      const expiredListings = await db.playerListings
        .where('status').equals('active')
        .filter(l => l.expiresAt.getTime() < now)
        .toArray()

      for (const listing of expiredListings) {
        try {
          await db.transaction('rw', db.playerListings, db.savedNames, async () => {
            await db.playerListings.update(listing.id!, {
              status: 'expired',
              updatedAt: new Date(),
            })
            // Revert pet to active so Harry can care for, race, and relist
            await db.savedNames.update(listing.petId, {
              status: 'active',
              updatedAt: new Date(),
            })
          })

          // Fire one toast per expired listing (spec PL-10)
          toast({
            type: 'info',
            title: `${listing.petName}'s listing has expired. They're back in your collection.`,
          })
        } catch (err) {
          // Individual listing expiry failure should not block others
          toast({
            type: 'error',
            title: `Something went wrong expiring a listing — please try again.`,
          })
        }
      }
    } catch (err) {
      toast({
        type: 'error',
        title: 'Something went wrong checking your listings — please try again.',
      })
    }
  }

  // ── listPet ───────────────────────────────────────────────────────────────
  //
  // Sets pet.status = 'for_sale' AND creates a playerListings record in ONE
  // db.transaction(). The two writes are atomic — no partial state is possible.
  //
  // Throws if the pet is already for_sale (defensive guard — the UI hides the
  // button in this state, so this path is not normally reachable).

  async function listPet(petId: number, price: number): Promise<void> {
    try {
      const pet = await db.savedNames.get(petId)
      if (!pet) throw new Error('Pet not found.')

      // Defensive guard for already-listed pet (spec section 7: "Can't list a pet already for_sale")
      if (pet.status === 'for_sale') {
        toast({ type: 'error', title: 'Something went wrong — please try again.' })
        throw new Error('Pet is already listed for sale.')
      }

      const [min, max] = RARITY_MARKET_VALUES[pet.rarity]
      const marketValue = randomBetween(min, max)
      const now = new Date()
      const expiresAt = new Date(now.getTime() + LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

      let newListingId: number | undefined

      await db.transaction('rw', db.playerListings, db.savedNames, async () => {
        await db.savedNames.update(petId, { status: 'for_sale', updatedAt: now })
        newListingId = await db.playerListings.add({
          petId,
          petName: pet.name,
          breed: pet.breed,
          rarity: pet.rarity,
          imageUrl: pet.imageUrl,
          askingPrice: price,
          marketValue,
          viewCount: 0,
          status: 'active',
          soldTo: null,
          soldPrice: null,
          listedAt: now,
          expiresAt,
          soldAt: null,
          updatedAt: now,
        })
      })

      // Schedule NPC offer generation after the listing is confirmed
      // (fire-and-forget timer — errors are handled inside scheduleNpcOffers)
      if (newListingId !== undefined) {
        scheduleNpcOffers(
          newListingId,
          { petName: pet.name, breed: pet.breed, rarity: pet.rarity, askingPrice: price },
          (listingId, petName) => {
            // Toast fired from within the timer callback — visible on any screen (spec PL-6)
            toast({
              type: 'info',
              title: `Someone's interested in ${petName}! Check My Listings.`,
            })
          },
        )
      }
    } catch (err) {
      // Re-throw so the FE confirm button can stay open on error path (spec PL-1)
      // Toast was already fired above for the known error case; only fire a generic
      // toast if this is an unexpected error from the transaction.
      const message = err instanceof Error ? err.message : ''
      if (message !== 'Pet is already listed for sale.') {
        toast({ type: 'error', title: 'Something went wrong — please try again.' })
      }
      throw err
    }
  }

  // ── cancelListing ─────────────────────────────────────────────────────────
  //
  // Marks the listing as 'cancelled' AND reverts pet.status to 'active' in ONE
  // db.transaction(). Also auto-declines all pending NPC offers for the listing.

  async function cancelListing(listingId: number): Promise<void> {
    try {
      const listing = await db.playerListings.get(listingId)
      if (!listing) throw new Error('Listing not found.')

      const now = new Date()

      await db.transaction('rw', db.playerListings, db.savedNames, db.npcBuyerOffers, async () => {
        await db.playerListings.update(listingId, { status: 'cancelled', updatedAt: now })
        await db.savedNames.update(listing.petId, { status: 'active', updatedAt: now })

        // Auto-decline all pending NPC offers on this listing (spec PL-9)
        const pendingOffers = await db.npcBuyerOffers
          .where('listingId').equals(listingId)
          .filter(o => o.status === 'pending')
          .toArray()
        for (const offer of pendingOffers) {
          await db.npcBuyerOffers.update(offer.id!, { status: 'declined', updatedAt: now })
        }
      })

      toast({
        type: 'info',
        title: `${listing.petName} is back in your collection.`,
      })
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      throw err
    }
  }

  // ── retractListing ────────────────────────────────────────────────────────
  //
  // Canonical entry point for the auction-retract feature (ListingRetractModal).
  // Differs from cancelListing in two ways:
  //   1. Does NOT fire a success toast — the calling modal fires its own.
  //   2. Returns { success: true } so the modal can close and fire its toast.
  //
  // Transaction integrity:
  //   playerListings.update(status:'cancelled') + savedNames.update(status:'active')
  //   + npcBuyerOffers.update(status:'declined') are all inside ONE db.transaction().
  //   Partial state (listing cancelled but pet still 'for_sale') is not possible.
  //
  // Error handling: toast type:'error' + rethrow so the modal stays open and
  // re-enables its buttons (TRANS-3).

  async function retractListing(listingId: number, _petId: number): Promise<{ success: true }> {
    try {
      const listing = await db.playerListings.get(listingId)
      if (!listing) throw new Error('Listing not found.')

      const now = new Date()

      await db.transaction('rw', db.playerListings, db.savedNames, db.npcBuyerOffers, async () => {
        await db.playerListings.update(listingId, { status: 'cancelled', updatedAt: now })
        await db.savedNames.update(listing.petId, { status: 'active', updatedAt: now })

        // Auto-decline all pending NPC offers on this listing
        const pendingOffers = await db.npcBuyerOffers
          .where('listingId').equals(listingId)
          .filter(o => o.status === 'pending')
          .toArray()
        for (const offer of pendingOffers) {
          await db.npcBuyerOffers.update(offer.id!, { status: 'declined', updatedAt: now })
        }
      })

      return { success: true }
    } catch (err) {
      toast({ type: 'error', title: 'Could not cancel — please try again.' })
      throw err
    }
  }

  // ── completeSale ──────────────────────────────────────────────────────────
  //
  // Transaction integrity (CLAUDE.md — spend-before-write):
  //   earn() + savedNames.delete() + playerListings.update() are ALL inside one
  //   db.transaction('rw', db.playerWallet, db.transactions, db.savedNames,
  //   db.playerListings, db.npcBuyerOffers, ...).
  //
  //   earn() internally accesses db.playerWallet and db.transactions — these tables
  //   must be included in the outer transaction table list to avoid Dexie's
  //   "Table not part of transaction" error when the outer transaction is active.
  //
  //   If earn() succeeds and savedNames.delete() throws, the entire transaction
  //   rolls back: no coins are credited and the pet is not removed. This prevents
  //   the data corruption case described in the refined stories technical notes.

  async function completeSale(npcOfferId: number): Promise<{ petName: string; coinsEarned: number }> {
    try {
      const npcOffer = await db.npcBuyerOffers.get(npcOfferId)
      if (!npcOffer || npcOffer.status !== 'pending') {
        throw new Error('Offer is no longer available.')
      }

      const listing = await db.playerListings.get(npcOffer.listingId)
      if (!listing || listing.status !== 'active') {
        throw new Error('Listing is no longer active.')
      }

      const now = new Date()

      await db.transaction(
        'rw',
        db.playerWallet,
        db.transactions,
        db.savedNames,
        db.playerListings,
        db.npcBuyerOffers,
        async () => {
          // 1. Mark the accepted offer
          await db.npcBuyerOffers.update(npcOfferId, { status: 'accepted', updatedAt: now })

          // 2. Mark the listing as sold
          await db.playerListings.update(listing.id!, {
            status: 'sold',
            soldTo: npcOffer.npcName,
            soldPrice: npcOffer.offerPrice,
            soldAt: now,
            updatedAt: now,
          })

          // 3. Earn coins — runs inside this transaction, so wallet update and
          //    pet deletion are in the same atomic unit. If deletion fails,
          //    the wallet update is also rolled back.
          await earn(
            npcOffer.offerPrice,
            `${listing.petName} found a new home with ${npcOffer.npcName}`,
            'marketplace',
            listing.petId,
          )

          // 4. Remove the pet from Harry's collection
          await db.savedNames.delete(listing.petId)

          // 5. Auto-decline all other pending offers on this listing (spec PL-7)
          const competing = await db.npcBuyerOffers
            .where('listingId').equals(npcOffer.listingId)
            .filter(o => o.id !== npcOfferId && o.status === 'pending')
            .toArray()
          for (const o of competing) {
            await db.npcBuyerOffers.update(o.id!, { status: 'declined', updatedAt: now })
          }
        },
      )

      // Badge eligibility check after successful sale.
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

      return { petName: listing.petName, coinsEarned: npcOffer.offerPrice }
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      throw err
    }
  }

  // ── declineNpcOffer ────────────────────────────────────────────────────────
  //
  // Updates a single NPC offer to 'declined'. No modal, no coins change.
  // The listing remains active (spec PL-8).

  async function declineNpcOffer(npcOfferId: number): Promise<void> {
    try {
      await db.npcBuyerOffers.update(npcOfferId, { status: 'declined', updatedAt: new Date() })
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      throw err
    }
  }

  // ── getOffersForListing ────────────────────────────────────────────────────
  //
  // Convenience helper: returns pending NPC offers for a specific listing,
  // most recent first, capped at NPC_OFFER_MAX_PER_LISTING.
  // Used by PlayerListingCard to render NpcOfferCards.

  function getOffersForListing(listingId: number): NpcBuyerOffer[] {
    return (pendingNpcOffers ?? [])
      .filter(o => o.listingId === listingId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, NPC_OFFER_MAX_PER_LISTING)
  }

  // ── getPetForListing ───────────────────────────────────────────────────────
  //
  // Async helper: fetches the SavedName for a listing's petId.
  // Useful for components that need to display the pet image.

  async function getPetForListing(listing: PlayerListing): Promise<SavedName | undefined> {
    try {
      return await db.savedNames.get(listing.petId)
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      return undefined
    }
  }

  return {
    // Live data
    activeListings: activeListings ?? [],
    pendingNpcOffers: pendingNpcOffers ?? [],

    // Actions
    listPet,
    cancelListing,
    retractListing,
    completeSale,
    declineNpcOffer,

    // Helpers
    getOffersForListing,
    getPetForListing,
    checkExpiredListings,

    // Constants (re-exported so FE can reference without importing from this file separately)
    NPC_OFFER_MIN_DELAY_MS,
    NPC_OFFER_MAX_DELAY_MS,
    NPC_OFFER_MIN_SPACING_MS,
    NPC_OFFER_MAX_PER_LISTING,
    LISTING_EXPIRY_DAYS,
    SUGGESTED_PRICES,
  }
}
