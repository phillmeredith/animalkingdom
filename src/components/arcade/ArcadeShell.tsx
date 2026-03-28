// ArcadeShell — shared game wrapper for all 4 arcade games
// Phases: start → playing → results
// All 4 games pass their own theme + questions; shell handles the loop

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Star, Trophy, Dumbbell, Coins, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useWallet } from '@/hooks/useWallet'
import { useProgress } from '@/hooks/useProgress'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useToast } from '@/components/ui/Toast'
import { useSpeech } from '@/hooks/useSpeech'
import { db } from '@/lib/db'
import type { ArcadeQuestion } from '@/data/arcadeQuestions'
import type { SkillArea } from '@/lib/db'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArcadeTheme {
  accent: string        // CSS var or hex, e.g. 'var(--amber)'
  accentSub: string     // translucent bg
  accentText: string    // light text variant
  icon: React.ReactNode
  title: string
  subtitle: string
}

type Phase = 'start' | 'playing' | 'results'
type AnswerState = 'idle' | 'correct' | 'wrong'

const COINS_PER_CORRECT = 5
const XP_PER_CORRECT = 10
const PERFECT_BONUS = 20

// ─── Component ────────────────────────────────────────────────────────────────

interface ArcadeShellProps {
  area: SkillArea
  theme: ArcadeTheme
  questions: ArcadeQuestion[]
  onExit: () => void
  onComplete?: (score: number, total: number) => void
}

