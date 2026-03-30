// HabitatBuilderGame — 5-day survival simulation
//
// Architecture notes:
//   - Session header: createPortal to body, z-1100 (portal rule: fixed inside motion parent)
//   - XP strip: createPortal to body, z-1099
//   - Stat badge: createPortal to body, z-1150 (above session, below complete overlay)
//   - Session complete: createPortal to body, z-1200
//   - Quit banner: createPortal to body, z-1050 (inline slide-down, no modal/backdrop)
//   - PARTICLE RULE: badge initial state is scale: 1, opacity: 1 — never scale: 0
//   - TINT PAIR RULE: all badges use tint-pair — no solid colour + white text
//   - GHOST RULE: no ghost variant anywhere

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check, Lightbulb, ArrowUp, RotateCcw, Coins,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { CollectedCard } from '@/lib/db'

// ─── Types ─────────────────────────────────────────────────────────────────────
//
// HabitatBuilderOption / HabitatBuilderDecision are the internal types used by
// this simulation component. They are deliberately distinct from the
// HabitatOption / HabitatDecision types exported by questionGenerator.ts, which
// will be integrated by the Developer agent in a later phase.

export interface HabitatBuilderOption {
  label: string
  subtext?: string
  effect: { stamina?: number; food?: number; shelter?: number }
  isCorrect: boolean
}

export interface HabitatBuilderDecision {
  day: number
  situation: string
  options: HabitatBuilderOption[]
  outcomeCorrect: string
  outcomeIncorrect: string
}

export interface HabitatBuilderGameProps {
  card: CollectedCard
  yearLevel: 1 | 2 | 3
  onExit: () => void
  onComplete: (result: { xpEarned: number; statDeltas: Record<string, number> }) => void
}

// ─── Resource bar config ───────────────────────────────────────────────────────

interface ResourceBar {
  key: 'stamina' | 'food' | 'shelter'
  label: string
  colour: string  // DS token string
  colourDanger: string
}

const RESOURCE_BARS: ResourceBar[] = [
  { key: 'stamina',  label: 'Stamina',  colour: 'var(--green)',  colourDanger: 'var(--red)' },
  { key: 'food',     label: 'Food',     colour: 'var(--amber)',  colourDanger: 'var(--red)' },
  { key: 'shelter',  label: 'Shelter',  colour: 'var(--blue)',   colourDanger: 'var(--red)' },
]

const DANGER_THRESHOLD = 25
const INITIAL_VALUE    = 60
const CORRECT_GAIN     = 15
const WRONG_PENALTY    = 10
const TOTAL_DAYS       = 5
const XP_PER_CORRECT   = 10

// ─── Fallback decision generator ──────────────────────────────────────────────
// Used when @/data/questionGenerator is not yet built.

