// AuctionDetailSheet — bottom sheet for auction detail, bid confirm, and buy-now confirm
//
// Stories: AUC-06 (detail sheet), AUC-07 (bid flow), AUC-08 (re-bid)
//
// Portal rule: rendered via the existing BottomSheet component which already
// uses createPortal(content, document.body) — verified in Modal.tsx.
//
// DS compliance:
// - Glass rule: existing BottomSheet handles rgba(13,13,17,.80) + blur(24px)
// - No emojis — Lucide only
// - No ghost variant
// - All colours from var(--...) tokens
// - Tint-pair for all badge/banner elements
// - "Confirm bid" / "Bid again" / "Confirm" → variant="accent" (pink)
// - "Buy now" in detail view → variant="primary" (blue)
// - "Cancel" / "Back" → variant="outline"
// - Inline red error for insufficient coins — NOT a toast (spec section 7)
// - Stepper: no freeform input, min 44×44px touch target on [+] and [−]

import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, AlertCircle, Coins, Loader2
} from 'lucide-react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { BottomSheet } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { BidRetractModal } from './BidRetractModal'
import { cn } from '@/lib/utils'
import type { AuctionItem, AuctionBid } from '@/lib/db'

// ─── View states ─────────────────────────────────────────────────────────────

type SheetView = 'detail' | 'bid-confirm' | 'buynow-confirm'

// ─── AuctionCountdown ─────────────────────────────────────────────────────────

interface AuctionCountdownProps {
  endsAt: Date
  /** Called once when the timer crosses from active → expired. */
  onExpired: () => void
}

