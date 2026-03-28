// AnimalDetailModal — full-screen animal profile overlay
//
// EAD-2: Modal shell, portal, entry/exit animation, body scroll lock.
// Content sections (EAD-4 through EAD-10) are built by the FE thread and
// will be composed inside the scrollable content area below the glass header strip.
//
// PORTAL COMPLIANCE: This component renders via ReactDOM.createPortal into
// document.body. It must never be moved inside a motion.* subtree — any
// ancestor transform/opacity/filter creates a new stacking context that traps
// position:fixed children (see CLAUDE.md portal rule).

import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { AnimalDetailHeader } from './AnimalDetailHeader'
import { AnimalDetailContent } from './AnimalDetailContent'
import { getSoundUrl } from '@/data/animalSounds'
import type { AnimalEntry } from '@/data/animals'

export interface AnimalDetailModalProps {
  animal: AnimalEntry | null
  isOwned: boolean
  onClose: () => void
}

// ── Animation variants ─────────────────────────────────────────────────────────
//
// Full motion: slide up from y:100% with a spring entry, ease-in exit.
// Reduced motion: opacity fade only (150ms in, 150ms out), no y transform.

function buildVariants(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.15 } },
      exit: { opacity: 0, transition: { duration: 0.15 } },
    }
  }
  return {
    initial: { y: '100%', opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.7, 0, 0.84, 0] as [number, number, number, number],
      },
    },
  }
}

// ── ModalContent — rendered inside the portal ──────────────────────────────────

function ModalContent({ animal, isOwned, onClose }: AnimalDetailModalProps & { animal: AnimalEntry }) {
  const prefersReducedMotion = useReducedMotion()
  const { lock, unlock } = useScrollLock()
  const variants = buildVariants(prefersReducedMotion)
  const modalRef = useRef<HTMLDivElement>(null)

  // Apply body scroll lock for the lifetime of this component.
  // useScrollLock is reference-counted: safe to call alongside other overlays.
  useEffect(() => {
    lock()
    return () => { unlock() }
  // lock and unlock are module-level stable references — exhaustive-deps is correct here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Escape key dismissal (WCAG 2.1 SC 2.1.2 — no keyboard trap).
  // Focus is moved to the modal container on mount so Escape is immediately catchable.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    // Move focus into the modal so assistive technologies announce the dialog.
    // Timeout defers until after the spring entry animation frame.
    const focusTimer = setTimeout(() => { modalRef.current?.focus() }, 50)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(focusTimer)
    }
  }, [onClose])

  return (
    <motion.div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Animal profile — ${isOwned ? `Your ${animal.name}` : animal.name}`}
      // tabIndex="-1" allows programmatic focus without making the container tab-focusable
      // by keyboard users (focus moves to interactive children via normal Tab flow).
      tabIndex={-1}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ outline: 'none',
        // position:fixed is safe here because this element IS the portal root — it is
        // a direct child of document.body, not inside any motion.* ancestor.
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        // Full-screen modal sits on top of existing page content; no additional backdrop
        // overlay needed. Background is fully opaque so underlying content is hidden.
        backgroundColor: 'rgba(13,13,17,1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/*
        Scrollable content container.
        The glass header strip is rendered by FE (EAD-4) as a sticky child at the top
        of this container. This outer div is the scroll root.
        pb-24 ensures CTA is not obscured by any fixed element at the bottom of the screen.
      */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* EAD-4: glass header strip — sticky within this scroll container */}
        <AnimalDetailHeader animal={animal} isOwned={isOwned} soundUrl={getSoundUrl(animal.name)} onClose={onClose} />
        {/* EAD-4 through EAD-10: all content sections in canonical spec order */}
        <AnimalDetailContent animal={animal} onClose={onClose} />
      </div>
    </motion.div>
  )
}

// ── AnimalDetailModal — AnimatePresence wrapper, portal mount ─────────────────
//
// AnimatePresence is placed here (the call site) per the spec, not inside the modal
// itself. This component is the entry point rendered by ExploreScreen.

export function AnimalDetailModal({ animal, isOwned, onClose }: AnimalDetailModalProps) {
  return ReactDOM.createPortal(
    <AnimatePresence>
      {animal && (
        <ModalContent
          key={animal.id}
          animal={animal}
          isOwned={isOwned}
          onClose={onClose}
        />
      )}
    </AnimatePresence>,
    document.body,
  )
}