function generateFallbackDecisions(card: CollectedCard): HabitatBuilderDecision[] {
  const role = card.habitatBuilderRole ?? 'omnivore'
  const isCarnivore  = role === 'carnivore' || role === 'apex_predator'
  const isHerbivore  = role === 'herbivore'

  return [
    {
      day: 1,
      situation: `${card.name} wakes up in the habitat. What should they do first?`,
      options: [
        {
          label: isCarnivore ? 'Hunt for prey at dawn' : isHerbivore ? 'Find a patch of fresh plants' : 'Forage for food nearby',
          subtext: 'Use energy while it is cool',
          effect: { stamina: CORRECT_GAIN, food: CORRECT_GAIN },
          isCorrect: true,
        },
        {
          label: 'Stay in shelter all morning',
          subtext: 'Rest and save energy',
          effect: { stamina: -WRONG_PENALTY },
          isCorrect: false,
        },
        {
          label: 'Explore far from home',
          subtext: 'Risky without food',
          effect: { food: -WRONG_PENALTY, stamina: -WRONG_PENALTY },
          isCorrect: false,
        },
      ],
      outcomeCorrect:   'Great choice — starting with food gives plenty of energy for the day.',
      outcomeIncorrect: 'Think about what gives the most energy early in the day.',
    },
    {
      day: 2,
      situation: 'A storm is approaching. What is the safest plan?',
      options: [
        {
          label: 'Find shelter before the rain arrives',
          subtext: 'Staying dry protects health',
          effect: { shelter: CORRECT_GAIN, stamina: CORRECT_GAIN },
          isCorrect: true,
        },
        {
          label: 'Keep foraging — there is still time',
          subtext: 'Risk getting caught in the rain',
          effect: { food: CORRECT_GAIN, shelter: -WRONG_PENALTY },
          isCorrect: false,
        },
        {
          label: 'Climb the tallest tree to watch the storm',
          subtext: 'Curious but dangerous',
          effect: { stamina: -WRONG_PENALTY, shelter: -WRONG_PENALTY },
          isCorrect: false,
        },
      ],
      outcomeCorrect:   'Smart thinking — shelter comes first when a storm is near.',
      outcomeIncorrect: 'When bad weather is coming, finding shelter is the priority.',
    },
    {
      day: 3,
      situation: `${card.name} is tired. How should they recover?`,
      options: [
        {
          label: 'Rest in a safe, sheltered spot',
          subtext: 'Restore energy properly',
          effect: { stamina: CORRECT_GAIN, shelter: CORRECT_GAIN },
          isCorrect: true,
        },
        {
          label: 'Push through and keep moving',
          subtext: 'Ignore tiredness',
          effect: { stamina: -WRONG_PENALTY, food: -WRONG_PENALTY },
          isCorrect: false,
        },
        {
          label: 'Eat as much as possible',
          subtext: 'Food might help',
          effect: { food: CORRECT_GAIN, stamina: -WRONG_PENALTY },
          isCorrect: false,
        },
      ],
      outcomeCorrect:   'Rest is the best way to restore stamina in the wild.',
      outcomeIncorrect: 'A tired animal needs rest before anything else.',
    },
    {
      day: 4,
      situation: 'Food supplies are running low. What is the best strategy?',
      options: [
        {
          label: isCarnivore ? 'Track a reliable food source carefully' : 'Find a new foraging area with plenty of plants',
          subtext: 'Plan ahead for tomorrow too',
          effect: { food: CORRECT_GAIN, stamina: CORRECT_GAIN },
          isCorrect: true,
        },
        {
          label: 'Eat whatever is closest, even if it is not the best',
          subtext: 'Fast but risky',
          effect: { food: Math.floor(CORRECT_GAIN / 2), stamina: -Math.floor(WRONG_PENALTY / 2) },
          isCorrect: false,
        },
        {
          label: 'Wait and hope food appears',
          subtext: 'Passive approach',
          effect: { food: -WRONG_PENALTY, stamina: -WRONG_PENALTY },
          isCorrect: false,
        },
      ],
      outcomeCorrect:   'Planning ahead means there will be food tomorrow too.',
      outcomeIncorrect: 'When food is low, a careful plan beats rushing.',
    },
    {
      day: 5,
      situation: `Final day. ${card.name} must prepare for a cold night. What is the best choice?`,
      options: [
        {
          label: 'Gather extra food and reinforce shelter',
          subtext: 'Prepare for the cold ahead',
          effect: { food: CORRECT_GAIN, shelter: CORRECT_GAIN, stamina: CORRECT_GAIN },
          isCorrect: true,
        },
        {
          label: 'Go exploring one last time',
          subtext: 'Adventure before rest',
          effect: { stamina: -WRONG_PENALTY, food: -WRONG_PENALTY },
          isCorrect: false,
        },
        {
          label: 'Sleep early without gathering supplies',
          subtext: 'Save energy now',
          effect: { shelter: -WRONG_PENALTY, food: -WRONG_PENALTY },
          isCorrect: false,
        },
      ],
      outcomeCorrect:   'Excellent planning — a well-stocked shelter means a safe, warm night.',
      outcomeIncorrect: 'Before a cold night, gathering food and reinforcing shelter is key.',
    },
  ]
}

// ─── XP threshold helper ───────────────────────────────────────────────────────

function xpThreshold(level: number): number {
  return 50 * level
}

// ─── Session header (portalled) ───────────────────────────────────────────────

