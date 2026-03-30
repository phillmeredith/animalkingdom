// WorldQuestGame — Mapbox satellite + 3D terrain geography game
//
// Architecture notes:
//   - Session header: createPortal to body, z-1100 (portal rule: fixed inside motion parent)
//   - XP strip: createPortal to body, z-1099
//   - Stat badge: createPortal to body, z-1150
//   - Session complete: createPortal to body, z-1200
//   - Quit banner: createPortal to body, z-1050 (inline slide-down, no modal/backdrop)
//   - PARTICLE RULE: badge initial state is scale: 1, opacity: 1 — never scale: 0
//   - TINT PAIR RULE: all badges use tint-pair — no solid colour + white text
//   - GHOST RULE: no ghost variant anywhere
//   - MAP: real satellite imagery + 3D terrain via MapboxGameMap (react-map-gl v7)

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { useProgress } from '@/hooks/useProgress'
import type { CollectedCard } from '@/lib/db'
import { MapboxGameMap } from '@/components/games/MapboxGameMap'
import type { MapHighlight } from '@/components/games/MapboxGameMap'

// ─── Types ─────────────────────────────────────────────────────────────────────

type QuestionType = 'tap-map' | 'mcq'

interface MapQuestion {
  type: 'tap-map'
  question: string
  targetCountry: string      // must match an SVG path id
  hint: string
}

interface McqQuestion {
  type: 'mcq'
  question: string
  options: string[]
  correctIndex: number
  hint: string
}

type WorldQuestQuestion = MapQuestion | McqQuestion