export function ArcadeShell({ area, theme, questions, onExit, onComplete }: ArcadeShellProps) {
  const { earn } = useWallet()
  const { addXp, recordAnswer, getSkill } = useProgress()
  const reducedMotion = useReducedMotion()
  const { toast } = useToast()
  const { speak, enabled: speechEnabled } = useSpeech()

  const skill = getSkill(area)

  const [phase, setPhase] = useState<Phase>('start')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const currentQuestion = questions[currentIndex]
  const total = questions.length

  // Speak question aloud when it changes during play
  useEffect(() => {
    if (phase === 'playing' && speechEnabled && currentQuestion?.question) {
      speak(currentQuestion.question)
    }
  }, [currentIndex, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function startGame() {
    setPhase('playing')
    setCurrentIndex(0)
    setScore(0)
    setAnswerState('idle')
    setSelectedIndex(null)
    setCoinsEarned(0)
  }

  const finishGame = useCallback(async (finalScore: number) => {
    const coins = finalScore * COINS_PER_CORRECT + (finalScore === total ? PERFECT_BONUS : 0)
    setCoinsEarned(coins)

    try {
      if (coins > 0) await earn(coins, `${theme.title} arcade`, 'arcade')
      if (finalScore > 0) await addXp(area, finalScore * XP_PER_CORRECT)

      // Increment gamesPlayed for the skill area (R-12)
      const skillRecord = await db.skillProgress.where('area').equals(area).first()
      if (skillRecord?.id !== undefined) {
        await db.skillProgress.update(skillRecord.id, {
          gamesPlayed: (skillRecord.gamesPlayed ?? 0) + 1,
        })
      }
    } catch {
      // Surface error to the player rather than silently swallowing (QA-027)
      toast({ type: 'error', title: "Couldn't save your progress — try again." })
    }

    onComplete?.(finalScore, total)
    setPhase('results')
  }, [area, earn, addXp, toast, theme.title, total, onComplete])

  async function handleAnswer(optionIndex: number) {
    if (answerState !== 'idle' || !currentQuestion) return

    setSelectedIndex(optionIndex)
    const correct = optionIndex === currentQuestion.correctIndex

    if (correct) {
      setAnswerState('correct')
      setScore(s => s + 1)
    } else {
      setAnswerState('wrong')
      // Effort reward: 1 coin for every wrong answer (QA-023)
      earn(1, 'Effort reward', 'arcade').catch(() => {})
    }

    // Record answer (non-blocking)
    recordAnswer(area, currentQuestion.id, skill.tier, correct).catch(() => {})

    // Advance after flash
    setTimeout(async () => {
      setAnswerState('idle')
      setSelectedIndex(null)

      if (currentIndex + 1 >= total) {
        await finishGame(score + (correct ? 1 : 0))
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, reducedMotion ? 300 : 1000)
  }

  function getOptionClass(idx: number) {
    const base = 'w-full p-4 rounded-lg border text-left text-[15px] font-500 transition-all duration-150 active:scale-[.97] cursor-pointer'
    if (answerState === 'idle') {
      return cn(base, 'bg-[var(--elev)] border-[var(--border-s)] text-t1 hover:border-[var(--border)]')
    }
    if (idx === currentQuestion?.correctIndex) {
      return cn(base, 'bg-[var(--green-sub)] border-[var(--green)] text-[var(--green-t)]')
    }
    if (idx === selectedIndex && answerState === 'wrong') {
      return cn(base, 'bg-[var(--red-sub)] border-[var(--red)] text-[var(--red-t)]')
    }
    return cn(base, 'bg-[var(--elev)] border-[var(--border-s)] text-t3 opacity-50')
  }

  // ─── Start screen ──────────────────────────────────────────────────────────

  if (phase === 'start') {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] px-6">
        <div className="flex items-center pt-5 mb-8">
          <button onClick={onExit} className="w-11 h-11 flex items-center justify-center rounded-full text-t2 hover:text-t1 hover:bg-white/[.06] transition-all">
            <ChevronLeft size={22} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: theme.accentSub, color: theme.accentText }}>{theme.icon}</div>
          <h1 className="text-[32px] font-700 text-t1 mb-2">{theme.title}</h1>
          <p className="text-[15px] text-t2 mb-2">{theme.subtitle}</p>
          <p className="text-[13px] text-t3 mb-10">
            {total} questions · {COINS_PER_CORRECT} coins each · +{PERFECT_BONUS} bonus for perfect
          </p>

          {/* Skill level */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill mb-10 text-[13px] font-600"
            style={{ background: theme.accentSub, color: theme.accentText }}
          >
            <Star size={14} />
            Tier {skill.tier} · {skill.xp} XP
          </div>

          <Button variant="accent" size="lg" className="w-full max-w-xs" onClick={startGame}>
            Play
          </Button>
        </div>
      </div>
    )
  }

  // ─── Results screen ────────────────────────────────────────────────────────

  if (phase === 'results') {
    const isPerfect = score === total
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] px-6">
        <div className="flex items-center pt-5 mb-8">
          <button onClick={onExit} className="w-11 h-11 flex items-center justify-center rounded-full text-t2 hover:text-t1 hover:bg-white/[.06] transition-all">
            <ChevronLeft size={22} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: theme.accentSub, color: theme.accentText }}>
            {isPerfect ? <Trophy size={32} /> : score >= total / 2 ? <Star size={32} /> : <Dumbbell size={32} />}
          </div>
          <h2 className="text-[28px] font-700 text-t1 mb-1">
            {isPerfect ? 'Perfect score!' : `${score} out of ${total}`}
          </h2>
          <p className="text-[15px] text-t2 mb-8">
            {isPerfect ? 'Amazing work!' : score >= total / 2 ? 'Great effort!' : 'Keep practising!'}
          </p>

          {/* Coins earned */}
          <div
            className="flex items-center gap-2 px-6 py-3 rounded-pill mb-8 text-[16px] font-700"
            style={{ background: 'var(--amber-sub)', color: 'var(--amber-t)' }}
          >
            <Coins size={16} /> +{coinsEarned} coins earned
          </div>

          {/* Score dots */}
          <div className="flex gap-2 mb-10">
            {questions.map((_, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full"
                style={{
                  background: i < score
                    ? 'var(--green)'
                    : 'var(--border)',
                }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button variant="primary" size="lg" className="w-full" onClick={startGame}>
              Play again
            </Button>
            <Button variant="outline" size="md" className="w-full" onClick={onExit}>
              Back to games
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Playing ───────────────────────────────────────────────────────────────

  const progressPct = ((currentIndex) / total) * 100

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Exit confirmation overlay */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/75">
          <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 flex flex-col gap-4">
            <p className="text-[17px] font-700 text-t1">Leave the game?</p>
            <p className="text-[14px] text-t2">You'll lose your progress.</p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="md" className="w-full" onClick={() => setShowExitConfirm(false)}>
                Keep playing
              </Button>
              <Button variant="outline" size="md" className="w-full" onClick={onExit}>
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
        <button onClick={() => setShowExitConfirm(true)} className="w-11 h-11 flex items-center justify-center rounded-full text-t2 hover:text-t1 hover:bg-white/[.06] transition-all">
          <ChevronLeft size={22} />
        </button>
        <span className="text-[13px] font-600 text-t2">
          {currentIndex + 1} / {total}
        </span>
        <span
          className="text-[13px] font-700 px-3 py-1 rounded-pill"
          style={{ background: theme.accentSub, color: theme.accentText }}
        >
          <span className="flex items-center gap-1">{score} <Check size={12} strokeWidth={3} /></span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6 mb-6 shrink-0">
        <div className="h-1.5 rounded-full bg-[var(--border-s)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: theme.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="flex-1 flex flex-col items-center px-6 overflow-hidden pb-24"
          initial={{ opacity: 0, x: reducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reducedMotion ? 0 : -20 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          <div className="max-w-3xl w-full flex flex-col flex-1">
            <p className="text-[20px] font-600 text-t1 leading-snug mb-8">
              {currentQuestion?.question}
            </p>

            {/* 2×2 options grid */}
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion?.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={getOptionClass(idx)}
                  onClick={() => handleAnswer(idx)}
                  disabled={answerState !== 'idle'}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