function SessionHeader({
  card,
  day,
  onExit,
}: {
  card: CollectedCard
  day: number
  onExit: () => void
}) {
  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 z-[1100] flex items-center"
      style={{
        height: 56,
        paddingTop: 'env(safe-area-inset-top)',
        background: 'rgba(13,13,17,.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div className="flex items-center justify-between w-full px-4 py-2">
        {/* Left: card thumbnail + name */}
        <div className="flex items-center gap-2 min-w-0" style={{ flex: '1 1 0' }}>
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <AnimalImage
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              fallbackClassName="w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-600 text-[var(--t1)] truncate" style={{ maxWidth: 90 }}>
              {card.name}
            </p>
            <p className="text-[11px] font-500 text-[var(--t3)]">Habitat Builder</p>
          </div>
        </div>

        {/* Centre: day progress */}
        <div className="flex flex-col items-center shrink-0">
          <p className="text-[13px] font-600 text-[var(--t3)]">Day {day} / {TOTAL_DAYS}</p>
        </div>

        {/* Right: exit */}
        <div className="flex items-center justify-end" style={{ flex: '1 1 0' }}>
          <button
            onClick={onExit}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--t3)] hover:text-[var(--t1)] hover:bg-white/[.06] transition-colors"
            aria-label="Exit game session"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── XP strip (portalled) ─────────────────────────────────────────────────────

function XpStrip({ card, xpEarned }: { card: CollectedCard; xpEarned: number }) {
  const level     = card.level ?? 1
  const baseXp    = card.xp ?? 0
  const threshold = xpThreshold(level)
  const currentXp = Math.min(baseXp + xpEarned, threshold)
  const pct       = Math.min((currentXp / threshold) * 100, 100)

  return createPortal(
    <div
      className="fixed bottom-0 left-0 right-0 z-[1099] flex items-center px-4"
      style={{
        height: 44,
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(13,13,17,.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,.06)',
      }}
    >
      <div className="flex items-center gap-3 max-w-3xl mx-auto w-full">
        <p className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] shrink-0 w-16 truncate">
          {card.name}
        </p>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-s)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'var(--blue)', transition: 'width 400ms ease-out' }}
          />
        </div>
        <p className="text-[11px] font-600 text-[var(--t3)] shrink-0">
          {currentXp} / {threshold} XP
        </p>
      </div>
    </div>,
    document.body,
  )
}

// ─── Quit banner (portalled) ──────────────────────────────────────────────────

function QuitBanner({
  visible,
  onStay,
  onLeave,
}: {
  visible: boolean
  onStay: () => void
  onLeave: () => void
}) {
  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed left-0 right-0 z-[1050] px-4 py-3"
          style={{
            top: 56,
            paddingTop: 'calc(env(safe-area-inset-top))',
            background: 'rgba(13,13,17,.96)',
            borderBottom: '1px solid rgba(255,255,255,.06)',
          }}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-[14px] font-600 text-[var(--t1)] mb-0.5">Leave this session?</p>
            <p className="text-[13px] font-400 text-[var(--t2)] mb-3">
              Your cards won't gain XP if you leave.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={onStay}>Keep going</Button>
              <Button variant="accent" size="sm" onClick={onLeave}>Leave</Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ─── Stat badge animation (portalled) ─────────────────────────────────────────
//
// FRAMER MOTION RULE 3: initial={{ scale: 1, opacity: 1 }} — never scale: 0.
// Badge flies upward from near the card thumbnail, fades out at 800ms.

function StatBadge({
  label,
  anchorY,
  anchorX,
  onDone,
}: {
  label: string
  anchorY: number
  anchorX: number
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [onDone])

  return createPortal(
    <motion.div
      className="fixed z-[1150] pointer-events-none px-3 py-1.5 rounded-[var(--r-pill)] flex items-center gap-1.5 text-[13px] font-600"
      style={{
        top:       anchorY,
        left:      anchorX,
        background:    'var(--green-sub)',
        border:        '1px solid var(--green)',
        color:         'var(--green-t)',
        // PARTICLE RULE: start at full opacity and scale, animate upward
        scale:   1,
        opacity: 1,
      }}
      animate={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <ArrowUp size={12} />
      {label}
    </motion.div>,
    document.body,
  )
}

// ─── Confetti burst (portalled) ───────────────────────────────────────────────

const CONFETTI_COUNT = 18

function ConfettiBurst({
  reducedMotion,
  onDone,
}: {
  reducedMotion: boolean
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  if (reducedMotion) return null

  const particles = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle  = (i / CONFETTI_COUNT) * Math.PI * 2
    const dist   = 80 + Math.random() * 120
    const tx     = Math.cos(angle) * dist
    const ty     = Math.sin(angle) * dist
    const rotate = Math.random() * 360

    return (
      <motion.div
        key={i}
        className="absolute rounded-sm"
        style={{
          width:       6 + Math.random() * 6,
          height:      6 + Math.random() * 6,
          background:  'var(--blue)',
          top:         '50%',
          left:        '50%',
          translateX:  '-50%',
          translateY:  '-50%',
          // PARTICLE RULE: initial is NOT scale: 0
          opacity: 1,
          scale:   1,
        }}
        animate={{ x: tx, y: ty, rotate, opacity: 0 }}
        transition={{ duration: 1.2 + Math.random() * 0.8, ease: 'easeOut' }}
      />
    )
  })

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[1190] flex items-center justify-center overflow-hidden">
      <div className="relative">{particles}</div>
    </div>,
    document.body,
  )
}

