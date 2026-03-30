// GameSessionShell — full-screen educational game session wrapper
// Story 2/3 (Phase 1): replaces ArcadeShell for the 4 educational games
//
// Architecture:
//   - Session header: createPortal to body, z-1100, glass surface
//   - XP strip: createPortal to body, z-1099, glass surface
//   - Question area: scrollable, pt-[calc(56px+env(safe-area-inset-top))] pb-[44px]
//   - Quit confirmation: inline slide-down banner below header (not a modal)
//   - Session complete: full-screen portal overlay, z-1200
//   - BottomNav suppressed via document.body.dataset.hideNav
//
// PORTAL RULE: header and XP strip are portalled because the session screen
// lives inside a Framer Motion animated route. Any fixed child of a motion
// parent is trapped in that stacking context. createPortal escapes this.
//
// PARTICLE RULE: ConfettiBurst initial={scale: 1, opacity: 1} — never scale: 0.
//
// GHOST RULE: no ghost variant anywhere. "Back to games" uses plain text link.

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check, Lightbulb, ArrowUp, RotateCcw, ChevronLeft, Coins,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { RarityBadge } from '@/components/ui/Badge'
import { AnimalImage } from '@/components/ui/AnimalImage'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { CollectedCard, SkillArea } from '@/lib/db'
import type { ArcadeQuestion } from '@/data/arcadeQuestions'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface GameSessionTheme {
  accent: string      // e.g. 'var(--amber)'
  accentSub: string
  accentText: string
  icon: ReactNode
  title: string
}

export interface GameSessionShellProps {
  card: CollectedCard
  area: SkillArea
  theme: GameSessionTheme
  questions: ArcadeQuestion[]
  onExit: () => void
  onComplete: (result: { xpEarned: number; statDeltas: Record<string, number> }) => void
}

// ─── XP threshold ─────────────────────────────────────────────────────────────

function xpThreshold(level: number): number {
  return 50 * level
}

// ─── Session header (portalled) ───────────────────────────────────────────────

function SessionHeader({
  card,
  theme,
  questionIndex,
  totalQuestions,
  onExit,
}: {
  card: CollectedCard
  theme: GameSessionTheme
  questionIndex: number
  totalQuestions: number
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
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <AnimalImage
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              fallbackClassName="w-full h-full"
            />
          </div>
          <p
            className="text-[14px] font-600 text-[var(--t1)] truncate"
            style={{ maxWidth: 90 }}
          >
            {card.name}
          </p>
        </div>

        {/* Centre: game icon + question counter */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span style={{ color: theme.accentText }}>{theme.icon}</span>
          </div>
          <p className="text-[13px] font-600 text-[var(--t2)]">
            {questionIndex + 1} / {totalQuestions}
          </p>
        </div>

        {/* Right: exit button */}
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

function XpStrip({
  card,
  xpEarned,
  theme,
}: {
  card: CollectedCard
  xpEarned: number
  theme: GameSessionTheme
}) {
  const level    = card.level ?? 1
  const baseXp   = card.xp ?? 0
  const threshold = xpThreshold(level)
  const currentXp = Math.min(baseXp + xpEarned, threshold)
  const pct = Math.min((currentXp / threshold) * 100, 100)

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
        {/* XP bar */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-s)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: theme.accent,
              transition: 'width 400ms ease-out',
            }}
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

// ─── Quit banner ──────────────────────────────────────────────────────────────

function QuitBanner({
  visible,
  onStay,
  onLeave,
}: {
  visible: boolean
  onStay: () => void
  onLeave: () => void
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          // Slides down from session header (sits just below it at ~56px offset)
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
              <Button variant="outline" size="sm" onClick={onStay}>Keep playing</Button>
              <button
                className="text-[13px] font-600 text-[var(--red-t)] hover:opacity-70 transition-opacity"
                onClick={onLeave}
              >
                Leave
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Confetti burst (portalled) ───────────────────────────────────────────────
//
// FRAMER MOTION RULE 3: initial state is scale: 1, opacity: 1 — never scale: 0.
// Particles fly outward from origin; do not bloom from nothing.

const CONFETTI_COUNT = 18

function ConfettiBurst({
  accent,
  reducedMotion,
  onDone,
}: {
  accent: string
  reducedMotion: boolean
  onDone: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
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
          width:  6 + Math.random() * 6,
          height: 6 + Math.random() * 6,
          background: accent,
          top: '50%',
          left: '50%',
          translateX: '-50%',
          translateY: '-50%',
          opacity: 1,
          scale: 1,
        }}
        animate={{ x: tx, y: ty, rotate, opacity: 0 }}
        transition={{ duration: 1.2 + Math.random() * 0.8, ease: 'easeOut' }}
      />
    )
  })

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[1190] flex items-center justify-center overflow-hidden">
      <div className="relative">
        {particles}
      </div>
    </div>,
    document.body,
  )
}

