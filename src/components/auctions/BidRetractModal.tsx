// BidRetractModal — confirmation modal for withdrawing an auction bid
//
// Feature: auction-retract
//
// Portal: rendered via the Modal component which calls createPortal(content, document.body).
// This is mandatory because this modal is triggered from inside AuctionDetailSheet, which
// is a BottomSheet with Framer Motion animated ancestors. Failure to portal traps the
// fixed overlay inside the animation stacking context (CLAUDE.md Framer Motion rule #2).
//
// Glass surface: Modal component provides rgba(13,13,17,.88) + blur(24px) + border.
//
// Transaction integrity: retractBid() wraps earn() AND bid deletion inside ONE
// db.transaction(). If bid deletion fails, coins are NOT returned. This component
// is responsible only for calling the hook and handling the response.
//
// Loading state: both buttons disabled + Loader2 spinner while in-flight (TRANS-7).
// Body copy uses the exact coin amount as a numeral (spec requirement — not vague copy).

import { useState, useRef, useEffect } from 'react'
import { Loader2, Coins } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { useAuctions } from '@/hooks/useAuctions'
import { cn } from '@/lib/utils'
import type { AuctionItem, AuctionBid } from '@/lib/db'

interface BidRetractModalProps {
  auction: AuctionItem & { id: number }
  bid: AuctionBid & { id: number }
  isOpen: boolean
  onClose: () => void
  /** Called after a successful retract so the parent can update its own state. */
  onSuccess: () => void
  /** Ref to the trigger element — focus returns here on close (WCAG 2.1 AA). */
  triggerRef?: React.RefObject<HTMLElement>
}

export function BidRetractModal({
  auction,
  bid,
  isOpen,
  onClose,
  onSuccess,
  triggerRef,
}: BidRetractModalProps) {
  const { retractBid } = useAuctions()
  const { toast } = useToast()
  const [retracting, setRetracting] = useState(false)
  // Ref to "Keep my bid" — the first focusable element in the modal (spec: safe action first)
  const keepBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus "Keep my bid" when the modal opens
  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => keepBtnRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [isOpen])

  // Return focus to the trigger element on close
  function handleClose() {
    onClose()
    setTimeout(() => {
      if (triggerRef?.current) {
        triggerRef.current.focus()
      }
    }, 50)
  }

  async function handleRetract() {
    // TRANS-7: no-op if already in-flight
    if (retracting) return
    setRetracting(true)
    try {
      await retractBid(auction.id, bid.id, bid.amount)
      // Success: close modal, return focus, fire success toast with exact coin amount
      handleClose()
      onSuccess()
      toast({
        type: 'success',
        title: `${bid.amount} coins returned to your wallet`,
        duration: 4000,
      })
    } catch {
      // Error toast is fired by retractBid() in the hook (TRANS-4).
      // Re-enable buttons so the modal stays open and actionable (TRANS-3).
    } finally {
      setRetracting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Withdraw your bid?"
    >
      {/* Auction mini-summary row */}
      <div
        className="flex items-center gap-3 rounded-[var(--r-md)] p-4 mb-4"
        style={{ background: 'var(--elev)' }}
      >
        <AnimalImage
          src={auction.imageUrl}
          alt={auction.name}
          className="w-16 h-16 rounded-[var(--r-md)] object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[var(--t1)] truncate mb-1">
            {auction.name}
          </p>
          <RarityBadge rarity={auction.rarity} />
          {/* Bid amount row — exact numeral, var(--t3) per spec */}
          <div className="flex items-center gap-1 mt-1">
            <Coins size={12} className="text-[var(--amber)]" aria-hidden="true" />
            <span className="text-[13px] text-[var(--t3)]">
              Your bid: {bid.amount.toLocaleString()} coins
            </span>
          </div>
        </div>
      </div>

      {/* Body copy — exact coin amount as numeral (spec: vague copy not acceptable) */}
      <p className="text-[14px] text-[var(--t2)] leading-relaxed mb-6">
        Your {bid.amount.toLocaleString()} coins will be returned to your wallet.
      </p>

      {/* "Keep my bid" — safe action, first in DOM order */}
      <Button
        ref={keepBtnRef}
        variant="outline"
        size="md"
        className="w-full"
        onClick={handleClose}
        disabled={retracting}
        aria-label="Keep my bid active"
      >
        Keep my bid
      </Button>

      {/* "Withdraw bid" — destructive outline, mt-2 */}
      <button
        onClick={handleRetract}
        disabled={retracting}
        aria-busy={retracting}
        aria-label={retracting ? 'Withdrawing bid…' : 'Withdraw bid'}
        className={cn(
          'w-full h-11 mt-2 rounded-pill text-[14px] font-semibold transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-[var(--red)] focus-visible:outline-offset-2',
          'active:scale-[.97]',
          retracting
            ? 'opacity-50 pointer-events-none'
            : 'hover:bg-[var(--red-sub)]',
        )}
        style={{
          background: 'transparent',
          border: '1.5px solid var(--red)',
          color: 'var(--red-t)',
        }}
      >
        {retracting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            Withdrawing…
          </span>
        ) : (
          'Withdraw bid'
        )}
      </button>
    </Modal>
  )
}
