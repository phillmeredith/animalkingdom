// PlayerListingCard — full-width card for an active player listing
//
// Shows pet summary, asking price, listed date, NPC offers (if any), and a
// "Remove" button that opens DelistModal.
//
// NpcOfferCard is co-located here as it only renders inside a PlayerListingCard.
//
// DS compliance:
//   - Left accent: 3px solid var(--amber) via inline style (not Tailwind border-l
//     which would also render on other sides via shorthand)
//   - NpcOfferCard border: 1px solid var(--amber) — intentional money theme
//   - Accept: variant="accent" (pink)
//   - Decline: variant="outline"
//   - NPC avatar: User Lucide icon in a circle (no emoji, no initials text)
//   - No ghost variant anywhere

import { useState } from 'react'
import { Coins, User, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RarityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { DelistModal } from './DelistModal'
import { AcceptOfferModal } from './AcceptOfferModal'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { PlayerListing, NpcBuyerOffer } from '@/lib/db'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "Listed X days ago" string based on listing listedAt date. */
function daysAgoLabel(listedAt: Date): string {
  const msPerDay = 1000 * 60 * 60 * 24
  const days = Math.floor((Date.now() - listedAt.getTime()) / msPerDay)
  if (days === 0) return 'Listed today'
  if (days === 1) return 'Listed 1 day ago'
  return `Listed ${days} days ago`
}

// ─── NpcOfferCard ─────────────────────────────────────────────────────────────

interface NpcOfferCardProps {
  offer: NpcBuyerOffer
  onAccept: () => void
  onDecline: () => void
  declining: boolean
}

function NpcOfferCard({ offer, onAccept, onDecline, declining }: NpcOfferCardProps) {
  return (
    <div
      style={{
        background: 'var(--elev)',
        border: '1px solid var(--amber)',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
      }}
    >
      {/* Row 1: avatar + name + offer amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {/* NPC avatar circle */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--elev)',
            border: '1px solid var(--border-s)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <User size={12} strokeWidth={2} color="var(--t3)" />
        </div>

        {/* NPC name */}
        <span
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', flex: 1 }}
          className="truncate"
        >
          {offer.npcName}
        </span>

        {/* Offer amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Coins size={12} strokeWidth={2} color="var(--amber)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber-t)' }}>
            {offer.offerPrice}
          </span>
        </div>
      </div>

      {/* NPC message */}
      {offer.message && (
        <p
          style={{
            fontSize: 13,
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--t2)',
            margin: '0 0 12px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {offer.message}
        </p>
      )}

      {/* Button row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button
          variant="accent"
          size="sm"
          className="flex-1"
          style={{ minHeight: 44 }}
          onClick={onAccept}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          style={{ minHeight: 44 }}
          loading={declining}
          onClick={onDecline}
        >
          Decline
        </Button>
      </div>
    </div>
  )
}

// ─── PlayerListingCard ────────────────────────────────────────────────────────

interface PlayerListingCardProps {
  listing: PlayerListing
  offers: NpcBuyerOffer[]
  onCancelListing: (listingId: number) => Promise<void>
  onAcceptOffer: (npcOfferId: number) => Promise<{ petName: string; coinsEarned: number }>
  onDeclineOffer: (npcOfferId: number) => Promise<void>
}

export function PlayerListingCard({
  listing,
  offers,
  onCancelListing,
  onAcceptOffer,
  onDeclineOffer,
}: PlayerListingCardProps) {
  const reducedMotion = useReducedMotion()

  const [delistOpen, setDelistOpen] = useState(false)
  const [acceptOffer, setAcceptOffer] = useState<NpcBuyerOffer | null>(null)
  const [decliningId, setDecliningId] = useState<number | null>(null)

  // Local state for declined offer ids — so we can animate them out
  const [localDeclinedIds, setLocalDeclinedIds] = useState<number[]>([])

  const visibleOffers = offers.filter(o => !localDeclinedIds.includes(o.id!))

  async function handleDecline(offer: NpcBuyerOffer) {
    if (decliningId) return
    setDecliningId(offer.id!)
    try {
      await onDeclineOffer(offer.id!)
      setLocalDeclinedIds(prev => [...prev, offer.id!])
    } finally {
      setDecliningId(null)
    }
  }

  return (
    <>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border-s)',
          borderLeft: '3px solid var(--amber)',
          borderRadius: 16,
          padding: 16,
        }}
      >
        {/* Row 1: image + info + remove button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AnimalImage
            src={listing.imageUrl}
            alt={listing.petName}
            className="w-12 h-12 rounded-lg object-cover shrink-0"
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + rarity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}
                className="truncate"
              >
                {listing.petName}
              </span>
              <RarityBadge rarity={listing.rarity} />
            </div>

            {/* Asking price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Coins size={12} strokeWidth={2} color="var(--amber)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber-t)' }}>
                {listing.askingPrice}
              </span>
            </div>

            {/* Listed date */}
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--t3)', margin: 0 }}>
              {daysAgoLabel(listing.listedAt)}
            </p>
          </div>

          {/* Remove button — shrink-0, min 44×44 touch target */}
          <Button
            variant="outline"
            size="sm"
            style={{ flexShrink: 0, minHeight: 44, minWidth: 64 }}
            onClick={() => setDelistOpen(true)}
          >
            Remove
          </Button>
        </div>

        {/* Offers area */}
        {visibleOffers.length === 0 ? (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border-s)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--t3)',
                margin: 0,
              }}
            >
              Waiting for buyers...
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <AnimatePresence>
              {visibleOffers.map(offer => (
                <motion.div
                  key={offer.id}
                  exit={
                    reducedMotion
                      ? {}
                      : { x: '-100%', opacity: 0, transition: { duration: 0.3 } }
                  }
                  style={{ overflow: 'hidden' }}
                >
                  <NpcOfferCard
                    offer={offer}
                    onAccept={() => setAcceptOffer(offer)}
                    onDecline={() => handleDecline(offer)}
                    declining={decliningId === offer.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delist confirmation modal */}
      <DelistModal
        petName={listing.petName}
        open={delistOpen}
        onClose={() => setDelistOpen(false)}
        onConfirm={async () => {
          await onCancelListing(listing.id!)
          setDelistOpen(false)
        }}
      />

      {/* Accept offer confirmation modal */}
      <AcceptOfferModal
        offer={acceptOffer}
        open={acceptOffer !== null}
        petName={listing.petName}
        onClose={() => setAcceptOffer(null)}
        onConfirm={async (npcOfferId) => {
          const result = await onAcceptOffer(npcOfferId)
          setAcceptOffer(null)
          return result
        }}
      />
    </>
  )
}
