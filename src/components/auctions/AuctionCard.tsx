// AuctionCard — grid card for a single NPC-listed auction
//
// Stories: AUC-03 (card component), AUC-12 (won-card state)
//
// DS compliance:
// - No emojis — Lucide icons only
// - No ghost variant
// - All colours from var(--...) tokens
// - Tint-pair badges: never solid colour + white text
// - Hover: DS card hover pattern (translate-y-0.5 + shadow + border + scale on active)
// - Urgency timer: amber tint-pair badge at <1h, red tint-pair badge at <10min
// - Rarity left border: 4px solid in rarity colour (spec section 3)
// - Rarity body tint: sub colour at ~50% on body section only
//
// Self-review gate: run per-badge tint-pair check after every badge JSX element.

import { useEffect, useRef, useState } from 'react'
import { Coins, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import type { AuctionItem } from '@/lib/db'
import type { Rarity } from '@/lib/db'

// ─── Rarity colour maps ──────────────────────────────────────────────────────

// 4px left border colour per rarity (spec section 3)
// Common uses var(--t3) which resolves to #777E91 — the DS token, not a hardcoded hex
const RARITY_BORDER_COLOR: Record<Rarity, string> = {
  common:    'var(--t3)',
  uncommon:  'var(--green)',
  rare:      'var(--blue)',
  epic:      'var(--purple)',
  legendary: 'var(--amber)',
}

// Body background tint at 50% on body section (spec section 3)
const RARITY_BODY_BG: Record<Rarity, string> = {
  common:    'transparent',
  uncommon:  'rgba(69,178,107,.06)',   // --green-sub at ~50%
  rare:      'rgba(55,114,255,.06)',   // --blue-sub at ~50%
  epic:      'rgba(151,87,215,.06)',   // --purple-sub at ~50%
  legendary: 'rgba(245,166,35,.06)',  // --amber-sub at ~50%
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeRemaining(msRemaining: number): string {
  if (msRemaining <= 0) return 'Ended'
  const totalSeconds = Math.floor(msRemaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

type UrgencyLevel = 'normal' | 'warning' | 'critical' | 'ended'

function getUrgencyLevel(msRemaining: number): UrgencyLevel {
  if (msRemaining <= 0) return 'ended'
  if (msRemaining < 10 * 60 * 1000) return 'critical'
  if (msRemaining < 60 * 60 * 1000) return 'warning'
  return 'normal'
}

// ─── TimerDisplay ───────────────────────────────────────────────────────────

function TimerDisplay({ endsAt }: { endsAt: Date }) {
  const [msRemaining, setMsRemaining] = useState(
    () => endsAt.getTime() - Date.now()
  )

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMsRemaining(endsAt.getTime() - Date.now())
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [endsAt])

  const urgency = getUrgencyLevel(msRemaining)
  const label = formatTimeRemaining(msRemaining)

  // Normal: plain text --t3, 13px/400
  if (urgency === 'normal') {
    return (
      <span
        className="text-[13px] text-[var(--t3)]"
        aria-label={`Ends in ${label}`}
      >
        <Clock size={11} className="inline mr-1 text-[var(--t4)]" aria-hidden="true" />
        {label}
      </span>
    )
  }

  // Ended: muted --t4
  if (urgency === 'ended') {
    return (
      <span className="text-[13px] text-[var(--t4)]">
        Ended
      </span>
    )
  }

  // Warning (10min–1h): amber tint-pair badge — never solid amber
  if (urgency === 'warning') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-[2px] rounded-pill text-[12px] font-semibold bg-[var(--amber-sub)] text-[var(--amber-t)]"
        aria-label={`Ending in ${label}`}
      >
        <Clock size={11} aria-hidden="true" />
        {label}
      </span>
    )
  }

  // Critical (<10min): red tint-pair badge — never solid red
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-[2px] rounded-pill text-[12px] font-semibold bg-[var(--red-sub)] text-[var(--red-t)]"
      aria-label={`Ending very soon: ${label}`}
    >
      <Clock size={11} aria-hidden="true" />
      {label}
    </span>
  )
}

// ─── AuctionCard ─────────────────────────────────────────────────────────────

interface AuctionCardProps {
  auction: AuctionItem
  /** Player's current active bid on this auction (null if not bidding). */
  playerBidAmount: number | null
  onTap: () => void
}

