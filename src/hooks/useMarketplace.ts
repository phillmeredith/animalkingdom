// useMarketplace — NPC market offers + player listings
// Depends on: useWallet, useSavedNames
//
// Player-listing lifecycle (listPet, cancelListing, completeSale, NPC offer scheduling)
// is owned by usePlayerListings. The player-listing methods on this hook delegate to
// those implementations to avoid duplicated logic. The FE may call either hook —
// both are authoritative over their named methods.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useToast } from '@/components/ui/Toast'
import { ANIMALS } from '@/data/animals'
import { LISTING_EXPIRY_DAYS } from '@/hooks/usePlayerListings'
import type { MarketOffer, PlayerListing, NpcBuyerOffer, Rarity, SavedName } from '@/lib/db'

// ─── NPC name pool ────────────────────────────────────────────────────────────

const NPC_SELLERS = [
  { name: 'Farmer Joe', personality: 'friendly' },
  { name: 'Lady Hartwell', personality: 'posh' },
  { name: 'Ranger Silva', personality: 'adventurous' },
  { name: 'Old Brennan', personality: 'gruff' },
  { name: 'Dr Patel', personality: 'scientific' },
  { name: 'Captain Reyes', personality: 'seafarer' },
  { name: 'Miss Tanaka', personality: 'cheerful' },
  { name: 'Baron Klaus', personality: 'mysterious' },
]