export function AuctionCountdown({ endsAt, onExpired }: AuctionCountdownProps) {
  const [now, setNow] = useState(() => Date.now())
  const [firedExpired, setFiredExpired] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const msRemaining = Math.max(0, endsAt.getTime() - now)
  const isExpired = msRemaining === 0

  // Fire onExpired once
  useEffect(() => {
    if (isExpired && !firedExpired) {
      setFiredExpired(true)
      onExpired()
    }
  }, [isExpired, firedExpired, onExpired])

  // Digital format
  function formatDigital(): string {
    if (isExpired) return 'Ended'
    const totalSeconds = Math.floor(msRemaining / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m ${seconds}s`
  }

  // Sentence copy — updates every 30s in a polite aria-live region
  function getSentence(): string {
    if (isExpired) return 'Auction ended'
    const totalSeconds = Math.floor(msRemaining / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    if (totalSeconds > 3600) return `Ends in about ${hours}h`
    if (totalSeconds > 600) return `Ends in about ${minutes}m`
    return 'Ending very soon!'
  }

  // Urgency level for bar/text colour
  type Urgency = 'normal' | 'warning' | 'critical' | 'expired'
  function getUrgency(): Urgency {
    if (isExpired) return 'expired'
    if (msRemaining < 10 * 60 * 1000) return 'critical'
    if (msRemaining < 60 * 60 * 1000) return 'warning'
    return 'normal'
  }

  const urgency = getUrgency()

  const textColor = {
    normal:   'var(--t2)',
    warning:  'var(--amber-t)',
    critical: 'var(--red-t)',
    expired:  'var(--t4)',
  }[urgency]

  const barColor = {
    normal:   'var(--green)',
    warning:  'var(--amber)',
    critical: 'var(--red)',
    expired:  'transparent',
  }[urgency]

  // Approximate progress: we don't have startsAt on the card, so use a 24h window max
  // The bar drains as time passes; when <0 it's empty
  const ASSUMED_DURATION_MS = 24 * 60 * 60 * 1000
  const barPct = isExpired ? 0 : Math.min(100, (msRemaining / ASSUMED_DURATION_MS) * 100)

  return (
    <div className="flex flex-col gap-1.5">
      {/* Digital display — aria-hidden because it updates too fast for screen readers */}
      <span
        className="text-[14px] font-bold"
        style={{ color: textColor }}
        aria-hidden="true"
      >
        {formatDigital()}
      </span>
      {/* Sentence — aria-live for accessible updates every ~30s */}
      <span
        className="text-[13px] text-[var(--t3)]"
        aria-live="polite"
      >
        {getSentence()}
      </span>
      {/* Progress bar — aria-hidden, visual only */}
      <div
        className="w-full rounded-[100px] overflow-hidden"
        style={{ height: 4, background: 'var(--elev)' }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-[100px]"
          style={{
            width: `${barPct}%`,
            background: barColor,
            transition: reducedMotion ? undefined : 'width 1s linear',
          }}
        />
      </div>
    </div>
  )
}

// ─── BidHistoryList ───────────────────────────────────────────────────────────

interface BidHistoryListProps {
  bids: AuctionBid[]
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

export function BidHistoryList({ bids }: BidHistoryListProps) {
  const recent = [...bids]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3)

  if (recent.length === 0) {
    return (
      <p className="text-[13px] text-[var(--t3)]">No bids yet.</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {recent.map(bid => {
        const isPlayer = bid.bidder === 'player'
        return (
          <div key={bid.id} className="flex items-center justify-between gap-2">
            <span
              className="text-[13px] flex-1 min-w-0 truncate"
              style={{ color: isPlayer ? 'var(--blue-t)' : 'var(--t2)' }}
            >
              {isPlayer ? 'You' : bid.bidder}
            </span>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <div className="flex items-center gap-1">
                <Coins size={11} className="text-[var(--amber)]" aria-hidden="true" />
                <span className="text-[13px] font-bold text-[var(--amber-t)]">
                  {bid.amount.toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--t3)]">
                {timeAgo(bid.createdAt)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── CoinAmountBlock ──────────────────────────────────────────────────────────

function CoinAmountBlock({ amount }: { amount: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-5 rounded-[var(--r-md)] gap-1"
      style={{ background: 'var(--elev)' }}
    >
      <div className="flex items-center gap-2">
        <Coins size={24} className="text-[var(--amber)]" aria-hidden="true" />
        <span className="text-[40px] font-bold leading-none text-[var(--amber-t)]">
          {amount.toLocaleString()}
        </span>
      </div>
      <span className="text-[12px] text-[var(--t3)]">coins</span>
    </div>
  )
}

// ─── BidConfirmState ──────────────────────────────────────────────────────────

interface BidConfirmStateProps {
  auction: AuctionItem
  coins: number
  onBack: () => void
  onConfirm: (amount: number) => Promise<void>
}

function BidConfirmState({ auction, coins, onBack, onConfirm }: BidConfirmStateProps) {
  const minimumBid = auction.currentBid + auction.minimumIncrement
  const [bidAmount, setBidAmount] = useState(minimumBid)
  const [submitting, setSubmitting] = useState(false)
  const [insufficientCoins, setInsufficientCoins] = useState(false)
  const { toast } = useToast()

  const remaining = coins - bidAmount
  const isLowBalance = remaining >= 0 && remaining < 100
  const canConfirm = bidAmount >= minimumBid && coins >= bidAmount && !submitting

  function increment() {
    setBidAmount(prev => prev + auction.minimumIncrement)
    setInsufficientCoins(false)
  }

  function decrement() {
    setBidAmount(prev => Math.max(minimumBid, prev - auction.minimumIncrement))
    setInsufficientCoins(false)
  }

  async function handleConfirm() {
    if (!canConfirm) return
    setSubmitting(true)
    setInsufficientCoins(false)
    try {
      await onConfirm(bidAmount)
    } catch (err) {
      if (err instanceof Error && err.message === 'insufficient_coins') {
        // Inline error — NOT a toast (spec section 7 / state inventory)
        setInsufficientCoins(true)
      }
      // Other errors are surfaced as toasts by the hook
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-5">
      {/* Back button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          icon={<ChevronLeft size={20} aria-hidden="true" />}
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
      </div>

      {/* Heading */}
      <h2 className="text-[22px] font-semibold text-[var(--t1)]">
        Confirm your bid
      </h2>

      {/* Coin amount display block */}
      <CoinAmountBlock amount={bidAmount} />

      {/* Stepper row */}
      <div className="flex items-center gap-3">
        {/* [−] button — min 44×44px touch target */}
        <button
          onClick={decrement}
          disabled={bidAmount <= minimumBid || submitting}
          aria-label="Decrease bid"
          className={cn(
            'flex items-center justify-center rounded-pill border border-[var(--border)] text-[var(--t1)]',
            'transition-all duration-150 hover:border-t3 hover:bg-white/[.03] active:scale-[.97]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
            'disabled:opacity-40 disabled:pointer-events-none',
            // Min touch target
          )}
          style={{ minWidth: 44, minHeight: 44, padding: '0 12px' }}
        >
          <span className="text-[20px] font-bold leading-none select-none">−</span>
        </button>

        {/* Stepper amount display — read-only, no freeform input */}
        <div className="flex-1 text-center text-[20px] font-bold text-[var(--t1)]">
          {bidAmount.toLocaleString()}
        </div>

        {/* [+] button — min 44×44px touch target */}
        <button
          onClick={increment}
          disabled={submitting}
          aria-label="Increase bid"
          className={cn(
            'flex items-center justify-center rounded-pill border border-[var(--border)] text-[var(--t1)]',
            'transition-all duration-150 hover:border-t3 hover:bg-white/[.03] active:scale-[.97]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
            'disabled:opacity-40 disabled:pointer-events-none',
          )}
          style={{ minWidth: 44, minHeight: 44, padding: '0 12px' }}
        >
          <span className="text-[20px] font-bold leading-none select-none">+</span>
        </button>
      </div>

      {/* Notes */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-[13px] text-[var(--t3)] text-center">
          The minimum bid is {minimumBid.toLocaleString()} coins
        </p>
        {remaining >= 0 && (
          <p className="text-[13px] text-[var(--t2)] text-center">
            You'll have {remaining.toLocaleString()} coins left
          </p>
        )}
      </div>

      {/* Low balance warning — amber tint-pair, only when <100 coins remaining */}
      {/* Per-element tint-pair gate: bg-[var(--amber-sub)] + text-[var(--amber-t)] */}
      {isLowBalance && !insufficientCoins && (
        <div
          className="flex items-center gap-2 px-3 py-3 rounded-[var(--r-md)] bg-[var(--amber-sub)] text-[var(--amber-t)] text-[13px] font-medium"
          style={{ border: '1px solid var(--amber)' }}
          role="alert"
        >
          <AlertCircle size={16} aria-hidden="true" />
          You'll be almost out of coins!
        </div>
      )}

      {/* Insufficient coins inline error — red tint-pair, NOT a toast */}
      {/* Per-element tint-pair gate: bg-[var(--red-sub)] + text-[var(--red-t)] */}
      {insufficientCoins && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-sm)] bg-[var(--red-sub)] text-[var(--red-t)] text-[13px] font-medium"
          role="alert"
        >
          <AlertCircle size={14} aria-hidden="true" />
          You don't have enough coins
        </div>
      )}

      {/* Confirm bid button — variant="accent" (pink) per spec */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!canConfirm}
        loading={submitting}
        onClick={handleConfirm}
      >
        Confirm bid
      </Button>

      {/* Cancel — variant="outline", md */}
      <Button
        variant="outline"
        size="md"
        className="w-full"
        onClick={onBack}
        disabled={submitting}
      >
        Cancel
      </Button>
    </div>
  )
}

// ─── BuyNowConfirmState ───────────────────────────────────────────────────────

interface BuyNowConfirmStateProps {
  auction: AuctionItem
  coins: number
  onBack: () => void
  onConfirm: () => Promise<void>
}

function BuyNowConfirmState({ auction, coins, onBack, onConfirm }: BuyNowConfirmStateProps) {
  const buyNowPrice = auction.buyNow!
  const remaining = coins - buyNowPrice
  const canAfford = coins >= buyNowPrice
  const [submitting, setSubmitting] = useState(false)
  const [insufficientCoins, setInsufficientCoins] = useState(false)

  async function handleConfirm() {
    if (!canAfford || submitting) return
    setSubmitting(true)
    setInsufficientCoins(false)
    try {
      await onConfirm()
    } catch (err) {
      if (err instanceof Error && err.message === 'insufficient_coins') {
        setInsufficientCoins(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-5">
      {/* Back button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          icon={<ChevronLeft size={20} aria-hidden="true" />}
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
      </div>

      <h2 className="text-[22px] font-semibold text-[var(--t1)]">
        Buy now?
      </h2>

      <CoinAmountBlock amount={buyNowPrice} />

      {remaining >= 0 && (
        <p className="text-[13px] text-[var(--t2)] text-center">
          You'll have {remaining.toLocaleString()} coins left
        </p>
      )}

      {/* Insufficient coins inline error — red tint-pair */}
      {/* Per-element gate: bg-[var(--red-sub)] + text-[var(--red-t)] — not solid red */}
      {insufficientCoins && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-sm)] bg-[var(--red-sub)] text-[var(--red-t)] text-[13px] font-medium"
          role="alert"
        >
          <AlertCircle size={14} aria-hidden="true" />
          You don't have enough coins
        </div>
      )}

      {/* Confirm — accent (pink) per spec */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!canAfford || submitting}
        loading={submitting}
        onClick={handleConfirm}
      >
        Confirm
      </Button>

      {/* Cancel — outline */}
      <Button
        variant="outline"
        size="md"
        className="w-full"
        onClick={onBack}
        disabled={submitting}
      >
        Cancel
      </Button>
    </div>
  )
}

// ─── DetailView ───────────────────────────────────────────────────────────────

interface DetailViewProps {
  auction: AuctionItem
  playerBid: number | null
  /** The actual active bid record (if Harry has one) — needed for bid retract. */
  activeBidRecord: (AuctionBid & { id: number }) | null
  isOutbid: boolean
  coins: number
  bids: AuctionBid[]
  isReadOnly: boolean
  onPlaceBid: () => void
  onBuyNow: () => void
  onExpired: () => void
  onNavigateToAnimals: () => void
  onWithdrawBid: () => void
  /** Ref attached to the "Withdraw my bid" button — for focus restoration after modal close. */
  withdrawBidBtnRef?: React.RefObject<HTMLButtonElement>
}

function DetailView({
  auction,
  playerBid,
  activeBidRecord,
  isOutbid,
  coins,
  bids,
  isReadOnly,
  onPlaceBid,
  onBuyNow,
  onExpired,
  onNavigateToAnimals,
  onWithdrawBid,
  withdrawBidBtnRef,
}: DetailViewProps) {
  const isActive = auction.status === 'active'
  const isWon = auction.status === 'won'
  const minimumNextBid = auction.currentBid + auction.minimumIncrement
  const canAffordRebid = coins >= minimumNextBid

  return (
    <div className="px-6 pt-4 pb-8 flex flex-col gap-4">
      {/* Compact header row — image thumbnail + name/meta (matches PetDetailSheet pattern) */}
      <div className="flex items-center gap-4">
        <AnimalImage
          src={auction.imageUrl}
          alt={auction.name}
          className="w-20 h-20 rounded-xl object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[18px] font-semibold text-[var(--t1)] leading-snug truncate">
              {auction.name}
            </h3>
            {/* RarityBadge uses tint-pair — per-element gate satisfied */}
            <RarityBadge rarity={auction.rarity} />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className="text-[12px] font-medium text-[var(--t3)] uppercase tracking-wider">
              {auction.category}
            </span>
            <span className="text-[var(--t4)]">·</span>
            <span className="text-[12px] text-[var(--t3)]">
              Listed by {auction.npcSeller}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-s)' }} />

      {/* CURRENT BID */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)]">
          Current Bid
        </p>
        <div className="flex items-center gap-2">
          <Coins size={20} className="text-[var(--amber)]" aria-hidden="true" />
          <span className="text-[28px] font-bold text-[var(--amber-t)]">
            {auction.currentBid.toLocaleString()}
          </span>
        </div>
      </div>

      {/* BUY NOW — visible only when buyNow is set and auction is active */}
      {isActive && auction.buyNow != null && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)]">
            Buy Now
          </p>
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-[var(--amber)]" aria-hidden="true" />
            <span className="text-[16px] font-semibold text-[var(--amber-t)]">
              {auction.buyNow.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* YOUR BID — visible when player has an active bid */}
      {/* Amber-sub tint on the row per spec */}
      {playerBid != null && (
        <div
          className="flex flex-col gap-1 px-3 py-2 rounded-[var(--r-sm)]"
          style={{ background: 'var(--amber-sub)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)]">
            Your Bid
          </p>
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-[var(--amber)]" aria-hidden="true" />
            <span className="text-[16px] font-semibold text-[var(--amber-t)]">
              {playerBid.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* OUTBID BANNER — amber tint-pair, only when player is outbid and auction active */}
      {/* Per-element tint-pair gate: bg-[var(--amber-sub)] + 1px solid var(--amber) */}
      {isActive && isOutbid && playerBid != null && (
        <div
          className="flex items-start gap-2 px-3 py-3 rounded-[var(--r-md)] bg-[var(--amber-sub)] text-[14px] text-[var(--t2)]"
          style={{ border: '1px solid var(--amber)' }}
          role="alert"
        >
          <AlertCircle size={16} className="text-[var(--amber)] mt-0.5 shrink-0" aria-hidden="true" />
          <span>You've been outbid — bid again to stay in.</span>
        </div>
      )}

      {/* Won: read-only state info */}
      {isWon && (
        <div
          className="flex items-center justify-center py-2 px-3 rounded-[var(--r-md)] bg-[var(--green-sub)] text-[var(--green-t)] text-[13px] font-semibold"
          style={{ border: '1px solid var(--green)' }}
        >
          Yours now!
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-s)' }} />

      {/* RECENT BIDS */}
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)]">
          Recent Bids
        </p>
        <BidHistoryList bids={bids} />
      </div>

      {/* Countdown */}
      <AuctionCountdown endsAt={auction.endsAt} onExpired={onExpired} />

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-s)' }} />

      {/* CTAs — suppressed in read-only (won) state */}
      {!isReadOnly && isActive && (
        <div className="flex flex-col gap-3">
          {/* Primary CTA: "Place a bid" or "Bid again" or disabled "Auction ended" */}
          {/* variant="accent" (pink) is the bid action */}
          {isOutbid ? (
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              disabled={!canAffordRebid}
              onClick={onPlaceBid}
            >
              {canAffordRebid ? 'Bid again' : 'Not enough coins to bid higher'}
            </Button>
          ) : (
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={onPlaceBid}
            >
              Place a bid
            </Button>
          )}

          {/* Buy Now CTA — primary (blue), alternative action per spec */}
          {auction.buyNow != null && (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onBuyNow}
            >
              Buy now for {auction.buyNow.toLocaleString()} coins
            </Button>
          )}

          {/* "Withdraw my bid" text link — auction-retract feature.
              Only shown when Harry has an active bid AND the auction is not closed.
              Absent from DOM (not just hidden) when no bid or auction is closed. */}
          {activeBidRecord != null && (
            <div className="flex justify-center">
              <button
                ref={withdrawBidBtnRef}
                onClick={onWithdrawBid}
                // 44px min touch target — padding extends hit area vertically
                className={cn(
                  'text-[13px] font-normal py-3 px-2',
                  'transition-colors duration-150',
                  'hover:underline hover:text-[var(--t1)]',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
                  'active:opacity-70',
                )}
                style={{
                  color: 'var(--t3)',
                  textUnderlineOffset: '2px',
                }}
              >
                Withdraw my bid
              </button>
            </div>
          )}
        </div>
      )}

      {!isReadOnly && !isActive && (
        <Button variant="outline" size="lg" className="w-full" disabled>
          Auction ended
        </Button>
      )}

      {/* Won state CTA — navigate to My Animals */}
      {isReadOnly && isWon && (
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={onNavigateToAnimals}
        >
          Find them in My Animals
        </Button>
      )}
    </div>
  )
}

// ─── AuctionDetailSheet ──────────────────────────────────────────────────────

interface AuctionDetailSheetProps {
  auction: AuctionItem | null
  isOpen: boolean
  onClose: () => void
  playerBid: number | null
  isOutbid: boolean
  coins: number
  bids: AuctionBid[]
  onPlaceBid: (amount: number) => Promise<void>
  onBuyNow: () => Promise<void>
  onAuctionExpired: () => void
  onNavigateToAnimals: () => void
}

export function AuctionDetailSheet({
  auction,
  isOpen,
  onClose,
  playerBid,
  isOutbid,
  coins,
  bids,
  onPlaceBid,
  onBuyNow,
  onAuctionExpired,
  onNavigateToAnimals,
}: AuctionDetailSheetProps) {
  // Sheet-close mid-bid (Flow 6): view state resets to 'detail' on every open
  // so the stepper does not persist between opens.
  const [view, setView] = useState<SheetView>('detail')
  const [bidRetractOpen, setBidRetractOpen] = useState(false)
  const { toast } = useToast()
  // withdrawBidBtnRef — focus returns here after the retract modal closes (WCAG 2.1 AA)
  const withdrawBidBtnRef = useRef<HTMLButtonElement>(null)

  // Reset view to 'detail' whenever the sheet opens (spec Flow 6)
  useEffect(() => {
    if (isOpen) setView('detail')
  }, [isOpen])

  // Close retract modal when the sheet closes
  useEffect(() => {
    if (!isOpen) setBidRetractOpen(false)
  }, [isOpen])

  const isReadOnly = auction?.status === 'won'

  // Find the active player bid record from the bids array.
  // This is the bid record needed by BidRetractModal (needs id + amount).
  // Only computed when the sheet is open and an auction is selected.
  const activeBidRecord = (auction?.id != null && bids.length > 0)
    ? (bids.find(b => b.bidder === 'player' && b.bidStatus === 'active' && b.id != null) as (AuctionBid & { id: number }) | undefined ?? null)
    : null

  if (!auction) return null

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        maxHeight="90vh"
      >
        {view === 'detail' && (
          <DetailView
            auction={auction}
            playerBid={playerBid}
            activeBidRecord={activeBidRecord}
            isOutbid={isOutbid}
            coins={coins}
            bids={bids}
            isReadOnly={isReadOnly ?? false}
            onPlaceBid={() => setView('bid-confirm')}
            onBuyNow={() => setView('buynow-confirm')}
            onExpired={onAuctionExpired}
            onNavigateToAnimals={onNavigateToAnimals}
            onWithdrawBid={() => setBidRetractOpen(true)}
            withdrawBidBtnRef={withdrawBidBtnRef}
          />
        )}

      {view === 'bid-confirm' && (
        <BidConfirmState
          auction={auction}
          coins={coins}
          onBack={() => setView('detail')}
          onConfirm={async (amount) => {
            await onPlaceBid(amount)
            // Bid placed successfully — toast per spec ("Bid placed! Watch for NPC counter-bids.")
            toast({ type: 'success', title: 'Bid placed! Watch for NPC counter-bids.' })
            setView('detail')
            onClose()
          }}
        />
      )}

        {view === 'buynow-confirm' && auction.buyNow != null && (
          <BuyNowConfirmState
            auction={auction}
            coins={coins}
            onBack={() => setView('detail')}
            onConfirm={async () => {
              await onBuyNow()
              setView('detail')
              onClose()
            }}
          />
        )}
      </BottomSheet>

      {/* auction-retract: BidRetractModal — portalled to body via Modal component.
          Only rendered when Harry has an active bid and the auction is open. */}
      {activeBidRecord != null && auction.id != null && (
        <BidRetractModal
          auction={auction as AuctionItem & { id: number }}
          bid={activeBidRecord}
          isOpen={bidRetractOpen}
          onClose={() => {
            setBidRetractOpen(false)
            setTimeout(() => withdrawBidBtnRef.current?.focus(), 50)
          }}
          onSuccess={() => {
            setBidRetractOpen(false)
            // The BottomSheet's live data (bids, playerBid) will update reactively
            // via useLiveQuery in AuctionHubScreen — no manual refresh needed
          }}
          triggerRef={withdrawBidBtnRef as React.RefObject<HTMLElement>}
        />
      )}
    </>
  )
}
