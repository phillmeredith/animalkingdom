// AcceptOfferModal — confirmation before accepting an NPC buyer's offer
//
// Spec (interaction-spec.md section 5, AcceptOfferModal anatomy):
//   - Backdrop: rgba(0,0,0,.30) — intentionally darker than bg-black/10 per spec
//     rationale: irreversible sale warrants heavier scrim. Documented here so
//     this is not "corrected" back to the standard DS backdrop.
//   - "Cancel" (outline) + "Accept offer" (accent/pink)
//   - Portal: provided by Modal component
//   - On success: returns { petName, coinsEarned } to trigger SoldCelebrationOverlay
//   - Loading state on "Accept offer" while in flight
//
// DS compliance:
//   - No ghost variant
//   - No emojis; Lucide Coins icon only
//   - Accent (pink) for the confirm CTA — this is the earn/reward moment

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { SoldCelebrationOverlay } from './SoldCelebrationOverlay'
import type { NpcBuyerOffer } from '@/lib/db'

interface AcceptOfferModalProps {
  offer: NpcBuyerOffer | null
  open: boolean
  petName: string
  onClose: () => void
  onConfirm: (npcOfferId: number) => Promise<{ petName: string; coinsEarned: number }>
}

export function AcceptOfferModal({ offer, open, petName, onClose, onConfirm }: AcceptOfferModalProps) {
  const reducedMotion = useReducedMotion()
  const { lock, unlock } = useScrollLock()
  const [loading, setLoading] = useState(false)
  const [celebration, setCelebration] = useState<{ petName: string; coinsEarned: number; npcName: string } | null>(null)
  const acceptButtonRef = useRef<HTMLButtonElement>(null)

  // PL-DEF-003: Focus the "Accept offer" button when the modal opens (WCAG 2.4.3)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => acceptButtonRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (open) {
      lock()
      return unlock
    }
  }, [open])

  async function handleAccept() {
    if (!offer || loading) return
    // Capture npcName before the async call in case offer prop becomes null
    // when the parent closes the modal on success
    const npcName = offer.npcName
    setLoading(true)
    try {
      const result = await onConfirm(offer.id!)
      // onConfirm closes the modal (sets acceptOffer to null) and we show celebration
      setCelebration({ petName: result.petName, coinsEarned: result.coinsEarned, npcName })
    } catch {
      // Error toast fired by hook. Modal stays open for retry.
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <>
      <AnimatePresence>
        {open && offer && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 1000 }}
          >
            {/* Backdrop — deliberately rgba(0,0,0,.30) per spec rationale above */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,.30)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            {/* Modal card */}
            <motion.div
              style={{
                position: 'relative',
                background: 'rgba(13,13,17,.80)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 16,
                padding: 28,
                maxWidth: 420,
                width: '100%',
                boxShadow: 'var(--sh-elevated)',
              }}
              initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Heading */}
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: 'var(--t1)',
                  marginTop: 0,
                  marginBottom: 16,
                }}
              >
                Accept offer?
              </h2>

              {/* Summary row */}
              <div
                style={{
                  background: 'var(--elev)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', flex: 1 }}
                  className="truncate"
                >
                  {petName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Coins size={14} strokeWidth={2} color="var(--amber)" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber-t)' }}>
                    {offer.offerPrice}
                  </span>
                </div>
              </div>

              {/* Body */}
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'var(--t2)',
                  marginTop: 0,
                  marginBottom: 20,
                }}
              >
                {petName} will leave your collection.
              </p>

              {/* Button row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="outline"
                  size="md"
                  className="flex-1"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  ref={acceptButtonRef}
                  variant="accent"
                  size="md"
                  className="flex-1"
                  loading={loading}
                  onClick={handleAccept}
                >
                  Accept offer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SoldCelebrationOverlay — own portal at z-[2000], above modal at z-[1000] */}
      {celebration && (
        <SoldCelebrationOverlay
          petName={celebration.petName}
          coinsEarned={celebration.coinsEarned}
          npcName={celebration.npcName}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </>
  )

  return createPortal(content, document.body)
}