export interface WorldQuestGameProps {
  card: CollectedCard
  yearLevel: 1 | 2 | 3
  onExit: () => void
  onComplete: (result: { xpEarned: number; statDeltas: Record<string, number> }) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS   = 10
const XP_PER_CORRECT    = 10
const COINS_PER_CORRECT = 5

// ─── Fallback questions for Year 1 ───────────────────────────────────────────
// The generateWorldQuestQuestions function will be wired in by the Developer
// when questionGenerator is built. These inline questions cover the session.

const YEAR1_QUESTIONS: WorldQuestQuestion[] = [
  {
    type: 'tap-map',
    question: 'Can you find England on the map? Tap it!',
    targetCountry: 'england',
    hint: 'England is the largest country in the south of the island.',
  },
  {
    type: 'mcq',
    question: 'Which direction would you travel to get from England to Scotland?',
    options: ['North', 'South', 'East', 'West'],
    correctIndex: 0,
    hint: 'Scotland is above England on the map.',
  },
  {
    type: 'tap-map',
    question: 'Where is Scotland? Tap the map to show where it is.',
    targetCountry: 'scotland',
    hint: 'Scotland is in the northern part of the main island.',
  },
  {
    type: 'mcq',
    question: 'Which direction would you travel to get from England to Wales?',
    options: ['East', 'North', 'West', 'South'],
    correctIndex: 2,
    hint: 'Wales is to the left (west) of England.',
  },
  {
    type: 'tap-map',
    question: 'Can you find Wales on the map? Tap it!',
    targetCountry: 'wales',
    hint: 'Wales is on the western side of the main island.',
  },
  {
    type: 'mcq',
    question: 'Northern Ireland is separated from the rest of the UK by which body of water?',
    options: ['The English Channel', 'The Irish Sea', 'The North Sea', 'The Atlantic Ocean'],
    correctIndex: 1,
    hint: 'It is a sea, not a channel — and it sits between Ireland and Britain.',
  },
  {
    type: 'tap-map',
    question: 'Find Northern Ireland on the map and tap it.',
    targetCountry: 'northern-ireland',
    hint: 'Northern Ireland is on the island to the west of Scotland.',
  },
  {
    type: 'mcq',
    question: 'How many countries make up the United Kingdom?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    hint: 'England, Scotland, Wales, and Northern Ireland — count them!',
  },
  {
    type: 'mcq',
    question: 'What is the capital city of Scotland?',
    options: ['Glasgow', 'Edinburgh', 'Aberdeen', 'Dundee'],
    correctIndex: 1,
    hint: 'It is also known as "The Athens of the North".',
  },
  {
    type: 'mcq',
    question: 'What is the capital city of Wales?',
    options: ['Swansea', 'Bangor', 'Cardiff', 'Newport'],
    correctIndex: 2,
    hint: 'It is in the south of Wales, close to the coast.',
  },
]

const YEAR2_QUESTIONS: WorldQuestQuestion[] = [
  {
    type: 'tap-map',
    question: 'Can you find France on the map? Tap it!',
    targetCountry: 'france',
    hint: 'France is just south-east of England across the English Channel.',
  },
  {
    type: 'mcq',
    question: 'Which country is directly north of Spain?',
    options: ['Portugal', 'France', 'Italy', 'Germany'],
    correctIndex: 1,
    hint: 'There is a mountain range called the Pyrenees between them.',
  },
  {
    type: 'tap-map',
    question: 'Where is Germany? Tap it on the map.',
    targetCountry: 'germany',
    hint: 'Germany is in central Europe, east of France.',
  },
  {
    type: 'mcq',
    question: 'What sea is to the east of Italy?',
    options: ['Adriatic Sea', 'Mediterranean Sea', 'Baltic Sea', 'North Sea'],
    correctIndex: 0,
    hint: 'It is named after a Roman city — Hadria.',
  },
  {
    type: 'tap-map',
    question: 'Find Spain on the map and tap it.',
    targetCountry: 'spain',
    hint: 'Spain is a large country on the Iberian Peninsula in the south-west.',
  },
  {
    type: 'mcq',
    question: 'Which direction is Norway from the UK?',
    options: ['East', 'North-east', 'South', 'West'],
    correctIndex: 1,
    hint: 'Norway is a Scandinavian country across the North Sea.',
  },
  {
    type: 'tap-map',
    question: 'Can you tap on Italy? It is shaped like a boot!',
    targetCountry: 'italy',
    hint: 'Look for the long peninsula that looks like a boot kicking eastwards.',
  },
  {
    type: 'mcq',
    question: 'What is the capital of France?',
    options: ['Lyon', 'Marseille', 'Paris', 'Nice'],
    correctIndex: 2,
    hint: 'It is also famous for the Eiffel Tower.',
  },
  {
    type: 'mcq',
    question: 'Which river flows through Germany, Austria, and Hungary?',
    options: ['Rhine', 'Danube', 'Thames', 'Seine'],
    correctIndex: 1,
    hint: 'It is the longest river in the European Union.',
  },
  {
    type: 'mcq',
    question: 'Which European country has the most people?',
    options: ['France', 'Spain', 'Germany', 'Italy'],
    correctIndex: 2,
    hint: 'It is in central Europe and its capital is Berlin.',
  },
]

const YEAR3_QUESTIONS: WorldQuestQuestion[] = [
  {
    type: 'tap-map',
    question: 'Tap the continent of Africa on the world map.',
    targetCountry: 'africa',
    hint: 'Africa is the large continent south of Europe and west of Asia.',
  },
  {
    type: 'mcq',
    question: 'Which continent contains the Amazon rainforest?',
    options: ['Africa', 'Asia', 'South America', 'Australia'],
    correctIndex: 2,
    hint: 'The Amazon River runs through the largest rainforest on Earth.',
  },
  {
    type: 'tap-map',
    question: 'Tap Australia on the map.',
    targetCountry: 'australia',
    hint: 'Australia is both a country and a continent — in the southern hemisphere.',
  },
  {
    type: 'mcq',
    question: 'On which continent would you find the Sahara Desert?',
    options: ['Australia', 'Asia', 'Africa', 'South America'],
    correctIndex: 2,
    hint: 'The Sahara is the largest hot desert in the world.',
  },
  {
    type: 'tap-map',
    question: 'Find South America and tap it on the map.',
    targetCountry: 'south-america',
    hint: 'South America is below North America and to the left of Africa.',
  },
  {
    type: 'mcq',
    question: 'What is the largest ocean in the world?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
    correctIndex: 2,
    hint: 'It covers more than one third of the Earth\'s surface.',
  },
  {
    type: 'mcq',
    question: 'Which line divides the Earth into northern and southern hemispheres?',
    options: ['Tropic of Cancer', 'Equator', 'Prime Meridian', 'Arctic Circle'],
    correctIndex: 1,
    hint: 'It is at 0 degrees latitude.',
  },
  {
    type: 'mcq',
    question: 'How many continents are there on Earth?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    hint: 'Africa, Antarctica, Asia, Australia, Europe, North America, South America.',
  },
  {
    type: 'mcq',
    question: 'Which continent has the most countries?',
    options: ['Asia', 'Europe', 'Africa', 'Americas'],
    correctIndex: 2,
    hint: 'It has 54 recognised countries.',
  },
  {
    type: 'tap-map',
    question: 'Can you tap on Asia — the largest continent?',
    targetCountry: 'asia',
    hint: 'Asia is the large continent to the east, covering Russia, China, India, and many more.',
  },
]

function getQuestions(yearLevel: 1 | 2 | 3): WorldQuestQuestion[] {
  if (yearLevel === 2) return YEAR2_QUESTIONS
  if (yearLevel === 3) return YEAR3_QUESTIONS
  return YEAR1_QUESTIONS
}

// ─── XP threshold helper ───────────────────────────────────────────────────────

function xpThreshold(level: number): number {
  return 50 * level
}

// ─── REMOVED: UKMap, WesternEuropeMap, WorldMap SVG components ────────────────
// Replaced by MapboxGameMap (satellite streets + 3D terrain via react-map-gl).
// See src/components/games/MapboxGameMap.tsx.



// ─── Compass rose ─────────────────────────────────────────────────────────────

function CompassRose() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Compass rose"
    >
      {/* Circle background */}
      <circle cx="24" cy="24" r="22" fill="var(--card)" stroke="var(--border-s)" strokeWidth="1" />
      {/* North arrow */}
      <polygon points="24,6 21,22 27,22" fill="var(--blue)" />
      {/* South arrow */}
      <polygon points="24,42 21,26 27,26" fill="var(--border)" />
      {/* East arrow */}
      <polygon points="42,24 26,21 26,27" fill="var(--border)" />
      {/* West arrow */}
      <polygon points="6,24 22,21 22,27" fill="var(--border)" />
      {/* Centre dot */}
      <circle cx="24" cy="24" r="3" fill="var(--t1)" />
      {/* Labels */}
      <text x="24" y="5"  textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--t3)" fontFamily="DM Sans, sans-serif">N</text>
      <text x="24" y="47" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--t3)" fontFamily="DM Sans, sans-serif">S</text>
      <text x="47" y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--t3)" fontFamily="DM Sans, sans-serif">E</text>
      <text x="1"  y="27" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--t3)" fontFamily="DM Sans, sans-serif">W</text>
    </svg>
  )
}

