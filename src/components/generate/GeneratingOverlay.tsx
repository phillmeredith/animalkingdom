// GeneratingOverlay — full-screen loading animation between step 7 and results
// Animated floating paw prints (reduced motion: instant)

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks'

const PAW_SVG = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM16 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM8 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM19 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM12 10c-2.5 0-5 2-5 5 0 1.5.5 3 1.5 4 .5.5 1 1 1.5 1.5.5.5 1.5.5 2 0 .5-.5 1-1 1.5-1.5 1-1 1.5-2.5 1.5-4 0-3-2.5-5-5-5Z" />
  </svg>
)

// Paw positions: x% from left, delay in seconds, size scale
const PAWS = [
  { x: 20, delay: 0,    scale: 0.8 },
  { x: 45, delay: 0.3,  scale: 1.2 },
  { x: 70, delay: 0.6,  scale: 0.9 },
  { x: 30, delay: 0.9,  scale: 1.0 },
  { x: 60, delay: 1.2,  scale: 0.7 },
]

interface GeneratingOverlayProps {
  visible: boolean
}

export function GeneratingOverlay({ visible }: GeneratingOverlayProps) {
  const reducedMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="generating"
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          {/* Floating paws */}
          {!reducedMotion && (
            <div className="relative w-full h-48 mb-8 overflow-hidden">
              {PAWS.map((paw, i) => (
                <motion.div
                  key={i}
                  className="absolute text-[var(--blue)] opacity-60"
                  style={{ left: `${paw.x}%`, bottom: 0, scale: paw.scale }}
                  initial={{ y: 0, opacity: 0 }}
                  animate={{ y: -160, opacity: [0, 0.7, 0] }}
                  transition={{
                    delay: paw.delay,
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    ease: 'easeOut',
                  }}
                >
                  {PAW_SVG}
                </motion.div>
              ))}
            </div>
          )}

          <p className="text-[22px] font-600 text-t1 text-center px-8">
            Discovering your animal...
          </p>
          <p className="text-[15px] text-t2 mt-2 text-center">
            One moment
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
