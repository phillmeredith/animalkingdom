// ListingRetractModal — confirmation modal for cancelling a player listing
//
// Feature: auction-retract
//
// Portal: rendered via the Modal component which calls createPortal(content, document.body).
// This is mandatory because the modal may be triggered from inside Framer Motion animated
// parents (PetDetailSheet, StoreHubScreen). Failure to portal traps the fixed overlay
// inside the animation stacking context.
//
// Glass surface: Modal component provides rgba(13,13,17,.88) + blur(24px) + border.
//
// Focus trap: Modal wraps content — focus returns to triggerRef on close.
//
// Transaction integrity: retractListing() wraps all DB writes inside one db.transaction().
// This component is responsible only for calling the hook and handling the response.
//
// Loading state: both buttons are disabled and the destructive button shows a Loader2
// spinner while the retract is in-flight. This prevents double-submission (TRANS-7).

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { RarityBadge } from '@/components/ui/Badge'
import { TierBadge } from '@/components/ui/TierBadge'
import { useToast } from '@/components/ui/Toast'
import { usePlayerListings } from '@/hooks/usePlayerListings'
import { cn } from '@/lib/utils'
import type { SavedName } from '@/lib/db'

interface ListingRetractModalProps {
  /** The listing's DB id — passed to retractListing(). */
  listingId: number
  /** The pet record — drives the mini-summary row and success toast copy. */
  pet: SavedName & { id: number }
  isOpen: boolean
  onClose: () => void
  /** Called after a successful retract so the parent can update its own state. */
  onSuccess: () => void
  /** Ref to the trigger element — focus returns here on close (WCAG 2.1 AA). */
  triggerRef?: React.RefObject<HTMLElement>
}

export function ListingRetractModal({
  listingId,
  pet,
  isOpen,
  onClose,
  onSuccess,
  triggerRef,
}: ListingRetractModalProps) {
  const { retractListing } = usePlayerListings()
  const { toast } = useToast()
  const [retracting, setRetracting] = useState(false)
  // Ref to "Keep listing" — the first focusable element in the modal (spec: safe action first)
  const keepBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus "Keep listing" when the modal opens
  useEffect(() => {
    if (isOpen) {
      // Allow the portal render cycle to complete before focusing
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
      await retractListing(listingId, pet.id)
      // Success: close modal, return focus, fire success toast
      handleClose()
      onSuccess()
      toast({
        type: 'success',
        title: `${pet.name} is back in your collection`,
        duration: 4000,
      })
    } catch {
      // Error toast is fired by retractListing() in the hook (TRANS-4).
      // Re-enable buttons so the modal stays open and actionable (TRANS-3).
    } finally {
      setRetracting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cancel your listing?"
    >
      {/* Pet mini-summary row */}
      <div
        className="flex items-center gap-3 rounded-[var(--r-md)] p-4 mb-4"
        style={{ background: 'var(--elev)' }}
      >
        <AnimalImage
          src={pet.imageUrl}
          alt={pet.name}
          className="w-16 h-16 rounded-[var(--r-md)] object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[var(--t1)] truncate mb-1">
            {pet.name}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <RarityBadge rarity={pet.rarity} />
            <TierBadge category={pet.category} />
          </div>
        </div>
      </div>

      {/* Body copy */}
      <p className="text-[14px] text-[var(--t2)] leading-relaxed mb-6">
        {pet.name} will return to your collection. Any pending offers will be cancelled.
      </p>

      {/* "Keep listing" — safe action, first in DOM order (spec: destructive action not first) */}
      <Button
        ref={keepBtnRef}
        variant="outline"
        size="md"
        className="w-full"
        onClick={handleClose}
        disabled={retracting}
        aria-label="Keep listing active"
      >
        Keep listing
      </Button>

      {/* "Cancel listing" — destructive outline, mt-8 (8px gap per spec) */}
      <button
        onClick={handleRetract}
        disabled={retracting}
        aria-busy={retracting}
        aria-label={retracting ? 'Cancelling listing…' : 'Cancel listing'}
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
            Cancelling…
          </span>
        ) : (
          'Cancel listing'
        )}
      </button>
    </Modal>
  )
}
