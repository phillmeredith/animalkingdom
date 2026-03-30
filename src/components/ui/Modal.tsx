// Modal + BottomSheet — NFT Dark DS modal anatomy + iOS bottom sheet
// Spring animation via Framer Motion
//
// PORTAL REQUIREMENT: Both components render via ReactDOM.createPortal to prevent
// fixed-position containment inside Framer Motion animated ancestors. Any ancestor
// with transform, opacity < 1, filter, will-change, or perspective creates a new
// stacking context and traps fixed children. Portal escapes that entirely.
//
// SCROLL LOCK: Uses reference-counted useScrollLock (not direct body.style.overflow)
// so two simultaneous overlays do not fight each other over scroll restoration.

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollLock } from '@/hooks/useScrollLock'

// ─── Backdrop ──────────────────────────────────────────────────────────────────

function Backdrop({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    />
  )
}

// ─── Centred Modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

export function Modal({ isOpen, onClose, title, children, className, maxWidth = 'max-w-[420px]' }: ModalProps) {
  const reducedMotion = useReducedMotion()
  const { lock, unlock } = useScrollLock()
  // dialogRef — used for role/aria-modal and focus trap
  const dialogRef = useRef<HTMLDivElement>(null)

  // Reference-counted scroll lock — safe when Modal and BottomSheet are both open.
  useEffect(() => {
    if (isOpen) {
      lock()
      return unlock
    }
  }, [isOpen])

  // Focus trap: on open, move focus to the first focusable element.
  // Tab cycles within the dialog; Shift+Tab wraps from first to last.
  // On close the trap is removed automatically via cleanup.
  useEffect(() => {
    if (!isOpen) return
    const el = dialogRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <Backdrop onClick={onClose} />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            className={cn(
              'relative rounded-2xl p-7 shadow-elevated w-full',
              maxWidth,
              className,
            )}
            style={{
              background: 'rgba(13,13,17,.80)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,.06)',
            }}
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? {} : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--elev)] text-t3 hover:bg-[var(--border)] hover:text-t1 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <X size={14} />
            </button>

            {title && (
              <h2 id="modal-title" className="text-[22px] font-bold text-t1 mb-4 pr-8">{title}</h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

// ─── Bottom Sheet ──────────────────────────────────────────────────────────────

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  /**
   * Maximum height of the sheet panel.
   * Accepts any valid CSS length (e.g. "80vh", "85vh", "600px").
   * Defaults to "85vh" — preserves pre-existing behaviour for all existing callers.
   * The inner scroll container derives its own max-height from this value, so
   * passing a new maxHeight correctly constrains both the panel and its content area.
   */
  maxHeight?: string
}

export function BottomSheet({ isOpen, onClose, title, children, className, maxHeight = '85vh' }: BottomSheetProps) {
  const reducedMotion = useReducedMotion()
  const { lock, unlock } = useScrollLock()

  // Reference-counted scroll lock — safe when two BottomSheets or a BottomSheet
  // and a Modal are open simultaneously.
  useEffect(() => {
    if (isOpen) {
      lock()
      return unlock
    }
  }, [isOpen])

  // The inner scroll container subtracts the fixed chrome height (drag handle ~28px
  // + optional header ~56px = up to 84px). Using 80px as a safe constant matches the
  // original hardcoded value and covers both states (with and without title header).
  const scrollMaxHeight = `calc(${maxHeight} - 80px)`

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end">
          <Backdrop onClick={onClose} />
          <motion.div
            className={cn(
              'relative w-full',
              'rounded-t-2xl shadow-elevated overflow-hidden',
              className,
            )}
            style={{
              maxHeight,
              background: 'rgba(13,13,17,.80)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderTop: '1px solid rgba(255,255,255,.06)',
              borderLeft: '1px solid rgba(255,255,255,.04)',
              borderRight: '1px solid rgba(255,255,255,.04)',
            }}
            initial={reducedMotion ? {} : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reducedMotion ? {} : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Optional titled header with close button */}
            {title && (
              <div className="flex items-center justify-between px-7 py-3 border-b border-[var(--border-s)]">
                <h2 className="text-[22px] font-bold text-t1">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[var(--elev)] text-t3 hover:bg-[var(--border)] hover:text-t1 transition-colors flex items-center justify-center"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Scrollable content area */}
            <div
              className="overflow-y-auto overscroll-contain"
              style={{
                maxHeight: scrollMaxHeight,
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

/** Actions row for modals */
export function ModalActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-2 mt-6', className)}>
      {children}
    </div>
  )
}