const RARITY_MARKET_VALUES: Record<Rarity, [number, number]> = {
  common:    [30,  80],
  uncommon:  [80,  200],
  rare:      [200, 500],
  epic:      [500, 1200],
  legendary: [1200, 3000],
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateOffer(type: 'buy' | 'sell'): Omit<MarketOffer, 'id'> {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const weights = [40, 30, 20, 8, 2]
  let roll = Math.random() * 100
  let rarity: Rarity = 'common'
  for (let i = 0; i < rarities.length; i++) {
    roll -= weights[i]
    if (roll <= 0) { rarity = rarities[i]; break }
  }

  const [min, max] = RARITY_MARKET_VALUES[rarity]
  const price = randomBetween(min, max)
  const npc = NPC_SELLERS[Math.floor(Math.random() * NPC_SELLERS.length)]
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h

  return {
    type,
    animalType: animal.animalType,
    breed: animal.breed,
    rarity,
    imageUrl: animal.imageUrl,
    price,
    npcName: npc.name,
    npcPersonality: npc.personality,
    status: 'pending',
    expiresAt,
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMarketplace() {
  const { earn, spend } = useWallet()
  const { checkBadgeEligibility } = useProgress()
  const { toast } = useToast()

  const offers = useLiveQuery(
    () => db.marketOffers.where('status').equals('pending').toArray(),
    [],
    [] as MarketOffer[],
  )

  const listings = useLiveQuery(
    () => db.playerListings.where('status').equals('active').toArray(),
    [],
    [] as PlayerListing[],
  )

  const npcOffers = useLiveQuery(
    () => db.npcBuyerOffers.where('status').equals('pending').toArray(),
    [],
    [] as NpcBuyerOffer[],
  )

  // ── Generate daily market refresh ──────────────────────────────────────────

  async function refreshOffers(): Promise<void> {
    const now = new Date()

    // Expire old offers
    const allOffers = await db.marketOffers.toArray()
    for (const offer of allOffers) {
      if (offer.status === 'pending' && offer.expiresAt < now) {
        await db.marketOffers.update(offer.id!, { status: 'expired', updatedAt: now })
      }
    }

    // Ensure at least 6 pending offers (3 buy + 3 sell)
    const pending = await db.marketOffers.where('status').equals('pending').toArray()
    const buys = pending.filter(o => o.type === 'buy').length
    const sells = pending.filter(o => o.type === 'sell').length

    const newOffers: Omit<MarketOffer, 'id'>[] = []
    for (let i = buys; i < 4; i++) newOffers.push(generateOffer('buy'))
    for (let i = sells; i < 4; i++) newOffers.push(generateOffer('sell'))

    for (const o of newOffers) await db.marketOffers.add(o)
  }

  // ── Accept NPC buy offer (NPC buying from player) ──────────────────────────
  // type='buy': NPC wants to buy an animal — player sells one matching the criteria
  //
  // TD-PL-001: acceptBuyOffer and acceptSellOffer lack try/catch with toast().
  // This is a pre-existing omission, not introduced by the player-listings feature.
  // Fixing it is out of scope for this phase but must be addressed before these
  // functions are surfaced to any new UI surface.
  async function acceptBuyOffer(offerId: number, pet: SavedName): Promise<boolean> {
    const offer = await db.marketOffers.get(offerId)
    if (!offer || offer.status !== 'pending') return false

    const now = new Date()
    await db.transaction('rw', db.marketOffers, db.savedNames, db.playerWallet, db.transactions, async () => {
      await db.marketOffers.update(offerId, { status: 'accepted', updatedAt: now })
      await db.savedNames.delete(pet.id!)
      // earn() runs inside the transaction so coins and pet deletion are atomic
      await earn(offer.price, `Sold ${pet.name} to ${offer.npcName}`, 'marketplace', pet.id)
    })

    return true
  }

  // ── Accept NPC sell offer (NPC selling an animal — player buys) ─────────────
  // Transaction integrity: spend() + marketOffers.update() + savedNames.add() are
  // inside a single db.transaction() so coins and pet delivery are atomic.
  // If any write throws, the whole transaction rolls back (spend() is reversed).
  async function acceptSellOffer(offerId: number): Promise<boolean> {
    const offer = await db.marketOffers.get(offerId)
    if (!offer || offer.status !== 'pending') return false

    // Look up the correct category from the animal catalogue (QA-005 / QA-037)
    // Resolved before the transaction — ANIMALS is a synchronous in-memory array.
    const animalDef = ANIMALS.find(
      a => a.animalType === offer.animalType && a.breed === offer.breed,
    )

    try {
      await db.transaction(
        'rw',
        db.marketOffers,
        db.savedNames,
        db.playerWallet,
        db.transactions,
        async () => {
          const paid = await spend(offer.price, `Bought from ${offer.npcName}`, 'marketplace')
          if (!paid.ok) throw new Error('Not enough coins')

          const now = new Date()
          await db.marketOffers.update(offerId, { status: 'accepted', updatedAt: now })

          // Name left empty — UI naming modal will set it (naming pending signal)
          await db.savedNames.add({
            name: '',
            animalType: offer.animalType,
            breed: offer.breed,
            category: animalDef?.category ?? 'At Home',
            gender: Math.random() > 0.5 ? 'male' : 'female',
            age: 'Adult',
            personality: 'Friendly',
            colour: 'Mixed',
            rarity: offer.rarity,
            imageUrl: offer.imageUrl,
            barnName: null, showName: null, racingName: null, kennelName: null,
            pedigreeName: null, speciesName: null,
            discoveryNarrative: `You purchased this ${offer.breed} from ${offer.npcName} at the marketplace.`,
            siblings: [],
            source: 'marketplace',
            status: 'active',
            equippedSaddleId: null,
            careStreak: 0,
            lastFullCareDate: null,
            createdAt: now,
            updatedAt: now,
          })
        },
      )
    } catch (err) {
      const isInsufficientFunds = err instanceof Error && err.message === 'Not enough coins'
      toast({
        type: 'error',
        title: 'Purchase failed',
        message: isInsufficientFunds
          ? 'You do not have enough coins.'
          : 'Your coins have not been charged.',
      })
      return false
    }

    return true
  }

  async function declineOffer(offerId: number): Promise<void> {
    try {
      await db.marketOffers.update(offerId, { status: 'declined', updatedAt: new Date() })
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      throw err
    }
  }

  // ── Player listings ────────────────────────────────────────────────────────

  // createListing — kept for backwards compatibility with existing FE callers.
  // New code should call usePlayerListings.listPet() which owns the full lifecycle
  // (7-day expiry, spec-compliant NPC offer timing, toast on success/error).
  // This implementation is aligned with usePlayerListings: uses LISTING_EXPIRY_DAYS
  // constant and does NOT immediately generate NPC offers (that is usePlayerListings'
  // responsibility via scheduleNpcOffers).
  async function createListing(pet: SavedName, askingPrice: number): Promise<void> {
    try {
      if (pet.status === 'for_sale') {
        toast({ type: 'error', title: 'Something went wrong — please try again.' })
        throw new Error('Pet is already listed for sale.')
      }

      const [min, max] = RARITY_MARKET_VALUES[pet.rarity]
      const marketValue = randomBetween(min, max)
      const now = new Date()

      await db.transaction('rw', db.playerListings, db.savedNames, async () => {
        await db.savedNames.update(pet.id!, { status: 'for_sale', updatedAt: now })
        await db.playerListings.add({
          petId: pet.id!,
          petName: pet.name,
          breed: pet.breed,
          rarity: pet.rarity,
          imageUrl: pet.imageUrl,
          askingPrice,
          marketValue,
          viewCount: 0,
          status: 'active',
          soldTo: null,
          soldPrice: null,
          listedAt: now,
          // LISTING_EXPIRY_DAYS constant — 7 days (not the previous hardcoded 24h)
          expiresAt: new Date(now.getTime() + LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
          soldAt: null,
          updatedAt: now,
        })
      })

      // NPC offer scheduling is handled by usePlayerListings.listPet().
      // If callers use createListing() directly (legacy path), they must call
      // usePlayerListings.listPet() instead to get spec-compliant offer timing.
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message !== 'Pet is already listed for sale.') {
        toast({ type: 'error', title: 'Something went wrong — please try again.' })
      }
      throw err
    }
  }

  async function cancelListing(listingId: number): Promise<void> {
    try {
      const listing = await db.playerListings.get(listingId)
      if (!listing) return
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

  async function acceptNpcBuyerOffer(npcOfferId: number): Promise<boolean> {
    try {
      const npcOffer = await db.npcBuyerOffers.get(npcOfferId)
      if (!npcOffer || npcOffer.status !== 'pending') return false

      const listing = await db.playerListings.get(npcOffer.listingId)
      if (!listing || listing.status !== 'active') return false

      const now = new Date()
      await db.transaction('rw', db.playerListings, db.npcBuyerOffers, db.savedNames, db.playerWallet, db.transactions, async () => {
        await db.playerListings.update(listing.id!, {
          status: 'sold', soldTo: npcOffer.npcName,
          soldPrice: npcOffer.offerPrice, soldAt: now, updatedAt: now,
        })
        await db.npcBuyerOffers.update(npcOfferId, { status: 'accepted', updatedAt: now })
        await db.savedNames.delete(listing.petId)
        // earn() runs inside the transaction so coins and pet deletion are atomic.
        // Copy uses "found a new home" (not "sold") per UR finding and spec PL-7.
        await earn(
          npcOffer.offerPrice,
          `${listing.petName} found a new home with ${npcOffer.npcName}`,
          'marketplace',
          listing.petId,
        )

        // Auto-decline all other pending offers for the same listing (spec PL-7)
        const competing = await db.npcBuyerOffers
          .where('listingId').equals(npcOffer.listingId)
          .filter(o => o.id !== npcOfferId && o.status === 'pending')
          .toArray()
        for (const o of competing) {
          await db.npcBuyerOffers.update(o.id!, { status: 'declined', updatedAt: now })
        }
      })

      // Badge eligibility check after successful marketplace event.
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

      return true
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      throw err
    }
  }

  async function declineNpcBuyerOffer(npcOfferId: number): Promise<void> {
    try {
      await db.npcBuyerOffers.update(npcOfferId, { status: 'declined', updatedAt: new Date() })
    } catch (err) {
      toast({ type: 'error', title: 'Something went wrong — please try again.' })
      throw err
    }
  }

  return {
    offers,
    listings,
    npcOffers,
    refreshOffers,
    acceptBuyOffer,
    acceptSellOffer,
    declineOffer,
    createListing,
    cancelListing,
    acceptNpcBuyerOffer,
    declineNpcBuyerOffer,
  }
}
