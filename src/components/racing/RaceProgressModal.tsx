// RaceProgressModal — BottomSheet that opens when a player taps a RunningRaceCard body.
// Uses BottomSheet from Modal.tsx so that scroll lock (useScrollLock, reference-counted)
// and createPortal are inherited automatically — no direct body.style.overflow manipulation,
// no duplicate portal call.
// Spec: spec/features/race-progress-modal/interaction-spec.md
// Stories: product/race-progress-modal/refined-stories.md

import { useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Zap, Trophy, Flag, Mountain, Crown } from 'lucide-react'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/Modal'
import { RaceStatusLabel } from '@/components/racing/RaceStatusLabel'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils'
import type { Race, SavedName } from '@/lib/db'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface RaceProgressModalProps {
  isOpen: boolean
  race: Race
  /** The player's entered pet. null triggers placeholder treatment. */
  pet: SavedName | null
  /** id of the race currently being resolved, if any. */
  resolving: number | null
  onClose: () => void
  onResolve: (race: Race) => void
}

// ─── Race type icon map (mirrors PlayHubScreen) ─────────────────────────────────

const RACE_TYPE_ICON: Record<string, React.ReactNode> = {
  sprint:       <Zap  size={28} className="text-[var(--amber-t)]"  />,
  standard:     <Flag size={28} className="text-[var(--blue-t)]"   />,
  endurance:    <Mountain size={28} className="text-[var(--green-t)]" />,
  championship: <Crown size={28} className="text-[var(--purple-t)]" />,
}

// ─── Progress computation ───────────────────────────────────────────────────────

function computeFillPct(race: Race): number {
  const now     = Date.now()
  const start   = race.startsAt.getTime()
  const finish  = race.finishesAt.getTime()
  const span    = finish - start
  if (span <= 0) return 95
  const elapsed = now - start
  const raw     = (elapsed / span) * 100
  return Math.min(95, Math.max(5, raw))
}

function isRaceReady(race: Race): boolean {
  return Date.now() >= race.finishesAt.getTime()
}

// ─── Animal hero section ────────────────────────────────────────────────────────

function AnimalHero({ pet, reducedMotion }: { pet: SavedName | null; reducedMotion: boolean }) {
  const imageNode = pet ? (
    <AnimalImage
      src={pet.imageUrl}
      alt={pet.name}
      className="w-24 h-24 rounded-2xl object-cover"
    />
  ) : (
    // Placeholder when pet cannot be resolved
    <div
      className="w-24 h-24 rounded-2xl bg-[var(--elev)] border-2 border-[var(--blue)] flex items-center justify-center"
    >
      <Zap size={28} className="text-[var(--blue-t)]" />
    </div>
  )

  return (
    <div className="flex flex-col items-center gap-3 py-5">
      {/* Bob wrapper — inline-flex prevents layout shift */}
      <motion.div
        style={{ display: 'inline-flex' }}
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={
          reducedMotion
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Blue border + glow applied as a wrapper to avoid overriding AnimalImage classes */}
        <div
          style={{
            borderRadius: 'var(--r-lg)',
            border: '2px solid var(--blue)',
            boxShadow: 'var(--glow-blue)',
            display: 'inline-flex',
          }}
        >
          {imageNode}
        </div>
      </motion.div>

      <p className="text-[18px] font-bold text-t1 text-center">
        {pet?.name ?? 'Unknown Animal'}
      </p>
      <p className="text-[13px] text-t3 text-center">
        {pet?.breed ?? ''}
      </p>
    </div>
  )
}

// ─── Participants strip ─────────────────────────────────────────────────────────