// ─── Session header (portalled) ───────────────────────────────────────────────

function SessionHeader({
  card,
  questionIndex,
  onExit,
}: {
  card: CollectedCard
  questionIndex: number
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
            <p className="text-[11px] font-500 text-[var(--t3)]">World Quest</p>
          </div>
        </div>

        {/* Centre: question counter */}
        <div className="flex flex-col items-center shrink-0">
          <p className="text-[13px] font-600 text-[var(--t3)]">
            {questionIndex + 1} / {TOTAL_QUESTIONS}
          </p>
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
            style={{ width: `${pct}%`, background: 'var(--purple)', transition: 'width 400ms ease-out' }}
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
        background: 'var(--purple-sub)',
        border:     '1px solid var(--purple)',
        color:      'var(--purple-t)',
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
          width:      6 + Math.random() * 6,
          height:     6 + Math.random() * 6,
          background: 'var(--purple)',
          top:        '50%',
          left:       '50%',
          translateX: '-50%',
          translateY: '-50%',
          opacity:    1,
          scale:      1,
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
  coinsEarned,
  correctCount,
  statDeltas,
  reducedMotion,
  onPlayAgain,
  onExit,
}: {
  card: CollectedCard
  xpEarned: number
  coinsEarned: number
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
        background:           'rgba(13,13,17,.96)',
        backdropFilter:       'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showConfetti && (
        <ConfettiBurst reducedMotion={reducedMotion} onDone={() => setShowConfetti(false)} />
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
          <p className="text-[22px] font-700 text-[var(--t1)] mb-1">Quest complete!</p>
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
          {/* Coins earned — amber tint-pair */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)] border"
            style={{ background: 'var(--amber-sub)', borderColor: 'var(--amber)' }}
          >
            <Coins size={14} className="text-[var(--amber-t)]" />
            <span className="text-[14px] font-600 text-[var(--amber-t)]">+{coinsEarned}</span>
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

        {/* XP bar */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-600 text-[var(--t1)]">Level {level}</span>
            <span className="text-[13px] font-400 text-[var(--t3)]">{newXp} / {threshold} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-s)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: 'var(--purple)' }}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="w-full rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--card)] px-4 py-3">
          <p className="text-[13px] font-400 text-[var(--t2)]">
            Correct answers: <span className="font-600 text-[var(--t1)]">{correctCount} / {TOTAL_QUESTIONS}</span>
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
          {/* Plain text link — NOT a ghost button */}
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