// ─── Session complete overlay (portalled) ─────────────────────────────────────

function SessionCompleteOverlay({
  card,
  xpEarned,
  correctCount,
  statDeltas,
  reducedMotion,
  onPlayAgain,
  onExit,
}: {
  card: CollectedCard
  xpEarned: number
  correctCount: number
  statDeltas: Record<string, number>
  reducedMotion: boolean
  onPlayAgain: () => void
  onExit: () => void
}) {
  const [showConfetti, setShowConfetti] = useState(!reducedMotion)
  const navigate = useNavigate()

  const level     = card.level ?? 1
  const baseXp    = card.xp ?? 0
  const threshold = xpThreshold(level)
  const newXp     = Math.min(baseXp + xpEarned, threshold)
  const pct       = (newXp / threshold) * 100

  const statEntries = Object.entries(statDeltas).filter(([, v]) => v > 0)

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[1200] overflow-y-auto flex flex-col"
      style={{
        background:         'rgba(13,13,17,.96)',
        backdropFilter:     'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showConfetti && (
        <ConfettiBurst
          reducedMotion={reducedMotion}
          onDone={() => setShowConfetti(false)}
        />
      )}

      <div className="max-w-md mx-auto w-full px-6 pt-16 pb-24 flex flex-col items-center gap-6">
        {/* Card image */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden">
          <AnimalImage
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
          />
        </div>

        {/* Heading + rarity */}
        <div className="text-center">
          <p className="text-[22px] font-700 text-[var(--t1)] mb-1">Habitat survived!</p>
          <p className="text-[17px] font-600 text-[var(--t1)] mb-2">{card.name}</p>
          <RarityBadge rarity={card.rarity} />
        </div>

        {/* Rewards */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* XP earned — green tint-pair */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)] border"
            style={{ background: 'var(--green-sub)', borderColor: 'var(--green)' }}
          >
            <ArrowUp size={14} className="text-[var(--green-t)]" />
            <span className="text-[14px] font-600 text-[var(--green-t)]">+{xpEarned} XP</span>
          </div>
          {/* Correct decisions */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)] border"
            style={{ background: 'var(--amber-sub)', borderColor: 'var(--amber)' }}
          >
            <Coins size={14} className="text-[var(--amber-t)]" />
            <span className="text-[14px] font-600 text-[var(--amber-t)]">{correctCount} / {TOTAL_DAYS}</span>
          </div>
        </div>

        {/* Stat deltas — green tint-pair */}
        {statEntries.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            {statEntries.map(([stat, delta]) => (
              <div
                key={stat}
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)] border"
                style={{ background: 'var(--green-sub)', borderColor: 'var(--green)' }}
              >
                <ArrowUp size={14} className="text-[var(--green-t)]" />
                <span className="text-[14px] font-600 text-[var(--green-t)] capitalize">
                  +{delta} {stat}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* XP progress bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-600 text-[var(--t1)]">Level {level}</span>
            <span className="text-[13px] font-400 text-[var(--t3)]">{newXp} / {threshold} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-s)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--blue)' }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="w-full rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--card)] px-4 py-3">
          <p className="text-[13px] font-400 text-[var(--t2)]">
            Good decisions: <span className="font-600 text-[var(--t1)]">{correctCount} / {TOTAL_DAYS}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <Button variant="primary" size="lg" className="w-full" onClick={onPlayAgain}>
            <RotateCcw size={15} />
            Play again
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onExit}>
            Change card
          </Button>
          {/* Plain text link — NOT a ghost button (ghost is prohibited for visible actions) */}
          <button
            className="text-[14px] font-600 text-[var(--t2)] underline-offset-2 hover:text-[var(--t1)] transition-colors"
            style={{ textDecoration: 'underline' }}
            onClick={() => navigate('/play')}
          >
            Back to games
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}

