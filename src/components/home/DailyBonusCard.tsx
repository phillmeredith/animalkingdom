// DailyBonusCard — auto-dismissing daily bonus notification
// Appears on Home mount when bonus is awarded, slides away after 2.5s

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coins } from 'lucide-react'
import { useReducedMotion } from '@/hooks'

interface DailyBonusCardProps {
  amount: number
  streak: number
  onDismiss: () => void
}

export function DailyBonusCard({ amount, streak, onDismiss }: DailyBonusCardProps) {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const variants = reducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-4"
    >
      <div
        className="bg-[var(--card)] border border-[var(--border-s)] ring-1 ring-[var(--pink)] rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
        onClick={onDismiss}
        role="button"
        aria-label="Dismiss daily bonus"
      >
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-[var(--elev)]">
          <Coins className="w-6 h-6 text-[var(--amber)]" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-t1">Daily bonus!</p>
          <p className="text-[13px] text-[var(--amber-t)]">
            +{amount} coins · Day {streak}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
