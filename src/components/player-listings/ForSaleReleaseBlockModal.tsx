// ForSaleReleaseBlockModal — shown when Harry taps Release on a for_sale pet
//
// Per spec PL-4: this modal is a HARD BLOCK on the release flow. It is NOT a toast.
// Harry must actively dismiss it — a toast would be missed (UR finding: ADHD/autistic users).
//
// Portal: createPortal(content, document.body) via useScrollLock + AnimatePresence
// Glass treatment: rgba(13,13,17,.80) + blur(24px) + 1px solid rgba(255,255,255,.06)
// Backdrop: rgba(0,0,0,.30)
//
// "Go to My Listings" button: variant="primary" (blue) per spec
// "Close" button: variant="outline"
// Focus: "Go to My Listings" on open per spec
//
// DS compliance:
//   - No ghost variant
//   - No emojis; no Lucide icon required by spec for this modal
//   - Scroll lock: reference-counted via useScrollLock

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface ForSaleReleaseBlockModalProps {
  petName: string
  open: boolean
  onClose: () => void
  onGoToListings: () => void
}

export function ForSaleReleaseBlockModal({
  petName,
  open,
  onClose,
  onGoToListings,
}: ForSaleReleaseBlockModalProps) {
  const reducedMotion = useReducedMotion()
  const { lock, unlock } = useScrollLock()
  const goToListingsRef = useRef<HTMLButtonElement>(null)

  // Reference-counted scroll lock
  useEffect(() => {
    if (open) {
      lock()
      return unlock
    }
  }, [open])

  // Focus "Go to My Listings" on open per spec
  useEffect(() => {
    if (open) {
      setTimeout(() => goToListingsRef.current?.focus(), 50)
    }
  }, [open])

  const content = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 1000 }}
        >
          {/* Backdrop */}
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
                marginBottom: 8,
              }}
            >
              {petName} is listed for sale
            </h2>

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
              Remove the listing before releasing {petName}.
            </p>

            {/* Button row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                ref={goToListingsRef}
                variant="primary"
                size="md"
                className="w-full"
                onClick={onGoToListings}
              >
                Go to My Listings
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