// ─── Resource bar row ─────────────────────────────────────────────────────────

function ResourceBars({
  values,
}: {
  values: Record<'stamina' | 'food' | 'shelter', number>
}) {
  return (
    <div className="flex gap-4 w-full">
      {RESOURCE_BARS.map(({ key, label, colour, colourDanger }) => {
        const pct      = Math.min(Math.max(values[key], 0), 100)
        const isDanger = pct < DANGER_THRESHOLD
        const fill     = isDanger ? colourDanger : colour

        return (
          <div key={key} className="flex-1 flex flex-col gap-1.5">
            <p className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)]">
              {label}
            </p>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width:      `${pct}%`,
                  background: fill,
                  transition: 'width 600ms ease-out, background 300ms ease-out',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Decision option card ─────────────────────────────────────────────────────

type OptionState = 'idle' | 'correct' | 'wrong'

function DecisionOption({
  option,
  state,
  locked,
  onClick,
}: {
  option: HabitatBuilderOption
  state: OptionState
  locked: boolean
  onClick: () => void
}) {
  function getStyle(): React.CSSProperties {
    if (state === 'correct') {
      return { background: 'var(--green-sub)', borderColor: 'var(--green)' }
    }
    if (state === 'wrong') {
      return { background: 'var(--red-sub)', borderColor: 'var(--red)' }
    }
    return { background: 'var(--card)', borderColor: 'var(--border-s)' }
  }

  return (
    <button
      onClick={onClick}
      disabled={locked}
      className="w-full text-left rounded-2xl border p-4 transition-all duration-150 focus-visible:outline-2 focus-visible:outline focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2 hover:border-[var(--border)] hover:translate-y-[-1px] disabled:cursor-default"
      style={{ minHeight: 44, ...getStyle() }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-600 text-[var(--t1)] leading-snug">{option.label}</p>
          {option.subtext && (
            <p className="text-[13px] font-400 text-[var(--t2)] mt-1">{option.subtext}</p>
          )}
        </div>
        {state === 'correct' && (
          <Check size={16} className="text-[var(--green-t)] shrink-0 mt-0.5" />
        )}
      </div>
    </button>
  )
}

// ─── Main game component ───────────────────────────────────────────────────────

export function HabitatBuilderGame({
  card,
  yearLevel: _yearLevel,
  onExit,
  onComplete,
}: HabitatBuilderGameProps) {
  const navigate      = useNavigate()
  const reducedMotion = useReducedMotion()

  // Memoised — generateFallbackDecisions returns a new array every call; without useMemo
  // this causes currentDecision to get a new reference each render, which trips the
  // useEffect below and creates an infinite setState → re-render → setState loop.
  const decisions: HabitatBuilderDecision[] = useMemo(() => generateFallbackDecisions(card), [card])

  // Session state
  const [day,             setDay]           = useState(1)
  const [resources,       setResources]     = useState<Record<'stamina' | 'food' | 'shelter', number>>({
    stamina: INITIAL_VALUE,
    food:    INITIAL_VALUE,
    shelter: INITIAL_VALUE,
  })
  const [optionStates,    setOptionStates]  = useState<OptionState[]>([])
  const [locked,          setLocked]        = useState(false)
  const [xpEarned,        setXpEarned]      = useState(0)
  const [correctCount,    setCorrectCount]  = useState(0)
  const [statDeltas,      setStatDeltas]    = useState<Record<string, number>>({})
  const [showQuit,        setShowQuit]      = useState(false)
  const [complete,        setComplete]      = useState(false)
  const [badge,           setBadge]         = useState<{ label: string; x: number; y: number } | null>(null)
  const [wrongAttempts,   setWrongAttempts] = useState(0)
  const [lastWrongIdx,    setLastWrongIdx]  = useState<number | null>(null)

  const quitTimer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thumbnailRef   = useRef<HTMLDivElement>(null)

  const currentDecision = decisions[day - 1]

  // Suppress BottomNav during session
  useEffect(() => {
    document.body.dataset.hideNav = 'true'
    return () => { delete document.body.dataset.hideNav }
  }, [])

  // Quit banner auto-dismiss
  useEffect(() => {
    if (showQuit) {
      quitTimer.current = setTimeout(() => setShowQuit(false), 8000)
    }
    return () => {
      if (quitTimer.current !== null) clearTimeout(quitTimer.current)
    }
  }, [showQuit])

  // Initialise option states when day changes
  useEffect(() => {
    if (currentDecision) {
      setOptionStates(currentDecision.options.map(() => 'idle'))
      setLocked(false)
      setWrongAttempts(0)
      setLastWrongIdx(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day])

  const fireBadge = useCallback((label: string) => {
    if (reducedMotion) return
    const el = thumbnailRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setBadge({ label, x: rect.left, y: rect.top - 8 })
  }, [reducedMotion])

  function applyEffect(effect: HabitatBuilderOption['effect']): void {
    setResources(prev => ({
      stamina: Math.min(100, Math.max(0, prev.stamina + (effect.stamina ?? 0))),
      food:    Math.min(100, Math.max(0, prev.food    + (effect.food    ?? 0))),
      shelter: Math.min(100, Math.max(0, prev.shelter + (effect.shelter ?? 0))),
    }))
  }

  function handleOptionTap(idx: number) {
    if (locked) return
    const option = currentDecision.options[idx]

    if (option.isCorrect) {
      // Mark all options with correct/idle states
      setOptionStates(prev => prev.map((_, i) => i === idx ? 'correct' : 'idle'))
      setLocked(true)
      applyEffect(option.effect)

      const newXp      = xpEarned + XP_PER_CORRECT
      const newCorrect = correctCount + 1
      setXpEarned(newXp)
      setCorrectCount(newCorrect)

      // Track stat delta for the bar that gained the most
      const primaryEffect = (Object.entries(option.effect) as Array<[string, number | undefined]>)
        .filter(([, v]) => (v ?? 0) > 0)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      const primaryStat = primaryEffect[0]?.[0] ?? 'stamina'
      setStatDeltas(prev => ({ ...prev, [primaryStat]: (prev[primaryStat] ?? 0) + 1 }))

      fireBadge(`+1 ${primaryStat.charAt(0).toUpperCase() + primaryStat.slice(1)}`)

      // Auto-advance after 1200ms
      setTimeout(() => {
        if (day >= TOTAL_DAYS) {
          const finalDeltas = { ...statDeltas, [primaryStat]: (statDeltas[primaryStat] ?? 0) + 1 }
          onComplete({ xpEarned: newXp, statDeltas: finalDeltas })
          setComplete(true)
        } else {
          setDay(d => d + 1)
        }
      }, 1200)
    } else {
      // Wrong tap: pulse red for 400ms, then reset to idle
      setOptionStates(prev => prev.map((_, i) => i === idx ? 'wrong' : prev[i]))
      setWrongAttempts(w => w + 1)
      setLastWrongIdx(idx)
      applyEffect(option.effect)
      setTimeout(() => {
        setOptionStates(prev => prev.map((_, i) => i === idx ? 'idle' : prev[i]))
        setLastWrongIdx(null)
      }, 400)
    }
  }

  function handlePlayAgain() {
    setDay(1)
    setResources({ stamina: INITIAL_VALUE, food: INITIAL_VALUE, shelter: INITIAL_VALUE })
    setXpEarned(0)
    setCorrectCount(0)
    setStatDeltas({})
    setComplete(false)
    setWrongAttempts(0)
    setLastWrongIdx(null)
  }

  if (!currentDecision && !complete) return null

  // ─── Phone layout (< 820px) ─────────────────────────────────────────────────
  // ─── iPad layout (≥ 820px): two-column ──────────────────────────────────────

  return (
    <>
      {/* Portalled session header */}
      <SessionHeader card={card} day={day} onExit={() => setShowQuit(true)} />

      {/* Portalled XP strip */}
      <XpStrip card={card} xpEarned={xpEarned} />

      {/* Portalled quit banner */}
      <QuitBanner
        visible={showQuit}
        onStay={() => setShowQuit(false)}
        onLeave={() => { setShowQuit(false); onExit() }}
      />

      {/* Stat badge animation */}
      <AnimatePresence>
        {badge && (
          <StatBadge
            key={badge.label + badge.y}
            label={badge.label}
            anchorX={badge.x}
            anchorY={badge.y}
            onDone={() => setBadge(null)}
          />
        )}
      </AnimatePresence>

      {/* Session complete overlay */}
      <AnimatePresence>
        {complete && (
          <SessionCompleteOverlay
            card={card}
            xpEarned={xpEarned}
            correctCount={correctCount}
            statDeltas={statDeltas}
            reducedMotion={reducedMotion}
            onPlayAgain={handlePlayAgain}
            onExit={onExit}
          />
        )}
      </AnimatePresence>

      {/* Question area */}
      <div
        className="flex-1 overflow-y-auto pb-[44px]"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {!complete && currentDecision && (
          <div className="max-w-3xl mx-auto w-full px-6 pt-6 pb-24">

            {/* ── iPad two-column layout ── */}
            <div className="flex flex-col md:flex-row gap-8">

              {/* ── Left column (phone: full width, iPad: 50%) ── */}
              <div className="flex flex-col gap-6 md:w-1/2">
                {/* Card thumbnail */}
                <div ref={thumbnailRef} className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 md:w-40 md:h-40">
                    <AnimalImage
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      fallbackClassName="w-full h-full"
                    />
                  </div>
                  <div className="md:hidden">
                    {/* Day indicator — phone only, beside thumbnail */}
                    <p
                      className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)] mb-1"
                    >
                      Day {day} of {TOTAL_DAYS}
                    </p>
                    {/* 5-dot progress */}
                    <div className="flex gap-1.5">
                      {Array.from({ length: TOTAL_DAYS }, (_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: i < day ? 'var(--blue)' : 'var(--border)' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Day indicator + dots — iPad only, below thumbnail */}
                <div className="hidden md:flex flex-col gap-2">
                  <p className="text-[11px] font-700 uppercase tracking-widest text-[var(--t3)]">
                    Day {day} of {TOTAL_DAYS}
                  </p>
                  <div className="flex gap-1.5">
                    {Array.from({ length: TOTAL_DAYS }, (_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ background: i < day ? 'var(--blue)' : 'var(--border)' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Situation text */}
                <p className="text-[17px] font-600 text-[var(--t1)] leading-snug max-w-sm">
                  {currentDecision.situation}
                </p>
              </div>

              {/* ── Right column (phone: full width, iPad: 50%) ── */}
              <div className="flex flex-col gap-6 md:w-1/2">
                {/* Resource bars */}
                <ResourceBars values={resources} />

                {/* Decision options */}
                <div className="flex flex-col gap-3">
                  {currentDecision.options.map((option, idx) => (
                    <DecisionOption
                      key={idx}
                      option={option}
                      state={optionStates[idx] ?? 'idle'}
                      locked={locked}
                      onClick={() => handleOptionTap(idx)}
                    />
                  ))}
                </div>

                {/* Hint strip — appears after wrong answer */}
                <AnimatePresence>
                  {wrongAttempts > 0 && !locked && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-2 px-4 py-3 rounded-[var(--r-lg)]"
                      style={{ background: 'var(--amber-sub)', border: '1px solid var(--amber)' }}
                    >
                      <Lightbulb size={16} className="text-[var(--amber-t)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-600 text-[var(--t2)]">Try that one again</p>
                        <p className="text-[13px] font-400 text-[var(--t3)]">
                          {currentDecision.outcomeIncorrect}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
