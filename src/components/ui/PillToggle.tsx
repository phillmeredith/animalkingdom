// PillToggle — segmented control (sub-tabs)
// NFT Dark DS: pill container, active = --elev bg with spring slide animation

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface PillToggleProps {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  /** Namespace for the layoutId — must be unique if two PillToggles render on the same screen */
  id?: string
}

export function PillToggle({ tabs, activeId, onChange, className = '', id = 'pill' }: PillToggleProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={`
        flex bg-[var(--card)] border border-[var(--border-s)]
        rounded-pill p-1 gap-0.5 ${className}
      `}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-pill
            text-[13px] font-medium transition-colors duration-200
            min-h-[44px] overflow-hidden
            ${activeId === tab.id ? 'text-t1' : 'text-t3 hover:text-t2'}
          `}
        >
          {/* Sliding background pill */}
          {activeId === tab.id && (
            reducedMotion ? (
              <div className="absolute inset-0 rounded-pill bg-[var(--elev)]" />
            ) : (
              <motion.div
                layoutId={id}
                className="absolute inset-0 rounded-pill bg-[var(--elev)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )
          )}
          {/* Content sits above the pill */}
          <span className="relative z-10 flex items-center gap-1.5">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}