// ─── Session complete overlay (portalled) ─────────────────────────────────────

function SessionCompleteOverlay({
  card,
  theme,
  xpEarned,
  coinsEarned,
  statDeltas,
  correctCount,
  totalQuestions,
  reducedMotion,
  onPlayAgain,
  onChangeCard,
  onBackToGames,
}: {
  card: CollectedCard
  theme: GameSessionTheme
  xpEarned: number
  coinsEarned: number
  statDeltas: Record<string, number>
  correctCount: number
  totalQuestions: number
  reducedMotion: boolean
  onPlayAgain: () => void
  onChangeCard: () => void
  onBackToGames: () => void
}) {
  const [showConfetti, setShowConfetti] = useState(!reducedMotion)

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
        background: 'rgba(13,13,17,.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showConfetti && (
        <ConfettiBurst
          accent={theme.accent}
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

        {/* Card name + rarity */}
        <div className="text-center">
          <p className="text-[22px] font-700 text-[var(--t1)] mb-1">Session complete!</p>
          <p className="text-[17px] font-600 text-[var(--t1)] mb-2">{card.name}</p>
          <RarityBadge rarity={card.rarity} />
        </div>

        {/* Rewards */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* XP earned */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)] border"
            style={{
              background: 'var(--green-sub)',
              borderColor: 'var(--green)',
            }}
          >
            <ArrowUp size={14} className="text-[var(--green-t)]" />
            <span className="text-[14px] font-600 text-[var(--green-t)]">+{xpEarned} XP</span>
          </div>
          {/* Coins earned */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--r-lg)] border"
            style={{
              background: 'var(--amber-sub)',
              borderColor: 'var(--amber)',
            }}
          >
            <Coins size={14} className="text-[var(--amber-t)]" />
            <span className="text-[14px] font-600 text-[var(--amber-t)]">+{coinsEarned}</span>
          </div>
        </div>

        {/* Stat deltas */}
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
            <span className="text-[13px] font-600 text-[var(--t1)]">Level {card.level ?? 1}</span>
            <span className="text-[13px] font-400 text-[var(--t3)]">
              {newXp} / {threshold} XP
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-s)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: theme.accent }}
            />
          </div>
        </div>

        {/* Session summary */}
        <div className="w-full rounded-[var(--r-lg)] border border-[var(--border-s)] bg-[var(--card)] px-4 py-3">
          <p className="text-[13px] font-400 text-[var(--t2)]">
            Challenges answered: <span className="font-600 text-[var(--t1)]">{correctCount} / {totalQuestions}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <Button variant="primary" size="lg" className="w-full" onClick={onPlayAgain}>
            <RotateCcw size={15} />
            Play again
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onChangeCard}>
            Change card
          </Button>
          {/* Plain text link — NOT a ghost button (ghost is prohibited for visible actions) */}
          <button
            className="text-[14px] font-600 text-[var(--t2)] underline-offset-2 hover:text-[var(--t1)] transition-colors"
            style={{ textDecoration: 'underline' }}
            onClick={onBackToGames}
          >
            Back to games
          </button>
        </div>
      </div>
    </motion.div>,
    document.body,
  )
}

// ─── MCQ question display ─────────────────────────────────────────────────────

type AnswerState = 'idle' | 'correct' | 'wrong'

