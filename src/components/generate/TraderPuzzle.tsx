// TraderPuzzle — post-adoption quiz BottomSheet
// 50% chance after adoption. One attempt, no retry.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useWallet, useProgress } from '@/hooks'
import type { TraderQuestion } from '@/data/generateOptions'

interface TraderPuzzleProps {
  visible: boolean
  question: TraderQuestion | null
  onComplete: () => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function TraderPuzzle({ visible, question, onComplete }: TraderPuzzleProps) {
  const { earn } = useWallet()
  const { addXp, recordAnswer } = useProgress()
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!visible || !question) return null

  async function handleAnswer(idx: number) {
    if (!question || answerState !== 'idle') return

    setSelectedIndex(idx)
    const correct = idx === question.correctIndex

    if (correct) {
      setAnswerState('correct')
      const reward = Math.floor(Math.random() * 16) + 10 // 10–25
      await earn(reward, 'Trader puzzle', 'arcade')
      await addXp(question.area, 15)
      await recordAnswer(question.area, question.questionId, 1, true)
    } else {
      setAnswerState('wrong')
      await earn(1, 'Trader puzzle effort', 'arcade')
      await recordAnswer(question.area, question.questionId, 1, false)
    }

    setTimeout(onComplete, 1800)
  }

  function getOptionClass(idx: number): string {
    if (answerState === 'idle') {
      return cn(
        'w-full p-3.5 rounded-lg border text-left text-[14px] font-500 transition-all active:scale-[.97] cursor-pointer',
        'bg-[var(--elev)] border-[var(--border-s)] text-t1 hover:border-[var(--border)]',
      )
    }
    if (idx === question?.correctIndex) {
      return 'w-full p-3.5 rounded-lg border text-left text-[14px] font-500 bg-[var(--green-sub)] border-[var(--green)] text-[var(--green-t)]'
    }
    if (idx === selectedIndex && answerState === 'wrong') {
      return 'w-full p-3.5 rounded-lg border text-left text-[14px] font-500 bg-[var(--red-sub)] border-[var(--red)] text-[var(--red-t)]'
    }
    return 'w-full p-3.5 rounded-lg border text-left text-[14px] font-500 bg-[var(--elev)] border-[var(--border-s)] text-t3 opacity-60'
  }

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,.65)' }}
    >
      <motion.div
        className="w-full bg-[var(--card)] border-t border-[var(--border-s)] rounded-t-xl px-6 pt-5 pb-10"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        {/* Content constrained for tablet */}
        <div className="max-w-xl mx-auto w-full">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-[20px] font-600 text-t1 flex items-center gap-2">
              Trader Quiz!
              <Coins size={18} className="text-[var(--amber)]" />
            </h3>
            <p className="text-[13px] text-t2 mt-0.5">Answer correctly for 10–25 coins</p>
          </div>

          {/* Question */}
          <p className="text-[15px] text-t1 mb-5 leading-snug">{question.question}</p>

          {/* 2×2 options grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {question.options.map((opt, idx) => (
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

          {/* Skip */}
          {answerState === 'idle' && (
            <Button variant="outline" size="sm" className="w-full text-t3" onClick={onComplete}>
              Skip — not now
            </Button>
          )}

          {/* Result message */}
          {answerState === 'correct' && (
            <p className="text-center text-[var(--green-t)] font-600 text-[15px] flex items-center justify-center gap-1.5">
              <Check size={16} />
              Correct! Coins on their way
            </p>
          )}
          {answerState === 'wrong' && (
            <p className="text-center text-[var(--red-t)] font-500 text-[14px]">
              Not quite — you still earn 1 coin for trying!
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
