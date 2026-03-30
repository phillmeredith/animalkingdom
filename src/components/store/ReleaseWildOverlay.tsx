// ReleaseWildOverlay — full-screen celebration overlay shown when a rescued animal
// is released back to the wild.
//
// Portal requirement: rendered via createPortal to document.body to escape any
// ancestor stacking context created by Framer Motion transforms (CLAUDE.md rule).
//
// Framer Motion rules applied:
//   - Particles use initial={{ scale: 1 }} — no scale: 0 on burst particles
//   - Particles are rendered OUTSIDE the AnimatePresence block wrapping the overlay
//     entrance — they must animate independently (CLAUDE.md §AnimatePresence rule)

import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins } from 'lucide-react'
import { AnimalImage } from '@/components/ui/AnimalImage'
import type { RescueMission } from '@/lib/db'

// ─── Particle helpers ─────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number
  y: number
  rotate: number
  color: string
  size: number
  delay: number
  duration: number
}

const PARTICLE_COLORS = [
  '#45B26B', // mint green
  '#ffffff', // white
  '#7EDFA5', // light green
  '#A8F0C6', // pale green
  '#3772FF', // blue accent
]

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 360,         // ±180px horizontal spread
    y: Math.random() * 260 - 200,            // between -200 and +60px vertical
    rotate: (Math.random() - 0.5) * 720,     // ±360 degrees
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    size: Math.random() * 8 + 6,             // 6–14px
    delay: Math.random() * 0.3,              // stagger up to 300ms
    duration: 0.8 + Math.random() * 0.4,     // 0.8–1.2s
  }))
}

// Particles are stable across renders — built once per mount using useMemo equivalent
// (module-level const is fine here; the overlay is unmounted between releases)
const PARTICLES = buildParticles(20)

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReleaseWildOverlayProps {
  mission: RescueMission | null  // null = hidden
  coinsEarned: number
  onViewMap: () => void
  onContinue: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReleaseWildOverlay({ mission, coinsEarned, onViewMap, onContinue }: ReleaseWildOverlayProps) {
  const isOpen = mission !== null

  const content = (
    <>
      {/* ── Overlay entrance ── controlled by its own AnimatePresence */}
      <AnimatePresence>
        {isOpen && mission && (
          // exit candidate: the overlay itself — justified as the sole controlled exit target
          <motion.div
            key="release-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'linear-gradient(135deg, #45B26B 0%, #3772FF 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            // Intentionally no onClick dismiss — must use buttons only (spec)
          >
            {/* Animal image */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <AnimalImage
                src={mission.imageUrl}
                alt={mission.name}
                className="w-32 h-32 rounded-2xl object-cover"
              />
            </motion.div>

            {/* Text content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 24,
                width: '100%',
                maxWidth: 384,
              }}
            >
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#ffffff',
                  textAlign: 'center',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Well done, ranger!
              </p>

              <p
                style={{
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.80)',
                  textAlign: 'center',
                  margin: '8px 0 0',
                }}
              >
                {mission.name} is free!
              </p>

              {/* Coin reward pill — white bg, border white/40, amber text */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 24,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  background: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.40)',
                }}
              >
                <Coins size={16} strokeWidth={2} style={{ color: '#D97706' }} aria-hidden="true" />
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#D97706',
                  }}
                >
                  {coinsEarned} coins earned
                </span>
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginTop: 32,
                  width: '100%',
                }}
              >
                {/* Primary — white bg, dark text */}
                <button
                  onClick={onViewMap}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 12,
                    background: '#ffffff',
                    color: '#0D0D11',
                    fontSize: 16,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  View on World Map
                </button>

                {/* Secondary — white/20 bg, white text */}
                <button
                  onClick={onContinue}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.20)',
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Particle burst ── independent AnimatePresence, outside the overlay entrance block.
          Particles animate independently and must not block the overlay exit (CLAUDE.md rule). */}
      <AnimatePresence>
        {isOpen && (
          // Burst origin is viewport centre — particles radiate outward from z:9999+1
          <div
            key="release-particles"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {PARTICLES.map(p => (
              <motion.div
                key={p.id}
                // Rule: burst particles start at full scale — never scale: 0 (CLAUDE.md §3)
                initial={{ scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 }}
                animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0 }}
                transition={{ delay: p.delay, duration: p.duration, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: 2,
                  background: p.color,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )

  return createPortal(content, document.body)
}