function ParticipantsStrip({ race }: { race: Race }) {
  const npcParticipants = race.participants.filter((p) => !p.isPlayer)

  const MAX_VISIBLE = 6
  const visible    = npcParticipants.slice(0, MAX_VISIBLE)
  const overflowN  = npcParticipants.length - MAX_VISIBLE

  return (
    <div className="flex flex-col">
      <p className="text-[11px] font-bold uppercase tracking-widest text-t3 mb-2">
        Racing alongside
      </p>

      {npcParticipants.length === 0 ? (
        <p className="text-[13px] text-t3">No other runners found</p>
      ) : (
        <ul className="flex flex-col gap-0">
          {visible.map((p, i) => (
            <li key={i} className="flex items-center gap-2 py-1">
              {/* Generic silhouette avatar — no NPC imageUrl */}
              <div
                className="w-7 h-7 rounded-full bg-[var(--elev)] flex items-center justify-center shrink-0"
              >
                <Zap size={14} className="text-t4" />
              </div>
              <span className="text-[13px] font-medium text-t2 min-w-0 truncate">
                {p.name}
              </span>
              {p.breed && (
                <span className="text-[12px] text-t3 ml-auto shrink-0 pl-2">
                  {p.breed}
                </span>
              )}
            </li>
          ))}
          {overflowN > 0 && (
            <li className="text-[12px] text-t3 pt-1">
              +{overflowN} more runners
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ─── Progress section (state A — racing) ───────────────────────────────────────

function ProgressSectionA({
  race,
  reducedMotion,
}: {
  race: Race
  reducedMotion: boolean
}) {
  const [fillPct, setFillPct] = useState(() => computeFillPct(race))

  // Tick every 5 seconds per spec
  useEffect(() => {
    const id = setInterval(() => {
      setFillPct(computeFillPct(race))
    }, 5000)
    return () => clearInterval(id)
  }, [race])

  const showAlmostThere = fillPct >= 80

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <div className="flex items-center gap-1.5">
        <Zap size={14} className="text-[var(--blue-t)] shrink-0" />
        <span className="text-[13px] font-semibold text-[var(--blue-t)]">
          Racing now...
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full rounded-full bg-[var(--elev)] overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(fillPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Race progress"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${fillPct}%`,
            background: 'linear-gradient(to right, var(--blue), var(--pink))',
            transition: reducedMotion ? 'none' : 'width 4s ease-out',
          }}
        />
      </div>

      {/* Sub-label — only when ≥80% */}
      <div className="h-4">
        {showAlmostThere && (
          <p className="text-[12px] text-t3 text-right">Almost there!</p>
        )}
      </div>
    </div>
  )
}

// ─── Progress section (state B — ready) ────────────────────────────────────────

function ProgressSectionB({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {/* Trophy with scale pulse */}
      <motion.div
        animate={
          reducedMotion
            ? undefined
            : { scale: [1, 1.08, 1] }
        }
        transition={
          reducedMotion
            ? undefined
            : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <Trophy size={32} className="text-[var(--amber-t)]" aria-hidden="true" />
      </motion.div>

      <p className="text-[20px] font-bold text-t1 text-center">
        Ready to reveal!
      </p>
      <p className="text-[13px] text-t3 text-center">
        Your result is waiting.
      </p>
    </div>
  )
}

// ─── Sheet content ──────────────────────────────────────────────────────────────
// Rendered as children of <BottomSheet> — the sheet surface, portal, scroll lock,
// backdrop, and slide animation are all owned by BottomSheet.

function SheetContent({
  race,
  pet,
  resolving,
  onClose,
  onResolve,
  reducedMotion,
  closeButtonRef,
}: {
  race: Race
  pet: SavedName | null
  resolving: number | null
  onClose: () => void
  onResolve: (race: Race) => void
  reducedMotion: boolean
  closeButtonRef: React.RefObject<HTMLButtonElement>
}) {
  const [isReady, setIsReady] = useState(() => isRaceReady(race))
  // Track whether we have already been in state A — used to suppress the A→B
  // transition when the modal opens directly in state B.
  const wasRacingRef = useRef(!isRaceReady(race))

  // Poll for the A → B transition while modal is open
  useEffect(() => {
    if (isReady) return
    const id = setInterval(() => {
      if (isRaceReady(race)) {
        setIsReady(true)
        clearInterval(id)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [race, isReady])

  // Track whether this was an in-progress race (state A was shown)
  const openedInStateA = wasRacingRef.current

  const isResolvingThisRace = resolving === race.id
  const raceTypeIcon = RACE_TYPE_ICON[race.type] ?? <Flag size={28} />

  function handleReveal() {
    onClose()
    onResolve(race)
  }

  // CTA variant: accent (pink) only when ready
  const ctaVariant = isReady ? 'accent' : 'primary'

  return (
    // Content column — constrained on iPad
    <div className="max-w-xl mx-auto w-full px-6 pt-4 pb-8">

      {/* ── Close button — top-right corner per DS pattern ── */}
      <div className="flex justify-end mb-2">
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'bg-[var(--elev)] text-t3',
            'hover:bg-[var(--border)] hover:text-t1',
            'active:scale-[.97] transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2',
          )}
          aria-label="Close race progress"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Header row — icon + race name + status pill ── */}
      <div className="flex items-center gap-3 mb-1">
        {/* Race type icon */}
        <span className="flex items-center justify-center shrink-0">
          {raceTypeIcon}
        </span>

        {/* Race name */}
        <p className="text-[17px] font-bold text-t1 flex-1 min-w-0 truncate">
          {race.name}
        </p>

        {/* Status pill */}
        <RaceStatusLabel status="running" />
      </div>

      {/* ── Animal hero ── */}
      <AnimalHero pet={pet} reducedMotion={reducedMotion} />

      {/* ── Participants strip ── */}
      <ParticipantsStrip race={race} />

      {/* ── Divider ── */}
      <div className="border-t border-[var(--border-s)] mt-4 pt-4">
        {/* ── Progress / status section — cross-fades A → B ── */}
        <AnimatePresence mode="wait" initial={false}>
          {/* State A — controlled exit target: blocks B from mounting until A exits */}
          {!isReady && (
            <motion.div
              key="state-a"
              initial={false}
              exit={
                reducedMotion || !openedInStateA
                  ? {}
                  : { opacity: 0, y: -8 }
              }
              transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeIn' }}
            >
              <ProgressSectionA race={race} reducedMotion={reducedMotion} />
            </motion.div>
          )}

          {/* State B — controlled exit target: enters after A has exited */}
          {isReady && (
            <motion.div
              key="state-b"
              initial={
                reducedMotion || !openedInStateA
                  ? {}
                  : { opacity: 0, y: 8 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.3, ease: 'easeOut', delay: openedInStateA ? 0.2 : 0 }
              }
            >
              <ProgressSectionB reducedMotion={reducedMotion} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Primary CTA ── */}
      <div className="mt-4">
        <motion.div
          // Scale pulse on transition A → B (once, not looping)
          animate={
            isReady && !reducedMotion
              ? { scale: [1, 1.03, 1] }
              : {}
          }
          transition={
            isReady && !reducedMotion
              ? { duration: 0.3, ease: 'easeOut' }
              : {}
          }
        >
          <Button
            variant={ctaVariant}
            size="lg"
            className="w-full"
            disabled={isResolvingThisRace}
            onClick={handleReveal}
            icon={<Trophy size={16} aria-hidden="true" />}
          >
            {isResolvingThisRace ? 'Revealing...' : 'Reveal Result'}
          </Button>
        </motion.div>
      </div>

    </div>
  )
}

// ─── RaceProgressModal ──────────────────────────────────────────────────────────
// Shell: delegates sheet surface, portal, scroll lock, backdrop, and slide
// animation to <BottomSheet maxHeight="80vh"> from Modal.tsx.
// Focus trap and ARIA roles sit on an inner wrapper div inside BottomSheet children.

export function RaceProgressModal({
  isOpen,
  race,
  pet,
  resolving,
  onClose,
  onResolve,
}: RaceProgressModalProps) {
  const reducedMotion  = useReducedMotion()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  // Ref to restore focus on close
  const triggerRef     = useRef<Element | null>(null)

  // Capture the trigger element on open so focus can be restored on close.
  // Scroll lock is handled by BottomSheet via useScrollLock — no direct
  // body.style.overflow manipulation here.
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement
    }
  }, [isOpen])

  // Move focus to close button when opened
  useEffect(() => {
    if (isOpen) {
      // rAF ensures the portal has mounted and the button is in the DOM
      const rafId = requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })
      return () => cancelAnimationFrame(rafId)
    } else {
      // Return focus to the trigger element
      if (triggerRef.current && 'focus' in triggerRef.current) {
        ;(triggerRef.current as HTMLElement).focus()
      }
    }
  }, [isOpen])

  // Focus trap — keep Tab/Shift+Tab inside the dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Collect all focusable elements inside the dialog
      const dialog = e.currentTarget
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

      if (focusable.length === 0) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [onClose],
  )

  return (
    // BottomSheet owns: createPortal, useScrollLock (reference-counted), Backdrop,
    // glass surface (motion.div), drag handle, slide animation, and overflow-y-auto
    // scroll container (calc(80vh - 80px)).
    <BottomSheet isOpen={isOpen} onClose={onClose} maxHeight="80vh">
      {/* ARIA dialog wrapper — also owns the focus trap keyboard handler */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Race progress"
        onKeyDown={handleKeyDown}
      >
        <SheetContent
          race={race}
          pet={pet}
          resolving={resolving}
          onClose={onClose}
          onResolve={onResolve}
          reducedMotion={reducedMotion}
          closeButtonRef={closeButtonRef}
        />
      </div>
    </BottomSheet>
  )
}
