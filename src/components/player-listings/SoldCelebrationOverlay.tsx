// SoldCelebrationOverlay — full-screen celebration after a successful sale
//
// Portal: createPortal(content, document.body) at z-[2000] (above AcceptOfferModal at 1000)
// Background: var(--grad-warm) — opaque, NOT glass treatment (per spec section 5)
//
// Animation:
//   - Coins icon: scale 0.5 → 1.0 with spring bounce (initial: scale 0.5, opacity 0)
//     This is a REVEAL animation for the icon, not a burst particle — scale-from-0 is
//     correct here (spec: "scale 0.5 → 1.0 with spring bounce on mount")
//   - Auto-dismiss: 4 seconds; timer resets on overlay background tap
//   - On dismiss: overlay fades out (300ms)
//
// DS compliance:
//   - No emojis; Lucide Coins icon (64px, white stroke)
//   - No ghost variant
//   - "Great!" button: variant="accent" (pink) per spec
//   - Coins first, pet departure second (UR-informed copy order)
//
// Framer Motion self-review:
//   - CelebrationOverlay is NOT a child of AnimatePresence mode="wait" in any parent
//   - position: fixed is in a createPortal subtree — not trapped by any motion ancestor
//   - Coins icon uses scale from 0.5, not scale: 0 — correct for a reveal, not a burst

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SoldCelebrationOverlayProps {
  petName: string
  coinsEarned: number
  npcName: string
  onDismiss: () => void
}

export function SoldCelebrationOverlay({
  petName,
  coinsEarned,
  npcName,
  onDismiss,
}: SoldCelebrationOverlayProps) {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function dismiss() {
    setVisible(false)
    // onDismiss is called after exit animation completes via onExitComplete
  }

  function resetTimer() {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(dismiss, 4000)
  }

  // Start auto-dismiss timer on mount
  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const content = (
    // AnimatePresence for the exit fade-out
    <AnimatePresence onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'var(--grad-warm)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '0 24px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={resetTimer} // background tap resets timer
        >
          {/* Coins icon with spring scale-in reveal — 48px on phone, 64px on md+ */}
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.3 }
                : { type: 'spring', stiffness: 300, damping: 20 }
            }
          >
            <div className="w-12 h-12 md:w-16 md:h-16">
              <Coins
                width="100%"
                height="100%"
                strokeWidth={1.5}
                color="rgba(255,255,255,.95)"
              />
            </div>
          </motion.div>

          {/* Coins earned — copy order: coins first, pet departure second (UR finding) */}
          {/* PL-DEF-004: responsive font size — 28px/600 on phone, 36px/700 on md+ */}
          {/* PL-DEF-006: no + prefix per spec "{coinsEarned} coins added!" */}
          <motion.h1
            className="text-[28px] font-semibold md:text-[36px] md:font-bold"
            style={{
              color: 'var(--t1)',
              margin: 0,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {coinsEarned} coins added!
          </motion.h1>

          {/* Pet departure */}
          <motion.p
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: 'var(--t1)',
              margin: 0,
              lineHeight: 1.6,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {petName} found a new home{npcName ? ` with ${npcName}` : ''}.
          </motion.p>

          {/* Dismiss button — stops propagation so tap doesn't both dismiss and reset timer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            style={{ marginTop: 8 }}
            onClick={e => e.stopPropagation()}
          >
            <Button variant="accent" size="lg" onClick={dismiss}>
              Great!
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