// ─── MCQ options ──────────────────────────────────────────────────────────────

type AnswerState = 'idle' | 'correct' | 'wrong'

function McqOptions({
  options,
  correctIndex,
  onCorrect,
  onWrong,
}: {
  options: string[]
  correctIndex: number
  onCorrect: () => void
  onWrong: () => void
}) {
  const [answerState, setAnswerState]   = useState<AnswerState>('idle')
  const [selectedIdx, setSelectedIdx]   = useState<number | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [skipped, setSkipped]           = useState(false)

  function handleSelect(idx: number) {
    if (answerState === 'correct' || skipped) return
    setSelectedIdx(idx)

    if (idx === correctIndex) {
      setAnswerState('correct')
      setTimeout(() => onCorrect(), 800)
    } else {
      setAnswerState('wrong')
      setWrongAttempts(w => w + 1)
      setTimeout(() => {
        setAnswerState('idle')
        setSelectedIdx(null)
      }, 400)
    }
  }

  function handleSkip() {
    setSkipped(true)
    setTimeout(() => onWrong(), 600)
  }

  function optionStyle(idx: number): React.CSSProperties {
    const isSelected  = selectedIdx === idx
    const isCorrect   = idx === correctIndex
    const showCorrect = skipped && isCorrect

    if (answerState === 'correct' && isSelected) {
      return { background: 'var(--green-sub)', borderColor: 'var(--green)', color: 'var(--green-t)' }
    }
    if (answerState === 'wrong' && isSelected) {
      return { background: 'var(--red-sub)', borderColor: 'var(--red)', color: 'var(--red-t)' }
    }
    if (showCorrect) {
      return { background: 'var(--green-sub)', borderColor: 'var(--green)', color: 'var(--green-t)' }
    }
    return { background: 'var(--card)', borderColor: 'var(--border-s)', color: 'var(--t1)' }
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt, idx) => {
        const isCorrectAnswer = idx === correctIndex
        const showCheck = (answerState === 'correct' && selectedIdx === idx) || (skipped && isCorrectAnswer)

        return (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={answerState === 'correct' || skipped}
            className="w-full text-left flex items-center justify-between gap-3 px-4 rounded-[var(--r-lg)] border transition-all duration-150 focus-visible:outline-2 focus-visible:outline focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
            style={{ minHeight: 52, fontSize: 16, fontWeight: 600, ...optionStyle(idx) }}
          >
            <span className="flex-1">{opt}</span>
            {showCheck && <Check size={16} className="shrink-0" />}
          </button>
        )
      })}

      {/* Hint strip */}
      <AnimatePresence>
        {wrongAttempts > 0 && answerState !== 'correct' && !skipped && (
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
              <p className="text-[13px] font-400 text-[var(--t3)]">Think carefully about the answer</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip link */}
      <AnimatePresence>
        {wrongAttempts >= 2 && answerState !== 'correct' && !skipped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <button
              onClick={handleSkip}
              className="text-[11px] font-600 text-[var(--t3)] underline underline-offset-2 hover:text-[var(--t2)] transition-colors"
            >
              Skip this one
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main game component ───────────────────────────────────────────────────────

export function WorldQuestGame({
  card,
  yearLevel,
  onExit,
  onComplete,
}: WorldQuestGameProps) {
  const navigate      = useNavigate()
  const reducedMotion = useReducedMotion()
  const { discoverCountry } = useProgress()

  const questions = getQuestions(yearLevel)

  const [questionIndex, setQuestionIndex]  = useState(0)
  const [xpEarned,      setXpEarned]       = useState(0)
  const [coinsEarned,   setCoinsEarned]     = useState(0)
  const [correctCount,  setCorrectCount]    = useState(0)
  const [statDeltas,    setStatDeltas]      = useState<Record<string, number>>({})
  const [showQuit,      setShowQuit]        = useState(false)
  const [complete,      setComplete]        = useState(false)
  const [badge,         setBadge]           = useState<{ label: string; x: number; y: number } | null>(null)

  // Map interaction state
  const [highlightedCountry, setHighlightedCountry] = useState<string | null>(null)
  const [mapHighlight,       setMapHighlight]        = useState<MapHighlight>(null)
  const [mapLocked,          setMapLocked]           = useState(false)

  const quitTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thumbnailRef = useRef<HTMLDivElement>(null)

  const currentQuestion = questions[questionIndex]

  // Suppress BottomNav
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

  // Reset map state when question changes
  useEffect(() => {
    setHighlightedCountry(null)
    setMapHighlight(null)
    setMapLocked(false)
  }, [questionIndex])

  const fireBadge = useCallback((label: string) => {
    if (reducedMotion) return
    const el = thumbnailRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setBadge({ label, x: rect.left, y: rect.top - 8 })
  }, [reducedMotion])

  // Alternate stats between intelligence and agility
  function getStatForQuestion(idx: number): string {
    return idx % 2 === 0 ? 'intelligence' : 'agility'
  }

  const handleCorrect = useCallback(() => {
    const newXp     = xpEarned + XP_PER_CORRECT
    const newCoins  = coinsEarned + COINS_PER_CORRECT
    const stat      = getStatForQuestion(questionIndex)
    const newDeltas = { ...statDeltas, [stat]: (statDeltas[stat] ?? 0) + 1 }

    setXpEarned(newXp)
    setCoinsEarned(newCoins)
    setCorrectCount(c => c + 1)
    setStatDeltas(newDeltas)
    fireBadge(`+1 ${stat.charAt(0).toUpperCase() + stat.slice(1)}`)

    if (questionIndex + 1 >= questions.length) {
      onComplete({ xpEarned: newXp, statDeltas: newDeltas })
      setComplete(true)
    } else {
      setTimeout(() => setQuestionIndex(i => i + 1), 1200)
    }
  }, [xpEarned, coinsEarned, statDeltas, questionIndex, questions.length, onComplete, fireBadge])

  const handleWrong = useCallback(() => {
    if (questionIndex + 1 >= questions.length) {
      onComplete({ xpEarned, statDeltas })
      setComplete(true)
    } else {
      setQuestionIndex(i => i + 1)
    }
  }, [questionIndex, questions.length, xpEarned, statDeltas, onComplete])

  function handleCountryTap(countryId: string) {
    if (mapLocked) return
    if (currentQuestion.type !== 'tap-map') return

    setHighlightedCountry(countryId)
    setMapLocked(true)

    if (countryId === currentQuestion.targetCountry) {
      setMapHighlight('correct')
      // Discover the country in the DB
      discoverCountry(countryId).catch(() => {
        // Non-blocking — discovery failure should not interrupt the game
      })
      setTimeout(() => handleCorrect(), 800)
    } else {
      setMapHighlight('wrong')
      setTimeout(() => {
        setMapHighlight(null)
        setHighlightedCountry(null)
        setMapLocked(false)
      }, 400)
    }
  }

  function handlePlayAgain() {
    setQuestionIndex(0)
    setXpEarned(0)
    setCoinsEarned(0)
    setCorrectCount(0)
    setStatDeltas({})
    setComplete(false)
    setHighlightedCountry(null)
    setMapHighlight(null)
    setMapLocked(false)
  }

  if (!currentQuestion && !complete) return null

  const isTapQuestion = !complete && currentQuestion?.type === 'tap-map'

  return (
    <>
      {/* Portalled session header */}
      <SessionHeader
        card={card}
        questionIndex={questionIndex}
        onExit={() => setShowQuit(true)}
      />

      {/* Portalled XP strip */}
      <XpStrip card={card} xpEarned={xpEarned} />

      {/* Portalled quit banner */}
      <QuitBanner
        visible={showQuit}
        onStay={() => setShowQuit(false)}
        onLeave={() => { setShowQuit(false); onExit() }}
      />

      {/* Stat badge */}
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
            coinsEarned={coinsEarned}
            correctCount={correctCount}
            statDeltas={statDeltas}
            reducedMotion={reducedMotion}
            onPlayAgain={handlePlayAgain}
            onExit={onExit}
          />
        )}
      </AnimatePresence>

      {/* Question area — full-height flex column so map fills remaining space */}
      <div
        className="flex-1 flex flex-col pb-[44px]"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {!complete && currentQuestion && (
          <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 pt-3 pb-4 min-h-0">

            {/* Question text — compact strip at top */}
            <div className="flex items-start gap-3 mb-3 shrink-0">
              {/* Badge anchor: card thumbnail on desktop, invisible div on phone */}
              <div className="hidden md:block w-12 h-12 rounded-lg overflow-hidden shrink-0" ref={thumbnailRef}>
                <AnimalImage
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full"
                />
              </div>
              <div className="md:hidden shrink-0" ref={thumbnailRef} aria-hidden />
              <p className="text-[17px] font-600 text-[var(--t1)] leading-snug flex-1">
                {currentQuestion.question}
              </p>
            </div>

            {/* Map — fills all remaining space. min-h-0 is required for flex-1 to shrink correctly. */}
            <div className="flex-1 min-h-0 rounded-[var(--r-lg)] overflow-hidden border border-[var(--border-s)] relative">
              <MapboxGameMap
                yearLevel={yearLevel}
                highlightedCountry={highlightedCountry}
                highlight={mapHighlight}
                onCountryTap={handleCountryTap}
                mapLocked={mapLocked}
                questionIndex={questionIndex}
              />
              <div className="absolute bottom-6 right-3 pointer-events-none z-10">
                <CompassRose />
              </div>
            </div>

            {/* Bottom panel — MCQ options or tap-map hint */}
            <div className="shrink-0 mt-3">
              {currentQuestion.type === 'mcq' ? (
                <McqOptions
                  key={`q-${questionIndex}`}
                  options={currentQuestion.options}
                  correctIndex={currentQuestion.correctIndex}
                  onCorrect={handleCorrect}
                  onWrong={handleWrong}
                />
              ) : (
                <>
                  <p className="text-[12px] font-500 text-[var(--t3)] text-center mb-2">
                    Tap the correct country on the map
                  </p>
                  {mapHighlight === 'wrong' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2 px-4 py-3 rounded-[var(--r-lg)]"
                      style={{ background: 'var(--amber-sub)', border: '1px solid var(--amber)' }}
                    >
                      <Lightbulb size={16} className="text-[var(--amber-t)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-600 text-[var(--t2)]">Try that one again</p>
                        <p className="text-[13px] font-400 text-[var(--t3)]">
                          {currentQuestion.hint}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
