// AdoptionOverlay — full-screen celebration after adopting
// Auto-dismisses after 2s or on tap. Triggers TraderPuzzle at 50% chance.

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useReducedMotion } from '@/hooks'

interface AdoptionOverlayProps {
  visible: boolean
  petName: string
  onDismiss: () => void
}

export function AdoptionOverlay({ visible, petName, onDismiss }: AdoptionOverlayProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [visible, onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="adoption-overlay"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(232,36,124,.65), rgba(55,114,255,.65))',
            backdropFilter: 'blur(20px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          onClick={onDismiss}
        >
          {/* Heart icon */}
          <motion.div
            initial={reducedMotion ? {} : { scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-6"
          >
            <Heart size={56} className="text-[var(--pink-t)]" />
          </motion.div>

          <h2 className="text-[28px] font-700 text-white text-center px-8">
            You adopted {petName}!
          </h2>
          <p className="text-[15px] text-white/70 mt-2 text-center">
            Welcome to the family
          </p>

          <p className="text-[12px] text-white/40 mt-10">
            Tap anywhere to continue
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