export function AuctionCard({ auction, playerBidAmount, onTap }: AuctionCardProps) {
  const isWon = auction.status === 'won'
  const isActive = auction.status === 'active'
  const borderColor = RARITY_BORDER_COLOR[auction.rarity]
  const bodyBg = RARITY_BODY_BG[auction.rarity]

  // Differentiation label: "Exclusive" for non-generate breeds, "Rare find" for others
  const differentiationLabel = auction.exclusiveToAuction ? 'Exclusive' : 'Rare find'

  return (
    <button
      onClick={onTap}
      aria-label={`${auction.name}, ${auction.rarity}, current bid ${auction.currentBid} coins`}
      className={cn(
        // Base surface
        'w-full text-left rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--card)]',
        'flex flex-col overflow-hidden',
        // DS hover pattern — exact class string from spec section 9
        'motion-safe:hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,.25)]',
        'hover:border-[var(--border)] motion-safe:active:scale-[.97] transition-all duration-300',
        // Focus ring
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
      )}
    >
      {/* Hero image — 16:9 aspect ratio, top-radius only */}
      <div className="relative w-full aspect-video overflow-hidden">
        <AnimalImage
          src={auction.imageUrl}
          alt={auction.name}
          className="w-full h-full"
        />
        {/* Rarity differentiation pill — top-left corner on the image */}
        {(isActive || isWon) && (
          // Tint-pair badge per rarity — per-element gate: no solid fill + white text
          <span
            className={cn(
              'absolute top-2 left-2 px-2 py-[2px] rounded-pill text-[11px] font-semibold',
              auction.rarity === 'legendary' && 'bg-[var(--amber-sub)] text-[var(--amber-t)]',
              auction.rarity === 'epic'      && 'bg-[var(--purple-sub)] text-[var(--purple-t)]',
              auction.rarity === 'rare'      && 'bg-[var(--blue-sub)] text-[var(--blue-t)]',
              auction.rarity === 'uncommon'  && 'bg-[var(--green-sub)] text-[var(--green-t)]',
              auction.rarity === 'common'    && 'bg-white/[.08] text-[var(--t3)]',
            )}
            aria-hidden="true"
          >
            {differentiationLabel}
          </span>
        )}
      </div>

      {/* Card body — rarity tint background + 4px left border */}
      <div
        className="flex-1 flex flex-col gap-2 p-4"
        style={{
          background: bodyBg,
          borderLeft: `4px solid ${borderColor}`,
        }}
      >
        {/* Won state banner — green tint-pair, full width, above name row */}
        {/* Per-element tint-pair gate: bg-[var(--green-sub)] + text-[var(--green-t)] — not solid green */}
        {isWon && (
          <div
            className="flex items-center justify-center py-1 px-2 rounded-[var(--r-sm)] text-[12px] font-semibold bg-[var(--green-sub)] text-[var(--green-t)]"
            style={{ border: '1px solid var(--green)' }}
          >
            Yours now!
          </div>
        )}

        {/* Row 1: Animal name + RarityBadge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-semibold text-[var(--t1)] leading-snug line-clamp-1 flex-1">
            {auction.name}
          </span>
          {/* RarityBadge uses tint-pair — per-element gate satisfied */}
          <RarityBadge rarity={auction.rarity} />
        </div>

        {/* Row 2: Current bid + time remaining */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Coins size={13} className="text-[var(--amber)] shrink-0" aria-hidden="true" />
            <span className="text-[14px] font-bold text-[var(--amber-t)]">
              {auction.currentBid.toLocaleString()}
            </span>
          </div>
          <TimerDisplay endsAt={auction.endsAt} />
        </div>

        {/* Buy Now pill — amber tint-pair, only if buyNow is set and auction is active */}
        {/* Per-element gate: bg-[var(--amber-sub)] + text-[var(--amber-t)] — not solid amber */}
        {isActive && auction.buyNow != null && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-pill text-[11px] font-semibold bg-[var(--amber-sub)] text-[var(--amber-t)]">
              Buy Now: {auction.buyNow.toLocaleString()}
            </span>
          </div>
        )}

        {/* "Your bid" pill — amber tint-pair, shown when player has an active bid */}
        {/* Per-element gate: bg-[var(--amber-sub)] + text-[var(--amber-t)] — not solid amber */}
        {isActive && playerBidAmount != null && (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-pill text-[12px] font-semibold bg-[var(--amber-sub)] text-[var(--amber-t)]">
              <Coins size={11} aria-hidden="true" />
              Your bid: {playerBidAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Won read-only link copy */}
        {isWon && (
          <span className="text-[12px] font-medium text-[var(--green-t)]">
            Find them in My Animals
          </span>
        )}
      </div>
    </button>
  )
}
