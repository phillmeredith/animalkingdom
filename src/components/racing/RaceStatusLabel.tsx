// RaceStatusLabel — tinted pill badge showing race state for a given card
// Anatomy: inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600
// NOT interactive — no onClick, no tabIndex, no role
// Reduced motion: Racing icon renders statically (no Framer Motion wrapper)

import { Zap, Flag, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface RaceStatusLabelProps {
  status: 'open' | 'running' | 'finished'
  isEntered?: boolean
}

export function RaceStatusLabel({ status, isEntered = false }: RaceStatusLabelProps) {
  const reducedMotion = useReducedMotion()

  // ─── State derivation ────────────────────────────────────────────────────────

  if (status === 'finished') {
    // Spec 3.2: 'Done' — neutral tint rgba(119,126,145,.12) / #B1B5C4 (= var(--t2))
    return (
      <span
        className="inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600"
        style={{
          background: 'rgba(119,126,145,.12)',
          color: 'var(--t2)',
        }}
      >
        <Trophy size={10} strokeWidth={2} />
        Done
      </span>
    )
  }

  if (status === 'running') {
    const icon = reducedMotion ? (
      <Zap size={10} strokeWidth={2} />
    ) : (
      // Animated icon only — opacity oscillates 1→0.5→1, 1200ms cycle, spec 3.4.
      // motion.span is the sole animated element; it does not affect sibling layout.
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        style={{ display: 'inline-flex' }}
      >
        <Zap size={10} strokeWidth={2} />
      </motion.span>
    )

    return (
      <span
        className="inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600"
        style={{
          background: 'var(--pink-sub)',
          color: 'var(--pink-t)',
        }}
      >
        {icon}
        Racing
      </span>
    )
  }

  // status === 'open'
  if (isEntered) {
    return (
      <span
        className="inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600"
        style={{
          background: 'var(--blue-sub)',
          color: 'var(--blue-t)',
        }}
      >
        <Flag size={10} strokeWidth={2} />
        Ready!
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-[5px] px-[10px] py-[4px] rounded-full text-[12px] font-600"
      style={{
        background: 'var(--green-sub)',
        color: 'var(--green-t)',
      }}
    >
      <Zap size={10} strokeWidth={2} />
      Enter now
    </span>
  )
}