function McqQuestion({
  question,
  onCorrect,
  onWrong,
  theme,
}: {
  question: ArcadeQuestion
  onCorrect: () => void
  onWrong: () => void
  theme: GameSessionTheme
}) {
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [skipped, setSkipped] = useState(false)

  function handleSelect(idx: number) {
    if (answerState === 'correct' || skipped) return

    setSelectedIdx(idx)
    if (idx === question.correctIndex) {
      setAnswerState('correct')
      setTimeout(() => onCorrect(), 800)
    } else {
      setAnswerState('wrong')
      setWrongAttempts(p => p + 1)
      // Pulse wrong for 400ms then reset to idle so Harry can try again
      setTimeout(() => setAnswerState('idle'), 400)
    }
  }

  function handleSkip() {
    setSkipped(true)
    setTimeout(() => onWrong(), 600)
  }

  function optionStyle(idx: number): React.CSSProperties {
    const isSelected  = selectedIdx === idx
    const isCorrect   = idx === question.correctIndex
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
    <div className="flex flex-col gap-6">
      {/* Options — vertical list per spec */}
      <div className="flex flex-col gap-3">
        {question.options.map((opt, idx) => {
          const isCorrectAnswer = idx === question.correctIndex
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
      </div>

      {/* Hint strip — shows after wrong attempt */}
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

      {/* Skip link — appears after 2 wrong attempts */}
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

// ─── Main shell ───────────────────────────────────────────────────────────────

const XP_PER_CORRECT   = 10
const COINS_PER_CORRECT = 5

// Map game area → primary stat incremented on correct answer
const AREA_STAT: Record<SkillArea, string> = {
  maths:     'speed',
  spelling:  'intelligence',
  science:   'stamina',
  geography: 'agility',
}

export function GameSessionShell({
  card,
  area,
  theme,
  questions,
  onExit,
  onComplete,
}: GameSessionShellProps) {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()

  const [questionIndex, setQuestionIndex] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [statDeltas, setStatDeltas] = useState<Record<string, number>>({})
  const [showQuit, setShowQuit] = useState(false)
  const [complete, setComplete] = useState(false)
  const quitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Suppress BottomNav while session is active
  useEffect(() => {
    document.body.dataset.hideNav = 'true'
    return () => {
      delete document.body.dataset.hideNav
    }
  }, [])

  // Auto-dismiss quit banner after 8 seconds
  useEffect(() => {
    if (showQuit) {
      quitTimer.current = setTimeout(() => setShowQuit(false), 8000)
    }
    return () => {
      if (quitTimer.current !== null) clearTimeout(quitTimer.current)
    }
  }, [showQuit])

  const handleCorrect = useCallback(() => {
    const newXp     = xpEarned + XP_PER_CORRECT
    const newCoins  = coinsEarned + COINS_PER_CORRECT
    const stat      = AREA_STAT[area]
    const newDeltas = { ...statDeltas, [stat]: (statDeltas[stat] ?? 0) + 1 }

    setXpEarned(newXp)
    setCoinsEarned(newCoins)
    setCorrectCount(c => c + 1)
    setStatDeltas(newDeltas)

    if (questionIndex + 1 >= questions.length) {
      // Session complete
      onComplete({ xpEarned: newXp, statDeltas: newDeltas })
      setComplete(true)
    } else {
      setQuestionIndex(i => i + 1)
    }
  }, [xpEarned, coinsEarned, statDeltas, questionIndex, questions.length, area, onComplete])

  const handleWrong = useCallback(() => {
    // Skip: advance without XP
    if (questionIndex + 1 >= questions.length) {
      onComplete({ xpEarned, statDeltas })
      setComplete(true)
    } else {
      setQuestionIndex(i => i + 1)
    }
  }, [questionIndex, questions.length, xpEarned, statDeltas, onComplete])

  function handleExitTap() {
    setShowQuit(true)
  }

  function handleLeave() {
    setShowQuit(false)
    onExit()
  }

  function handlePlayAgain() {
    setQuestionIndex(0)
    setXpEarned(0)
    setCoinsEarned(0)
    setCorrectCount(0)
    setStatDeltas({})
    setComplete(false)
  }

  function handleChangeCard() {
    setComplete(false)
    onExit()
  }

  const currentQuestion = questions[questionIndex]

  return (
    <>
      {/* Session header — portalled so it escapes Framer Motion stacking context */}
      <SessionHeader
        card={card}
        theme={theme}
        questionIndex={questionIndex}
        totalQuestions={questions.length}
        onExit={handleExitTap}
      />

      {/* XP strip — portalled */}
      <XpStrip card={card} xpEarned={xpEarned} theme={theme} />

      {/* Quit banner — portalled inline below header */}
      {createPortal(
        <QuitBanner
          visible={showQuit}
          onStay={() => setShowQuit(false)}
          onLeave={handleLeave}
        />,
        document.body,
      )}

      {/* Session complete overlay — portalled, z-1200 */}
      <AnimatePresence>
        {complete && (
          <SessionCompleteOverlay
            card={card}
            theme={theme}
            xpEarned={xpEarned}
            coinsEarned={coinsEarned}
            statDeltas={statDeltas}
            correctCount={correctCount}
            totalQuestions={questions.length}
            reducedMotion={reducedMotion}
            onPlayAgain={handlePlayAgain}
            onChangeCard={handleChangeCard}
            onBackToGames={() => navigate('/play')}
          />
        )}
      </AnimatePresence>

      {/* Question area — scrollable, padding clears the fixed header and XP strip */}
      <div
        className="flex-1 overflow-y-auto pb-[44px]"
        style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))' }}
      >
        {!complete && currentQuestion && (
          <div className="max-w-2xl mx-auto w-full px-6 pt-8 pb-24">
            {/* Question text */}
            <p className="text-[20px] font-700 text-[var(--t1)] text-center mb-8 leading-snug">
              {currentQuestion.question}
            </p>

            {/* MCQ options */}
            <McqQuestion
              key={`q-${questionIndex}`}
              question={currentQuestion}
              onCorrect={handleCorrect}
              onWrong={handleWrong}
              theme={theme}
            />
          </div>
        )}
      </div>
    </>
  )
}
