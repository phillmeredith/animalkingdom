// AuctionWonOverlay — full-screen celebration overlay for auction win
//
// Stories: AUC-10 (win resolution overlay)
//
// PORTAL REQUIREMENT (CLAUDE.md): Rendered via ReactDOM.createPortal(content, document.body).
// This overlay fires globally — potentially while any animated screen is visible.
// A fixed element inside a motion.* subtree is trapped by the stacking context
// (transform/opacity ancestors). Portal escapes that entirely.
//
// Surface: var(--grad-hero) — celebration surface, NOT glass.
// This is the one component where the glass rule does not apply (spec section 6).
//
// Dismiss: tap "Go to My Animals" ONLY. Backdrop tap does NOT dismiss.
// This is intentional — an autistic child dismissing accidentally before the
// celebration completes is distressing (spec section 3, Flow 4).
//
// Animation rules (CLAUDE.md Framer Motion self-review §3):
// - Overlay: opacity 0→1, 300ms ease-out
// - Animal image: scale 0.8→1.0 + opacity 0→1, spring { stiffness: 300, damping: 28 }
// - Coin particles: initial={{ scale: 1 }} — never scale: 0 for burst particles
// - prefers-reduced-motion: fade only, no scale, no particles

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useEffect, useState } from 'react'
import type { AuctionItem } from '@/lib/db'

// ─── Coin particles ───────────────────────────────────────────────────────────
// Burst particles start at full size and translate outward — never scale: 0
// (CLAUDE.md Framer Motion self-review rule §3)

// All particle colours use CSS custom properties — no hardcoded hex values
const PARTICLE_COLORS = [
  'var(--amber)', 'var(--amber-t)', 'var(--pink)', 'var(--blue)',
  'var(--green)', 'var(--purple)', 'var(--amber-t)', 'var(--blue-t)',
]

function CoinParticles() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => {
      const angle = Math.random() * 360
      const rad = (angle * Math.PI) / 180
      const dist = 180 + Math.random() * 280
      const size = 6 + Math.random() * 8
      return {
        id: i,
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * dist + 60 + Math.random() * 100,
        size,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        duration: 1.4 + Math.random() * 0.8,
        delay: Math.random() * 0.3,
        rotate: Math.random() * 720 - 360,
        borderRadius: i % 3 === 0 ? '50%' : 4,
      }
    })
  )

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none', overflow: 'hidden' }}
      aria-hidden="true"
    >
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            width: p.size,
            height: p.size,
            borderRadius: p.borderRadius,
            background: p.color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
          // Particles start at full size and opacity — no scale: 0 (CLAUDE.md §3)
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.tx,
            y: p.ty,
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
            opacity: { times: [0, 0.6, 1] },
          }}
        />
      ))}
    </div>
  )
}

// ─── Overlay content ──────────────────────────────────────────────────────────

interface OverlayContentProps {
  auction: AuctionItem
  reducedMotion: boolean
  onGoToAnimals: () => void
}

function OverlayContent({ auction, reducedMotion, onGoToAnimals }: OverlayContentProps) {
  const { lock, unlock } = useScrollLock()

  useEffect(() => {
    lock()
    return () => { unlock() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const coinsSpent = auction.currentBid

  return (
    <>
      {/* Celebration confetti particles — portal-rendered, not trapped inside overlay */}
      {/* Separate AnimatePresence wrapper — independent exit target, not a sibling */}
      {/* to the overlay motion.div (CLAUDE.md Framer Motion §1) */}
      {!reducedMotion && <CoinParticles />}

      {/* Overlay panel */}
      {/* position: fixed is safe here — this IS the portal root, not inside a motion ancestor */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`You won ${auction.name}!`}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'var(--grad-hero)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
        // Overlay enters with opacity only — no scale animation on the container
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }}
        // No exit animation — dismissed by button tap only
        onClick={e => e.stopPropagation()} // Backdrop tap does NOT dismiss (spec Flow 4)
      >
        <div
          style={{
            maxWidth: 320,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {/* Animal image — spring scale/opacity entrance */}
          <motion.div
            style={{
              width: 160,
              height: 160,
              borderRadius: 'var(--r-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--sh-elevated)',
              marginBottom: 24,
            }}
            // Image: scale 0.8→1.0 + opacity 0→1, spring per spec
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
            animate={reducedMotion
              ? { opacity: 1, transition: { duration: 0.3 } }
              : {
                  scale: 1,
                  opacity: 1,
                  transition: { type: 'spring', stiffness: 300, damping: 28 },
                }
            }
          >
            <AnimalImage
              src={auction.imageUrl}
              alt={auction.name}
              className="w-full h-full"
            />
          </motion.div>

          {/* "You won!" — H1 */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: 'var(--t1)',
              lineHeight: 1,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            You won!
          </h1>

          {/* "[Animal name] is yours!" — H3 */}
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--t1)',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {auction.name} is yours!
          </h2>

          {/* "[X] coins spent" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 32,
              color: 'var(--t2)',
              fontSize: 14,
            }}
          >
            <Coins size={14} aria-hidden="true" />
            <span>{coinsSpent.toLocaleString()} coins spent</span>
          </div>

          {/* "Go to My Animals" — only dismiss path */}
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={onGoToAnimals}
          >
            Go to My Animals
          </Button>
        </div>
      </motion.div>
    </>
  )
}

// ─── AuctionWonOverlay ────────────────────────────────────────────────────────

interface AuctionWonOverlayProps {
  auction: AuctionItem | null
  isOpen: boolean
  onGoToAnimals: () => void
}

export function AuctionWonOverlay({
  auction,
  isOpen,
  onGoToAnimals,
}: AuctionWonOverlayProps) {
  const reducedMotion = useReducedMotion()

  // AnimatePresence wraps only this overlay's content — independent wrapper,
  // not sharing mode="wait" with any other sibling (CLAUDE.md Framer Motion §1)
  const content = (
    <AnimatePresence>
      {isOpen && auction && (
        <OverlayContent
          key={`won-overlay-${auction.id}`}
          auction={auction}
          reducedMotion={reducedMotion}
          onGoToAnimals={onGoToAnimals}
        />
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
